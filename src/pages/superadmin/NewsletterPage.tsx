import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Mail, 
  Download, 
  Upload, 
  Trash2, 
  Search, 
  Plus, 
  AlertCircle,
  CheckCircle,
  PlusCircle
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export function NewsletterPage() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & Forms
  const [showImportModal, setShowImportModal] = useState(false);
  const [batchEmails, setBatchEmails] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchSubscribers() {
    try {
      setLoading(true);
      let query = supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.ilike('email', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSubscribers(data || []);
    } catch (err: any) {
      toast('Failed to load newsletter subscribers: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscribers();
  }, [search]);

  // Add individual subscriber
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: newEmail.toLowerCase().trim(),
          is_active: true
        });

      if (error) throw error;
      toast('Subscriber added to newsletter database.', 'success');
      setShowAddModal(false);
      setNewEmail('');
      fetchSubscribers();
    } catch (err: any) {
      toast('Failed to add subscriber: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Batch import emails
  const handleBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchEmails.trim()) return;

    setSaving(true);
    try {
      // Split by comma, newline, or whitespace
      const emails = batchEmails
        .split(/[\n,; \t]+/)
        .map(email => email.trim().toLowerCase())
        .filter(email => {
          // Simple email validation regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        });

      if (emails.length === 0) {
        toast('No valid email addresses parsed from text input.', 'error');
        setSaving(false);
        return;
      }

      // Format for insert
      const rows = emails.map(email => ({
        email,
        is_active: true
      }));

      // Batch insert ignoring duplicates
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert(rows)
        .select();

      // Note: If some duplicate error is hit, upsert might be better or filter duplicates locally
      if (error) {
        // If batch fails due to uniqueness, we can do upsert
        const { error: upsertErr } = await supabase
          .from('newsletter_subscribers')
          .upsert(rows, { onConflict: 'email' });
        if (upsertErr) throw upsertErr;
      }

      toast(`Successfully imported ${emails.length} subscriber emails.`, 'success');
      setShowImportModal(false);
      setBatchEmails('');
      fetchSubscribers();
    } catch (err: any) {
      toast('Import failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (sub: Subscriber) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: !sub.is_active })
        .eq('id', sub.id);

      if (error) throw error;
      toast(sub.is_active ? 'Subscription suspended.' : 'Subscription active.', 'success');
      fetchSubscribers();
    } catch (err: any) {
      toast('Toggle failed: ' + err.message, 'error');
    }
  };

  // Delete subscriber
  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this subscriber from the platform mailing list?')) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Subscriber removed.', 'success');
      fetchSubscribers();
    } catch (err: any) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast('No subscriber records to export.', 'warning');
      return;
    }

    // CSV structure
    const headers = ['ID', 'Email', 'Active Status', 'Date Subscribed'];
    const rows = subscribers.map(sub => [
      sub.id,
      sub.email,
      sub.is_active ? 'Active' : 'Unsubscribed',
      new Date(sub.created_at).toLocaleDateString()
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `recyclehub_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast('CSV Export completed successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="text-red-500" size={20} /> Corporate Newsletter Subscribers
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Manage Platform newsletter subscribers. Batch-import email listings and export active newsletter databases.</p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-gray-850 text-gray-400 hover:text-white flex items-center gap-1"
            onClick={handleExportCSV}
          >
            <Download size={14} /> Export CSV
          </Button>

          <Button 
            className="bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-1"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={14} /> Batch Import
          </Button>

          <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Subscriber
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-500" />
        </span>
        <Input
          placeholder="Filter email addresses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-gray-950 border-gray-800 text-white"
        />
      </div>

      {/* Table */}
      <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Subscriber Email</th>
                <th className="px-6 py-4 font-mono">Subscription Date</th>
                <th className="px-6 py-4">Mailing Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-3xs">
              {loading && subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">Querying subscriber tables...</td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">Mailing directory is empty.</td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-900/20">
                    <td className="px-6 py-4 font-bold text-white select-all">{s.email}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {s.is_active ? (
                        <Badge variant="success" className="bg-emerald-950/80 border border-emerald-500/20 text-emerald-400">ACTIVE</Badge>
                      ) : (
                        <Badge variant="error" className="bg-red-950/80 border border-red-500/20 text-red-400">UNSUBSCRIBED</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={s.is_active ? 'text-gray-400 hover:text-white' : 'text-emerald-500 hover:bg-emerald-950/20'}
                          onClick={() => handleToggleStatus(s)}
                          title={s.is_active ? 'Suspend Subscription' : 'Activate Subscription'}
                        >
                          {s.is_active ? 'Mute' : 'Activate'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:bg-red-950/40"
                          onClick={() => handleDeleteSubscriber(s.id)}
                          title="Remove from list"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <PlusCircle className="text-red-500" size={18} /> ADD EMAIL TO MAILING LIST
            </h3>
            <form onSubmit={handleAddSubscriber} className="space-y-4 font-mono text-xs">
              <Input
                label="Email Address"
                type="email"
                placeholder="customer@recyclehub.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                  Add Subscriber
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* --- BATCH IMPORT MODAL --- */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Upload className="text-red-500" size={18} /> BATCH PARSE EMAIL RECORDS
            </h3>
            <p className="text-3xs text-gray-500 font-mono mb-4">Paste list of subscriber emails below, separated by commas, spaces, or line breaks.</p>
            <form onSubmit={handleBatchImport} className="space-y-4">
              <div>
                <label className="block text-3xs font-mono text-gray-400 mb-1">SUBSCRIBERS EMAIL STREAM:</label>
                <textarea
                  rows={8}
                  placeholder="admin@recyclehub.com, user2@recyclehub.com, user3@recyclehub.com"
                  value={batchEmails}
                  onChange={(e) => setBatchEmails(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl text-xs text-white p-3 font-mono focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowImportModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                  Parse & Insert
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default NewsletterPage;
