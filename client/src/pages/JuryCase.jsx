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
import { User, FileText, Clock, ArrowLeft, AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export function JuryCase() {
  const { id } = useParams(); // This is the property ID
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteChoice, setVoteChoice] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isJuryMember, setIsJuryMember] = useState(false);
  const [disputeResolved, setDisputeResolved] = useState(false);
  const [winner, setWinner] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const loadDispute = async () => {
      try {
        // Check if current user is a jury member
        const juryCheck = disputeService.isJuryMember();
        setIsJuryMember(juryCheck);

        // Check if jury has already voted for this dispute
        const juryVote = localStorage.getItem(`jury_vote_${id}`);
        if (juryVote) {
          const voteData = JSON.parse(juryVote);
          setHasVoted(true);
          setVoteChoice(voteData.choice);
          setDisputeResolved(true);
          setWinner(voteData.choice);
        }

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
            status: disputeResolved ? 'resolved' : 'voting',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
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
  }, [id, disputeResolved]);

  const handleVote = async (choice) => {
    try {
      // Double-check jury membership before allowing vote
      if (!disputeService.isJuryMember()) {
        toast.error('Access denied. Only jury members can vote on disputes.');
        return;
      }

      if (hasVoted) {
        toast.error('You have already voted on this dispute.');
        return;
      }

      setIsVoting(true);
      
      // Call the smart contract to resolve the dispute
      const result = await web3Service.resolveDispute(id, choice === 'tenant');
      
      if (result.success) {
        // Store the vote locally
        const voteData = {
          choice: choice,
          timestamp: new Date().toISOString(),
          txnHash: result.txnHash
        };
        localStorage.setItem(`jury_vote_${id}`, JSON.stringify(voteData));
        
        setHasVoted(true);
        setVoteChoice(choice);
        setDisputeResolved(true);
        setWinner(choice);
        
        // Update dispute status
        setDispute(prev => ({
          ...prev,
          status: 'resolved'
        }));
        
        toast.success('Vote submitted successfully!', {
          description: `Dispute resolved. ${choice === 'tenant' ? 'Tenant' : 'Landlord'} wins the case.`
        });

        // Trigger a page refresh to update the dashboard
        setTimeout(() => {
          window.location.reload();
        }, 2000);
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

  const handleWithdraw = async () => {
    if (!isJuryMember) {
      toast.error('Only jury can withdraw rewards');
      return;
    }

    setWithdrawing(true);
    
    try {
      const result = await web3Service.withdraw();
      if (result.success) {
        toast.success('Withdrawal successful!', {
          description: 'Your dispute fee bounty has been sent to your wallet.'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to withdraw:', error);
      toast.error('Failed to withdraw funds', {
        description: error.message
      });
    } finally {
      setWithdrawing(false);
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
            <span className={`px-2 py-1 rounded border text-xs ${
              dispute.status === 'resolved' 
                ? 'bg-nb-accent/20 border-nb-accent text-nb-ink' 
                : 'bg-nb-warn/20 border-nb-warn text-nb-ink'
            }`}>
              {dispute.status}
            </span>
          </div>
        </div>

        {/* Resolution Status */}
        {disputeResolved && winner && (
          <NBCard className="mb-8 border-2 border-nb-accent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-nb-accent" />
                <div>
                  <h3 className="font-medium text-nb-ink">Dispute Resolved</h3>
                  <p className="text-sm text-nb-ink/70">
                    {winner === 'tenant' ? 'Tenant' : 'Landlord'} wins the case
                  </p>
                </div>
              </div>
              {isJuryMember && (
                <div className="text-right">
                  <p className="text-sm text-nb-ink/70">Jury Reward</p>
                  <p className="font-bold text-nb-ink">0.0005 BNB</p>
                  <NBButton
                    size="sm"
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="mt-2"
                    icon={<DollarSign className="w-4 h-4" />}
                  >
                    {withdrawing ? 'Withdrawing...' : 'Withdraw Bounty'}
                  </NBButton>
                </div>
              )}
            </div>
          </NBCard>
        )}

        {/* Jury Access Warning */}
        {!isJuryMember && (
          <NBCard className="mb-8 border-2 border-nb-error">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-nb-error mt-0.5" />
              <div>
                <h3 className="font-medium text-nb-ink mb-1">Access Restricted</h3>
                <p className="text-sm text-nb-ink/70 mb-2">
                  Only authorized jury members can vote on dispute cases. 
                  Your address: {disputeService.getCurrentAccount()}
                </p>
                <p className="text-sm text-nb-ink/50">
                  Authorized jury address: 0x0729a81A995Bed60F4F6C5Ec960bEd999740e160
                </p>
              </div>
            </div>
          </NBCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tenant Case */}
          <NBCard>
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-nb-accent mr-2" />
              <h2 className="font-display font-bold text-xl text-nb-ink">
                Tenant Case
              </h2>
              {winner === 'tenant' && (
                <div className="ml-auto flex items-center space-x-1 text-nb-accent">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Winner</span>
                </div>
              )}
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
              {winner === 'landlord' && (
                <div className="ml-auto flex items-center space-x-1 text-nb-accent">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Winner</span>
                </div>
              )}
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
          
          {!isJuryMember ? (
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
          ) : hasVoted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-nb-accent/20 border-2 border-nb-accent rounded-nb mx-auto flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-nb-accent" />
              </div>
              <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
                Vote Submitted
              </h3>
              <p className="text-nb-ink/70 mb-4">
                Thank you for participating in the dispute resolution process.
              </p>
              <div className="bg-nb-accent/20 border-2 border-nb-accent rounded-nb p-4">
                <h4 className="font-medium text-nb-ink mb-2">Your Vote: {voteChoice === 'tenant' ? 'Tenant' : 'Landlord'}</h4>
                <p className="text-sm text-nb-ink/70">
                  The dispute has been resolved. {winner === 'tenant' ? 'Tenant' : 'Landlord'} wins the case.
                </p>
              </div>
            </div>
          ) : dispute.status === 'voting' && (dispute.tenantCase || dispute.landlordCase) ? (
            <div className="space-y-4">
              <p className="text-nb-ink/70 mb-6">
                Review both cases carefully and cast your vote. Your decision will help resolve this dispute fairly.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              
              {isVoting && (
                <div className="text-center mt-4">
                  <p className="text-nb-ink/70">Submitting your vote...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
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
            </div>
          )}
        </NBCard>
      </div>
    </div>
  );
}
