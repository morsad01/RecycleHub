import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Gift, 
  Users, 
  DollarSign, 
  ArrowRight, 
  CheckCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { formatPrice } from '../../lib/utils';

interface ReferralRecord {
  id: string;
  referrer_id: string;
  referred_email: string;
  reward_amount: number;
  status: 'invited' | 'registered' | 'rewarded';
  created_at: string;
  referrer: {
    full_name: string;
  } | null;
}

export function ReferralsPage() {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Analytics
  const [metrics, setMetrics] = useState({
    totalInvited: 0,
    totalRegistered: 0,
    totalRewarded: 0,
    totalPayout: 0
  });

  async function fetchReferrals() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('referrals')
        .select('*, referrer:profiles!referrals_referrer_id_fkey(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const records = (data as any[]) || [];
      setReferrals(records);

      // Calculations
      const invited = records.filter(r => r.status === 'invited').length;
      const registered = records.filter(r => r.status === 'registered').length;
      const rewarded = records.filter(r => r.status === 'rewarded').length;
      const payout = records
        .filter(r => r.status === 'rewarded')
        .reduce((sum, r) => sum + Number(r.reward_amount), 0);

      setMetrics({
        totalInvited: invited,
        totalRegistered: registered,
        totalRewarded: rewarded,
        totalPayout: payout
      });

    } catch (err: any) {
      toast('Failed to load referral logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleReleaseReward = async (id: string) => {
    setProcessing(id);
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ status: 'rewarded' })
        .eq('id', id);

      if (error) throw error;
      toast('Referral reward released successfully.', 'success');
      fetchReferrals();
    } catch (err: any) {
      toast('Failed to approve payout: ' + err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Gift className="text-red-500" size={20} /> Customer Referral & Rewards Desk
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Monitor customer referral logs, audit payout rewards, and approve campaign incentive allocations.</p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-950 border-gray-800 border-l-4 border-l-yellow-500">
          <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">Total Invitations Sent</span>
          <span className="text-md font-extrabold text-white font-mono mt-1 block">
            {metrics.totalInvited + metrics.totalRegistered + metrics.totalRewarded} Users
          </span>
        </Card>

        <Card className="p-4 bg-gray-950 border-gray-800 border-l-4 border-l-blue-500">
          <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">Conversion Rate</span>
          <span className="text-md font-extrabold text-white font-mono mt-1 block">
            {metrics.totalInvited + metrics.totalRegistered + metrics.totalRewarded > 0 
              ? `${Math.round(((metrics.totalRegistered + metrics.totalRewarded) / (metrics.totalInvited + metrics.totalRegistered + metrics.totalRewarded)) * 100)}%` 
              : '0%'}
          </span>
        </Card>

        <Card className="p-4 bg-gray-950 border-gray-800 border-l-4 border-l-purple-500">
          <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">Pending Approvals</span>
          <span className="text-md font-extrabold text-yellow-500 font-mono mt-1 block">
            {metrics.totalRegistered} Payouts
          </span>
        </Card>

        <Card className="p-4 bg-gray-950 border-gray-800 border-l-4 border-l-emerald-500">
          <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">Incentives Released</span>
          <span className="text-md font-extrabold text-emerald-500 font-mono mt-1 block">
            {formatPrice(metrics.totalPayout)}
          </span>
        </Card>
      </div>

      {/* Referrals table */}
      <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
          <h3 className="font-bold text-xs text-white font-mono tracking-wider">REFERRAL CONVERSIONS LOGS</h3>
          <Badge className="bg-blue-950 border border-blue-500/20 text-blue-500 text-4xs font-mono font-bold">REWARD MODEL: ৳50.00 / CONVERSION</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-900/40 text-gray-400 font-semibold border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Referrer (Promoter)</th>
                <th className="px-6 py-4">Referred Lead Email</th>
                <th className="px-6 py-4 font-mono">Date Logged</th>
                <th className="px-6 py-4 text-center">Reward (৳)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right font-mono">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-3xs">
              {loading && referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">Querying referral engine...</td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No referral records captured.</td>
                </tr>
              ) : (
                referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-900/20">
                    <td className="px-6 py-4 font-sans font-bold text-white">
                      {r.referrer?.full_name || 'System'}
                      <div className="text-3xs text-gray-500 font-mono mt-0.5">{r.referrer_id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-bold">{r.referred_email}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center text-white font-bold">৳{r.reward_amount}</td>
                    <td className="px-6 py-4">
                      <Badge className={
                        r.status === 'rewarded' ? 'bg-emerald-950 border border-emerald-500/20 text-emerald-400' :
                        r.status === 'registered' ? 'bg-yellow-950 border border-yellow-500/20 text-yellow-400' :
                        'bg-gray-900 border border-gray-800 text-gray-500'
                      }>
                        {r.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 'registered' ? (
                        <Button 
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-2.5 rounded-lg font-bold"
                          onClick={() => handleReleaseReward(r.id)}
                          disabled={processing === r.id}
                        >
                          {processing === r.id ? 'Releasing...' : 'Release Reward'}
                        </Button>
                      ) : r.status === 'rewarded' ? (
                        <span className="text-emerald-500 font-bold flex items-center justify-end gap-0.5"><CheckCircle size={12} /> PAID</span>
                      ) : (
                        <span className="text-gray-600">Pending Signup</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
export default ReferralsPage;
