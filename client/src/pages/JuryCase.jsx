/**
 * @fileoverview Jury case voting page
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { getById, castVote } from '@/lib/services/disputesService';
import { User, FileText, Clock } from 'lucide-react';

export function JuryCase() {
  const { id } = useParams();
  const [dispute, setDispute] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteChoice, setVoteChoice] = useState(null);

  useEffect(() => {
    const disputeData = getById(id);
    setDispute(disputeData);
  }, [id]);

  const handleVote = (choice) => {
    try {
      const updatedDispute = castVote(id, choice);
      setDispute(updatedDispute);
      setHasVoted(true);
      setVoteChoice(choice);
      toast.success('Vote submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit vote');
    }
  };

  if (!dispute) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading case...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
            Case #{dispute.id}
          </h1>
          <div className="flex items-center space-x-4 text-nb-ink/70">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Deadline: {new Date(dispute.deadline).toLocaleDateString()}
            </span>
            <span className={`px-2 py-1 rounded border text-xs ${
              dispute.status === 'voting' ? 'bg-nb-warn/20 border-nb-warn text-nb-ink' :
              dispute.status === 'resolved' ? 'bg-nb-ok/20 border-nb-ok text-nb-ink' :
              'bg-nb-accent/20 border-nb-accent text-nb-ink'
            }`}>
              {dispute.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tenant Statement */}
          <NBCard>
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-nb-accent mr-2" />
              <h2 className="font-display font-bold text-xl text-nb-ink">
                Tenant Statement
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-nb-ink mb-2">Claim Summary</h3>
                <p className="text-nb-ink/80 text-sm">{dispute.claimSummary}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-nb-ink mb-2">Detailed Statement</h3>
                <p className="text-nb-ink/80 text-sm">{dispute.tenantStatement}</p>
              </div>
              
              {dispute.tenantEvidence.length > 0 && (
                <div>
                  <h3 className="font-medium text-nb-ink mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Evidence ({dispute.tenantEvidence.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {dispute.tenantEvidence.map((evidence, index) => (
                      <div key={index} className="border border-nb-ink/20 rounded p-2">
                        <img
                          src={evidence}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
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
          </NBCard>

          {/* Landlord Statement */}
          <NBCard>
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-nb-accent-2 mr-2" />
              <h2 className="font-display font-bold text-xl text-nb-ink">
                Landlord Response
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-nb-ink mb-2">Response Statement</h3>
                <p className="text-nb-ink/80 text-sm">{dispute.landlordStatement}</p>
              </div>
              
              {dispute.landlordEvidence.length > 0 && (
                <div>
                  <h3 className="font-medium text-nb-ink mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Evidence ({dispute.landlordEvidence.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {dispute.landlordEvidence.map((evidence, index) => (
                      <div key={index} className="border border-nb-ink/20 rounded p-2">
                        <img
                          src={evidence}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
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
          </NBCard>
        </div>

        {/* Voting Section */}
        <NBCard>
          <h2 className="font-display font-bold text-xl text-nb-ink mb-6">
            Cast Your Vote
          </h2>
          
          {!hasVoted && dispute.status === 'voting' ? (
            <div className="space-y-4">
              <p className="text-nb-ink/70 mb-6">
                Based on the evidence presented, who do you believe should win this dispute?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NBButton
                  onClick={() => handleVote('tenant')}
                  className="h-auto py-4 flex-col"
                  data-testid="vote-tenant"
                >
                  <User className="w-6 h-6 mb-2" />
                  <span>Vote for Tenant</span>
                </NBButton>
                
                <NBButton
                  variant="secondary"
                  onClick={() => handleVote('landlord')}
                  className="h-auto py-4 flex-col"
                  data-testid="vote-landlord"
                >
                  <User className="w-6 h-6 mb-2" />
                  <span>Vote for Landlord</span>
                </NBButton>
                
                <NBButton
                  variant="ghost"
                  onClick={() => handleVote('abstain')}
                  className="h-auto py-4 flex-col"
                >
                  <span className="text-2xl mb-2">🤷</span>
                  <span>Abstain</span>
                </NBButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              {hasVoted ? (
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
                    {dispute.result && (
                      <div className="text-sm text-nb-ink/70">
                        <p>Final Result: {dispute.result.winner} wins</p>
                        <p>Fees Distributed: ₹{dispute.result.distributedFees}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
                    Voting Closed
                  </h3>
                  <p className="text-nb-ink/70">
                    This dispute has been resolved or voting period has ended.
                  </p>
                </div>
              )}
            </div>
          )}
        </NBCard>
      </div>
    </div>
  );
}
