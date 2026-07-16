import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  ClipboardCheck, 
  Check, 
  X, 
  Sparkles, 
  ShieldAlert, 
  Tag, 
  FileText,
  User,
  MapPin,
  Maximize2
} from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import type { ProductWithRelations } from '../../types';

export function ProductModerationPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function fetchPendingProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, seller:profiles(*), category:categories(*), product_images(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as ProductWithRelations[]) || []);
    } catch (err: any) {
      toast('Failed to load pending listings: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const handleApprove = async (product: ProductWithRelations) => {
    try {
      setProcessing(true);
      const { error } = await supabase
        .from('products')
        .update({ status: 'active' })
        .eq('id', product.id);

      if (error) throw error;
      toast('Listing Approved & Published successfully.', 'success');
      setSelectedProduct(null);
      fetchPendingProducts();
    } catch (err: any) {
      toast('Failed to approve listing: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !rejectFeedback.trim()) return;

    try {
      setProcessing(true);
      // 1. Update product status to rejected
      const { error } = await supabase
        .from('products')
        .update({ status: 'rejected' })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      // 2. Insert admin review feedback/notification to seller
      await supabase.from('notifications').insert({
        user_id: selectedProduct.seller_id,
        title: 'Listing Rejected',
        message: `Your listing "${selectedProduct.title}" was rejected for the following reason: ${rejectFeedback}`,
        type: 'alert'
      });

      toast('Listing Rejected. Seller notified.', 'success');
      setShowRejectModal(false);
      setRejectFeedback('');
      setSelectedProduct(null);
      fetchPendingProducts();
    } catch (err: any) {
      toast('Failed to reject listing: ' + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="text-red-500" size={20} /> Product Moderation Desk
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Verify and audit new listings using AI risk assessments before they are visible on the marketplace.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Listings Queue */}
        <div className="flex-1 space-y-4">
          {loading && products.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-mono text-xs">Querying moderation queue...</div>
          ) : products.length === 0 ? (
            <Card className="p-8 text-center bg-gray-950 border-gray-800">
              <ClipboardCheck size={40} className="mx-auto text-gray-700 mb-2" />
              <p className="text-xs text-gray-500 font-mono">Approval queue is empty. Operational status is up to date.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => {
                const primaryImage = p.product_images?.find(img => img.is_primary)?.url || p.product_images?.[0]?.url;
                return (
                  <Card 
                    key={p.id} 
                    className={`bg-gray-950 border-gray-800 hover:border-gray-700 cursor-pointer overflow-hidden flex flex-col justify-between transition-all ${
                      selectedProduct?.id === p.id ? 'ring-2 ring-red-600' : ''
                    }`}
                    onClick={() => setSelectedProduct(p)}
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="aspect-video w-full bg-gray-900 relative">
                        {primaryImage ? (
                          <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">No media provided</div>
                        )}
                        {/* Risk Indicator badge */}
                        {p.risk_score > 0.6 && (
                          <span className="absolute top-2 right-2 bg-red-950 border border-red-500/30 text-red-500 text-3xs font-mono font-bold py-1 px-2.5 rounded-full shadow-lg flex items-center gap-1">
                            <ShieldAlert size={10} /> HIGH RISK ({Math.floor(p.risk_score * 100)}%)
                          </span>
                        )}
                      </div>

                      {/* Content info */}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-xs truncate max-w-[70%]">{p.title}</h4>
                          <span className="text-xs font-bold text-red-400 font-mono">৳{p.price}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-3xs text-gray-500">
                          <span className="bg-gray-900 border border-gray-800 py-0.5 px-2 rounded text-gray-400">{p.category?.name || 'Uncategorized'}</span>
                          <span>•</span>
                          <span>{p.condition?.toUpperCase() || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-900/60 border-t border-gray-800/40 flex justify-between items-center">
                      <span className="text-3xs text-gray-500 font-mono flex items-center gap-1">
                        <User size={10} /> {p.seller?.full_name}
                      </span>
                      <span className="text-3xs text-red-500 hover:underline font-bold flex items-center gap-0.5">
                        Audit Details <Maximize2 size={10} />
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Product Auditing Sheet */}
        {selectedProduct && (
          <div className="w-full lg:w-[450px] shrink-0 space-y-6">
            <Card className="bg-gray-950 border-gray-800 p-5 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-sm font-mono tracking-wider">LISTING COMPLIANCE AUDIT</h3>
                <button onClick={() => setSelectedProduct(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
              </div>

              {/* Basic Meta */}
              <div>
                <h4 className="font-extrabold text-white text-md">{selectedProduct.title}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge className="bg-red-950 border border-red-500/20 text-red-400 font-mono">৳{selectedProduct.price}</Badge>
                  <span className="text-3xs text-gray-500 font-mono flex items-center gap-0.5">
                    <MapPin size={10} /> {selectedProduct.location || 'No Location'}
                  </span>
                </div>
              </div>

              {/* Images Grid Carousel */}
              <div className="grid grid-cols-3 gap-2">
                {selectedProduct.product_images?.map((img) => (
                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="block aspect-square border border-gray-800 rounded-lg overflow-hidden relative group bg-gray-900">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>

              {/* AI Evaluation Metrics */}
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-yellow-500/10 text-yellow-500 rounded-bl-xl border-l border-b border-yellow-500/15 flex items-center gap-1 text-3xs font-bold font-mono">
                  <Sparkles size={10} /> AI AUDITED
                </div>
                <h4 className="text-3xs font-mono font-bold text-gray-400 uppercase tracking-widest">AI Safety Assessment</h4>
                
                <div className="space-y-2.5 pt-1.5">
                  {/* Category Confidence */}
                  <div>
                    <div className="flex justify-between text-3xs text-gray-500 font-mono mb-1">
                      <span>Category Confidence:</span>
                      <span className="text-white font-bold">{selectedProduct.ai_category_confidence ? `${Math.floor(selectedProduct.ai_category_confidence * 100)}%` : 'N/A'}</span>
                    </div>
                    <div className="w-full bg-gray-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full" style={{ width: `${(selectedProduct.ai_category_confidence || 0) * 100}%` }} />
                    </div>
                  </div>

                  {/* Pricing Comparison */}
                  <div className="flex justify-between items-center text-2xs py-1 border-y border-gray-800/40">
                    <span className="text-gray-500 font-mono flex items-center gap-1"><Tag size={12} /> Suggested Retail:</span>
                    <span className="text-white font-bold font-mono">{selectedProduct.ai_suggested_price ? `৳${selectedProduct.ai_suggested_price}` : 'N/A'}</span>
                  </div>

                  {/* AI Condition */}
                  <div className="flex justify-between items-center text-2xs pb-1 border-b border-gray-800/40">
                    <span className="text-gray-500 font-mono">Estimated Wear:</span>
                    <span className="text-white font-bold font-mono uppercase">{selectedProduct.ai_condition || 'N/A'}</span>
                  </div>

                  {/* Counterfeit Risk Score */}
                  <div>
                    <div className="flex justify-between text-3xs text-gray-500 font-mono mb-1">
                      <span>Fake Risk Score:</span>
                      <span className={selectedProduct.risk_score > 0.6 ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>
                        {Math.floor(selectedProduct.risk_score * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-950 h-1 rounded-full overflow-hidden">
                      <div className={selectedProduct.risk_score > 0.6 ? 'bg-red-500 h-full' : 'bg-emerald-500 h-full'} style={{ width: `${(selectedProduct.risk_score || 0) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Specifications & Details */}
              <div className="space-y-2 text-2xs">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5">
                  <FileText size={14} className="text-red-500" /> Listing Specifications
                </div>
                {selectedProduct.brand && <p className="text-gray-400">Brand: <strong className="text-white">{selectedProduct.brand}</strong></p>}
                <p className="text-gray-400">Condition: <strong className="text-white">{selectedProduct.condition?.toUpperCase() || 'N/A'}</strong></p>
                {selectedProduct.stock_quantity && <p className="text-gray-400">Stock Quantity: <strong className="text-white">{selectedProduct.stock_quantity}</strong></p>}
                
                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                  <div className="p-3 bg-gray-900 border border-gray-800/60 rounded-xl mt-2 space-y-1 font-mono">
                    {Object.entries(selectedProduct.specifications).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-500">{k}:</span>
                        <span className="text-gray-300">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedProduct.description && (
                  <div className="pt-2 border-t border-gray-800/60">
                    <span className="text-gray-500 block mb-1">Description:</span>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedProduct.description}</p>
                  </div>
                )}
              </div>

              {/* Review Actions Panel */}
              <div className="flex gap-3 border-t border-gray-800 pt-4">
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5"
                  onClick={() => handleApprove(selectedProduct)}
                  disabled={processing}
                >
                  <Check size={16} /> Approve & Publish
                </Button>
                <Button 
                  className="flex-1 bg-red-950/60 hover:bg-red-900/60 text-red-500 border border-red-500/20 font-semibold flex items-center justify-center gap-1.5"
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                >
                  <X size={16} /> Reject Listing
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* --- REJECT FEEDBACK MODAL --- */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2 border-b border-gray-800 pb-2">
              <X className="text-red-500" size={18} /> REJECT PRODUCT COMPLIANCE
            </h3>
            <p className="text-3xs text-gray-500 font-mono mb-4">State the reason of rejection. Feedback will be sent directly to the seller.</p>
            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-2xs font-mono text-gray-400 mb-1">REJECTION REASON/FEEDBACK:</label>
                <textarea
                  rows={4}
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  placeholder="Describe why this listing violates platform policies..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl text-xs text-white p-3 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" disabled={processing}>
                  Issue Rejection Notice
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default ProductModerationPage;
