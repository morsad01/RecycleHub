import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Input, Select } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Compass, 
  Plus, 
  Trash2, 
  Tag, 
  Calendar, 
  Users, 
  ShieldAlert,
  Percent,
  BadgeCent
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export function CouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as const,
    value: 10,
    min_order_amount: 0,
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
    is_active: true
  });

  async function fetchCoupons() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err: any) {
      toast('Failed to load coupons: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.start_date || !formData.end_date) {
      toast('Please enter a coupon code and active date range', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          code: formData.code.toUpperCase().trim(),
          type: formData.type,
          value: Number(formData.value),
          min_order_amount: Number(formData.min_order_amount),
          max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
          is_active: formData.is_active
        });

      if (error) throw error;
      toast('Discount coupon created.', 'success');
      setShowAddModal(false);
      setFormData({
        code: '',
        type: 'percentage',
        value: 10,
        min_order_amount: 0,
        max_discount_amount: '',
        start_date: '',
        end_date: '',
        usage_limit: '',
        is_active: true
      });
      fetchCoupons();
    } catch (err: any) {
      toast('Failed to create coupon: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this discount coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Coupon removed.', 'success');
      fetchCoupons();
    } catch (err: any) {
      toast('Deletion failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass className="text-red-500" size={20} /> Promo Discount & Coupons Hub
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Establish customer discount campaigns, restrict minimum order values, set user limit controls, and set durations.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Create Coupon
        </Button>
      </div>

      {/* Grid of Coupons */}
      {loading && coupons.length === 0 ? (
        <div className="text-center py-10 text-gray-500 font-mono text-xs">Querying campaigns...</div>
      ) : coupons.length === 0 ? (
        <Card className="p-8 text-center bg-gray-950 border-gray-850">
          <Tag size={40} className="mx-auto text-gray-700 mb-2" />
          <p className="text-xs text-gray-500 font-mono">No discount coupons active.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c) => {
            const isExpired = new Date(c.end_date) < new Date();
            
            return (
              <Card key={c.id} className="bg-gray-950 border-gray-850 overflow-hidden flex flex-col justify-between shadow-2xl">
                <div className="p-5 space-y-4">
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 block">COUPON CODE:</span>
                      <strong className="text-md font-extrabold text-white font-mono uppercase tracking-widest">{c.code}</strong>
                    </div>

                    <Badge className={
                      isExpired ? 'bg-red-950 border border-red-500/20 text-red-500' :
                      c.is_active ? 'bg-emerald-950 border border-emerald-500/20 text-emerald-400' :
                      'bg-gray-900 border border-gray-800 text-gray-500'
                    }>
                      {isExpired ? 'EXPIRED' : c.is_active ? 'ACTIVE' : 'PAUSED'}
                    </Badge>
                  </div>

                  <div className="flex gap-3 items-center p-3 bg-gray-900 border border-gray-850 rounded-xl">
                    <div className="p-2 bg-red-950/40 border border-red-500/20 text-red-500 rounded-lg">
                      {c.type === 'percentage' ? <Percent size={18} /> : <BadgeCent size={18} />}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase">Discount Value:</span>
                      <p className="text-sm font-bold text-white">
                        {c.type === 'percentage' ? `${c.value}% OFF` : `৳${c.value} OFF`}
                      </p>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="text-3xs font-mono text-gray-400 space-y-1.5 p-3.5 bg-gray-900/60 border border-gray-850/40 rounded-xl">
                    <div className="flex justify-between">
                      <span>Minimum Purchase:</span>
                      <span className="text-white">৳{c.min_order_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage Tracker:</span>
                      <span className="text-white">{c.usage_count} / {c.usage_limit || '∞'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires On:</span>
                      <span className="text-white">{new Date(c.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-900/60 border-t border-gray-800/40 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="text-red-500 hover:bg-red-950/40"
                  >
                    <Trash2 size={14} className="inline mr-1" /> Delete Coupon
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Plus className="text-red-500" size={18} /> CREATE CAMPAIGN COUPON
            </h3>
            <form onSubmit={handleCreateCoupon} className="space-y-4 font-mono text-xs">
              <Input
                label="Coupon Code"
                placeholder="RECYCLE10"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Discount Format"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="bg-gray-950 border-gray-800 text-white"
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Cash Discount</option>
                </Select>

                <Input
                  label="Discount Value"
                  type="number"
                  value={formData.value.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  className="bg-gray-950 border-gray-800 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Purchase (৳)"
                  type="number"
                  value={formData.min_order_amount.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: Number(e.target.value) }))}
                  className="bg-gray-950 border-gray-800 text-white"
                />

                <Input
                  label="Total Usage Limits"
                  type="number"
                  placeholder="Unlimited if empty"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Campaign Start"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                  required
                />
                <Input
                  label="Campaign Expiry"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                  Create Coupon
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default CouponsPage;
