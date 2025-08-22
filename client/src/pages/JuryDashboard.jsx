/**
 * @fileoverview Jury dashboard page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { listActive } from '@/lib/services/disputesService';
import { Gavel, Clock, Users } from 'lucide-react';

export function JuryDashboard() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    const activeDisputes = listActive();
    setDisputes(activeDisputes);
  }, []);

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
            Jury Dashboard
          </h1>
          <p className="font-body text-nb-ink/70">
            Review active disputes and participate in fair resolution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <NBCard className="text-center">
            <Gavel className="w-8 h-8 text-nb-accent mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-nb-ink">{disputes.length}</div>
            <div className="text-sm text-nb-ink/70">Active Cases</div>
          </NBCard>
          
          <NBCard className="text-center">
            <Clock className="w-8 h-8 text-nb-warn mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-nb-ink">2</div>
            <div className="text-sm text-nb-ink/70">Pending Votes</div>
          </NBCard>
          
          <NBCard className="text-center">
            <Users className="w-8 h-8 text-nb-ok mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-nb-ink">15</div>
            <div className="text-sm text-nb-ink/70">Cases Resolved</div>
          </NBCard>
        </div>

        <NBCard>
          <h2 className="font-display font-bold text-xl text-nb-ink mb-6">
            Active Disputes
          </h2>
          
          {disputes.length === 0 ? (
            <div className="text-center py-8">
              <Gavel className="w-16 h-16 text-nb-ink/30 mx-auto mb-4" />
              <p className="text-nb-ink/70">No active disputes at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="border-2 border-nb-ink/20 rounded-nb p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-bold text-lg text-nb-ink">
                        {dispute.title}
                      </h3>
                      <p className="text-nb-ink/70 mb-2">{dispute.claimSummary}</p>
                      <div className="flex items-center space-x-4 text-sm text-nb-ink/60">
                        <span>Case #{dispute.id}</span>
                        <span>Status: {dispute.status}</span>
                        <span>Raised by: {dispute.raisedBy}</span>
                      </div>
                    </div>
                    <NBButton
                      onClick={() => navigate(`/jury/case/${dispute.id}`)}
                      size="sm"
                    >
                      Review Case
                    </NBButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NBCard>
      </div>
    </div>
  );
}
