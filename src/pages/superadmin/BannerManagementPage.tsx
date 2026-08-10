import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Input, Select } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Image, 
  Plus, 
  Trash2, 
  Calendar, 
  Link2,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Banner {
  id: string;
  type: 'homepage' | 'sidebar' | 'popup' | 'category' | 'offer' | 'flash_sale';
  image_url: string;
  link_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export function BannerManagementPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    type: 'homepage' as const,
    image_url: '',
    link_url: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  async function fetchBanners() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (err: any) {
      toast('Failed to load advertising banners: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url || !formData.start_date || !formData.end_date) {
      toast('Please complete all mandatory fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('banners')
        .insert({
          type: formData.type,
          image_url: formData.image_url,
          link_url: formData.link_url || null,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          is_active: formData.is_active
        });

      if (error) throw error;
      toast('Schedulable advertising banner saved.', 'success');
      setShowAddModal(false);
      setFormData({
        type: 'homepage',
        image_url: '',
        link_url: '',
        start_date: '',
        end_date: '',
        is_active: true
      });
      fetchBanners();
    } catch (err: any) {
      toast('Failed to create banner: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);
        
      if (error) throw error;
      toast(banner.is_active ? 'Banner status deactivated.' : 'Banner scheduling active.', 'success');
      fetchBanners();
    } catch (err: any) {
      toast('Operation failed: ' + err.message, 'error');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this banner advertisement?')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Banner removed successfully.', 'success');
      fetchBanners();
    } catch (err: any) {
      toast('Deletion failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Top */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Image className="text-red-500" size={20} /> Promo Banner Scheduling Console
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Manage popup campaigns, sidebar ads, category headers, and schedule publishing durations.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Schedule Banner Ad
        </Button>
      </div>

      {/* Grid of Active Banners */}
      {loading && banners.length === 0 ? (
        <div className="text-center py-10 text-gray-500 font-mono text-xs">Querying advertising channels...</div>
      ) : banners.length === 0 ? (
        <Card className="p-8 text-center bg-gray-950 border-gray-850">
          <Image size={40} className="mx-auto text-gray-700 mb-2" />
          <p className="text-xs text-gray-500 font-mono">No banners currently scheduled.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((b) => {
            const isFuture = new Date(b.start_date) > new Date();
            const isPast = new Date(b.end_date) < new Date();
            
            return (
              <Card key={b.id} className="bg-gray-950 border-gray-850 overflow-hidden flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="aspect-video w-full bg-gray-900 relative">
                    <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-gray-950/80 border border-gray-850 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                      {b.type.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-3xs font-mono">
                      <span className="text-gray-500">SCHEDULING SPAN:</span>
                      {isPast ? (
                        <span className="text-red-500 font-bold uppercase">Expired</span>
                      ) : isFuture ? (
                        <span className="text-yellow-500 font-bold uppercase">Scheduled</span>
                      ) : (
                        <span className="text-emerald-500 font-bold uppercase">Active</span>
                      )}
                    </div>
                    
                    <div className="text-2xs font-mono text-gray-400 space-y-1 bg-gray-900 p-2.5 rounded-xl border border-gray-800/40">
                      <div className="flex justify-between">
                        <span>Starts:</span>
                        <span className="text-white">{new Date(b.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ends:</span>
                        <span className="text-white">{new Date(b.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {b.link_url && (
                      <p className="text-[10px] text-gray-400 truncate flex items-center gap-1.5">
                        <Link2 size={12} className="text-red-500" /> {b.link_url}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-900/60 border-t border-gray-800/40 flex justify-between items-center">
                  <button 
                    onClick={() => handleToggleActive(b)}
                    className={`flex items-center gap-1 text-2xs font-mono font-bold ${
                      b.is_active ? 'text-emerald-500' : 'text-gray-500'
                    }`}
                  >
                    {b.is_active ? (
                      <>Active <ToggleRight size={20} className="text-emerald-500" /></>
                    ) : (
                      <>Paused <ToggleLeft size={20} className="text-gray-700" /></>
                    )}
                  </button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteBanner(b.id)}
                    className="text-red-500 hover:bg-red-950/40"
                  >
                    <Trash2 size={14} /> Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Plus className="text-red-500" size={18} /> SCHEDULE ADVERTISING BANNER
            </h3>
            <form onSubmit={handleCreateBanner} className="space-y-4">
              <Select
                label="Banner Channel / Type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="bg-gray-950 border-gray-800 text-white"
              >
                <option value="homepage">Homepage Hero Banner</option>
                <option value="sidebar">Sidebar Banner Ad</option>
                <option value="popup">Modal/Popup Promo Banner</option>
                <option value="category">Category Header Banner</option>
                <option value="offer">Special Offer Card Banner</option>
                <option value="flash_sale">Flash Sale countdown banner</option>
              </Select>

              <Input
                label="Banner Image URL"
                placeholder="https://example.com/ad.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />

              <Input
                label="Destination link (URL)"
                placeholder="/products?category=electronics"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Publish Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                  required
                />
                <Input
                  label="Expiration Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                  Add to Schedule
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default BannerManagementPage;
