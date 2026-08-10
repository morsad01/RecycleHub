import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Users, 
  Search, 
  DollarSign, 
  ShoppingBag, 
  Heart, 
  Star, 
  ShieldAlert, 
  Activity,
  History,
  TrendingUp,
  Mail
} from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import type { Profile } from '../../types';

interface CrmStats {
  clv: number;
  totalOrders: number;
  wishlistCount: number;
  reviewsCount: number;
  supportTicketsCount: number;
  sellerProductsCount: number;
}

export function CrmPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Customer details
  const [selectedCust, setSelectedCust] = useState<Profile | null>(null);
  const [crmStats, setCrmStats] = useState<CrmStats>({
    clv: 0,
    totalOrders: 0,
    wishlistCount: 0,
    reviewsCount: 0,
    supportTicketsCount: 0,
    sellerProductsCount: 0
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      
      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCustomers((data as Profile[]) || []);
    } catch (err: any) {
      toast('Failed to load CRM data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  // Load detailed CRM history when customer is clicked
  useEffect(() => {
    if (!selectedCust) return;

    const uId = selectedCust.id;
    async function loadCrmHistory() {
      // 1. Fetch Orders & Calculate CLV (Customer Lifetime Value)
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', uId)
        .order('created_at', { ascending: false });

      const paidOrders = orderData?.filter(o => o.payment_status === 'paid') || [];
      const clvSum = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      setOrders(orderData || []);

      // 2. Fetch Wishlist Items
      const { count: wishCount } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uId);

      // 3. Fetch Support Tickets / Reports count
      const { count: ticketCount, data: ticketData } = await supabase
        .from('reports')
        .select('*', { count: 'exact' })
        .eq('reporter_id', uId);
      setTickets(ticketData || []);

      // 4. Fetch Reviews Count
      const { count: revCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('reviewer_id', uId);

      // 5. Fetch Seller Listings Count
      const { count: prodCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', uId);

      setCrmStats({
        clv: clvSum,
        totalOrders: orderData?.length || 0,
        wishlistCount: wishCount || 0,
        reviewsCount: revCount || 0,
        supportTicketsCount: ticketCount || 0,
        sellerProductsCount: prodCount || 0
      });
    }

    loadCrmHistory();
  }, [selectedCust]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="text-red-500" size={20} /> Enterprise Customer Relationship Hub (CRM)
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Monitor customer lifecycles, audit shopping carts, measure seller ratings, and calculate Customer Lifetime Value (CLV).</p>
        </div>
      </div>

      {/* Search directory */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-500" />
        </span>
        <Input
          placeholder="Filter customers by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-gray-950 border-gray-800 text-white"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Table directory */}
        <div className="flex-1">
          <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-800">
                  <tr>
                    <th className="px-5 py-3">Customer Profile</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3 font-mono">Date Joined</th>
                    <th className="px-5 py-3 text-right">Relationship State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {loading && customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 font-mono">Querying CRM database...</td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 font-mono">No customers found.</td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-gray-900/40 cursor-pointer transition-colors ${selectedCust?.id === c.id ? 'bg-red-950/20' : ''}`}
                        onClick={() => setSelectedCust(c)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-white leading-tight">{c.full_name}</div>
                          <div className="text-3xs text-gray-500 font-mono truncate max-w-[200px]">{c.id}</div>
                        </td>
                        <td className="px-5 py-4 text-gray-300 font-mono">{c.phone || 'N/A'}</td>
                        <td className="px-5 py-4 text-gray-450 font-mono">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Badge className="bg-gray-900 border border-gray-800 text-gray-400">
                            {c.role.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* CLV & Relationship Detail Panel */}
        {selectedCust && (
          <div className="w-full lg:w-[480px] shrink-0 space-y-6">
            <Card className="bg-gray-950 border-gray-800 p-5 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-sm font-mono tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-red-500" /> RELATIONSHIP METRICS
                </h3>
                <button onClick={() => setSelectedCust(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
              </div>

              <div>
                <h4 className="font-extrabold text-white text-md">{selectedCust.full_name}</h4>
                <p className="text-3xs text-gray-500 font-mono select-all">{selectedCust.id}</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-gray-900 border-gray-850 border-l-4 border-l-emerald-500">
                  <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">Customer Lifetime Value</span>
                  <span className="text-md font-extrabold text-emerald-500 font-mono mt-1 block">
                    {formatPrice(crmStats.clv)}
                  </span>
                </Card>

                <Card className="p-4 bg-gray-900 border-gray-850 border-l-4 border-l-blue-500">
                  <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">Total Orders / Wishlist</span>
                  <span className="text-md font-extrabold text-white font-mono mt-1 block">
                    {crmStats.totalOrders} / {crmStats.wishlistCount}
                  </span>
                </Card>
              </div>

              {/* Activity Lists Tabs */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5 uppercase">
                  <History size={14} className="text-red-500" /> Order History Logs
                </div>
                {orders.length === 0 ? (
                  <p className="text-3xs text-gray-500 font-mono py-1">No orders placed by this customer.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orders.map((o) => (
                      <div key={o.id} className="text-3xs font-mono p-3 bg-gray-900 border border-gray-850 rounded-xl space-y-1">
                        <div className="flex justify-between">
                          <span className="text-white font-bold">Order #{o.id.substring(0, 8)}</span>
                          <span className={o.payment_status === 'paid' ? 'text-emerald-400 font-bold' : 'text-yellow-400'}>
                            {o.payment_status?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Value: ৳{o.total_amount}</span>
                          <span>{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5 uppercase mt-4">
                  <ShieldAlert size={14} className="text-red-500" /> Support Desk Activity
                </div>
                {tickets.length === 0 ? (
                  <p className="text-3xs text-gray-500 font-mono py-1">No support tickets submitted.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {tickets.map((t) => (
                      <div key={t.id} className="text-3xs font-mono p-3 bg-gray-900 border border-gray-850 rounded-xl space-y-1">
                        <div className="flex justify-between text-gray-400">
                          <span className="font-bold text-red-400">{t.reason}</span>
                          <span>{t.status?.toUpperCase()}</span>
                        </div>
                        <p className="text-gray-500 leading-normal truncate">{t.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
export default CrmPage;
