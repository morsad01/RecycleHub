import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  MessageSquareWarning, 
  Trash2, 
  CheckCheck, 
  AlertCircle,
  FileText,
  User,
  ShoppingBag,
  Star
} from 'lucide-react';
import type { Report, Review } from '../../types';

export function ContentModerationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'reports' | 'reviews'>('reports');
  
  // Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  async function fetchReports() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(*), reported_user:profiles!reports_reported_user_id_fkey(*), reported_product:products(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as any[]) || []);
    } catch (err: any) {
      toast('Failed to load reports: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(*), product:products(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data as any[]) || []);
    } catch (err: any) {
      toast('Failed to load reviews: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else {
      fetchReviews();
    }
  }, [activeTab]);

  // Resolve Report
  const handleResolveReport = async (reportId: string, actionStatus: 'resolved' | 'dismissed') => {
    try {
      setProcessing(true);
      const { error } = await supabase
        .from('reports')
        .update({ status: actionStatus })
        .eq('id', reportId);

      if (error) throw error;
      toast(`Report status updated to ${actionStatus}.`, 'success');
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      toast('Failed to update report: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Delete Inappropriate Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user review? This action cannot be undone.')) return;

    try {
      setProcessing(true);
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      toast('Review deleted successfully.', 'success');
      fetchReviews();
    } catch (err: any) {
      toast('Failed to delete review: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquareWarning className="text-red-500" size={20} /> Content Moderation Desk
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Moderate trust & safety reports, remove toxic feedback, and audit content compliance.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-4">
        <button
          className={`py-2.5 px-4 font-mono text-xs font-bold transition-all border-b-2 ${
            activeTab === 'reports' 
              ? 'border-red-500 text-white' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
          onClick={() => { setActiveTab('reports'); setSelectedReport(null); }}
        >
          SAFETY REPORTS ({reports.filter(r => r.status === 'open').length} OPEN)
        </button>
        <button
          className={`py-2.5 px-4 font-mono text-xs font-bold transition-all border-b-2 ${
            activeTab === 'reviews' 
              ? 'border-red-500 text-white' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('reviews')}
        >
          USER REVIEWS & COMMENTS
        </button>
      </div>

      {activeTab === 'reports' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Reports Table list */}
          <div className="flex-1">
            <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="px-5 py-3">Report Details</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {loading && reports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500 font-mono">Loading reports desk...</td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500 font-mono">No reports logged. Platform secure.</td>
                      </tr>
                    ) : (
                      reports.map((r) => (
                        <tr 
                          key={r.id} 
                          className={`hover:bg-gray-900/40 cursor-pointer transition-colors ${selectedReport?.id === r.id ? 'bg-red-950/20' : ''}`}
                          onClick={() => setSelectedReport(r)}
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">Report #{r.id.substring(0, 8)}</div>
                            <div className="text-3xs text-gray-500 font-mono">By: {r.reporter?.full_name || 'Anonymous'}</div>
                          </td>
                          <td className="px-5 py-4 text-gray-300">{r.reason}</td>
                          <td className="px-5 py-4">
                            <Badge 
                              className={
                                r.status === 'open' ? 'bg-red-950/80 border border-red-500/30 text-red-400' :
                                r.status === 'reviewing' ? 'bg-yellow-950/80 border border-yellow-500/30 text-yellow-400' :
                                r.status === 'resolved' ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-400' :
                                'bg-gray-900 border border-gray-800 text-gray-500'
                              }
                            >
                              {r.status?.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-3xs text-red-500 font-mono hover:underline">Verify Desk</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Selected Report auditing detail panel */}
          {selectedReport && (
            <div className="w-full lg:w-96 shrink-0 space-y-6">
              <Card className="bg-gray-950 border-gray-800 p-5 space-y-5 shadow-2xl">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <h3 className="font-bold text-white text-sm font-mono tracking-wider">SAFETY INVESTIGATION</h3>
                  <button onClick={() => setSelectedReport(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1">
                    <span className="text-3xs text-gray-500 font-mono">REPORTER INFO</span>
                    <p className="text-xs font-semibold text-white flex items-center gap-1"><User size={12} /> {selectedReport.reporter?.full_name}</p>
                    <p className="text-3xs text-gray-500 font-mono">{selectedReport.reporter_id}</p>
                  </div>

                  {selectedReport.reported_user && (
                    <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1">
                      <span className="text-3xs text-gray-500 font-mono">REPORTED OFFENDER</span>
                      <p className="text-xs font-semibold text-white flex items-center gap-1"><User size={12} /> {selectedReport.reported_user.full_name}</p>
                      <p className="text-3xs text-gray-500 font-mono">{selectedReport.reported_user_id}</p>
                      <Badge className={selectedReport.reported_user.is_banned ? 'bg-red-950 border border-red-500/20 text-red-500 mt-1' : 'bg-emerald-950 border border-emerald-500/20 text-emerald-500 mt-1'}>
                        {selectedReport.reported_user.is_banned ? 'BANNED' : 'ACTIVE'}
                      </Badge>
                    </div>
                  )}

                  {selectedReport.reported_product && (
                    <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1">
                      <span className="text-3xs text-gray-500 font-mono">REPORTED ITEM/LISTING</span>
                      <p className="text-xs font-semibold text-white flex items-center gap-1"><ShoppingBag size={12} /> {selectedReport.reported_product.title}</p>
                      <p className="text-3xs text-gray-500 font-mono">ID: {selectedReport.reported_product_id}</p>
                      <p className="text-3xs text-red-400 font-mono">Price: ৳{selectedReport.reported_product.price}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5">
                    <AlertCircle size={14} className="text-red-500" /> Allegation Reason
                  </div>
                  <p className="text-white font-semibold">{selectedReport.reason}</p>
                  {selectedReport.description && (
                    <div className="p-3 bg-gray-900 border border-gray-800/40 rounded-xl">
                      <p className="text-gray-400 leading-relaxed text-2xs">{selectedReport.description}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedReport.status === 'open' && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1"
                      onClick={() => handleResolveReport(selectedReport.id, 'resolved')}
                      disabled={processing}
                    >
                      <CheckCheck size={14} /> Mark Resolved
                    </Button>
                    <Button 
                      className="flex-1 bg-gray-850 hover:bg-gray-800 border border-gray-800 text-gray-400 font-semibold flex items-center justify-center gap-1"
                      onClick={() => handleResolveReport(selectedReport.id, 'dismissed')}
                      disabled={processing}
                    >
                      Dismiss Report
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* Reviews Table list */
        <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">Reviewer</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Linked Item</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading && reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 font-mono">Loading reviews directory...</td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 font-mono">No reviews recorded on platform.</td>
                  </tr>
                ) : (
                  reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-gray-900/40">
                      <td className="px-6 py-4 font-semibold text-white">
                        {rev.reviewer?.full_name || 'Anonymous'}
                        <div className="text-3xs text-gray-500 font-mono">{rev.reviewer_id}</div>
                      </td>
                      <td className="px-6 py-4 text-yellow-500 font-bold flex items-center gap-0.5">
                        <Star size={14} className="fill-yellow-500" /> {rev.rating} / 5
                      </td>
                      <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{rev.comment || 'No text comment.'}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {rev.product?.title || 'Unknown Listing'}
                        <div className="text-3xs text-gray-600 font-mono">{rev.product_id}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-red-500 hover:bg-red-950/40"
                          disabled={processing}
                        >
                          <Trash2 size={14} /> Remove Review
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
export default ContentModerationPage;
