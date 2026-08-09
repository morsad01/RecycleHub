import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Input, Select } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Eye, 
  Globe, 
  Edit
} from 'lucide-react';

interface SeoMetadata {
  id: string;
  page_slug: string;
  title: string;
  description: string | null;
  keywords: string | null;
  canonical_url: string | null;
  og_image: string | null;
  twitter_card: string;
  created_at: string;
}

export function SeoPage() {
  const { toast } = useToast();
  const [seoList, setSeoList] = useState<SeoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Forms & Modal
  const [selectedSeo, setSelectedSeo] = useState<SeoMetadata | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formFields, setFormFields] = useState({
    page_slug: '',
    title: '',
    description: '',
    keywords: '',
    canonical_url: '',
    og_image: '',
    twitter_card: 'summary_large_image'
  });

  async function fetchSeoMetadata() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .order('page_slug', { ascending: true });

      if (error) throw error;
      setSeoList(data || []);
    } catch (err: any) {
      toast('Failed to load SEO metadata: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSeoMetadata();
  }, []);

  const handleCreateSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.page_slug || !formFields.title) {
      toast('Please enter page slug and meta title', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('seo_metadata')
        .insert({
          page_slug: formFields.page_slug.toLowerCase().trim(),
          title: formFields.title,
          description: formFields.description || null,
          keywords: formFields.keywords || null,
          canonical_url: formFields.canonical_url || null,
          og_image: formFields.og_image || null,
          twitter_card: formFields.twitter_card
        });

      if (error) throw error;
      toast('SEO overrides created.', 'success');
      setShowAddModal(false);
      setFormFields({
        page_slug: '',
        title: '',
        description: '',
        keywords: '',
        canonical_url: '',
        og_image: '',
        twitter_card: 'summary_large_image'
      });
      fetchSeoMetadata();
    } catch (err: any) {
      toast('Failed to create SEO mapping: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeo) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('seo_metadata')
        .update({
          title: selectedSeo.title,
          description: selectedSeo.description,
          keywords: selectedSeo.keywords,
          canonical_url: selectedSeo.canonical_url,
          og_image: selectedSeo.og_image,
          twitter_card: selectedSeo.twitter_card
        })
        .eq('id', selectedSeo.id);

      if (error) throw error;
      toast('SEO configuration saved.', 'success');
      setSelectedSeo(null);
      fetchSeoMetadata();
    } catch (err: any) {
      toast('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeo = async (id: string) => {
    if (!confirm('Are you sure you want to delete SEO overrides for this route?')) return;

    try {
      const { error } = await supabase
        .from('seo_metadata')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('SEO mapping deleted.', 'success');
      fetchSeoMetadata();
    } catch (err: any) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="text-red-500" size={20} /> Platform SEO Tags Console
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Manage site-wide meta tags, customize Open Graph (OG) shares, and define canonical index rules.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Establish Page SEO
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* SEO Grid list */}
        <div className="flex-1">
          <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Page Slug / Route</th>
                    <th className="px-6 py-4">Meta Title</th>
                    <th className="px-6 py-4 font-mono">OpenGraph Image</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono text-3xs">
                  {loading && seoList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">Querying search tags directory...</td>
                    </tr>
                  ) : seoList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">No custom page SEO mappings registered.</td>
                    </tr>
                  ) : (
                    seoList.map((seo) => (
                      <tr 
                        key={seo.id} 
                        className={`hover:bg-gray-900/40 cursor-pointer transition-colors ${selectedSeo?.id === seo.id ? 'bg-red-950/20' : ''}`}
                        onClick={() => setSelectedSeo(seo)}
                      >
                        <td className="px-6 py-4 text-white font-bold">
                          /{seo.page_slug}
                        </td>
                        <td className="px-6 py-4 text-gray-300 truncate max-w-[200px]">{seo.title}</td>
                        <td className="px-6 py-4 text-gray-400 truncate max-w-[150px]">
                          {seo.og_image || 'Inherited/Default'}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSeo(seo)} className="text-yellow-500 hover:bg-yellow-950/20">
                              <Edit size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSeo(seo.id)} className="text-red-500 hover:bg-red-950/40">
                              <Trash2 size={14} />
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
        </div>

        {/* Selected SEO Page Inspector */}
        {selectedSeo && (
          <div className="w-full lg:w-[480px] shrink-0 space-y-6">
            <Card className="bg-gray-950 border-gray-800 p-5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-sm font-mono tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-red-500" /> CONFIGURE META TAGS
                </h3>
                <button onClick={() => setSelectedSeo(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
              </div>

              <form onSubmit={handleUpdateSeo} className="space-y-4 text-2xs font-mono">
                <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
                  <span className="text-4xs text-gray-500 block">DESTINATION URL ROUTE:</span>
                  <span className="text-white font-bold">/{selectedSeo.page_slug}</span>
                </div>

                <Input
                  label="Meta Title Override"
                  value={selectedSeo.title}
                  onChange={(e) => setSelectedSeo(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="bg-gray-900 border-gray-800 text-white"
                  required
                />

                <div>
                  <label className="block text-3xs text-gray-400 mb-1">Meta Description</label>
                  <textarea
                    rows={3}
                    value={selectedSeo.description || ''}
                    onChange={(e) => setSelectedSeo(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-300 p-3 focus:outline-none focus:border-red-500"
                  />
                </div>

                <Input
                  label="Keywords (comma separated)"
                  value={selectedSeo.keywords || ''}
                  onChange={(e) => setSelectedSeo(prev => prev ? { ...prev, keywords: e.target.value } : null)}
                  className="bg-gray-900 border-gray-800 text-white"
                />

                <Input
                  label="Canonical URL Route"
                  value={selectedSeo.canonical_url || ''}
                  onChange={(e) => setSelectedSeo(prev => prev ? { ...prev, canonical_url: e.target.value } : null)}
                  className="bg-gray-900 border-gray-800 text-white"
                />

                <Input
                  label="OpenGraph Social Image (URL)"
                  value={selectedSeo.og_image || ''}
                  onChange={(e) => setSelectedSeo(prev => prev ? { ...prev, og_image: e.target.value } : null)}
                  className="bg-gray-900 border-gray-800 text-white"
                />

                <Select
                  label="Twitter Card Type"
                  value={selectedSeo.twitter_card}
                  onChange={(e) => setSelectedSeo(prev => prev ? { ...prev, twitter_card: e.target.value } : null)}
                  className="bg-gray-900 border-gray-800 text-white"
                >
                  <option value="summary_large_image">summary_large_image (Card with large photo)</option>
                  <option value="summary">summary (Small thumbnail card)</option>
                  <option value="app">app (App download card)</option>
                </Select>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="border-gray-850 text-gray-400" type="button" onClick={() => setSelectedSeo(null)}>
                    Cancel
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                    <Save size={14} className="inline mr-1" /> Save SEO Overrides
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Plus className="text-red-500" size={18} /> ESTABLISH PAGE SEO
            </h3>
            <form onSubmit={handleCreateSeo} className="space-y-4 font-mono text-xs">
              <Input
                label="Target Route / Slug"
                placeholder="about-us (Exclude leading slash)"
                value={formFields.page_slug}
                onChange={(e) => setFormFields(prev => ({ ...prev, page_slug: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />

              <Input
                label="Meta Title Override"
                placeholder="About ResellBD — AI-Powered Second-Hand Resale Marketplace"
                value={formFields.title}
                onChange={(e) => setFormFields(prev => ({ ...prev, title: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />

              <div>
                <label className="block text-2xs font-mono text-gray-400 mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  placeholder="Buy used products smarter and sell used products better on ResellBD with AI price intelligence and verified seller trust in Bangladesh..."
                  value={formFields.description}
                  onChange={(e) => setFormFields(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl text-xs text-white p-3 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                  Create SEO Map
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default SeoPage;
