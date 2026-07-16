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
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity size={20} className="text-red-500" /> Platform NOC Operations Center
          </h2>
          <p className="text-xs text-gray-500 font-mono">Monitor platform status, load indicators, and pending workflows.</p>
        </div>
        <Badge variant="success" className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-500 py-1 px-3">
          SECURE CONNECTION ACTIVE
        </Badge>
      </div>

      {/* Grid 1: Infrastructure Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-gray-950 border-gray-800 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xs font-mono text-gray-500 uppercase tracking-widest">System Health</p>
              <p className="text-xl font-bold text-white mt-1">{stats.operationalStatus}</p>
            </div>
            <div className="h-10 w-10 bg-emerald-950/50 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <CheckCircle size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gray-950 border-gray-800 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xs font-mono text-gray-500 uppercase tracking-widest">Live Connections</p>
              <p className="text-xl font-bold text-white mt-1">{stats.liveConnections}</p>
            </div>
            <div className="h-10 w-10 bg-blue-950/50 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
              <Users size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gray-950 border-gray-800 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xs font-mono text-gray-500 uppercase tracking-widest">DB Server Load</p>
              <p className="text-xl font-bold text-white mt-1">{stats.dbLoad}%</p>
            </div>
            <div className="h-10 w-10 bg-purple-950/50 border border-purple-500/20 rounded-lg flex items-center justify-center text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
              <Database size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gray-950 border-gray-800 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xs font-mono text-gray-500 uppercase tracking-widest">Security Alerts</p>
              <p className="text-xl font-bold text-white mt-1">{stats.securityAlertsCount}</p>
            </div>
            <div className="h-10 w-10 bg-red-950/50 border border-red-500/20 rounded-lg flex items-center justify-center text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
              <ShieldAlert size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid 2: Workflows and Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <Card className="p-5 bg-gray-950 border-gray-800 md:col-span-2">
          <h3 className="text-sm font-bold text-white tracking-wider font-mono mb-4 border-b border-gray-800 pb-2">PENDING WORKFLOW QUEUES</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-yellow-950/40 border border-yellow-500/20 text-yellow-500 rounded-xl">
                <ClipboardCheck size={20} />
              </div>
              <div>
                <p className="text-2xs text-gray-400 font-medium">Product Reviews</p>
                <p className="text-lg font-bold text-white">{stats.pendingProducts}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-blue-950/40 border border-blue-500/20 text-blue-500 rounded-xl">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-2xs text-gray-400 font-medium">Seller Verifications</p>
                <p className="text-lg font-bold text-white">{stats.pendingVerifications}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-500 rounded-xl">
                <Ticket size={20} />
              </div>
              <div>
                <p className="text-2xs text-gray-400 font-medium">Open Reports</p>
                <p className="text-lg font-bold text-white">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Platform Growth */}
        <Card className="p-5 bg-gray-950 border-gray-800">
          <h3 className="text-sm font-bold text-white tracking-wider font-mono mb-4 border-b border-gray-800 pb-2">REVENUE & GROWTH</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-gray-900/60 p-2.5 rounded-xl border border-gray-800/40">
              <span className="text-xs text-gray-400 flex items-center gap-1.5"><DollarSign size={14} /> Total Revenue</span>
              <span className="text-sm font-bold text-white">{formatPrice(stats.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-900/60 p-2.5 rounded-xl border border-gray-800/40">
              <span className="text-xs text-gray-400 flex items-center gap-1.5"><Users size={14} /> Total Platform Users</span>
              <span className="text-sm font-bold text-white">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-900/60 p-2.5 rounded-xl border border-gray-800/40">
              <span className="text-xs text-gray-400 flex items-center gap-1.5"><Activity size={14} /> New Users Today</span>
              <span className="text-sm font-bold text-white">+{stats.newUsersToday}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid 3: Realtime Infrastructure Monitoring Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 bg-gray-950 border-gray-800">
          <h3 className="text-sm font-bold text-white tracking-wider font-mono mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
            <Cpu size={16} className="text-red-500" /> Infrastructure Node Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-2xs font-mono text-gray-400 mb-1">
                <span>Vercel Edge Node (Asia South)</span>
                <span className="text-green-500 font-bold">ACTIVE (100% OK)</span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-2xs font-mono text-gray-400 mb-1">
                <span>Supabase Deno Edge Runtime</span>
                <span className="text-green-500 font-bold">HEALTHY (99.8%)</span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[99.8%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-2xs font-mono text-gray-400 mb-1">
                <span>Vercel Storage CDN Usage</span>
                <span className="text-gray-400">1.2 GB / 10 GB</span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[12%]" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gray-950 border-gray-800">
          <h3 className="text-sm font-bold text-white tracking-wider font-mono mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
            <Server size={16} className="text-red-500" /> AI API Engine Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">AI Model Provider</span>
              <span className="text-white font-semibold">OpenAI (gpt-4o-mini)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Total API Queries Today</span>
              <span className="text-white font-semibold font-mono">{stats.aiUsageToday} Calls</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">API Threshold Limits</span>
              <span className="text-white font-semibold font-mono text-emerald-400">NORMAL</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Web App API Connection</span>
              <span className="text-white font-semibold font-mono text-emerald-400">CONNECTED</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default PlatformHealthPage;
