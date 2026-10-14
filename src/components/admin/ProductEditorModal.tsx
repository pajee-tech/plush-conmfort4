import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductVariation, ProductImageItem, SofaConfiguration } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { adminAuthService } from '../../services/adminAuthService';
import {
  X,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Info,
  Check,
  Search,
  Eye,
} from 'lucide-react';

interface ProductEditorModalProps {
  product: Product | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const PRESET_SOFA_CONFIGS: Array<{ name: string; config: SofaConfiguration; priceMultiplier: number }> = [
  { name: '1 Seater (Armchair)', config: '1 Seater', priceMultiplier: 0.45 },
  { name: '2 Seater Sofa', config: '2 Seater', priceMultiplier: 0.65 },
  { name: '3 Seater Sofa', config: '3 Seater', priceMultiplier: 0.8 },
  { name: '3+2 Sofa Suite', config: '3+2 Suite', priceMultiplier: 1.0 },
  { name: '3+3 Sofa Suite', config: '3+3 Suite', priceMultiplier: 1.15 },
  { name: '2+2 Sofa Suite', config: '2+2 Suite', priceMultiplier: 0.95 },
  { name: '3+2+1 Complete Suite', config: '3+2+1 Suite', priceMultiplier: 1.35 },
  { name: 'Corner L-Shape (Left)', config: 'Corner L-Shape (Left)', priceMultiplier: 1.05 },
  { name: 'Corner L-Shape (Right)', config: 'Corner L-Shape (Right)', priceMultiplier: 1.05 },
];

const PRESET_BED_CONFIGS: Array<{ name: string; config: SofaConfiguration; priceMultiplier: number }> = [
  { name: 'Single Bed Frame (3ft)', config: 'Single (3ft)', priceMultiplier: 0.7 },
  { name: 'Small Double (4ft)', config: 'Small Double (4ft)', priceMultiplier: 0.85 },
  { name: 'Double Bed Frame (4ft 6in)', config: 'Double (4ft 6in)', priceMultiplier: 1.0 },
  { name: 'King Bed Frame (5ft)', config: 'King (5ft)', priceMultiplier: 1.15 },
  { name: 'Super King Bed Frame (6ft)', config: 'Super King (6ft)', priceMultiplier: 1.3 },
];

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  product,
  isNew,
  onClose,
  onSave,
}) => {
  const { categories, products } = useStore();

  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'variations' | 'description' | 'seo'>('basic');

  // Form state initialized from existing product or clean template
  const [formData, setFormData] = useState<Product>(() => {
    if (product) {
      return {
        ...product,
        variations: product.variations || [],
        imageGallery: product.imageGallery || product.images.map((img, i) => ({
          id: `img-${i}`,
          url: img,
          alt: `${product.name} handcrafted photo ${i + 1}`,
          order: i,
          isFeatured: i === 0,
        })),
      };
    }

    const defaultCat = categories[0]?.id || 'cat-sofas';
    const randomSku = `PC-UK-${Math.floor(100 + Math.random() * 900)}`;

    return {
      id: `prod-${Date.now()}`,
      name: '',
      slug: '',
      sku: randomSku,
      categoryId: defaultCat,
      price: 999,
      salePrice: 849,
      regularPrice: 1199,
      stock: 12,
      lowStockThreshold: 3,
      images: ['/uploads/products/verona-plush-velvet-corner-sofa-grey-fabric-chesterfield-style-l-shape-settee-with-scatter-cushions-1.png'],
      imageGallery: [
        {
          id: 'img-0',
          url: '/uploads/products/verona-plush-velvet-corner-sofa-grey-fabric-chesterfield-style-l-shape-settee-with-scatter-cushions-1.png',
          alt: 'Primary product photo',
          order: 0,
          isFeatured: true,
        },
      ],
      variations: [],
      shortDescription: 'Handcrafted luxury British sofa in premium plush velvet.',
      fullDescription: 'Indulge in bespoke British luxury. Constructed with kiln-dried European hardwood and pocket-sprung reflex foam for supreme longevity.',
      dimensions: { width: 250, height: 90, depth: 180, seatHeight: 48 },
      materials: ['Plush Velvet', 'Kiln-Dried Hardwood', 'Pocket Springs'],
      colours: [
        { name: 'Steel Grey', hex: '#6B6E70' },
        { name: 'Navy Blue', hex: '#1D2A44' },
      ],
      sizes: ['Standard Suite'],
      tags: ['Handcrafted', 'UK Made', 'Bespoke'],
      isPublished: true,
      isFeatured: false,
      isTrending: true,
      deliveryInfo: 'Delivered in 3–5 working days with 2-man room of choice delivery.',
      careInstructions: 'Spot clean with mild velvet upholstery foam cleaner.',
      seoTitle: '',
      seoDescription: '',
      canonicalUrl: '',
      robotsIndexing: 'index, follow',
      rating: 5.0,
      reviewCount: 1,
      relatedProductIds: [],
      complementaryProductIds: [],
      reviews: [],
    };
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auto-generate slug from name if empty
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug && !isNew ? prev.slug : slug,
      seoTitle: prev.seoTitle || `${name} | Handcrafted Furniture UK | Plush Comfort`,
      seoDescription:
        prev.seoDescription ||
        `Shop the ${name} handcrafted in Dewsbury, UK with solid hardwood frame and free UK delivery.`,
    }));
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await adminAuthService.uploadImage(
          base64Data,
          file.name,
          `${formData.name} uploaded photo`
        );

        if (res.success && res.url) {
          const newUrl = res.url;
          if (!isGallery) {
            // Replace primary image
            const updatedImages = [newUrl, ...formData.images.slice(1)];
            setFormData((prev) => ({
              ...prev,
              images: updatedImages,
              imageGallery: [
                { id: `img-${Date.now()}`, url: newUrl, alt: `${formData.name} featured image`, order: 0, isFeatured: true },
                ...(prev.imageGallery || []).slice(1),
              ],
            }));
          } else {
            // Add to gallery
            const updatedImages = [...formData.images, newUrl];
            const updatedGallery = [
              ...(formData.imageGallery || []),
              {
                id: `img-${Date.now()}`,
                url: newUrl,
                alt: `${formData.name} gallery image`,
                order: (formData.imageGallery?.length || 0),
                isFeatured: false,
              },
            ];
            setFormData((prev) => ({
              ...prev,
              images: updatedImages,
              imageGallery: updatedGallery,
            }));
          }
        } else {
          setUploadError(res.error || 'Image upload failed.');
        }
      } catch (err: any) {
        setUploadError(err.message || 'Image processing error.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Variation Handler
  const handleAddVariation = () => {
    const newVar: ProductVariation = {
      id: `var-${Date.now()}`,
      name: 'New Configuration',
      configuration: '3 Seater',
      sku: `${formData.sku}-${(formData.variations?.length || 0) + 1}`,
      price: formData.price,
      salePrice: formData.salePrice,
      stock: 5,
      colour: formData.colours[0]?.name || 'Standard',
      image: formData.images[0] || '',
      isDefault: (formData.variations?.length || 0) === 0,
    };

    setFormData((prev) => ({
      ...prev,
      variations: [...(prev.variations || []), newVar],
    }));
  };

  // Quick Preset Generator
  const handleGeneratePresets = (type: 'sofa' | 'bed') => {
    const presets = type === 'sofa' ? PRESET_SOFA_CONFIGS : PRESET_BED_CONFIGS;
    const basePrice = formData.price || 999;
    const baseSale = formData.salePrice || 849;

    const generated: ProductVariation[] = presets.map((p, idx) => ({
      id: `var-${Date.now()}-${idx}`,
      name: p.name,
      configuration: p.config,
      sku: `${formData.sku}-${p.config.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`,
      price: Math.round(basePrice * p.priceMultiplier),
      salePrice: Math.round(baseSale * p.priceMultiplier),
      stock: 8,
      colour: formData.colours[0]?.name || 'Steel Grey',
      image: formData.images[0] || '',
      isDefault: idx === (type === 'sofa' ? 3 : 2), // Default to 3+2 or Double
    }));

    setFormData((prev) => ({
      ...prev,
      variations: generated,
    }));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 z-10 shadow-2xl max-h-[92vh] flex flex-col my-auto border border-[#E8E0D5]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A25828]">
                {isNew ? 'Create Catalogue Entry' : 'Catalogue Editor'}
              </span>
              <span className="text-xs text-stone-400 font-mono">SKU: {formData.sku}</span>
            </div>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#221C18]">
              {isNew ? 'Add Handcrafted Furniture' : formData.name || 'Edit Piece'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {formData.slug && (
              <a
                href={`/product/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#FAF2EB] hover:bg-[#A25828] text-[#A25828] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs border border-[#EEDFD0]"
                title="Preview this piece on storefront in a new tab"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Product</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 py-3 border-b border-stone-200 overflow-x-auto shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'basic'
                ? 'bg-[#A25828] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            1. Core Info & Pricing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'images'
                ? 'bg-[#A25828] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            2. Images & Gallery ({formData.images.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variations')}
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'variations'
                ? 'bg-[#A25828] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            3. Variations ({formData.variations?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'description'
                ? 'bg-[#A25828] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            4. Content & Specs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'seo'
                ? 'bg-[#A25828] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            5. SEO & Structured Data
          </button>
        </div>

        {/* Tab Contents */}
        <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto py-4 space-y-6 text-xs pr-1">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Verona Plush Velvet Corner Sofa"
                    className="w-full p-2.5 rounded-xl border border-[#D5C7B7] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    URL Slug *
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2.5 bg-stone-100 border border-r-0 border-[#D5C7B7] rounded-l-xl text-stone-400 font-mono text-[11px]">
                      /product/
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full p-2.5 rounded-r-xl border border-[#D5C7B7] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#D5C7B7] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Regular Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-[#D5C7B7] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Sale Price (£, optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="Discounted"
                    className="w-full p-2.5 rounded-xl border border-[#D5C7B7] text-[#A25828] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-[#D5C7B7] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Primary Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#D5C7B7] bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Low Stock Warning Threshold</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 3 })}
                    className="w-full p-2.5 rounded-xl border border-[#D5C7B7]"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E0D5] flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded text-[#A25828] focus:ring-[#A25828] w-4 h-4"
                  />
                  <span>Published on Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-[#A25828] focus:ring-[#A25828] w-4 h-4"
                  />
                  <span>Featured on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="rounded text-[#A25828] focus:ring-[#A25828] w-4 h-4"
                  />
                  <span>Trending Badge</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: IMAGES & GALLERY */}
          {activeTab === 'images' && (
            <div className="space-y-6 animate-fade-in">
              {/* Guidance Box with Recommended Dimensions */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#A25828]" />
                <div className="space-y-1">
                  <span className="font-bold block">Recommended Image Standards</span>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Primary / Gallery Photos:</strong> 1200 &times; 900px (4:3 ratio), WebP or PNG, &lt; 500KB.<br />
                    <strong>Square Thumbnails:</strong> 800 &times; 800px (1:1 ratio). Ensure all images have descriptive Alt text for Google Image Search SEO and UK accessibility standards.
                  </p>
                </div>
              </div>

              {/* Upload New Image Banner */}
              <div className="p-4 rounded-2xl border border-dashed border-[#D5C7B7] bg-[#FAF8F5] text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <label className="bg-[#A25828] hover:bg-[#8A461A] text-white px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer inline-flex items-center gap-2 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {isUploading && <p className="text-stone-500 animate-pulse">Uploading and optimizing image...</p>}
                {uploadError && <p className="text-red-600 font-semibold">{uploadError}</p>}
              </div>

              {/* Images List */}
              <div className="space-y-3">
                <span className="font-bold text-stone-800 block text-xs">
                  Active Image List &amp; Alt Tags ({formData.images.length})
                </span>

                {formData.images.map((imgUrl, index) => {
                  const galleryItem = formData.imageGallery?.find((g) => g.url === imgUrl);
                  const isFeatured = index === 0;

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-center gap-3 ${
                        isFeatured ? 'border-[#A25828] bg-[#FAF2EB]/40' : 'border-[#E8E0D5] bg-white'
                      }`}
                    >
                      {/* Image Preview */}
                      <div className="w-20 h-20 rounded-xl bg-white border border-stone-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                      </div>

                      {/* Fields */}
                      <div className="flex-1 w-full space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-xs">
                            {isFeatured ? 'Primary Featured Image (Hero)' : `Gallery Photo #${index + 1}`}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono truncate max-w-xs">{imgUrl}</span>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Descriptive Alt Text for SEO (e.g. Verona Plush Velvet Corner Sofa in Silver)"
                            value={galleryItem?.alt || `${formData.name} photo ${index + 1}`}
                            onChange={(e) => {
                              const newAlt = e.target.value;
                              const updatedGallery = (formData.imageGallery || []).map((g, i) =>
                                i === index ? { ...g, alt: newAlt } : g
                              );
                              setFormData({ ...formData, imageGallery: updatedGallery });
                            }}
                            className="w-full p-2 text-xs rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...formData.images];
                              const temp = copy[index - 1];
                              copy[index - 1] = copy[index];
                              copy[index] = temp;
                              setFormData({ ...formData, images: copy });
                            }}
                            title="Move Up"
                            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        )}

                        {index < formData.images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...formData.images];
                              const temp = copy[index + 1];
                              copy[index + 1] = copy[index];
                              copy[index] = temp;
                              setFormData({ ...formData, images: copy });
                            }}
                            title="Move Down"
                            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        )}

                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = formData.images.filter((_, i) => i !== index);
                              setFormData({ ...formData, images: filtered });
                            }}
                            title="Delete Image"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add custom image URL */}
              <div className="pt-2">
                <label className="block font-semibold text-stone-700 mb-1">Add Image by URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="new_img_url"
                    placeholder="https://... or /uploads/products/..."
                    className="flex-1 p-2 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new_img_url') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        setFormData({
                          ...formData,
                          images: [...formData.images, input.value.trim()],
                        });
                        input.value = '';
                      }
                    }}
                    className="bg-stone-800 text-white px-4 py-2 rounded-xl font-semibold hover:bg-stone-900 cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VARIATIONS */}
          {activeTab === 'variations' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E0D5]">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs">Product Variations &amp; Suites</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Configure modular suites (1 Seater, 2 Seater, 3 Seater, 3+2, 3+3, 2+2, 3+2+1, Bed sizes) with dedicated price, SKU, stock, and photos.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGeneratePresets('sofa')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#D5C7B7] hover:border-[#A25828] text-[#A25828] font-bold transition-colors cursor-pointer text-xs"
                  >
                    + Auto-Gen Sofa Suites
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGeneratePresets('bed')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#D5C7B7] hover:border-[#A25828] text-[#A25828] font-bold transition-colors cursor-pointer text-xs"
                  >
                    + Auto-Gen Bed Sizes
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="px-3 py-1.5 rounded-xl bg-[#A25828] text-white font-bold hover:bg-[#8A461A] transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Variation</span>
                  </button>
                </div>
              </div>

              {/* Variations list */}
              <div className="space-y-3">
                {(!formData.variations || formData.variations.length === 0) && (
                  <div className="p-8 text-center text-stone-400 border border-dashed rounded-2xl">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-xs text-stone-600">No variations configured yet.</p>
                    <p className="text-[11px] mt-1">
                      Click "Auto-Gen Sofa Suites" or "Add Custom Variation" above to enable variation selections on the live product page.
                    </p>
                  </div>
                )}

                {formData.variations?.map((v, index) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-2xl border border-[#E8E0D5] bg-white space-y-3 hover:border-[#D5C7B7] transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...(formData.variations || [])];
                            updated[index].name = e.target.value;
                            setFormData({ ...formData, variations: updated });
                          }}
                          placeholder="e.g. 3+2 Sofa Suite"
                          className="font-bold text-stone-900 border-b border-dashed border-stone-300 focus:border-[#A25828] outline-hidden px-1 py-0.5"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 cursor-pointer">
                          <input
                            type="radio"
                            name="default_var"
                            checked={!!v.isDefault}
                            onChange={() => {
                              const updated = (formData.variations || []).map((item, i) => ({
                                ...item,
                                isDefault: i === index,
                              }));
                              setFormData({ ...formData, variations: updated });
                            }}
                          />
                          <span>Default Option</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.variations || []).filter((_, i) => i !== index);
                            setFormData({ ...formData, variations: updated });
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 uppercase">Configuration</label>
                        <select
                          value={v.configuration}
                          onChange={(e) => {
                            const updated = [...(formData.variations || [])];
                            updated[index].configuration = e.target.value;
                            setFormData({ ...formData, variations: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold"
                        >
                          <option value="1 Seater">1 Seater</option>
                          <option value="2 Seater">2 Seater</option>
                          <option value="3 Seater">3 Seater</option>
                          <option value="3+2 Suite">3+2 Suite</option>
                          <option value="3+3 Suite">3+3 Suite</option>
                          <option value="2+2 Suite">2+2 Suite</option>
                          <option value="3+2+1 Suite">3+2+1 Suite</option>
                          <option value="Corner L-Shape (Left)">Corner (Left)</option>
                          <option value="Corner L-Shape (Right)">Corner (Right)</option>
                          <option value="U-Shape Sectional">U-Shape Sectional</option>
                          <option value="Single (3ft)">Single (3ft)</option>
                          <option value="Small Double (4ft)">Small Double (4ft)</option>
                          <option value="Double (4ft 6in)">Double (4ft 6in)</option>
                          <option value="King (5ft)">King (5ft)</option>
                          <option value="Super King (6ft)">Super King (6ft)</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 uppercase">Price (£)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={v.price}
                          onChange={(e) => {
                            const updated = [...(formData.variations || [])];
                            updated[index].price = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, variations: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-stone-300 font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 uppercase">Sale Price (£)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={v.salePrice || ''}
                          onChange={(e) => {
                            const updated = [...(formData.variations || [])];
                            updated[index].salePrice = e.target.value ? parseFloat(e.target.value) : undefined;
                            setFormData({ ...formData, variations: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-stone-300 text-[#A25828] font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 uppercase">SKU</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const updated = [...(formData.variations || [])];
                            updated[index].sku = e.target.value;
                            setFormData({ ...formData, variations: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-stone-300 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 uppercase">Stock</label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => {
                            const updated = [...(formData.variations || [])];
                            updated[index].stock = parseInt(e.target.value, 10) || 0;
                            setFormData({ ...formData, variations: updated });
                          }}
                          className="w-full p-2 rounded-lg border border-stone-300 font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DESCRIPTION & SPECS */}
          {activeTab === 'description' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Short Tagline / Excerpt
                </label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#D5C7B7] text-xs leading-relaxed"
                />
              </div>

              {/* Rich Text Editor for Full Description with Internal Links */}
              <div>
                <RichTextEditor
                  label="Full Editorial Description (Supports Headings, Bullets & Internal Links)"
                  value={formData.fullDescription}
                  onChange={(val) => setFormData({ ...formData, fullDescription: val })}
                  rows={8}
                />
              </div>

              {/* Specifications */}
              <div className="pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-800 block text-xs mb-2">Dimensions (cm)</span>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-stone-500 font-semibold">Width (cm)</label>
                    <input
                      type="number"
                      value={formData.dimensions.width}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, width: Number(e.target.value) },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 font-semibold">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.dimensions.height}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, height: Number(e.target.value) },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 font-semibold">Depth (cm)</label>
                    <input
                      type="number"
                      value={formData.dimensions.depth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, depth: Number(e.target.value) },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 font-semibold">Seat Height (cm)</label>
                    <input
                      type="number"
                      value={formData.dimensions.seatHeight || 48}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, seatHeight: Number(e.target.value) },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery and Care */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">UK Delivery Notice</label>
                  <input
                    type="text"
                    value={formData.deliveryInfo}
                    onChange={(e) => setFormData({ ...formData, deliveryInfo: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Care &amp; Cleaning Instructions</label>
                  <input
                    type="text"
                    value={formData.careInstructions}
                    onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SEO & SCHEMA */}
          {activeTab === 'seo' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Meta Title (Max 60 characters)
                </label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="e.g. Verona Plush Velvet Corner Sofa | Plush Comfort UK"
                  className="w-full p-2.5 rounded-xl border border-[#D5C7B7]"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  {formData.seoTitle.length}/60 characters
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Meta Description (Max 160 characters)
                </label>
                <textarea
                  rows={3}
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="e.g. Handcrafted British luxury sofa in Dewsbury with kiln-dried hardwood frame, free UK delivery, and 10-year warranty."
                  className="w-full p-3 rounded-xl border border-[#D5C7B7]"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  {formData.seoDescription.length}/160 characters
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={formData.canonicalUrl || `https://plushcomfort.uk/product/${formData.slug}`}
                    onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Robots Directive</label>
                  <select
                    value={formData.robotsIndexing || 'index, follow'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        robotsIndexing: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="index, follow">index, follow (Standard)</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="noindex, nofollow">noindex, nofollow (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Google SERP Preview */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Google SERP Search Result Preview
                </span>
                <div className="font-sans">
                  <span className="text-xs text-stone-600 block truncate">
                    https://plushcomfort.uk &rsaquo; product &rsaquo; {formData.slug}
                  </span>
                  <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer">
                    {formData.seoTitle || formData.name}
                  </h4>
                  <p className="text-xs text-[#4d5156] line-clamp-2">
                    {formData.seoDescription || formData.shortDescription}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-600 font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-[#A25828] hover:bg-[#8A461A] text-white px-8 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save &amp; Update Catalogue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
