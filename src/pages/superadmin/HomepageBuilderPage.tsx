import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  Layout, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Edit, 
  Save, 
  Sliders, 
  List, 
  Sparkles,
  Link2
} from 'lucide-react';

interface HomepageSection {
  id: string;
  type: string;
  content: any;
  sort_order: number;
  is_published: boolean;
}

export function HomepageBuilderPage() {
  const { toast } = useToast();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState('hero_slider');

  async function fetchSections() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order', { ascending: true });
        
      if (error) throw error;
      setSections(data || []);
    } catch (err: any) {
      toast('Failed to load homepage layout: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSections();
  }, []);

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create initial content based on type
      let content: any = {};
      switch (newType) {
        case 'hero_slider':
          content = {
            slides: [
              { title: 'AI-Powered Second-Hand Marketplace', subtitle: 'Buy smarter. Sell better. Trust more in Bangladesh.', buttonText: 'Browse Marketplace', link: '/products', bgGradient: 'from-primary-950 to-neutral-950' }
            ]
          };
          break;
        case 'featured_categories':
          content = { title: 'Featured Categories', maxCategories: 6 };
          break;
        case 'trending_products':
          content = { title: 'Trending Listings', limit: 8, layout: 'grid' };
          break;
        case 'testimonials':
          content = {
            title: 'Trusted by Thousands of Buyers & Sellers',
            reviews: [
              { name: 'Morsadul Islam', role: 'Verified Buyer', text: 'ResellBD made finding a verified pre-loved laptop fast and safe with fair price intelligence!', rating: 5 }
            ]
          };
          break;
        case 'partners':
          content = {
            title: 'Our Trusted Logistics Partners',
            logos: ['https://placehold.co/150x80/0f172a/ffffff?text=SteadFast']
          };
          break;
        case 'newsletter':
          content = { title: 'Subscribe to ResellBD Price Alerts', placeholder: 'Enter your email address...' };
          break;
      }

      const sortOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) + 1 : 1;

      const { error } = await supabase
        .from('homepage_sections')
        .insert({
          type: newType,
          content,
          sort_order: sortOrder,
          is_published: true
        });

      if (error) throw error;
      toast('Section added successfully.', 'success');
      setShowAddModal(false);
      fetchSections();
    } catch (err: any) {
      toast('Failed to create section: ' + err.message, 'error');
    }
  };

  const handleTogglePublish = async (section: HomepageSection) => {
    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ is_published: !section.is_published })
        .eq('id', section.id);
        
      if (error) throw error;
      toast(section.is_published ? 'Section hidden.' : 'Section published.', 'success');
      fetchSections();
    } catch (err: any) {
      toast('Operation failed: ' + err.message, 'error');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = sections[index];
    const target = sections[targetIndex];

    try {
      // Swap sort orders
      const { error: err1 } = await supabase
        .from('homepage_sections')
        .update({ sort_order: target.sort_order })
        .eq('id', current.id);
        
      const { error: err2 } = await supabase
        .from('homepage_sections')
        .update({ sort_order: current.sort_order })
        .eq('id', target.id);

      if (err1 || err2) throw new Error('Order swap database failure');
      
      toast('Section order saved.', 'success');
      fetchSections();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section from your landing page?')) return;

    try {
      const { error } = await supabase
        .from('homepage_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      toast('Section deleted from homepage.', 'success');
      fetchSections();
    } catch (err: any) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ content: editingSection.content })
        .eq('id', editingSection.id);

      if (error) throw error;
      toast('Section content updated.', 'success');
      setEditingSection(null);
      fetchSections();
    } catch (err: any) {
      toast('Save failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layout className="text-red-500" size={20} /> Landing Page Layout Builder
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Control which layout segments appear on your public landing page. Reorder, toggle visibility, and update items.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Layout Segment
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sections list */}
        <div className="flex-1 space-y-3">
          {loading && sections.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-mono text-xs">Querying layout grid...</div>
          ) : sections.length === 0 ? (
            <Card className="p-8 text-center bg-gray-950 border-gray-850">
              <Layout size={40} className="mx-auto text-gray-700 mb-2" />
              <p className="text-xs text-gray-500 font-mono">No landing page segments declared yet.</p>
            </Card>
          ) : (
            sections.map((section, index) => (
              <Card 
                key={section.id} 
                className={`p-4 bg-gray-950 border-gray-850 hover:border-gray-700 transition-all flex items-center justify-between gap-4 ${
                  editingSection?.id === section.id ? 'ring-2 ring-red-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Reordering Controls */}
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleReorder(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-500 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleReorder(index, 'down')}
                      disabled={index === sections.length - 1}
                      className="text-gray-500 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">SORT POSITION: #{index + 1}</span>
                    <h4 className="font-extrabold text-white text-xs">{section.type.toUpperCase().replace('_', ' ')}</h4>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <Badge className={section.is_published ? 'bg-emerald-950 border border-emerald-500/20 text-emerald-500' : 'bg-gray-900 border border-gray-800 text-gray-500'}>
                    {section.is_published ? 'ACTIVE' : 'HIDDEN'}
                  </Badge>

                  <div className="flex gap-1.5 ml-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleTogglePublish(section)}
                      className="text-gray-400 hover:text-white"
                      title={section.is_published ? 'Hide Segment' : 'Publish Segment'}
                    >
                      {section.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingSection(section)}
                      className="text-yellow-500 hover:bg-yellow-950/20"
                      title="Edit JSON settings"
                    >
                      <Edit size={14} />
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-red-500 hover:bg-red-950/40"
                      title="Remove Segment"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Selected JSON Config panel */}
        {editingSection && (
          <div className="w-full lg:w-[450px] shrink-0 space-y-6">
            <Card className="bg-gray-950 border-gray-800 p-5 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-sm font-mono tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} className="text-red-500" /> CONFIGURE DATA SCHEMA
                </h3>
                <button onClick={() => setEditingSection(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
              </div>

              <div>
                <h4 className="font-bold text-white text-xs">{editingSection.type.toUpperCase()}</h4>
                <p className="text-3xs text-gray-500 font-mono">Customize key parameters inside JSON format below.</p>
              </div>

              <form onSubmit={handleSaveContent} className="space-y-4">
                <div>
                  <label className="block text-3xs font-mono text-gray-400 mb-1">RAW JSON CONFIGURATION:</label>
                  <textarea
                    rows={12}
                    value={JSON.stringify(editingSection.content, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditingSection(prev => prev ? { ...prev, content: parsed } : null);
                      } catch {}
                    }}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-300 p-3 font-mono focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="border-gray-800 text-gray-400 font-semibold" type="button" onClick={() => setEditingSection(null)}>
                    Cancel
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1" type="submit">
                    <Save size={14} /> Save Config
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
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Plus className="text-red-500" size={18} /> ADD LANDING MODULE
            </h3>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <label className="block text-2xs font-mono text-gray-400 mb-1">SELECT MODULE TYPE:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl text-xs text-white p-3 focus:outline-none focus:border-red-500"
                >
                  <option value="hero_slider">Hero Slider (Slides, Titles)</option>
                  <option value="featured_categories">Featured Categories Grid</option>
                  <option value="trending_products">Trending Listings Panel</option>
                  <option value="testimonials">User Feedback/Testimonials</option>
                  <option value="partners">Corporate Partner Logos</option>
                  <option value="newsletter">Email newsletter sign up banner</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit">
                  Insert Segment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default HomepageBuilderPage;
