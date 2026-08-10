import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Shield, Eye, Lock, FileText, Camera, HelpCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { AdminLayout } from './AdminLayout';
import { Avatar, Badge, Button, Modal, Textarea } from '../../components/ui';
import { formatDate } from '../../lib/utils';
import type { IdentityVerification, Profile } from '../../types';

export function AdminIdentityVerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedVerif, setSelectedVerif] = useState<IdentityVerification | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [actionType, setActionType] = useState<'rejected' | 'more_info_needed'>('rejected');

  const { data: verifications, isLoading } = useQuery({
    queryKey: ['admin-identity-verifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('identity_verifications')
        .select('*, user:profiles!user_id(*)')
        .order('created_at', { ascending: false });
      return (data ?? []) as (IdentityVerification & { user: Profile })[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, feedback }: { id: string; status: any; feedback?: string }) => {
      await supabase
        .from('identity_verifications')
        .update({
          status,
          admin_feedback: feedback || null,
          reviewer_id: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      const verif = verifications?.find((v) => v.id === id);
      if (verif && status === 'approved') {
        // Upgrade profile verified identity status
        await supabase
          .from('profiles')
          .update({
            is_seller_verified: true,
            identity_verified: true,
            verification_level: 'level_3',
          })
          .eq('id', verif.user_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-identity-verifications'] });
      toast('Verification review completed successfully', 'success');
      setShowFeedbackModal(false);
      setSelectedVerif(null);
      setFeedbackText('');
    },
  });

  const handleOpenFeedback = (v: IdentityVerification, type: 'rejected' | 'more_info_needed') => {
    setSelectedVerif(v);
    setActionType(type);
    setFeedbackText(
      type === 'rejected'
        ? 'Identity document could not be authenticated. Name or photo mismatch.'
        : 'Please upload a clearer image of your government ID with all 4 corners visible.'
    );
    setShowFeedbackModal(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Identity KYC Review Queue</h1>
          <p className="text-xs text-neutral-500 mt-1">Review government ID documents, selfies, and approve verified badges securely.</p>
        </div>
        <Badge variant="primary" className="px-3 py-1 text-xs">
          <Lock size={12} className="mr-1" /> Privacy Shield Active
        </Badge>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-3xl" />
            ))}
          </div>
        ) : verifications && verifications.length > 0 ? (
          verifications.map((v) => (
            <div key={v.id} className="bg-white rounded-3xl shadow-card border border-neutral-100 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <Avatar src={v.user?.avatar_url} name={v.user?.full_name} size={48} />
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">{v.user?.full_name}</h3>
                    <p className="text-2xs text-neutral-400">
                      ID: {v.user_id.slice(0, 8)} • Submitted {formatDate(v.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-2xs font-bold ${
                      v.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'rejected'
                        ? 'bg-error-100 text-error-800'
                        : v.status === 'more_info_needed'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-primary-100 text-primary-800'
                    }`}
                  >
                    {v.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Document details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-50">
                  <span className="text-3xs text-neutral-400 font-semibold uppercase block">Doc Type</span>
                  <span className="font-bold text-neutral-800 uppercase mt-0.5 block">{v.document_type}</span>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50">
                  <span className="text-3xs text-neutral-400 font-semibold uppercase block">AI Readability</span>
                  <span className="font-bold text-emerald-600 mt-0.5 block">
                    {Math.round((v.ai_readability_score || 0.9) * 100)}% Quality
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50">
                  <span className="text-3xs text-neutral-400 font-semibold uppercase block">ID Document</span>
                  <span className="font-semibold text-primary-600 mt-0.5 block truncate">
                    {v.document_storage_path ? 'Encrypted File' : 'Not Attached'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50">
                  <span className="text-3xs text-neutral-400 font-semibold uppercase block">Selfie Match</span>
                  <span className="font-semibold text-primary-600 mt-0.5 block truncate">
                    {v.selfie_storage_path ? 'Attached' : 'Not Provided'}
                  </span>
                </div>
              </div>

              {v.admin_feedback && (
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-900 text-xs">
                  <strong>Feedback Given:</strong> {v.admin_feedback}
                </div>
              )}

              {/* Actions */}
              {v.status === 'pending' && (
                <div className="flex flex-wrap gap-2 justify-end pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenFeedback(v, 'more_info_needed')}
                  >
                    <HelpCircle size={14} className="mr-1" /> Request More Info
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-error-600 border-error-200 hover:bg-error-50"
                    onClick={() => handleOpenFeedback(v, 'rejected')}
                  >
                    <X size={14} className="mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => reviewMutation.mutate({ id: v.id, status: 'approved' })}
                  >
                    <Check size={14} className="mr-1" /> Approve & Grant Verified Badge
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center text-neutral-400 text-sm shadow-card border border-neutral-100">
            <Shield size={36} className="mx-auto text-neutral-300 mb-2" />
            <p>No pending identity verification submissions in queue.</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <Modal
        open={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title={actionType === 'rejected' ? 'Reject Identity Verification' : 'Request Additional Information'}
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">
            Provide clear guidance to the user on why this action was taken:
          </p>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedVerif &&
                reviewMutation.mutate({
                  id: selectedVerif.id,
                  status: actionType,
                  feedback: feedbackText.trim(),
                })
              }
              disabled={!feedbackText.trim()}
            >
              Confirm Action
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
