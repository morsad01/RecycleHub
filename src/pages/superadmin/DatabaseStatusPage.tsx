import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Badge, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { Server, Database, HardDrive, Cpu, Terminal, RefreshCw } from 'lucide-react';

interface TableStat {
  table_name: string;
  row_count: number;
  size_pretty: string;
}

export function DatabaseStatusPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<TableStat[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDbStats() {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_database_table_stats');
      if (error) throw error;
      
      setStats((data as TableStat[]) || []);
    } catch (err: any) {
      toast('Failed to load database stats: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDbStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="text-red-500" size={20} /> Supabase Database Console
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Inspect active tables, view record volumes, and monitor disk allocation on your cloud Postgres instance.</p>
        </div>
        <Button size="sm" variant="outline" className="border-gray-800 text-gray-400 hover:text-white flex items-center gap-1" onClick={fetchDbStats}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh Catalog
        </Button>
      </div>

      {/* Database Connection Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gray-950 border-gray-800 flex gap-3 items-center">
          <div className="h-9 w-9 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
            <Database size={18} />
          </div>
          <div>
            <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">Connection Status</span>
            <span className="text-xs font-bold text-emerald-500">CONNECTED / HEALTHY</span>
          </div>
        </Card>

        <Card className="p-4 bg-gray-950 border-gray-800 flex gap-3 items-center">
          <div className="h-9 w-9 bg-blue-950/40 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
            <Server size={18} />
          </div>
          <div>
            <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">PostgreSQL Engine</span>
            <span className="text-xs font-bold text-white">PostgreSQL 15+ (Supabase)</span>
          </div>
        </Card>

        <Card className="p-4 bg-gray-950 border-gray-800 flex gap-3 items-center">
          <div className="h-9 w-9 bg-purple-950/40 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
            <Terminal size={18} />
          </div>
          <div>
            <span className="text-4xs font-mono text-gray-500 uppercase tracking-widest block">Project Reference</span>
            <span className="text-xs font-bold text-white font-mono select-all">neqjmodldfqtyhlshozk</span>
          </div>
        </Card>
      </div>

      {/* Catalog Table stats */}
      <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
          <h3 className="font-bold text-xs text-white font-mono tracking-wider">ACTIVE DATABASE SCHEMAS (public)</h3>
          <Badge className="bg-blue-950 border border-blue-500/20 text-blue-500 text-4xs font-mono font-bold">Base Tables Only</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-900/40 text-gray-500 font-semibold border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Table Name</th>
                <th className="px-6 py-4 text-center">Row Count (Estimates)</th>
                <th className="px-6 py-4 text-center">Allocated Disk Size</th>
                <th className="px-6 py-4 text-right">Data State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-3xs">
              {loading && stats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">Querying database catalogs...</td>
                </tr>
              ) : stats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">No tables detected in the public schema.</td>
                </tr>
              ) : (
                stats.map((t) => (
                  <tr key={t.table_name} className="hover:bg-gray-900/20">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                      <Terminal size={12} className="text-gray-600" /> {t.table_name}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-300 font-bold">{t.row_count}</td>
                    <td className="px-6 py-4 text-center text-gray-400">{t.size_pretty}</td>
                    <td className="px-6 py-4 text-right">
                      {t.row_count > 0 ? (
                        <span className="text-emerald-500 font-bold">OK (POPULATED)</span>
                      ) : (
                        <span className="text-gray-600">EMPTY</span>
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
export default DatabaseStatusPage;
