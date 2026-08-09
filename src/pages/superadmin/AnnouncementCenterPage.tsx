import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Input, Select } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Users, 
  ShieldAlert, 
  Wrench, 
  FileText
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'notice' | 'maintenance' | 'security' | 'promo';
  target: 'everyone' | 'buyers' | 'sellers' | 'admins';
  is_active: boolean;
  created_at: string;
}

export function AnnouncementCenterPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'notice' as const,
    target: 'everyone' as const,
    is_active: true
  });

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err: any) {
      toast('Failed to load announcements: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast('Please enter a title and message', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          target: formData.target,
          is_active: formData.is_active
        });

      if (error) throw error;
      toast('Broadcast announcement published.', 'success');
      setShowAddModal(false);
      setFormData({
        title: '',
        message: '',
        type: 'notice',
        target: 'everyone',
        is_active: true
      });
      fetchAnnouncements();
    } catch (err: any) {
      toast('Failed to publish announcement: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id);

      if (error) throw error;
      toast(announcement.is_active ? 'Announcement disabled.' : 'Announcement active.', 'success');
      fetchAnnouncements();
    } catch (err: any) {
      toast('Failed to toggle status: ' + err.message, 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broadcast notice?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Broadcast notice removed.', 'success');
      fetchAnnouncements();
    } catch (err: any) {
      toast('Deletion failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="text-red-500" size={20} /> Platform Announcement Center
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Broadcast platform alerts, maintenance notices, safety instructions, and promo banners to user groups.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Broadcast Alert
        </Button>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {loading && announcements.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-mono text-xs">Querying announcement server...</div>
        ) : announcements.length === 0 ? (
          <Card className="p-8 text-center bg-gray-950 border-gray-850">
            <Megaphone size={40} className="mx-auto text-gray-700 mb-2" />
            <p className="text-xs text-gray-500 font-mono">No broadcasts active at this moment.</p>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} className="p-5 bg-gray-950 border-gray-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-700 transition-all">
              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-xl border ${
                  a.type === 'security' ? 'bg-red-950/40 border-red-500/20 text-red-500' :
                  a.type === 'maintenance' ? 'bg-yellow-950/40 border-yellow-500/20 text-yellow-500' :
                  a.type === 'promo' ? 'bg-blue-950/40 border-blue-500/20 text-blue-500' :
                  'bg-gray-900 border-gray-800 text-gray-400'
                }`}>
                  {a.type === 'security' ? <ShieldAlert size={20} /> :
                   a.type === 'maintenance' ? <Wrench size={20} /> :
                   <Megaphone size={20} />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-white text-sm">{a.title}</h4>
                    <span className="text-[10px] font-mono text-gray-500">
                      Target: <strong className="text-white">{a.target.toUpperCase()}</strong>
                    </span>
                    <Badge className={a.is_active ? 'bg-emerald-950/80 border border-emerald-500/20 text-emerald-400' : 'bg-gray-900 border border-gray-800 text-gray-500'}>
                      {a.is_active ? 'BROADCASTING' : 'DISABLED'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">{a.message}</p>
                  <p className="text-3xs text-gray-600 font-mono">Published on: {new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t border-gray-800 md:border-t-0 pt-3 md:pt-0">
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-gray-850 hover:bg-gray-900 ${
                    a.is_active ? 'text-emerald-500' : 'text-gray-500'
                  }`}
                  onClick={() => handleToggleActive(a)}
                >
                  {a.is_active ? 'Mute Notice' : 'Broadcast'}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-950/40"
                  onClick={() => handleDeleteAnnouncement(a.id)}
                >
                  <Trash2 size={14} /> Remove
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Megaphone className="text-red-500" size={18} /> BROADCAST PLATFORM ALERT
            </h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <Input
                label="Alert Title / Headline"
                placeholder="Scheduled Server Maintenance"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />

              <div>
                <label className="block text-2xs font-mono text-gray-400 mb-1">Alert Details / Body Message</label>
                <textarea
                  rows={4}
                  placeholder="Describe your announcement here..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl text-xs text-white p-3 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Notice Category"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="bg-gray-950 border-gray-800 text-white"
                >
                  <option value="notice">General Platform Notice</option>
                  <option value="maintenance">Maintenance alert</option>
                  <option value="security">Security Advisory</option>
                  <option value="promo">Marketing/Promotion</option>
                </Select>

                <Select
                  label="Target User Audience"
                  value={formData.target}
                  onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value as any }))}
                  className="bg-gray-950 border-gray-800 text-white"
                >
                  <option value="everyone">Everyone (All users)</option>
                  <option value="buyers">Buyers only</option>
                  <option value="sellers">Sellers only</option>
                  <option value="admins">Platform Administrators</option>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                  Launch Broadcast
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default AnnouncementCenterPage;
