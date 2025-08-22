/**
 * @fileoverview New dispute creation page
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { create } from '@/lib/services/disputesService';

export function NewDispute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    rentalId: searchParams.get('rentalId') || '',
    role: 'tenant',
    title: '',
    claimSummary: '',
    detailedNarrative: '',
    evidence: [],
    desiredOutcome: 'refund'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      create(formData);
      toast.success('Dispute submitted successfully!');
      navigate('/jury');
    } catch (error) {
      toast.error('Failed to submit dispute');
    }
  };

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <NBCard>
          <h1 className="font-display font-bold text-3xl text-nb-ink mb-8">
            Raise a Dispute
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Dispute Title
              </label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                placeholder="Brief title for your dispute"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Claim Summary
              </label>
              <textarea
                value={formData.claimSummary}
                onChange={(e) => setFormData({...formData, claimSummary: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                placeholder="Brief summary of your claim"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nb-ink mb-2">
                Detailed Narrative
              </label>
              <textarea
                value={formData.detailedNarrative}
                onChange={(e) => setFormData({...formData, detailedNarrative: e.target.value})}
                rows={6}
                className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                placeholder="Provide detailed explanation of the issue"
                required
              />
            </div>

            <div className="flex gap-4">
              <NBButton type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </NBButton>
              <NBButton type="submit" data-testid="dispute-submit">
                Submit Dispute
              </NBButton>
            </div>
          </form>
        </NBCard>
      </div>
    </div>
  );
}
