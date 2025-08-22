/**
 * @fileoverview Jury case voting page with IPFS dispute data
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { disputeService } from '@/lib/services/disputeService';
import { web3Service } from '@/lib/services/web3Service';
import { User, FileText, Clock, ArrowLeft } from 'lucide-react';

export function JuryCase() {
  const { id } = useParams(); // This is the property ID
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteChoice, setVoteChoice] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isJuryMember, setIsJuryMember] = useState(false);

  useEffect(() => {
    const loadDispute = async () => {
      try {
        // Check if current user is a jury member
        const juryCheck = disputeService.isJuryMember();
        setIsJuryMember(juryCheck);

        // Get dispute cases from localStorage
        const landlordCase = localStorage.getItem(`dispute_${id}_landlord`);
        const tenantCase = localStorage.getItem(`dispute_${id}_tenant`);
        
        let landlordDetails = null;
        let tenantDetails = null;

        if (landlordCase) {
          const landlordData = JSON.parse(landlordCase);
          const result = await disputeService.getDisputeCase(landlordData.caseUrl);
          if (result.success) {
            landlordDetails = result.case;
          }
        }

        if (tenantCase) {
          const tenantData = JSON.parse(tenantCase);
          const result = await disputeService.getDisputeCase(tenantData.caseUrl);
          if (result.success) {
            tenantDetails = result.case;
          }
        }

        if (landlordDetails || tenantDetails) {
          setDispute({
            id: id,
            propertyId: id,
            landlordCase: landlordDetails,
            tenantCase: tenantDetails,
            status: 'voting',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          });
        }
      } catch (error) {
        console.error('Failed to load dispute:', error);
        toast.error('Failed to load dispute case');
      } finally {
        setLoading(false);
      }
    };

    loadDispute();
  }, [id]);

  const handleVote = async (choice) => {
    try {
      setIsVoting(true);
      
      // In a real implementation, this would call the smart contract
      // For now, we'll simulate the vote
      const result = await web3Service.resolveDispute(id, choice === 'tenant');
      
      if (result.success) {
        setHasVoted(true);
        setVoteChoice(choice);
        toast.success('Vote submitted successfully!', {
          description: `Transaction: ${result.txnHash.slice(0, 10)}...`
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
      toast.error('Failed to submit vote', {
        description: error.message
      });
    } finally {
      setIsVoting(false);
    }
  };

  // Helper function to convert IPFS URL to gateway URL
  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl) return '/mock-images/placeholder-evidence.jpg';
    
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    if (ipfsUrl.startsWith('https://')) {
      return ipfsUrl;
    }
    
    if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafy')) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
    }
    
    return '/mock-images/placeholder-evidence.jpg';
  };

  // Update the voting section to check for jury membership
  const renderVotingSection = () => {
    if (!isJuryMember) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-nb-error/20 border-2 border-nb-error rounded-nb mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
            Access Denied
          </h3>
          <p className="text-nb-ink/70 mb-4">
            Only authorized jury members can vote on dispute cases.
          </p>
          <p className="text-sm text-nb-ink/50">
            Your address: {disputeService.getCurrentAccount()}
          </p>
        </div>
      );
    }

    if (!hasVoted && dispute.status === 'voting' && (dispute.tenantCase || dispute.landlordCase)) {
      return (
        <div className="space-y-4">
          <p className="text-nb-ink/70 mb-6">
            Review both cases carefully and cast your vote. Your decision will help resolve this dispute fairly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NBButton
              onClick={() => handleVote('tenant')}
              className="h-auto py-4 flex-col"
              disabled={isVoting || !dispute.tenantCase}
              data-testid="vote-tenant"
            >
              <User className="w-6 h-6 mb-2" />
              <span>Vote for Tenant</span>
              {!dispute.tenantCase && (
                <span className="text-xs mt-1 opacity-60">Case not submitted</span>
              )}
            </NBButton>
            
            <NBButton
              onClick={() => handleVote('landlord')}
              className="h-auto py-4 flex-col"
              disabled={isVoting || !dispute.landlordCase}
              data-testid="vote-landlord"
            >
              <User className="w-6 h-6 mb-2" />
              <span>Vote for Landlord</span>
              {!dispute.landlordCase && (
                <span className="text-xs mt-1 opacity-60">Case not submitted</span>
              )}
            </NBButton>
            
            <NBButton
              variant="ghost"
              onClick={() => handleVote('abstain')}
              className="h-auto py-4 flex-col"
              disabled={isVoting}
            >
              <span className="text-2xl mb-2">🤷</span>
              <span>Abstain</span>
            </NBButton>
          </div>
          
          {isVoting && (
            <div className="text-center mt-4">
              <p className="text-nb-ink/70">Submitting your vote...</p>
            </div>
          )}
        </div>
      );
    }

    if (hasVoted) {
      return (
        <div>
          <div className="w-16 h-16 bg-nb-ok/20 border-2 border-nb-ok rounded-nb mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
            Vote Submitted
          </h3>
          <p className="text-nb-ink/70 mb-4">
            Thank you for participating in the dispute resolution process.
          </p>
          <div className="bg-nb-accent/20 border-2 border-nb-accent rounded-nb p-4">
            <h4 className="font-medium text-nb-ink mb-2">Your Vote: {voteChoice}</h4>
            <p className="text-sm text-nb-ink/70">
              The dispute has been resolved on the blockchain.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
          {!dispute.tenantCase && !dispute.landlordCase ? 'Waiting for Cases' : 'Voting Closed'}
        </h3>
        <p className="text-nb-ink/70">
          {!dispute.tenantCase && !dispute.landlordCase 
            ? 'Both parties need to submit their cases before voting can begin.'
            : 'This dispute has been resolved or voting period has ended.'
          }
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading dispute case...</div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold text-xl text-nb-ink mb-2">
            Case Not Found
          </h2>
          <p className="text-nb-ink/70 mb-4">
            No dispute cases found for this property.
          </p>
          <NBButton onClick={() => navigate('/jury')}>
            Back to Dashboard
          </NBButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/jury')}
            className="flex items-center text-nb-ink/70 hover:text-nb-ink mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
            Case: Property #{dispute.propertyId}
          </h1>
          <div className="flex items-center space-x-4 text-nb-ink/70">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Deadline: {new Date(dispute.deadline).toLocaleDateString()}
            </span>
            <span className="px-2 py-1 rounded border text-xs bg-nb-warn/20 border-nb-warn text-nb-ink">
              {dispute.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tenant Case */}
          <NBCard>
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-nb-accent mr-2" />
              <h2 className="font-display font-bold text-xl text-nb-ink">
                Tenant Case
              </h2>
            </div>
            
            {dispute.tenantCase ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-nb-ink mb-2">Case Title</h3>
                  <p className="text-nb-ink/80 text-sm">{dispute.tenantCase.title}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-nb-ink mb-2">Claim Summary</h3>
                  <p className="text-nb-ink/80 text-sm">{dispute.tenantCase.claimSummary}</p>
                </div>
                
                {dispute.tenantCase.detailedStatement && (
                  <div>
                    <h3 className="font-medium text-nb-ink mb-2">Detailed Statement</h3>
                    <p className="text-nb-ink/80 text-sm">{dispute.tenantCase.detailedStatement}</p>
                  </div>
                )}
                
                {dispute.tenantCase.evidence && dispute.tenantCase.evidence.length > 0 && (
                  <div>
                    <h3 className="font-medium text-nb-ink mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Evidence ({dispute.tenantCase.evidence.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {dispute.tenantCase.evidence.map((evidence, index) => (
                        <div key={index} className="border border-nb-ink/20 rounded p-2">
                          <img
                            src={getImageUrl(evidence)}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() => window.open(getImageUrl(evidence), '_blank')}
                            onError={(e) => {
                              e.target.src = '/mock-images/placeholder-evidence.jpg';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-nb-ink/50">Tenant case not yet submitted</p>
              </div>
            )}
          </NBCard>

          {/* Landlord Case */}
          <NBCard>
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-nb-accent-2 mr-2" />
              <h2 className="font-display font-bold text-xl text-nb-ink">
                Landlord Case
              </h2>
            </div>
            
            {dispute.landlordCase ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-nb-ink mb-2">Case Title</h3>
                  <p className="text-nb-ink/80 text-sm">{dispute.landlordCase.title}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-nb-ink mb-2">Response Summary</h3>
                  <p className="text-nb-ink/80 text-sm">{dispute.landlordCase.claimSummary}</p>
                </div>
                
                {dispute.landlordCase.detailedStatement && (
                  <div>
                    <h3 className="font-medium text-nb-ink mb-2">Detailed Response</h3>
                    <p className="text-nb-ink/80 text-sm">{dispute.landlordCase.detailedStatement}</p>
                  </div>
                )}
                
                {dispute.landlordCase.evidence && dispute.landlordCase.evidence.length > 0 && (
                  <div>
                    <h3 className="font-medium text-nb-ink mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Evidence ({dispute.landlordCase.evidence.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {dispute.landlordCase.evidence.map((evidence, index) => (
                        <div key={index} className="border border-nb-ink/20 rounded p-2">
                          <img
                            src={getImageUrl(evidence)}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() => window.open(getImageUrl(evidence), '_blank')}
                            onError={(e) => {
                              e.target.src = '/mock-images/placeholder-evidence.jpg';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-nb-ink/50">Landlord case not yet submitted</p>
              </div>
            )}
          </NBCard>
        </div>

        {/* Voting Section */}
        <NBCard>
          <h2 className="font-display font-bold text-xl text-nb-ink mb-6">
            Cast Your Vote
          </h2>
          {renderVotingSection()}
        </NBCard>
      </div>
    </div>
  );
}
