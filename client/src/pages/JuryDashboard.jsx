/**
 * @fileoverview Jury dashboard page with IPFS dispute integration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { disputeService } from '@/lib/services/disputeService';
import { Gavel, Clock, Users, RefreshCw, History, CheckCircle } from 'lucide-react';

export function JuryDashboard() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [completedDisputes, setCompletedDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  const loadDisputes = async () => {
    try {
      setLoading(true);
      
      // Get all dispute cases from localStorage
      const allDisputeCases = [];
      const completedCases = [];
      
      // Scan localStorage for dispute cases
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dispute_')) {
          try {
            const disputeData = JSON.parse(localStorage.getItem(key));
            if (disputeData && disputeData.caseUrl) {
              // Extract property ID and role from key
              const parts = key.split('_');
              if (parts.length >= 3) {
                const propertyId = parts[1];
                const role = parts[2];
                
                allDisputeCases.push({
                  ...disputeData,
                  key: key,
                  propertyId: propertyId,
                  role: role
                });
              }
            }
          } catch (error) {
            console.error('Failed to parse dispute case:', error);
          }
        }
      }

      // Check for completed disputes (jury votes)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('jury_vote_')) {
          try {
            const voteData = JSON.parse(localStorage.getItem(key));
            if (voteData && voteData.choice) {
              const propertyId = key.replace('jury_vote_', '');
              completedCases.push({
                propertyId: propertyId,
                voteData: voteData
              });
            }
          } catch (error) {
            console.error('Failed to parse jury vote:', error);
          }
        }
      }

      // Group disputes by property ID and merge landlord/tenant cases
      const groupedDisputes = {};
      
      allDisputeCases.forEach(dispute => {
        const key = dispute.propertyId;
        if (!groupedDisputes[key]) {
          groupedDisputes[key] = {
            propertyId: dispute.propertyId,
            cases: {},
            createdAt: dispute.submittedAt,
            status: 'voting'
          };
        }
        groupedDisputes[key].cases[dispute.role] = dispute;
      });

      // Convert to array and create combined dispute objects
      const processedDisputes = Object.values(groupedDisputes).map(group => {
        const landlordCase = group.cases.landlord;
        const tenantCase = group.cases.tenant;
        
        // Check if this dispute is completed
        const completedCase = completedCases.find(c => c.propertyId === group.propertyId);
        const isCompleted = !!completedCase;
        
        return {
          id: group.propertyId,
          title: `Property #${group.propertyId} Dispute`,
          propertyId: group.propertyId,
          landlordCase,
          tenantCase,
          status: isCompleted ? 'completed' : 'voting',
          createdAt: group.createdAt,
          completedAt: completedCase?.voteData?.timestamp,
          winner: completedCase?.voteData?.choice,
          claimSummary: tenantCase?.claimSummary || landlordCase?.claimSummary || 'Dispute case available for review'
        };
      });

      // Separate active and completed disputes
      const activeDisputes = processedDisputes.filter(d => d.status === 'voting');
      const completedDisputesList = processedDisputes.filter(d => d.status === 'completed');

      setDisputes(activeDisputes);
      setCompletedDisputes(completedDisputesList);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDisputes();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading dispute cases...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
              Jury Dashboard
            </h1>
            <p className="font-body text-nb-ink/70">
              Review active disputes and participate in fair resolution
            </p>
          </div>
          <NBButton
            variant="ghost"
            onClick={handleRefresh}
            disabled={refreshing}
            icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </NBButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <NBCard className="text-center p-6">
            <Gavel className="w-8 h-8 text-nb-accent mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-nb-ink">{disputes.length}</div>
            <div className="text-sm text-nb-ink/70">Active Cases</div>
          </NBCard>
          
          <NBCard className="text-center p-6">
            <Clock className="w-8 h-8 text-nb-warn mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-nb-ink">
              {disputes.filter(d => d.status === 'voting').length}
            </div>
            <div className="text-sm text-nb-ink/70">Pending Votes</div>
          </NBCard>
          
          <NBCard className="text-center p-6">
            <Users className="w-8 h-8 text-nb-ok mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-nb-ink">{completedDisputes.length}</div>
            <div className="text-sm text-nb-ink/70">Cases Resolved</div>
          </NBCard>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <NBButton
            variant={activeTab === 'active' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('active')}
            icon={<Gavel className="w-4 h-4" />}
          >
            Active Cases ({disputes.length})
          </NBButton>
          <NBButton
            variant={activeTab === 'history' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('history')}
            icon={<History className="w-4 h-4" />}
          >
            Case History ({completedDisputes.length})
          </NBButton>
        </div>

        {/* Active Disputes */}
        {activeTab === 'active' && (
          <NBCard>
            <h2 className="font-display font-bold text-xl text-nb-ink mb-6">
              Active Dispute Cases
            </h2>
            
            {disputes.length === 0 ? (
              <div className="text-center py-8">
                <Gavel className="w-16 h-16 text-nb-ink/30 mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
                  No active disputes
                </h3>
                <p className="text-nb-ink/70">
                  All dispute cases have been resolved or there are no disputes at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border-2 border-nb-ink/20 rounded-nb p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
                          {dispute.title}
                        </h3>
                        <p className="text-nb-ink/70 mb-3">{dispute.claimSummary}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-nb-ink/60 mb-4">
                          <span>Property ID: {dispute.propertyId}</span>
                          <span>Status: {dispute.status}</span>
                          <span>Created: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Case Status */}
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-nb-ink/70">Landlord Case:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              dispute.landlordCase 
                                ? 'bg-nb-ok/20 text-nb-ok border border-nb-ok' 
                                : 'bg-nb-error/20 text-nb-error border border-nb-error'
                            }`}>
                              {dispute.landlordCase ? 'Submitted' : 'Not Submitted'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-nb-ink/70">Tenant Case:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              dispute.tenantCase 
                                ? 'bg-nb-ok/20 text-nb-ok border border-nb-ok' 
                                : 'bg-nb-error/20 text-nb-error border border-nb-error'
                            }`}>
                              {dispute.tenantCase ? 'Submitted' : 'Not Submitted'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <NBButton
                          onClick={() => navigate(`/jury/case/${dispute.id}`)}
                          size="sm"
                          disabled={!dispute.landlordCase && !dispute.tenantCase}
                        >
                          {dispute.landlordCase || dispute.tenantCase ? 'Review Case' : 'Pending Cases'}
                        </NBButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NBCard>
        )}

        {/* Case History */}
        {activeTab === 'history' && (
          <NBCard>
            <h2 className="font-display font-bold text-xl text-nb-ink mb-6">
              Case History
            </h2>
            
            {completedDisputes.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-16 h-16 text-nb-ink/30 mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg text-nb-ink mb-2">
                  No completed cases
                </h3>
                <p className="text-nb-ink/70">
                  No dispute cases have been resolved yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedDisputes.map((dispute) => (
                  <div key={dispute.id} className="border-2 border-nb-accent/20 rounded-nb p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-display font-bold text-lg text-nb-ink">
                            {dispute.title}
                          </h3>
                          <div className="flex items-center space-x-1 text-nb-accent">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Resolved</span>
                          </div>
                        </div>
                        <p className="text-nb-ink/70 mb-3">{dispute.claimSummary}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-nb-ink/60 mb-4">
                          <span>Property ID: {dispute.propertyId}</span>
                          <span>Winner: {dispute.winner === 'tenant' ? 'Tenant' : 'Landlord'}</span>
                          <span>Resolved: {new Date(dispute.completedAt).toLocaleDateString()}</span>
                        </div>

                        {/* Case Status */}
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-nb-ink/70">Landlord Case:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              dispute.landlordCase 
                                ? 'bg-nb-ok/20 text-nb-ok border border-nb-ok' 
                                : 'bg-nb-error/20 text-nb-error border border-nb-error'
                            }`}>
                              {dispute.landlordCase ? 'Submitted' : 'Not Submitted'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-nb-ink/70">Tenant Case:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              dispute.tenantCase 
                                ? 'bg-nb-ok/20 text-nb-ok border border-nb-ok' 
                                : 'bg-nb-error/20 text-nb-error border border-nb-error'
                            }`}>
                              {dispute.tenantCase ? 'Submitted' : 'Not Submitted'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <NBButton
                          onClick={() => navigate(`/jury/case/${dispute.id}`)}
                          size="sm"
                          variant="ghost"
                        >
                          View Details
                        </NBButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NBCard>
        )}
      </div>
    </div>
  );
}
