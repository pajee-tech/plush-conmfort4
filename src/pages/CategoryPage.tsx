import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import {
  Filter,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  BookOpen,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface CategoryPageProps {
  categorySlug: string;
  subcategorySlug?: string;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categorySlug,
  subcategorySlug,
}) => {
  const { categories, products, setRoute, trackEvent } = useStore();

  const cleanSlug = (categorySlug || '').trim().toLowerCase();
  let category = categories.find(
    (c) =>
      c.slug.toLowerCase().trim() === cleanSlug ||
      c.id.toLowerCase().trim() === cleanSlug ||
      (cleanSlug === 'beds' && (c.slug === 'beds-bed-frames' || c.id === 'cat-beds')) ||
      (cleanSlug === 'beds-bed-frames' && c.slug === 'beds')
  );
  let resolvedSubcategorySlug = subcategorySlug;

  // If not found as top-level category, check if categorySlug matches a subcategory slug of any parent category
  if (!category) {
    for (const parent of categories) {
      const match = parent.subcategories?.find(
        (s) => s.slug.toLowerCase().trim() === cleanSlug || s.id.toLowerCase().trim() === cleanSlug
      );
      if (match) {
        category = parent;
        resolvedSubcategorySlug = match.slug;
        break;
      }
    }
  }

  const activeSubcategory = category?.subcategories?.find(
    (s) => s.slug.toLowerCase().trim() === (resolvedSubcategorySlug || '').toLowerCase().trim()
  );

  // Filters State
  const [selectedSubcat, setSelectedSubcat] = useState<string | undefined>(
    activeSubcategory?.id
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(2500);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Sync subcategory prop & document SEO metadata
  React.useEffect(() => {
    setSelectedSubcat(activeSubcategory?.id);
    if (category) {
      trackEvent('category_view', category.id, category.name);
      
      // Dynamic UK SEO Title & Meta Description
      document.title = activeSubcategory
        ? `${activeSubcategory.name} | Handcrafted ${category.name} | Plush Comfort UK`
        : (category.seoTitle || `Luxury Handcrafted ${category.name} UK | Plush Comfort`);
      
      const meta = document.querySelector('meta[name="description"]');
      if (meta && category.seoDescription) {
        meta.setAttribute('content', category.seoDescription);
      }
    }
  }, [categorySlug, subcategorySlug, activeSubcategory, category, trackEvent]);

  // Available products for current category with primary & secondary category support
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    return products.filter((p) => {
      if (!p.isPublished) return false;
      if (p.categoryId === category.id) return true;
      if (category.slug === 'sofas' && (p.categoryId.includes('sofa') || p.categoryId === 'cat-armchairs')) return true;
      if ((category.slug === 'beds-bed-frames' || category.slug === 'beds') && (p.categoryId.includes('bed') || p.categoryId === 'cat-mattresses')) return true;
      return false;
    });
  }, [category, products]);

  const allMaterials = useMemo(() => {
    const set = new Set<string>();
    categoryProducts.forEach((p) => p.materials.forEach((m) => set.add(m)));
    return Array.from(set);
  }, [categoryProducts]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return categoryProducts
      .filter((p) => {
        if (selectedSubcat && p.subcategoryId !== selectedSubcat) return false;
        if (selectedMaterial !== 'all' && !p.materials.includes(selectedMaterial)) return false;
        const price = p.salePrice ?? p.price;
        if (price > maxPrice) return false;
        if (inStockOnly && p.stock <= 0) return false;
        return true;
      })
      .sort((a, b) => {
        const priceA = a.salePrice ?? a.price;
        const priceB = b.salePrice ?? b.price;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'rating') return b.rating - a.rating;
        return b.isFeatured ? 1 : -1;
      });
  }, [categoryProducts, selectedSubcat, selectedMaterial, maxPrice, inStockOnly, sortBy]);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold">Category Not Found</h1>
        <button
          onClick={() => setRoute({ name: 'shop' })}
          className="mt-4 bg-[#A25828] text-white px-6 py-2.5 rounded-full text-sm font-semibold"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const pageTitle = activeSubcategory
    ? `${activeSubcategory.name} | Handcrafted ${category.name}`
    : `Luxury Handcrafted ${category.name}`;

  const normalizeImg = (src?: string) => {
    if (!src || !src.trim()) return '';
    const trimmed = src.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return `/${trimmed}`;
  };

  const rawBanner = category.bannerImage?.trim() || category.image?.trim();
  const bannerImage = normalizeImg(rawBanner);
  const isBannerVisible = category.showBanner !== false && Boolean(bannerImage);

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-20">
      {/* 1. HERO BANNER OR STANDARD HEADER */}
      {isBannerVisible ? (
        <div className="relative bg-[#221C18] border-b border-[#E8E0D5] overflow-hidden">
          {/* Background Banner Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={bannerImage}
              alt={category.imageAlt || `${category.name} Luxury Furniture Collection`}
              onError={(e) => {
                if (category.image && e.currentTarget.src !== normalizeImg(category.image)) {
                  e.currentTarget.src = normalizeImg(category.image);
                }
              }}
              className="w-full h-full object-cover object-center filter brightness-[0.68] scale-[1.01] transition-transform duration-700"
            />
            {/* Multi-stage Luxury Contrast Gradient Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            <div className="absolute inset-0 backdrop-brightness-[0.9]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 relative z-10">
            {/* Breadcrumbs with high-contrast text */}
            <nav className="flex items-center gap-2 text-xs text-stone-200 mb-5 drop-shadow-sm font-medium">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setRoute({ name: 'home' });
                }}
                className="hover:text-white cursor-pointer transition-colors"
              >
                Home
              </a>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <a
                href="/shop"
                onClick={(e) => {
                  e.preventDefault();
                  setRoute({ name: 'shop' });
                }}
                className="hover:text-white cursor-pointer transition-colors"
              >
                Shop
              </a>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <a
                href={`/category/${category.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSubcat(undefined);
                  setRoute({ name: 'category', categorySlug: category.slug });
                }}
                className={`hover:text-white cursor-pointer transition-colors ${!activeSubcategory ? 'font-bold text-white' : ''}`}
              >
                {category.name}
              </a>
              {activeSubcategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  <a
                    href={`/category/${category.slug}/${activeSubcategory.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setRoute({ name: 'category', categorySlug: category.slug, subcategorySlug: activeSubcategory.slug });
                    }}
                    className="font-bold text-white"
                  >
                    {activeSubcategory.name}
                  </a>
                </>
              )}
            </nav>

            {/* Category Title & Description with enhanced contrast & shadow */}
            <div className="max-w-3xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/20 backdrop-blur-xs text-[11px] font-bold uppercase tracking-widest text-amber-300 shadow-sm">
                <span>Yorkshire Workshop Handcrafted</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-[0_3px_14px_rgba(0,0,0,0.9)] leading-[1.15]">
                {pageTitle}
              </h1>
              <p className="text-sm sm:text-base text-stone-100 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-2xl font-normal">
                {activeSubcategory?.description || category.description}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b border-[#E8E0D5] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs text-[#8A786A] mb-4">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setRoute({ name: 'home' });
                }}
                className="hover:text-[#A25828] cursor-pointer"
              >
                Home
              </a>
              <ChevronRight className="w-3.5 h-3.5" />
              <a
                href="/shop"
                onClick={(e) => {
                  e.preventDefault();
                  setRoute({ name: 'shop' });
                }}
                className="hover:text-[#A25828] cursor-pointer"
              >
                Shop
              </a>
              <ChevronRight className="w-3.5 h-3.5" />
              <a
                href={`/category/${category.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSubcat(undefined);
                  setRoute({ name: 'category', categorySlug: category.slug });
                }}
                className={`hover:text-[#A25828] cursor-pointer ${!activeSubcategory ? 'font-bold text-[#221C18]' : ''}`}
              >
                {category.name}
              </a>
              {activeSubcategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <a
                    href={`/category/${category.slug}/${activeSubcategory.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setRoute({ name: 'category', categorySlug: category.slug, subcategorySlug: activeSubcategory.slug });
                    }}
                    className="font-bold text-[#221C18]"
                  >
                    {activeSubcategory.name}
                  </a>
                </>
              )}
            </nav>

            {/* Clear H1 & Short Introduction */}
            <div className="max-w-3xl space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#221C18]">
                {pageTitle}
              </h1>
              <p className="text-sm sm:text-base text-[#6B6159] leading-relaxed">
                {activeSubcategory?.description || category.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Navigation Bar */}
      <div className="bg-white border-b border-[#E8E0D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/category/${category.slug}`}
              onClick={(e) => {
                e.preventDefault();
                setSelectedSubcat(undefined);
                setRoute({ name: 'category', categorySlug: category.slug });
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer border inline-block ${
                !selectedSubcat
                  ? 'bg-[#221C18] text-white border-[#221C18]'
                  : 'bg-white text-stone-700 border-[#E0D7CC] hover:bg-stone-50'
              }`}
            >
              All {category.name} ({categoryProducts.length})
            </a>
            {category.subcategories.map((sub) => {
              const subCount = categoryProducts.filter((p) => p.subcategoryId === sub.id).length;
              const isSelected = selectedSubcat === sub.id || activeSubcategory?.id === sub.id;
              return (
                <a
                  key={sub.id}
                  href={`/category/${category.slug}/${sub.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedSubcat(sub.id);
                    setRoute({
                      name: 'category',
                      categorySlug: category.slug,
                      subcategorySlug: sub.slug,
                    });
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer border inline-block ${
                    isSelected
                      ? 'bg-[#A25828] text-white border-[#A25828]'
                      : 'bg-white text-stone-700 border-[#E0D7CC] hover:bg-stone-50'
                  }`}
                >
                  {sub.name} {subCount > 0 && `(${subCount})`}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (FILTERS & PRODUCT GRID) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="lg:hidden flex items-center gap-2 bg-white border border-[#D5C7B7] px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters ({filteredProducts.length})</span>
            </button>
            <span className="text-xs text-[#8A786A]">
              Showing <strong>{filteredProducts.length}</strong> handcrafted pieces
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-[#D5C7B7] rounded-lg px-3 py-1.5 text-xs text-[#221C18] font-medium focus:outline-none focus:border-[#A25828]"
            >
              <option value="featured">Featured &amp; Bestsellers</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* 2-Column Layout: Sidebar Filters + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
          {/* Filters Sidebar */}
          <aside
            className={`space-y-6 ${
              showFiltersMobile ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-semibold text-sm text-[#221C18] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#A25828]" />
                  Filter Furniture
                </h3>
                {(selectedMaterial !== 'all' || selectedSubcat || maxPrice < 2500 || inStockOnly) && (
                  <button
                    onClick={() => {
                      setSelectedMaterial('all');
                      setSelectedSubcat(undefined);
                      setMaxPrice(2500);
                      setInStockOnly(false);
                    }}
                    className="text-xs text-[#A25828] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Price Range Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-stone-700">
                  <span>Max Price:</span>
                  <span className="font-bold text-[#A25828] tabular-nums">£{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2500"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#A25828]"
                />
                <div className="flex justify-between text-[11px] text-stone-400">
                  <span>£50</span>
                  <span>£2,500</span>
                </div>
              </div>

              {/* Materials Filter */}
              {allMaterials.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                    Upholstery &amp; Frame Material
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                      <input
                        type="radio"
                        name="material"
                        checked={selectedMaterial === 'all'}
                        onChange={() => setSelectedMaterial('all')}
                        className="accent-[#A25828]"
                      />
                      <span>All Materials</span>
                    </label>
                    {allMaterials.map((mat) => (
                      <label key={mat} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                        <input
                          type="radio"
                          name="material"
                          checked={selectedMaterial === mat}
                          onChange={() => setSelectedMaterial(mat)}
                          className="accent-[#A25828]"
                        />
                        <span>{mat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability Filter */}
              <div className="pt-2 border-t border-stone-200">
                <label className="flex items-center gap-2 text-xs text-stone-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[#A25828] rounded"
                  />
                  <span>In Stock for Immediate Delivery</span>
                </label>
              </div>
            </div>

            {/* Buying Guide Teaser Box in Sidebar */}
            <div className="bg-[#F7F2EB] p-5 rounded-2xl border border-[#E8DFC5] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#A25828] uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Expert Advice</span>
              </div>
              <h4 className="font-serif font-bold text-base text-[#221C18]">
                Need help measuring or selecting {category.name.toLowerCase()}?
              </h4>
              <p className="text-xs text-[#6B6159] leading-relaxed">
                Read our in-depth UK buying guides covering doorway clearance, fabric durability, and frame guarantees.
              </p>
              <button
                onClick={() => setRoute({ name: 'blog' })}
                className="text-xs font-bold text-[#A25828] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
              >
                Read {category.name} Guide <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>

          {/* Product Grid Area (3 Columns) */}
          <main className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-12 text-center space-y-3">
                <h3 className="font-serif text-xl font-bold text-[#221C18]">
                  No products matched your filters
                </h3>
                <p className="text-sm text-stone-500 max-w-md mx-auto">
                  Try broadening your price range or resetting material selections to view all available handcrafted options.
                </p>
                <button
                  onClick={() => {
                    setSelectedMaterial('all');
                    setSelectedSubcat(undefined);
                    setMaxPrice(2000);
                  }}
                  className="bg-[#A25828] text-white px-6 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* 3. EDITABLE BOTTOM CATEGORY DESCRIPTION & INTERNAL LINKS (Mandatory Section 7) */}
        <section className="mt-20 bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E0D5] space-y-8">
          <div>
            <span className="text-xs font-bold text-[#A25828] uppercase tracking-wider">
              Craftsmanship &amp; Specifications
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#221C18] mt-1 mb-4">
              About Our {category.name} Range
            </h2>
            <div className="prose prose-stone text-sm text-[#5A4E46] leading-relaxed space-y-4">
              <p>{category.bottomSeoDescription}</p>
            </div>
          </div>

          {/* Contextual Internal Links Strip */}
          <div className="pt-6 border-t border-[#E8E0D5] grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2]">
              <h4 className="font-semibold text-xs text-[#221C18] uppercase tracking-wider mb-1">
                Complementary Pieces
              </h4>
              <p className="text-xs text-stone-600 mb-2">
                Pair your {category.name.toLowerCase()} with solid oak side tables and pure British wool throws.
              </p>
              <button
                onClick={() => setRoute({ name: 'shop' })}
                className="text-xs font-bold text-[#A25828] hover:underline cursor-pointer"
              >
                Browse Living Accessories &rarr;
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2]">
              <h4 className="font-semibold text-xs text-[#221C18] uppercase tracking-wider mb-1">
                UK White-Glove Delivery
              </h4>
              <p className="text-xs text-stone-600 mb-2">
                Our specialist 2-man team delivers directly into your room of choice with optional assembly.
              </p>
              <button
                onClick={() => setRoute({ name: 'delivery' })}
                className="text-xs font-bold text-[#A25828] hover:underline cursor-pointer"
              >
                Check UK Postcode Coverage &rarr;
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2]">
              <h4 className="font-semibold text-xs text-[#221C18] uppercase tracking-wider mb-1">
                30-Day Comfort Trial
              </h4>
              <p className="text-xs text-stone-600 mb-2">
                Enjoy your new furniture at home for 30 days with complete peace of mind.
              </p>
              <button
                onClick={() => setRoute({ name: 'returns' })}
                className="text-xs font-bold text-[#A25828] hover:underline cursor-pointer"
              >
                Read Returns Policy &rarr;
              </button>
            </div>
          </div>

          {/* Category FAQs */}
          {category.faqs && category.faqs.length > 0 && (
            <div className="pt-6 border-t border-[#E8E0D5]">
              <h3 className="font-serif text-xl font-bold text-[#221C18] mb-4">
                Frequently Asked Questions About {category.name}
              </h3>
              <div className="divide-y divide-[#EFEAE2]">
                {category.faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className="py-4">
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between text-left font-medium text-sm text-[#221C18] hover:text-[#A25828] transition-colors cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-500 transition-transform ${
                            isOpen ? 'rotate-180 text-[#A25828]' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs sm:text-sm text-[#665B53] leading-relaxed animate-fade-in">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
