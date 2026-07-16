import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, Input, Select } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { 
  FolderOpen, 
  Upload, 
  Trash2, 
  Search, 
  Plus, 
  Folder, 
  FileText, 
  Image as ImageIcon,
  ArrowLeft,
  Settings,
  AlertCircle,
  Copy,
  ChevronRight
} from 'lucide-react';

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
  } | null;
}

export function MediaLibraryPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bucket, setBucket] = useState('media');
  const [path, setPath] = useState('');
  const [items, setItems] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action forms
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);

  // Unused Media Detection state
  const [detecting, setDetecting] = useState(false);
  const [referencedUrls, setReferencedUrls] = useState<string[]>([]);

  // Fetch lists
  async function fetchStorageItems() {
    try {
      setLoading(true);
      // Supabase storage list folders and files inside current path
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path || undefined, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        // If bucket doesn't exist, try to create it or report it
        if (error.message.includes('not found')) {
          toast(`Bucket '${bucket}' not found. Please create it in your Supabase storage dashboard first.`, 'warning');
        } else {
          throw error;
        }
        setItems([]);
      } else {
        // Exclude placeholder keep files
        setItems(data?.filter(item => item.name !== '.keep') || []);
      }
    } catch (err: any) {
      toast('Failed to load storage items: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStorageItems();
  }, [bucket, path]);

  // Navigate folder levels
  const handleFolderClick = (folderName: string) => {
    setPath(prev => prev ? `${prev}/${folderName}` : folderName);
  };

  const handleBackClick = () => {
    if (!path) return;
    const parts = path.split('/');
    parts.pop();
    setPath(parts.join('/'));
  };

  // Create folder placeholder file
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const folderPath = path ? `${path}/${newFolderName}/.keep` : `${newFolderName}/.keep`;
      // Upload empty keep file to create subfolder
      const { error } = await supabase.storage
        .from(bucket)
        .upload(folderPath, new Blob([]), { upsert: true });

      if (error) throw error;
      toast(`Folder '${newFolderName}' created.`, 'success');
      setShowFolderModal(false);
      setNewFolderName('');
      fetchStorageItems();
    } catch (err: any) {
      toast('Failed to create folder: ' + err.message, 'error');
    }
  };

  // Upload file
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Clean filename
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = path ? `${path}/${cleanName}` : cleanName;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (error) throw error;
      toast(`File ${file.name} uploaded successfully.`, 'success');
      fetchStorageItems();
    } catch (err: any) {
      toast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete file or folder
  const handleDeleteItem = async (item: StorageFile) => {
    const isFolder = !item.metadata;
    if (!confirm(`Are you sure you want to permanently delete this ${isFolder ? 'folder' : 'file'}?`)) return;

    try {
      const targetPath = path ? `${path}/${item.name}` : item.name;
      
      if (isFolder) {
        // Delete folder placeholder Keep file
        const { error } = await supabase.storage
          .from(bucket)
          .remove([`${targetPath}/.keep`]);
        if (error) throw error;
      } else {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([targetPath]);
        if (error) throw error;
      }

      toast('Resource deleted.', 'success');
      fetchStorageItems();
    } catch (err: any) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  // Scan database tables to find what media URLs are referenced
  const detectUnusedMedia = async () => {
    try {
      setDetecting(true);
      
      // 1. Fetch user avatars
      const { data: users } = await supabase.from('profiles').select('avatar_url');
      const avatars = users?.map(u => u.avatar_url).filter(Boolean) as string[];

      // 2. Fetch product images
      const { data: productImgs } = await supabase.from('product_images').select('url');
      const productUrls = productImgs?.map(p => p.url).filter(Boolean) as string[];

      // 3. Fetch blogs image
      const { data: blogs } = await supabase.from('blog_posts').select('featured_image_url');
      const blogUrls = blogs?.map(b => b.featured_image_url).filter(Boolean) as string[];

      setReferencedUrls([...avatars, ...productUrls, ...blogUrls]);
      toast('Media reference scanning completed.', 'success');
    } catch (err: any) {
      toast('Scanning failed: ' + err.message, 'error');
    } finally {
      setDetecting(false);
    }
  };

  const getPublicUrl = (fileName: string) => {
    const filePath = path ? `${path}/${fileName}` : fileName;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const isMediaUnused = (fileName: string) => {
    if (referencedUrls.length === 0) return null; // Scan has not run
    const publicUrl = getPublicUrl(fileName);
    // Check if public url is not referenced in active DB listings
    return !referencedUrls.some(refUrl => refUrl.includes(publicUrl) || publicUrl.includes(refUrl));
  };

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderOpen className="text-red-500" size={20} /> Storage & Media Library Manager
          </h2>
          <p className="text-2xs text-gray-500 font-mono">Navigate storage buckets, create folders, upload assets, and detect unreferenced files to optimize space.</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-gray-850 text-gray-400 hover:text-white"
            onClick={detectUnusedMedia}
            disabled={detecting}
          >
            {detecting ? 'Scanning...' : 'Detect Unused Assets'}
          </Button>

          <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1" onClick={() => setShowFolderModal(true)}>
            <Plus size={16} /> New Folder
          </Button>
          
          <Button 
            className="bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUploadFile} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Bucket and Path Breadcrumbs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-950 p-4 border border-gray-850 rounded-2xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-3xs font-mono text-gray-500 uppercase tracking-widest">Select Bucket:</span>
          <Select
            value={bucket}
            onChange={(e) => { setBucket(e.target.value); setPath(''); }}
            className="bg-gray-900 border-gray-800 text-white py-1 px-3 text-xs"
          >
            <option value="media">media (CMS uploads)</option>
            <option value="products">products (listings)</option>
            <option value="avatars">avatars (user profiles)</option>
          </Select>
        </div>

        {/* Path Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-2xs font-mono text-gray-400">
          <button onClick={() => setPath('')} className="hover:text-white font-bold">root</button>
          {path.split('/').filter(Boolean).map((part, index, arr) => (
            <div key={part} className="flex items-center gap-1.5">
              <ChevronRight size={12} className="text-gray-600" />
              <button 
                onClick={() => setPath(arr.slice(0, index + 1).join('/'))}
                className="hover:text-white font-bold"
              >
                {part}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-500" />
        </span>
        <Input
          placeholder="Filter resources in current directory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-gray-950 border-gray-800 text-white"
        />
      </div>

      {/* Grid of Folders and Files */}
      {loading && filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-mono text-xs">Loading storage directory...</div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center bg-gray-950 border-gray-850">
          <Folder size={40} className="mx-auto text-gray-700 mb-2" />
          <p className="text-xs text-gray-500 font-mono">This directory is empty or contains no matching files.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          {/* Back Folder Link if not inside root */}
          {path && (
            <Card 
              className="p-4 bg-gray-950 border-gray-850 hover:bg-gray-900/60 cursor-pointer flex flex-col items-center justify-center text-center aspect-square select-none group"
              onClick={handleBackClick}
            >
              <ArrowLeft size={36} className="text-gray-600 group-hover:text-red-500 transition-colors" />
              <span className="text-3xs font-mono font-bold text-gray-400 mt-2">Go Back</span>
            </Card>
          )}

          {/* Render Folders & Files */}
          {filteredItems.map((item) => {
            const isFolder = !item.metadata;
            const publicUrl = getPublicUrl(item.name);
            const sizeKB = item.metadata ? Math.round(item.metadata.size / 1024) : 0;
            const unused = isMediaUnused(item.name);

            return (
              <Card 
                key={item.name} 
                className="bg-gray-950 border-gray-850 overflow-hidden flex flex-col justify-between aspect-square group shadow-2xl relative"
              >
                {/* Unused Indicator Badge */}
                {unused === true && (
                  <span className="absolute top-2 right-2 bg-yellow-950/80 border border-yellow-500/30 text-yellow-500 text-[8px] font-mono font-bold py-0.5 px-2 rounded-full z-10">
                    UNUSED
                  </span>
                )}

                {/* Main preview */}
                <div 
                  className="flex-1 flex flex-col items-center justify-center p-4 cursor-pointer relative bg-gray-900/40"
                  onClick={() => isFolder ? handleFolderClick(item.name) : window.open(publicUrl, '_blank')}
                >
                  {isFolder ? (
                    <Folder size={48} className="text-red-500/80 group-hover:scale-105 transition-transform" />
                  ) : item.metadata?.mimetype.startsWith('image/') ? (
                    <div className="w-full h-full absolute inset-0">
                      <img src={publicUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <FileText size={48} className="text-gray-600 group-hover:scale-105 transition-transform" />
                  )}
                </div>

                {/* Details Footer */}
                <div className="p-2.5 bg-gray-950 border-t border-gray-900 flex justify-between items-center z-10">
                  <div className="truncate max-w-[70%]">
                    <span className="text-3xs font-bold text-white block truncate leading-none" title={item.name}>{item.name}</span>
                    {!isFolder && <span className="text-[9px] font-mono text-gray-500 mt-0.5 block">{sizeKB} KB</span>}
                  </div>

                  <div className="flex gap-1">
                    {!isFolder && (
                      <button 
                        onClick={() => { navigator.clipboard.writeText(publicUrl); toast('URL copied to clipboard.', 'success'); }}
                        className="p-1 text-gray-500 hover:text-white"
                        title="Copy Public URL"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteItem(item)}
                      className="p-1 text-red-500 hover:bg-red-950/40 rounded"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- NEW FOLDER MODAL --- */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="bg-gray-900 border-gray-800 p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Plus className="text-red-500" size={18} /> CREATE NEW SUBFOLDER
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <Input
                label="Folder Name"
                placeholder="banners"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-gray-950 border-gray-800 text-white"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="border-gray-800 text-gray-400" type="button" onClick={() => setShowFolderModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" type="submit">
                  Establish Folder
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default MediaLibraryPage;
