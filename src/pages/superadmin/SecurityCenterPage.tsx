import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { 
  Lock, 
  ShieldAlert, 
  History, 
  Terminal, 
  CheckCircle,
  FileJson,
  User,
  ExternalLink
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  created_at: string;
}

export function SecurityCenterPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Security Alert Logs (failed logins)
  const [failedLogins, setFailedLogins] = useState<any[]>([]);

  async function fetchSecurityAudits() {
    try {
      setLoading(true);
      
      // 1. Fetch live DB audit logs from audit_logs table
      const { data: auditData, error: auditErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (auditErr) throw auditErr;
      
      setLogs((auditData as AuditLog[]) || []);

      // 2. Fetch failed logins from login_history
      const { data: failedData } = await supabase
        .from('login_history')
        .select('*, profile:profiles(*)')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);
      setFailedLogins(failedData || []);

    } catch (err: any) {
      toast('Failed to load security audit records: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSecurityAudits();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="text-red-500" size={20} /> Security & System Audit Center
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Monitor platform security warnings, track database-level audit logs, and inspect raw transaction diffs.</p>
        </div>
        <Button size="sm" variant="outline" className="border-gray-800 text-gray-400 hover:text-white" onClick={fetchSecurityAudits}>
          Refresh Audit Feed
        </Button>
      </div>

      {/* Warning Center for Security Officers */}
      {failedLogins.length > 0 && (
        <Card className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex gap-3 items-start">
          <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div className="text-2xs space-y-1.5 w-full">
            <p className="font-bold text-red-500 uppercase tracking-widest font-mono">Alert: Failed Login Attempts Detected</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs font-mono">
              {failedLogins.slice(0, 4).map((login) => (
                <div key={login.id} className="p-2 bg-gray-950/60 rounded-xl border border-red-950/20">
                  <p className="text-white">User: <strong className="text-red-400">{login.profile?.full_name || login.user_id}</strong></p>
                  <p className="text-gray-500">IP: {login.ip_address || 'Unknown'} | Device: {login.device_type || 'Unknown'}</p>
                  <p className="text-gray-600">Timestamp: {new Date(login.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Main Audit Console grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Table Audit Logs Feed */}
        <div className="flex-1">
          <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
              <h3 className="font-bold text-xs text-white font-mono tracking-wider">DATABASE AUDIT LOGS (REALTIME TRIGGERS)</h3>
              <Badge className="bg-emerald-950 border border-emerald-500/20 text-emerald-500 text-4xs font-mono font-bold">MUTATION TRACKING ACTIVE</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-900/40 text-gray-500 font-semibold border-b border-gray-800">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Modified Table</th>
                    <th className="px-5 py-3">Record Key</th>
                    <th className="px-5 py-3 text-right">Raw Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono text-3xs">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">Querying security console...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">No database events recorded in this period.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-gray-900/40 cursor-pointer transition-colors ${selectedLog?.id === log.id ? 'bg-red-950/20' : ''}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-5 py-4 text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-4xs font-bold ${
                            log.action === 'INSERT' ? 'bg-emerald-950 border border-emerald-500/20 text-emerald-400' :
                            log.action === 'UPDATE' ? 'bg-yellow-950 border border-yellow-500/20 text-yellow-400' :
                            'bg-red-950 border border-red-500/20 text-red-400'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-white">{log.table_name}</td>
                        <td className="px-5 py-4 text-gray-400 truncate max-w-[120px]">{log.record_id}</td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-red-500 hover:underline font-bold flex items-center justify-end gap-0.5 cursor-pointer">
                            Inspect JSON <ExternalLink size={10} />
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Selected Log Inspector Panel */}
        {selectedLog && (
          <div className="w-full lg:w-[450px] shrink-0 space-y-6">
            <Card className="bg-gray-950 border-gray-800 p-5 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-sm font-mono tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} className="text-red-500" /> TRANSACTION INSPECTOR
                </h3>
                <button onClick={() => setSelectedLog(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
              </div>

              {/* Header Info */}
              <div className="text-3xs font-mono space-y-1 bg-gray-900 p-3 border border-gray-800 rounded-xl">
                <p className="text-gray-500">EVENT ID: <span className="text-white select-all">{selectedLog.id}</span></p>
                <p className="text-gray-500">OPERATOR ID: <span className="text-white">{selectedLog.user_id || 'System / Trigger'}</span></p>
                <p className="text-gray-500">CLIENT IP: <span className="text-white">{selectedLog.ip_address || 'Internal/Loopback'}</span></p>
              </div>

              {/* Side-by-side / Detailed JSON Diffs */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-white border-b border-gray-800 pb-1.5">
                  <FileJson size={14} className="text-red-500" /> Transaction Mutations
                </div>
                
                <div className="space-y-3 font-mono text-[10px] max-h-96 overflow-y-auto">
                  {selectedLog.old_data && (
                    <div>
                      <span className="text-red-500 font-bold block mb-1">[-] PREVIOUS STATE:</span>
                      <pre className="p-3 bg-gray-900 border border-red-950/20 text-gray-400 rounded-xl overflow-x-auto max-w-[400px]">
                        {JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.new_data && (
                    <div className="mt-3">
                      <span className="text-emerald-500 font-bold block mb-1">[+] PROPOSED STATE:</span>
                      <pre className="p-3 bg-gray-900 border border-emerald-950/20 text-gray-400 rounded-xl overflow-x-auto max-w-[400px]">
                        {JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
export default SecurityCenterPage;
