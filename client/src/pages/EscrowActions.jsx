/**
 * @fileoverview Escrow actions page for tenants
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { getById as getRental, markCompleted, flagDispute } from '@/lib/services/rentalsService';
import { getById as getProperty } from '@/lib/services/propertiesService';
import { CheckCircle, AlertTriangle, Home, Calendar, IndianRupee } from 'lucide-react';

/**
 * Escrow actions page - tenant can confirm or dispute
 */
export function EscrowActions() {
  const { rentalId } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const rentalData = getRental(rentalId);
        if (!rentalData) {
          toast.error('Rental not found');
          navigate('/tenant');
          return;
        }
        setRental(rentalData);

        const propertyData = getProperty(rentalData.propertyId);
        setProperty(propertyData);
      } catch (error) {
        console.error('Failed to load rental data:', error);
        toast.error('Failed to load rental information');
      } finally {
        setLoading(false);
      }
    };

    if (rentalId) {
      loadData();
    }
  }, [rentalId, navigate]);

  const handleConfirmSatisfaction = () => {
    try {
      markCompleted(rentalId);
      toast.success('Rental completed successfully!', {
        description: 'Funds have been released to the landlord (demo)'
      });
      navigate('/tenant');
    } catch (error) {
      console.error('Failed to complete rental:', error);
      toast.error('Failed to complete rental. Please try again.');
    }
  };

  const handleRaiseDispute = () => {
    try {
      flagDispute(rentalId);
      toast.info('Rental flagged for dispute', {
        description: 'Redirecting to dispute form...'
      });
      navigate(`/disputes/new?rentalId=${rentalId}`);
    } catch (error) {
      console.error('Failed to flag dispute:', error);
      toast.error('Failed to raise dispute. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-nb-ink font-body">Loading rental information...</div>
      </div>
    );
  }

  if (!rental || !property) {
    return null;
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
            Escrow Actions
          </h1>
          <p className="font-body text-nb-ink/70">
            Review your rental and choose your next action
          </p>
        </div>

        {/* Rental Summary */}
        <NBCard className="mb-8">
          <h2 className="font-display font-bold text-xl text-nb-ink mb-6">
            Rental Summary
          </h2>
          
          <div className="flex items-start space-x-6">
            <img
              src={property.photos[0]}
              alt={property.title}
              className="w-32 h-24 object-cover rounded border-2 border-nb-ink"
              onError={(e) => {
                e.target.src = '/mock-images/placeholder-property.jpg';
              }}
            />
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-nb-ink">
                  {property.title}
                </h3>
                <p className="text-nb-ink/70">
                  {property.address}, {property.city}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Home className="w-4 h-4 text-nb-ink/60" />
                  <span className="text-sm text-nb-ink">Rental ID: {rental.id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-nb-ink/60" />
                  <span className="text-sm text-nb-ink">
                    {rental.durationMonths} months
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <IndianRupee className="w-4 h-4 text-nb-ink/60" />
                  <span className="text-sm text-nb-ink">
                    ₹{property.rentPerMonth.toLocaleString()}/month
                  </span>
                </div>
              </div>
              
              <div className="bg-nb-accent/20 border-2 border-nb-accent rounded-nb p-3">
                <div className="text-sm text-nb-ink">
                  <strong>Status:</strong> {rental.status}
                </div>
                <div className="text-xs text-nb-ink/70 mt-1">
                  Started: {new Date(rental.startDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </NBCard>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Happy Path */}
          <NBCard className="text-center hover:-translate-y-1 transition-transform duration-200">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-nb-ok/20 border-2 border-nb-ok rounded-nb mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-nb-ok" />
              </div>
              
              <h3 className="font-display font-bold text-xl text-nb-ink">
                Everything is Fine
              </h3>
              
              <p className="font-body text-nb-ink/70">
                Confirm that you're satisfied with the rental. This will release 
                the escrowed funds to the landlord and complete the rental agreement.
              </p>
              
              <div className="bg-nb-ok/10 border-2 border-nb-ok rounded-nb p-3">
                <div className="text-sm text-nb-ink">
                  <strong>What happens next:</strong>
                </div>
                <ul className="text-xs text-nb-ink/70 mt-1 space-y-1">
                  <li>• Funds released to landlord</li>
                  <li>• Security deposit returned</li>
                  <li>• Rental marked as completed</li>
                </ul>
              </div>
              
              <NBButton
                onClick={handleConfirmSatisfaction}
                className="w-full"
                size="lg"
                data-testid="escrow-happy"
              >
                Confirm Satisfaction
              </NBButton>
            </div>
          </NBCard>

          {/* Dispute Path */}
          <NBCard className="text-center hover:-translate-y-1 transition-transform duration-200">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-nb-warn/20 border-2 border-nb-warn rounded-nb mx-auto flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-nb-warn" />
              </div>
              
              <h3 className="font-display font-bold text-xl text-nb-ink">
                Raise a Dispute
              </h3>
              
              <p className="font-body text-nb-ink/70">
                If there are issues with the rental, raise a dispute. The case 
                will be reviewed by the decentralized jury system for fair resolution.
              </p>
              
              <div className="bg-nb-warn/10 border-2 border-nb-warn rounded-nb p-3">
                <div className="text-sm text-nb-ink">
                  <strong>What happens next:</strong>
                </div>
                <ul className="text-xs text-nb-ink/70 mt-1 space-y-1">
                  <li>• Submit your case details</li>
                  <li>• Landlord responds with evidence</li>
                  <li>• Community jury votes on outcome</li>
                </ul>
              </div>
              
              <NBButton
                variant="secondary"
                onClick={handleRaiseDispute}
                className="w-full"
                size="lg"
                data-testid="escrow-dispute"
              >
                Raise Dispute
              </NBButton>
            </div>
          </NBCard>
        </div>

        {/* Information */}
        <NBCard className="mt-8">
          <h3 className="font-display font-bold text-lg text-nb-ink mb-4">
            Important Information
          </h3>
          
          <div className="space-y-3 text-sm text-nb-ink/80">
            <p>
              <strong>Escrow Protection:</strong> Your funds are safely held in smart 
              contracts until the rental is completed or disputes are resolved.
            </p>
            <p>
              <strong>Dispute Process:</strong> If you raise a dispute, both parties 
              will present their case to a decentralized jury for fair judgment.
            </p>
            <p>
              <strong>Demo Mode:</strong> This is a demonstration. No real funds are 
              involved and no actual transactions will be processed.
            </p>
          </div>
        </NBCard>
      </div>
    </div>
  );
}
