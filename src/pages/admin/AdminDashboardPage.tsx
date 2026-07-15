import { useQuery } from '@tanstack/react-query';
import { Users, Package, DollarSign, Flag, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/I18nContext';
import { AdminLayout } from './AdminLayout';
import { formatPrice } from '../../lib/utils';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PIE_COLORS = ['#0F7A5C', '#F4A340', '#3A9E7C', '#5BB897', '#92D1BC', '#E08E2A', '#B8721E'];

export function AdminDashboardPage() {
  const { t } = useI18n();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, products, orders, flagged] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
      ]);
      const gmv = orders.data?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0;
      return {
        totalUsers: users.count ?? 0,
        totalListings: products.count ?? 0,
        gmv,
        flagged: flagged.count ?? 0,
      };
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ['admin-charts'],
    queryFn: async () => {
      // New users per day (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [usersData, listingsData, categoryData] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', sevenDaysAgo),
        supabase.from('products').select('created_at').gte('created_at', sevenDaysAgo),
        supabase.from('products').select('category_id, category:categories(name)').eq('status', 'active'),
      ]);

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
      });

      const usersByDay = days.map((day) => ({
        date: day.slice(5),
        users: usersData.data?.filter((u) => u.created_at.startsWith(day)).length ?? 0,
        listings: listingsData.data?.filter((p) => p.created_at.startsWith(day)).length ?? 0,
      }));

      const categoryCounts: Record<string, number> = {};
      categoryData.data?.forEach((p: any) => {
        const name = p.category?.name ?? 'Uncategorized';
        categoryCounts[name] = (categoryCounts[name] ?? 0) + 1;
      });
      const categoryPie = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

      return { usersByDay, categoryPie };
    },
  });

  const kpiCards = [
    { label: t('admin.totalUsers'), value: stats?.totalUsers ?? 0, icon: <Users size={20} />, color: 'bg-primary-500' },
    { label: t('admin.totalListings'), value: stats?.totalListings ?? 0, icon: <Package size={20} />, color: 'bg-blue-500' },
    { label: t('admin.gmv'), value: formatPrice(stats?.gmv ?? 0), icon: <DollarSign size={20} />, color: 'bg-accent-500' },
    { label: t('admin.flagged'), value: stats?.flagged ?? 0, icon: <Flag size={20} />, color: 'bg-error-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('admin.dashboard')}</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-5">
            <div className={`w-10 h-10 rounded-xl ${kpi.color} text-white flex items-center justify-center mb-3`}>
              {kpi.icon}
            </div>
            <p className="text-sm text-neutral-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-500" /> {t('admin.newUsers')} & {t('admin.newListings')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData?.usersByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EC" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#0F7A5C" strokeWidth={2} />
              <Line type="monotone" dataKey="listings" stroke="#F4A340" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-accent-500" /> {t('admin.categoryBreakdown')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData?.categoryPie ?? []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(e: any) => e.name}
              >
                {(chartData?.categoryPie ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
