import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Sparkles, Activity, ShieldAlert, Award } from 'lucide-react';

export function AiDashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['ai-dashboard-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 1. Fetch AI logs
      const { data: logs } = await supabase
        .from('ai_logs')
        .select('*')
        .eq('user_id', user.id);

      // 2. Fetch seller products to count flagged items
      const { data: products } = await supabase
        .from('products')
        .select('status')
        .eq('seller_id', user.id);

      const totalAnalyses = logs?.length ?? 0;
      const averageConfidence = logs && logs.length > 0
        ? logs.reduce((sum, log) => sum + (log.confidence_score ?? 0), 0) / logs.length
        : 0;

      const flaggedCount = products?.filter((p) => p.status === 'flagged').length ?? 0;

      // Calculate feature usage breakdown
      const usageMap: Record<string, number> = {};
      logs?.forEach((log) => {
        usageMap[log.feature_name] = (usageMap[log.feature_name] || 0) + 1;
      });

      const featuresList = Object.entries(usageMap).map(([name, count]) => ({
        name: name.replace(/_/g, ' ').toUpperCase(),
        count
      })).sort((a, b) => b.count - a.count);

      return {
        totalAnalyses,
        averageConfidence,
        flaggedCount,
        featuresList
      };
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-16 bg-neutral-100 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-neutral-100 rounded-2xl" />
          <div className="h-24 bg-neutral-100 rounded-2xl" />
          <div className="h-24 bg-neutral-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const data = stats || {
    totalAnalyses: 0,
    averageConfidence: 0,
    flaggedCount: 0,
    featuresList: []
  };

  // Confidence dial circumference parameters
  const radius = 35;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (data.averageConfidence) * circumference;

  return (
    <div className="space-y-6">
      {/* Welcome AI banner */}
      <div className="bg-accent-50 rounded-2xl p-5 border border-accent-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent-500 shrink-0" size={20} />
            <h2 className="text-lg font-bold text-accent-950">AI Smart Assistant Dashboard</h2>
          </div>
          <p className="text-sm text-accent-700 mt-1">Review confidence scores, fake risk detections, and automatic description metrics.</p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-neutral-50 p-4 rounded-2xl flex items-center justify-between border border-neutral-100">
          <div>
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Total AI Operations</span>
            <p className="text-2xl font-black text-neutral-900 mt-2">{data.totalAnalyses}</p>
          </div>
          <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl">
            <Activity size={20} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-neutral-50 p-4 rounded-2xl flex items-center justify-between border border-neutral-100">
          <div>
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Avg Confidence Rating</span>
            <p className="text-2xl font-black text-neutral-900 mt-2">{(data.averageConfidence * 100).toFixed(0)}%</p>
          </div>
          {/* SVG Circular Progress Bar */}
          <svg className="w-14 h-14 text-accent-500 select-none" viewBox="0 0 70 70">
            <circle stroke="currentColor" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} r={normalizedRadius} cx={radius} cy={radius} />
          </svg>
        </div>

        {/* Metric 3 */}
        <div className="bg-neutral-50 p-4 rounded-2xl flex items-center justify-between border border-neutral-100">
          <div>
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Flagged Counterfeits</span>
            <p className="text-2xl font-black text-error-600 mt-2">{data.flaggedCount}</p>
          </div>
          <div className="p-3 bg-error-100 text-error-600 rounded-2xl">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Usage statistics */}
        <div className="border border-neutral-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-2">
            <Award size={16} className="text-primary-500" />
            AI Feature Usage Breakdown
          </h3>
          <div className="space-y-3">
            {data.featuresList.map((f, i) => (
              <div key={f.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-neutral-700">
                  <span>{f.name}</span>
                  <span>{f.count} calls</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${i === 0 ? 'bg-primary-500' : 'bg-accent-400'}`}
                    style={{ width: `${(f.count / data.totalAnalyses) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.featuresList.length === 0 && (
              <p className="text-neutral-400 text-center py-6 text-xs">No AI actions logged yet.</p>
            )}
          </div>
        </div>

        {/* AI FAQ Guidance card */}
        <div className="border border-neutral-100 rounded-2xl p-5 space-y-4 shadow-sm bg-gradient-to-br from-neutral-50 to-neutral-100/50">
          <h3 className="font-bold text-neutral-800 text-sm">Automated Listing Rules</h3>
          <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
            <div className="flex gap-2">
              <span className="font-bold text-primary-600">01.</span>
              <p>Uploaded listing prices are cross-checked with historical marketplace sales. Low margins raise fake risk alerts.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary-600">02.</span>
              <p>Condition detection is performed via visual clarity and pixel compression evaluations.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary-600">03.</span>
              <p>Counterfeit warnings immediately route active listings to Admin Review pipelines for buyer protection.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
