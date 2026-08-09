import { useState, useCallback, DragEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, X, Sparkles, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Button, Input, Select, Textarea, Badge } from '../components/ui';
import type { Category, ProductWithRelations } from '../types';
import { useAiDescription, useAiPricing, useAiFakeDetector } from '../features/ai/hooks/useAi';
import { formatPrice } from '../lib/utils';

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-product-image`;

interface UploadedImage {
  url: string;
  path: string;
}

interface AIResult {
  suggested_category?: string;
  condition_estimate?: string;
  confidence?: number;
  is_likely_fake?: boolean;
  risk_score?: number;
  risk_reasons?: string[];
}

export function SellNewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [step, setStep] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [brand, setBrand] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // AI helper mutations
  const descMutation = useAiDescription();
  const pricingMutation = useAiPricing();
  const fakeMutation = useAiFakeDetector();
  const [recommendedPrices, setRecommendedPrices] = useState<any>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isCheckingPricing, setIsCheckingPricing] = useState(false);

  const handleAiGenerateDescription = async () => {
    if (!title || !categoryId || !condition) {
      toast('Please enter title, category, and condition first', 'error');
      return;
    }
    const catName = categories?.find((c) => c.id === (subcategoryId || categoryId))?.name || 'Electronics';
    setIsGeneratingDesc(true);
    try {
      const result = await descMutation.mutateAsync({
        title,
        category: catName,
        condition
      });
      if (result) {
        setDescription(result.description);
        const specsTextFormatted = Object.entries(result.features).map(([_, v]) => `Key Feature: ${v}`).join('\n');
        setSpecsText(specsTextFormatted);
        toast('Smart description generated!', 'success');
      }
    } catch {
      toast('Failed to generate smart description', 'error');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleAiPricingCheck = async () => {
    if (!categoryId || !condition) {
      toast('Please select category and condition first', 'error');
      return;
    }
    const catName = categories?.find((c) => c.id === (subcategoryId || categoryId))?.name || 'Electronics';
    setIsCheckingPricing(true);
    try {
      const result = await pricingMutation.mutateAsync({
        category: catName,
        brand: brand || null,
        condition
      });
      if (result) {
        setRecommendedPrices(result);
        toast('AI Price suggestions retrieved!', 'success');
      }
    } catch {
      toast('Failed to fetch price recommendations', 'error');
    } finally {
      setIsCheckingPricing(false);
    }
  };

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return (data ?? []) as Category[];
    },
    staleTime: 60_000,
  });

  // Load existing product for edit
  useQuery({
    queryKey: ['product-edit', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('id', id!)
        .maybeSingle();
      if (data) {
        const p = data as ProductWithRelations;
        setTitle(p.title);
        setDescription(p.description ?? '');
        
        // Find parent category to set correctly
        const cat = categories?.find((c) => c.id === p.category_id);
        if (cat) {
          if (cat.parent_id) {
            setCategoryId(cat.parent_id);
            setSubcategoryId(cat.id);
          } else {
            setCategoryId(cat.id);
            setSubcategoryId('');
          }
        } else {
          setCategoryId(p.category_id ?? '');
        }

        setPrice(p.price.toString());
        setOriginalPrice((p as any).original_price?.toString() ?? '');
        setIsNegotiable((p as any).is_negotiable ?? false);
        setBrand((p as any).brand ?? '');
        setCondition(p.condition ?? '');
        setLocation(p.location ?? '');
        setStockQuantity(p.stock_quantity?.toString() ?? '1');
        setImages((p.product_images ?? []).map((img) => ({ url: img.url, path: '' })));

        // Specifications
        let specsStr = '';
        try {
          const specs = (p as any).specifications;
          if (specs) {
            const parsed = typeof specs === 'string' ? JSON.parse(specs) : specs;
            specsStr = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join('\n');
          }
        } catch {}
        setSpecsText(specsStr);
      }
      return data;
    },
    enabled: isEdit && !!categories,
  });

  const handleUpload = useCallback(async (files: FileList) => {
    if (!user) return;
    setUploading(true);
    const newImages: UploadedImage[] = [];
    
    try {
      const { uploadToGoogleDrive } = await import('../lib/googleDrive');
      for (const file of Array.from(files)) {
        try {
          const directUrl = await uploadToGoogleDrive(file);
          newImages.push({ url: directUrl, path: '' });
        } catch (error: any) {
          console.error("Google Drive Upload Error:", error);
          alert("Error uploading image: " + (error.message || error));
        }
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch (err: any) {
      console.error("Upload exception:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }

    // Trigger AI analysis if first images
    if (newImages.length > 0) {
      analyzeImages(newImages.map((img) => img.url));
    }
  }, [user]);

  // Drag & drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const analyzeImages = async (imageUrls: string[]) => {
    setAnalyzing(true);
    setAiResult(null);
    try {
      const response = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ images: imageUrls }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          setAiResult(data);
          // Pre-fill fields
          if (data.suggested_category) {
            const cat = categories?.find((c) =>
              c.name.toLowerCase().includes(data.suggested_category!.toLowerCase()) ||
              c.slug === data.suggested_category!.toLowerCase()
            );
            if (cat) {
              if (cat.parent_id) {
                setCategoryId(cat.parent_id);
                setSubcategoryId(cat.id);
              } else {
                setCategoryId(cat.id);
              }
            }
          }
          if (data.condition_estimate) {
            const cond = (['new', 'excellent', 'good', 'fair', 'poor'] as const).find((c) =>
              data.condition_estimate!.toLowerCase().includes(c)
            );
            if (cond) setCondition(cond);
          }
        }
      }
    } catch {
      // Graceful degradation
    } finally {
      setAnalyzing(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const steps = [t('sell.stepImages'), t('sell.stepDetails'), t('sell.stepReview')];

  const canProceed = () => {
    if (step === 0) return images.length > 0;
    if (step === 1) return title.trim() && price && condition && categoryId;
    return true;
  };

  const handlePublish = async (asDraft: boolean) => {
    if (!user) return;
    setSaving(true);

    // Parse specifications
    const specifications: Record<string, string> = {};
    if (specsText.trim()) {
      specsText.split('\n').forEach((line) => {
        const [k, v] = line.split(':');
        if (k && v) specifications[k.trim()] = v.trim();
      });
    }

    try {
      // Run AI Fake / Counterfeit check
      let finalStatus = asDraft ? 'draft' : 'pending';
      let isFlagged = false;
      let riskScore = 0.05;

      try {
        const fakeResult = await fakeMutation.mutateAsync({
          title,
          description,
          price: parseFloat(price),
          brand: brand || null
        });
        if (fakeResult) {
          riskScore = fakeResult.riskScore;
          if (fakeResult.riskScore > 0.7) {
            finalStatus = 'flagged';
            isFlagged = true;
            toast('Listing flagged by AI safety checks: sent to Admin Review', 'warning');
          }
        }
      } catch {}

      const finalCategoryId = subcategoryId || categoryId;
      const productData = {
        seller_id: user.id,
        title,
        description,
        category_id: finalCategoryId || null,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        is_negotiable: isNegotiable,
        brand: brand.trim() || null,
        specifications,
        condition: condition || null,
        ai_condition: aiResult?.condition_estimate ?? null,
        ai_category_confidence: aiResult?.confidence ?? null,
        risk_score: riskScore,
        is_flagged: isFlagged,
        status: finalStatus,
        location: location || null,
        stock_quantity: parseInt(stockQuantity) || 1,
        stock_status: (parseInt(stockQuantity) || 1) > 0 ? 'in_stock' : 'out_of_stock',
      };

      let productId = id;
      if (isEdit) {
        await supabase.from('products').update(productData).eq('id', id!);
      } else {
        const { data } = await supabase.from('products').insert(productData).select('id').single();
        productId = data?.id;
      }

      if (productId) {
        // Delete old images if editing
        if (isEdit) {
          await supabase.from('product_images').delete().eq('product_id', productId);
        }
        // Insert images
        if (images.length > 0) {
          await supabase.from('product_images').insert(
            images.map((img, i) => ({
              product_id: productId,
              url: img.url,
              is_primary: i === 0,
              sort_order: i,
            }))
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast(asDraft ? t('sell.draftSaved') : t('sell.publishSuccess'), 'success');
      navigate('/my-listings');
    } catch (err) {
      toast(t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const parentCategories = categories?.filter((c) => !c.parent_id) ?? [];
  const subcategories = categories?.filter((c) => c.parent_id && c.parent_id === categoryId) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{isEdit ? t('common.edit') : t('sell.title')}</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i <= step ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-500'
            }`}>
              {i < step ? <Check size={16} /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i <= step ? 'text-neutral-900' : 'text-neutral-400'}`}>{label}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary-500' : 'bg-neutral-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Images */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-primary-500 bg-primary-50/50'
                  : 'border-neutral-300 hover:border-primary-400 hover:bg-primary-50/30'
              }`}
            >
              <label className="cursor-pointer block w-full h-full">
                <Upload size={32} className="mx-auto text-neutral-400 mb-2" />
                <p className="text-sm font-medium text-neutral-700">{t('sell.uploadImages')}</p>
                <p className="text-xs text-neutral-500 mt-1">{t('sell.uploadHint')}</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleUpload(e.target.files)}
                />
              </label>
            </div>

            {uploading && <p className="text-sm text-neutral-500 mt-3 text-center">{t('common.loading')}</p>}

            {analyzing && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-accent-50 rounded-xl">
                <Sparkles size={18} className="text-accent-500 animate-pulse" />
                <span className="text-sm text-neutral-700">{t('sell.analyzing')}</span>
              </div>
            )}

            {aiResult && !analyzing && (
              <div className="mt-4 p-4 bg-accent-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-500" />
                  <span className="text-sm font-medium text-neutral-900">{t('product.aiSuggested')}</span>
                </div>
                {aiResult.suggested_category && <p className="text-sm text-neutral-600">Category: <strong>{aiResult.suggested_category}</strong></p>}
                {aiResult.condition_estimate && <p className="text-sm text-neutral-600">Condition: <strong>{aiResult.condition_estimate}</strong></p>}
                {aiResult.confidence && <p className="text-sm text-neutral-600">Confidence: <strong>{(aiResult.confidence * 100).toFixed(0)}%</strong></p>}
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <Badge variant="primary" className="absolute top-1 left-1">Primary</Badge>}
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(1)} disabled={!canProceed()} size="lg">
              {t('sell.stepDetails')} <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            <Input
              label={t('sell.productTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 12 Pro Max 256GB"
              required
            />
             <div className="space-y-1">
              <Textarea
                label={t('sell.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item's condition, features, and any flaws..."
                rows={4}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiGenerateDescription}
                loading={isGeneratingDesc}
              >
                <Sparkles size={12} className="mr-1" /> Generate description with AI
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Select label={t('sell.category')} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(''); }} required>
                <option value="">{t('sell.selectCategory')}</option>
                {parentCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>

              <Select
                label="Subcategory"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={subcategories.length === 0}
              >
                <option value="">Select subcategory</option>
                {subcategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>

              <Select label={t('sell.condition')} value={condition} onChange={(e) => setCondition(e.target.value)} required>
                <option value="">{t('sell.selectCategory')}</option>
                <option value="new">{t('condition.new')}</option>
                <option value="excellent">{t('condition.excellent')}</option>
                <option value="good">{t('condition.good')}</option>
                <option value="fair">{t('condition.fair')}</option>
                <option value="poor">{t('condition.poor')}</option>
              </Select>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Input
                label={t('sell.price')}
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                required
              />
              <Input
                label="Original Price"
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="0"
              />
              <Input
                label="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiPricingCheck}
                  loading={isCheckingPricing}
                >
                  <Sparkles size={12} className="mr-1" /> Request AI Price Suggestion
                </Button>
              </div>

              {recommendedPrices && (
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-xs space-y-2 animate-fade-in max-w-md">
                  <p className="font-semibold text-neutral-800 flex items-center gap-1">
                    <Sparkles size={13} className="text-primary-600" /> ResellBD Price Intelligence Matrix:
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <button
                      type="button"
                      onClick={() => setPrice(Math.round(recommendedPrices.recommended * 0.9).toString())}
                      className="p-2 rounded-xl bg-white border border-neutral-200 hover:border-primary-500 transition-all text-2xs"
                    >
                      <span className="text-neutral-400 block">Quick Sale</span>
                      <span className="font-bold text-neutral-900 block mt-0.5">{formatPrice(Math.round(recommendedPrices.recommended * 0.9))}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrice(recommendedPrices.recommended.toString())}
                      className="p-2 rounded-xl bg-primary-50 border border-primary-300 hover:bg-primary-100 transition-all text-2xs"
                    >
                      <span className="text-primary-700 font-semibold block">Recommended</span>
                      <span className="font-bold text-primary-900 block mt-0.5">{formatPrice(recommendedPrices.recommended)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrice(Math.round(recommendedPrices.recommended * 1.12).toString())}
                      className="p-2 rounded-xl bg-white border border-neutral-200 hover:border-primary-500 transition-all text-2xs"
                    >
                      <span className="text-neutral-400 block">Max Target</span>
                      <span className="font-bold text-neutral-900 block mt-0.5">{formatPrice(Math.round(recommendedPrices.recommended * 1.12))}</span>
                    </button>
                  </div>
                  <p className="text-3xs text-neutral-500">
                    Calculated from secondary marketplace transactions in Bangladesh with condition weighting.
                  </p>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700">Price is Negotiable</span>
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label={t('sell.location')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dhaka"
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="1"
                min="0"
                required
              />
            </div>

            <Textarea
              label="Specifications (one per line, key: value)"
              value={specsText}
              onChange={(e) => setSpecsText(e.target.value)}
              placeholder="Color: Space Gray&#10;Storage: 256GB&#10;RAM: 8GB"
              rows={4}
            />

            {aiResult?.condition_estimate && (
              <div className="flex items-center gap-2 p-3 bg-accent-50 rounded-xl">
                <Sparkles size={16} className="text-accent-500" />
                <span className="text-sm text-neutral-600">{t('product.aiCondition')}: <strong>{aiResult.condition_estimate}</strong></span>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)} size="lg">
              <ArrowLeft size={18} /> {t('common.back')}
            </Button>
            <Button onClick={() => setStep(2)} disabled={!canProceed()} size="lg">
              {t('sell.stepReview')} <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900">{t('sell.reviewTitle')}</h2>
            {images[0] && (
              <img src={images[0].url} alt="" className="w-full max-h-64 object-cover rounded-xl" />
            )}
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-neutral-500">{t('sell.productTitle')}</span><span className="text-sm font-medium">{title}</span></div>
              <div className="flex justify-between"><span className="text-sm text-neutral-500">{t('sell.category')}</span><span className="text-sm font-medium">{categories?.find((c) => c.id === (subcategoryId || categoryId))?.name ?? '-'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-neutral-500">{t('sell.condition')}</span><span className="text-sm font-medium">{condition ? t(`condition.${condition}` as any) : '-'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-neutral-500">{t('sell.price')}</span><span className="text-sm font-bold">৳{price}</span></div>
              {brand && <div className="flex justify-between"><span className="text-sm text-neutral-500">Brand</span><span className="text-sm font-medium">{brand}</span></div>}
              {originalPrice && <div className="flex justify-between"><span className="text-sm text-neutral-500">Original Price</span><span className="text-sm font-medium line-through">৳{originalPrice}</span></div>}
              <div className="flex justify-between"><span className="text-sm text-neutral-500">Negotiable</span><span className="text-sm font-medium">{isNegotiable ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-neutral-500">{t('sell.location')}</span><span className="text-sm font-medium">{location || '-'}</span></div>
            </div>
            {description && (
              <div>
                <p className="text-sm text-neutral-500 mb-1">{t('sell.description')}</p>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{description}</p>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} size="lg">
              <ArrowLeft size={18} /> {t('common.back')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handlePublish(true)} disabled={saving} size="lg">
                {t('sell.saveDraft')}
              </Button>
              <Button onClick={() => handlePublish(false)} loading={saving} size="lg">
                {t('sell.publish')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
