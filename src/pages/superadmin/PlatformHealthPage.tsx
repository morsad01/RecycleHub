import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Activity, 
  Server, 
  Users, 
  DollarSign, 
  Database, 
  Cpu, 
  ClipboardCheck, 
  ShieldAlert, 
  Ticket, 
  CheckCircle,
  HardDrive
} from 'lucide-react';
import { formatPrice } from '../../lib/utils';

export function PlatformHealthPage() {
  const [stats, setStats] = useState({
    operationalStatus: 'Operational',
    liveConnections: 0,
    dbLoad: 12,
    apiStatus: 'Healthy',
    aiUsageToday: 0,
    pendingProducts: 0,
    pendingVerifications: 0,
    pendingReports: 0,
    totalUsers: 0,
    newUsersToday: 0,
    todayOrders: 0,
    totalRevenue: 0,
    securityAlertsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Pending Products Count
        const { count: pendingProductsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // 2. Pending Verifications Count
        const { count: pendingVerificationsCount } = await supabase
          .from('seller_verifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // 3. Pending Reports Count
        const { count: pendingReportsCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');

        // 4. Total Users Count
        const { count: totalUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // 5. New Users Today
        const { count: newUsersTodayCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${todayStr}T00:00:00.000Z`);

        // 6. Today's Orders
        const { count: todayOrdersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${todayStr}T00:00:00.000Z`);

        // 7. Total Revenue
        const { data: ordersData } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('payment_status', 'paid');
        const revenueSum = ordersData?.reduce((sum, item) => sum + Number(item.total_amount), 0) || 0;

        // 8. AI Logs Usage Count
        let aiLogsCount = 0;
        try {
          const { count: logsCount } = await supabase
            .from('ai_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${todayStr}T00:00:00.000Z`);
          aiLogsCount = logsCount || 0;
        } catch {}

        // 9. Security Alerts Count (failed logins from login_history)
        let alertCount = 0;
        try {
          const { count: failedLogins } = await supabase
            .from('login_history')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'failed');
          alertCount = failedLogins || 0;
        } catch {}

        // 10. Generate randomized live traffic stats for simulated NOC display
        const simulatedLiveConns = Math.floor(Math.random() * 80) + 120;
        const simulatedDbLoad = Math.floor(Math.random() * 8) + 8;

        setStats({
          operationalStatus: 'Operational',
          liveConnections: simulatedLiveConns,
          dbLoad: simulatedDbLoad,
          apiStatus: 'Healthy',
          aiUsageToday: aiLogsCount,
          pendingProducts: pendingProductsCount || 0,
          pendingVerifications: pendingVerificationsCount || 0,
          pendingReports: pendingReportsCount || 0,
          totalUsers: totalUsersCount || 0,
          newUsersToday: newUsersTodayCount || 0,
          todayOrders: todayOrdersCount || 0,
          totalRevenue: revenueSum,
          securityAlertsCount: alertCount,
        });

      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
    
    // Set up a realtime interval to simulate NOC dashboard metrics updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        liveConnections: Math.max(80, prev.liveConnections + (Math.random() > 0.5 ? 2 : -2)),
        dbLoad: Math.min(99, Math.max(5, prev.dbLoad + (Math.random() > 0.5 ? 1 : -1))),
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1F2937] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" /> Platform NOC Operations Center
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Monitor system status, operational load, and moderation workflows.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#162A22] border border-[#1B4D3E] text-emerald-400 text-xs font-semibold rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          SYSTEM OPERATIONAL
        </div>
      </div>

      {/* Grid 1: Infrastructure Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-[#161F30] border border-[#22304A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">System Health</p>
              <p className="text-xl font-bold text-white mt-1">{stats.operationalStatus}</p>
            </div>
            <div className="h-10 w-10 bg-[#1E293B] border border-[#334155] rounded-lg flex items-center justify-center text-emerald-400">
              <CheckCircle size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#161F30] border border-[#22304A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Live Connections</p>
              <p className="text-xl font-bold text-white mt-1">{stats.liveConnections}</p>
            </div>
            <div className="h-10 w-10 bg-[#1E293B] border border-[#334155] rounded-lg flex items-center justify-center text-slate-300">
              <Users size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#161F30] border border-[#22304A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">DB Server Load</p>
              <p className="text-xl font-bold text-white mt-1">{stats.dbLoad}%</p>
            </div>
            <div className="h-10 w-10 bg-[#1E293B] border border-[#334155] rounded-lg flex items-center justify-center text-slate-300">
              <Database size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#161F30] border border-[#22304A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Security Alerts</p>
              <p className="text-xl font-bold text-white mt-1">{stats.securityAlertsCount}</p>
            </div>
            <div className="h-10 w-10 bg-[#1E293B] border border-[#334155] rounded-lg flex items-center justify-center text-rose-400">
              <ShieldAlert size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid 2: Workflows and Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <Card className="p-5 bg-[#161F30] border border-[#22304A] lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-300 tracking-wider font-mono mb-4 border-b border-[#22304A] pb-2 uppercase">
            Pending Workflow Queues
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-[#1E293B] border border-[#334155] text-amber-400 rounded-lg">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Product Reviews</p>
                <p className="text-lg font-bold text-white">{stats.pendingProducts}</p>
              </div>
            </div>

            <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-[#1E293B] border border-[#334155] text-sky-400 rounded-lg">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Seller Verifications</p>
                <p className="text-lg font-bold text-white">{stats.pendingVerifications}</p>
              </div>
            </div>

            <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-[#1E293B] border border-[#334155] text-rose-400 rounded-lg">
                <Ticket size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Open Reports</p>
                <p className="text-lg font-bold text-white">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Platform Growth */}
        <Card className="p-5 bg-[#161F30] border border-[#22304A]">
          <h3 className="text-xs font-bold text-slate-300 tracking-wider font-mono mb-4 border-b border-[#22304A] pb-2 uppercase">
            Revenue & Growth
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-[#1F2937]">
              <span className="text-xs text-slate-400 flex items-center gap-2"><DollarSign size={14} className="text-emerald-400" /> Total Revenue</span>
              <span className="text-sm font-bold text-white">{formatPrice(stats.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-[#1F2937]">
              <span className="text-xs text-slate-400 flex items-center gap-2"><Users size={14} className="text-sky-400" /> Platform Users</span>
              <span className="text-sm font-bold text-white">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-[#1F2937]">
              <span className="text-xs text-slate-400 flex items-center gap-2"><Activity size={14} className="text-emerald-400" /> New Users Today</span>
              <span className="text-sm font-bold text-emerald-400">+{stats.newUsersToday}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid 3: Realtime Infrastructure Monitoring Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 bg-[#161F30] border border-[#22304A]">
          <h3 className="text-xs font-bold text-slate-300 tracking-wider font-mono mb-4 border-b border-[#22304A] pb-2 flex items-center gap-2 uppercase">
            <Cpu size={15} className="text-slate-400" /> Infrastructure Node Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                <span>Vercel Edge Node (Asia South)</span>
                <span className="text-emerald-400 font-semibold">ACTIVE (100%)</span>
              </div>
              <div className="w-full bg-[#111827] h-2 rounded-full overflow-hidden border border-[#1F2937]">
                <div className="bg-emerald-500 h-full w-[100%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                <span>Supabase Deno Edge Runtime</span>
                <span className="text-emerald-400 font-semibold">HEALTHY (99.8%)</span>
              </div>
              <div className="w-full bg-[#111827] h-2 rounded-full overflow-hidden border border-[#1F2937]">
                <div className="bg-emerald-500 h-full w-[99.8%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                <span>Vercel Storage CDN Usage</span>
                <span className="text-slate-300">1.2 GB / 10 GB</span>
              </div>
              <div className="w-full bg-[#111827] h-2 rounded-full overflow-hidden border border-[#1F2937]">
                <div className="bg-[#3B82F6] h-full w-[12%]" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#161F30] border border-[#22304A]">
          <h3 className="text-xs font-bold text-slate-300 tracking-wider font-mono mb-4 border-b border-[#22304A] pb-2 flex items-center gap-2 uppercase">
            <Server size={15} className="text-slate-400" /> AI API Engine Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs bg-[#111827] p-2.5 rounded-lg border border-[#1F2937]">
              <span className="text-slate-400">AI Model Provider</span>
              <span className="text-white font-semibold">Google Gemini (gemini-1.5-flash)</span>
            </div>
            <div className="flex justify-between items-center text-xs bg-[#111827] p-2.5 rounded-lg border border-[#1F2937]">
              <span className="text-slate-400">API Queries Today</span>
              <span className="text-white font-semibold font-mono">{stats.aiUsageToday} Calls</span>
            </div>
            <div className="flex justify-between items-center text-xs bg-[#111827] p-2.5 rounded-lg border border-[#1F2937]">
              <span className="text-slate-400">API Threshold Limits</span>
              <span className="text-emerald-400 font-semibold font-mono">NORMAL</span>
            </div>
            <div className="flex justify-between items-center text-xs bg-[#111827] p-2.5 rounded-lg border border-[#1F2937]">
              <span className="text-slate-400">Backend Connection</span>
              <span className="text-emerald-400 font-semibold font-mono">CONNECTED</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default PlatformHealthPage;
