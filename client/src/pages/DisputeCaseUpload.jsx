/**
 * @fileoverview Dispute case upload page - simplified version
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { NBCard } from '@/components/NBCard';
import { NBButton } from '@/components/NBButton';
import { disputeService } from '@/lib/services/disputeService';
import { ChevronLeft, Upload, X, FileText, AlertTriangle } from 'lucide-react';

/**
 * Simplified dispute case upload page
 */
export function DisputeCaseUpload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const propertyId = searchParams.get('propertyId');
  const role = searchParams.get('role') || 'tenant';

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    evidence: []
  });

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      // Validate file type (images and documents)
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name} (max 10MB)`);
        return false;
      }

      return true;
    });

    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...validFiles]
    }));

    toast.success(`${validFiles.length} file(s) added as evidence`);
  };

  const removeEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      setUploadProgress(20);

      // Create case data
      const caseData = {
        title: formData.title,
        claimSummary: formData.description,
        detailedStatement: formData.description
      };

      // Upload dispute case to IPFS
      const result = await disputeService.uploadDisputeCase(
        propertyId,
        role,
        caseData,
        formData.evidence
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setUploadProgress(80);

      // Store case reference
      localStorage.setItem(`dispute_${propertyId}_${role}`, JSON.stringify({
        caseUrl: result.caseUrl,
        caseHash: result.caseHash,
        submittedAt: new Date().toISOString(),
        role: role,
        propertyId: propertyId
      }));

      setUploadProgress(100);

      toast.success('Dispute case uploaded successfully!', {
        description: `Your ${role} case has been stored on IPFS`
      });

      // Navigate back to escrow page
      navigate(`/tenant/escrow/${propertyId}`);
    } catch (error) {
      console.error('Failed to upload dispute case:', error);
      toast.error('Failed to upload dispute case', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!propertyId) {
    return (
      <div className="min-h-screen bg-nb-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold text-xl text-nb-ink mb-2">
            Missing Property ID
          </h2>
          <p className="text-nb-ink/70 mb-4">
            No property ID specified for dispute upload.
          </p>
          <NBButton onClick={() => navigate('/tenant')}>
            Back to Properties
          </NBButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/tenant/escrow/${propertyId}`)}
            className="flex items-center text-nb-ink/70 hover:text-nb-ink mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Escrow
          </button>
          <h1 className="font-display font-bold text-3xl text-nb-ink mb-2">
            Upload Your Dispute Case
          </h1>
          <p className="font-body text-nb-ink/70">
            Submit your case for Property #{propertyId} as {role}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <NBCard className="mb-8">
            <div className="space-y-6">
              {/* Dispute Title */}
              <div>
                <label className="block text-sm font-medium text-nb-ink mb-2">
                  Dispute Title *
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                  placeholder="Brief title for your dispute case"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Dispute Description */}
              <div>
                <label className="block text-sm font-medium text-nb-ink mb-2">
                  Dispute Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
                  placeholder="Describe your dispute in detail. Include what happened, why you're disputing, and what you're seeking as resolution..."
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-nb-ink/60 mt-1">
                  Be as detailed as possible. Include dates, events, and any relevant information that will help the jury understand your case.
                </p>
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block text-sm font-medium text-nb-ink mb-2">
                  Evidence Files (Optional)
                </label>
                
                <div className="border-2 border-dashed border-nb-ink rounded-nb p-6 text-center">
                  <Upload className="w-8 h-8 text-nb-ink/40 mx-auto mb-2" />
                  <p className="text-sm text-nb-ink/70 mb-4">
                    Upload images, documents, or other evidence to support your case (Max 10MB per file)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    id="evidence-upload"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <div className="inline-flex items-center px-4 py-2 bg-nb-accent text-nb-ink font-medium rounded-nb border-2 border-nb-ink hover:bg-nb-accent/80 transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </div>
                  </label>
                  <p className="text-xs text-nb-ink/60 mt-2">
                    Supported: JPG, PNG, GIF, PDF, TXT
                  </p>
                </div>

                {/* Evidence Preview */}
                {formData.evidence.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-nb-ink mb-2">
                      Evidence Files ({formData.evidence.length})
                    </h4>
                    <div className="space-y-2">
                      {formData.evidence.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border border-nb-ink/20 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-nb-ink/60" />
                            <span className="text-sm text-nb-ink">{file.name}</span>
                            <span className="text-xs text-nb-ink/50">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEvidence(index)}
                            className="text-nb-error hover:text-nb-error/80"
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-nb-warn/20 border-2 border-nb-warn rounded-nb p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-nb-warn mt-0.5" />
                  <div>
                    <h3 className="font-medium text-nb-ink mb-1">Important Notice</h3>
                    <p className="text-sm text-nb-ink/70">
                      Your dispute case will be stored on IPFS and reviewed by the jury. 
                      Make sure all information is accurate and truthful. 
                      False claims may result in penalties.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <NBButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? 'Uploading Case...' : 'Submit Dispute Case'}
                </NBButton>
              </div>
            </div>
          </NBCard>
        </form>

        {/* Upload Progress */}
        {isSubmitting && (
          <NBCard className="bg-nb-accent/20 border-2 border-nb-accent">
            <h3 className="font-medium text-nb-ink mb-2">Uploading Your Case...</h3>
            <div className="w-full bg-nb-bg rounded-full h-2 border border-nb-ink">
              <div 
                className="bg-nb-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-nb-ink/70 mt-2">
              {uploadProgress < 20 && 'Preparing files...'}
              {uploadProgress >= 20 && uploadProgress < 80 && 'Uploading to IPFS...'}
              {uploadProgress >= 80 && uploadProgress < 100 && 'Finalizing case...'}
              {uploadProgress === 100 && 'Case uploaded successfully!'}
            </p>
          </NBCard>
        )}
      </div>
    </div>
  );
}
