import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Input, Select } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  Globe, 
  User, 
  Edit, 
  Save, 
  Sparkles,
  Link2
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image_url: string | null;
  tags: string[];
  category: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  created_at: string;
}

export function BlogManagementPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Forms & Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  const [formFields, setFormFields] = useState({
    title: '',
    slug: '',
    content: '',
    featured_image_url: '',
    tagsString: '',
    category: 'Recycling Guide',
    seo_title: '',
    seo_description: '',
    status: 'draft' as const,
    published_at: ''
  });

  async function fetchPosts() {
    try {
      setLoading(true);
      let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      toast('Failed to load blog posts: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [searchTerm]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.title || !formFields.slug || !formFields.content) {
      toast('Please enter title, slug, and content', 'error');
      return;
    }

    setSaving(true);
    try {
      const tagsArray = formFields.tagsString.split(',').map(t => t.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: formFields.title,
          slug: formFields.slug,
          content: formFields.content,
          featured_image_url: formFields.featured_image_url || null,
          tags: tagsArray,
          category: formFields.category,
          seo_title: formFields.seo_title || formFields.title,
          seo_description: formFields.seo_description || null,
          status: formFields.status,
          published_at: formFields.published_at ? new Date(formFields.published_at).toISOString() : null
        });

      if (error) throw error;
      toast('Blog article published.', 'success');
      setShowAddModal(false);
      // Reset
      setFormFields({
        title: '',
        slug: '',
        content: '',
        featured_image_url: '',
        tagsString: '',
        category: 'Recycling Guide',
        seo_title: '',
        seo_description: '',
        status: 'draft',
        published_at: ''
      });
      fetchPosts();
    } catch (err: any) {
      toast('Failed to create article: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: editingPost.title,
          slug: editingPost.slug,
          content: editingPost.content,
          featured_image_url: editingPost.featured_image_url,
          tags: editingPost.tags,
          category: editingPost.category,
          seo_title: editingPost.seo_title,
          seo_description: editingPost.seo_description,
          status: editingPost.status,
          published_at: editingPost.published_at ? new Date(editingPost.published_at).toISOString() : null
        })
        .eq('id', editingPost.id);

      if (error) throw error;
      toast('Article content saved.', 'success');
      setEditingPost(null);
      fetchPosts();
    } catch (err: any) {
      toast('Update failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this article?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast('Article removed.', 'success');
      fetchPosts();
    } catch (err: any) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="text-red-500" size={20} /> Blog & Articles Editor
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Create news updates, recycling guides, and schedule articles with SEO meta-tags for indexing.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Write Article
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-500" />
        </span>
        <Input
          placeholder="Search articles by title or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-gray-950 border-gray-800 text-white"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Posts Table list */}
        <div className="flex-1">
          <Card className="bg-gray-950 border-gray-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-900/60 text-gray-400 font-semibold border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Title / Slug</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 font-mono">Publish Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {loading && posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-mono">Querying blog server...</td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-mono">No articles found.</td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr 
                        key={post.id} 
                        className={`hover:bg-gray-900/40 cursor-pointer transition-colors ${editingPost?.id === post.id ? 'bg-red-950/20' : ''}`}
                        onClick={() => setEditingPost(post)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-white leading-tight">{post.title}</div>
                          <div className="text-3xs text-gray-500 font-mono truncate max-w-[200px]">/{post.slug}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{post.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-400 font-mono">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Immediate'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            post.status === 'published' ? 'bg-emerald-950 border border-emerald-500/20 text-emerald-400' :
                            post.status === 'scheduled' ? 'bg-yellow-950 border border-yellow-500/20 text-yellow-400' :
                            'bg-gray-900 border border-gray-800 text-gray-500'
                          }>
                            {post.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingPost(post)} className="text-yellow-500 hover:bg-yellow-950/20">
                              <Edit size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:bg-red-950/40">
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

        {/* Selected Blog editing panel */}
        {editingPost && (
          <div className="w-full lg:w-[480px] shrink-0 space-y-6">
            <Card className="bg-gray-950 border-gray-800 p-5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h3 className="font-bold text-white text-sm font-mono tracking-wider flex items-center gap-1.5">
                  <Edit size={14} className="text-red-500" /> EDIT ARTICLE DETAILS
                </h3>
                <button onClick={() => setEditingPost(null)} className="text-xs text-gray-500 hover:text-white">✕ Close</button>
              </div>

              <form onSubmit={handleUpdatePost} className="space-y-4 text-2xs font-mono">
                <Input
                  label="Title"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="bg-gray-900 border-gray-800 text-white"
                  required
                />
                
                <Input
                  label="URL Slug"
                  value={editingPost.slug}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, slug: e.target.value } : null)}
                  className="bg-gray-900 border-gray-800 text-white"
                  required
                />

                <Input
                  label="Featured Image URL"
                  value={editingPost.featured_image_url || ''}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, featured_image_url: e.target.value } : null)}
                  className="bg-gray-900 border-gray-800 text-white"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Status"
                    value={editingPost.status}
                    onChange={(e) => setEditingPost(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                    className="bg-gray-900 border-gray-800 text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </Select>

                  <Input
                    label="Scheduling Date"
                    type="datetime-local"
                    value={editingPost.published_at ? editingPost.published_at.substring(0, 16) : ''}
                    onChange={(e) => setEditingPost(prev => prev ? { ...prev, published_at: e.target.value } : null)}
                    className="bg-gray-900 border-gray-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-3xs text-gray-400 mb-1">Body Content (HTML/Markdown)</label>
                  <textarea
                    rows={8}
                    value={editingPost.content}
                    onChange={(e) => setEditingPost(prev => prev ? { ...prev, content: e.target.value } : null)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-300 p-3 focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                {/* SEO Fields */}
                <div className="p-3.5 bg-gray-900 border border-gray-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1 text-3xs font-bold text-white border-b border-gray-850 pb-1.5 uppercase">
                    <Sparkles size={12} className="text-yellow-500" /> Search Engine Optimization
                  </div>
                  <Input
                    label="SEO Meta Title"
                    value={editingPost.seo_title || ''}
                    onChange={(e) => setEditingPost(prev => prev ? { ...prev, seo_title: e.target.value } : null)}
                    className="bg-gray-950 border-gray-850 text-white text-[10px]"
                  />
                  <div>
                    <label className="block text-4xs text-gray-400 mb-1">SEO Description</label>
                    <textarea
                      rows={2}
                      value={editingPost.seo_description || ''}
                      onChange={(e) => setEditingPost(prev => prev ? { ...prev, seo_description: e.target.value } : null)}
                      className="w-full bg-gray-950 border border-gray-850 rounded-xl text-[10px] text-gray-300 p-2 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="border-gray-850 text-gray-400" type="button" onClick={() => setEditingPost(null)}>
                    Cancel
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                    <Save size={14} className="inline mr-1" /> Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-2xl shadow-2xl my-8">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <BookOpen className="text-red-500" size={18} /> WRITE NEW EDITORIAL ARTICLE
            </h3>
            
            <form onSubmit={handleCreatePost} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Title"
                  placeholder="How to Safely Buy Used Laptops in Dhaka"
                  value={formFields.title}
                  onChange={(e) => setFormFields(prev => ({ ...prev, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))}
                  className="bg-gray-950 border-gray-800 text-white"
                  required
                />
                
                <Input
                  label="URL Slug"
                  placeholder="how-to-safely-buy-used-laptops-dhaka"
                  value={formFields.slug}
                  onChange={(e) => setFormFields(prev => ({ ...prev, slug: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Category / Topic"
                  placeholder="Buying Guide"
                  value={formFields.category}
                  onChange={(e) => setFormFields(prev => ({ ...prev, category: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                />
                
                <Input
                  label="Tags (comma separated)"
                  placeholder="laptops, electronics, secondhand, dhaka"
                  value={formFields.tagsString}
                  onChange={(e) => setFormFields(prev => ({ ...prev, tagsString: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                />
              </div>

              <Input
                label="Featured Image URL"
                placeholder="https://example.com/banner.jpg"
                value={formFields.featured_image_url}
                onChange={(e) => setFormFields(prev => ({ ...prev, featured_image_url: e.target.value }))}
                className="bg-gray-950 border-gray-800 text-white"
              />

              <div>
                <label className="block text-2xs font-mono text-gray-400 mb-1">Body Content (HTML/Markdown)</label>
                <textarea
                  rows={6}
                  placeholder="Start writing article here..."
                  value={formFields.content}
                  onChange={(e) => setFormFields(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl text-xs text-white p-3 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Publish Status"
                  value={formFields.status}
                  onChange={(e) => setFormFields(prev => ({ ...prev, status: e.target.value as any }))}
                  className="bg-gray-950 border-gray-800 text-white"
                >
                  <option value="draft">Save Draft</option>
                  <option value="published">Publish Instantly</option>
                  <option value="scheduled">Schedule Post</option>
                </Select>

                <Input
                  label="Schedule date & time"
                  type="datetime-local"
                  value={formFields.published_at}
                  onChange={(e) => setFormFields(prev => ({ ...prev, published_at: e.target.value }))}
                  className="bg-gray-950 border-gray-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit" loading={saving}>
                  Create Article
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default BlogManagementPage;
