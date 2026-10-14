import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';
import { MegaMenu } from './MegaMenu';
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Phone,
  ChevronDown,
  ChevronRight,
  Lock,
  MessageCircle,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRoute,
    setRoute,
    cartCount,
    wishlist,
    settings,
    setIsCartDrawerOpen,
    setIsSearchOpen,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSiloOpen, setMobileSiloOpen] = useState<'sofas' | 'beds' | 'living' | 'guides' | null>(null);
  const [activeMegaSilo, setActiveMegaSilo] = useState<'sofas' | 'beds' | 'living' | 'guides' | null>(null);
  const [promoBannerDismissed, setPromoBannerDismissed] = useState(false);

  const isCurrent = (name: string, catSlug?: string) => {
    if (catSlug && currentRoute.name === 'category' && currentRoute.categorySlug === catSlug) {
      return true;
    }
    return currentRoute.name === name;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/98 backdrop-blur-md border-b border-[#E8E0D5] transition-all">
      {/* Top Promotional Announcement Banner */}
      {settings.isPromoBannerActive && !promoBannerDismissed && (
        <div className="bg-[#221C18] text-[#FDFBF7] text-xs py-2 px-4 relative flex items-center justify-between">
          <div className="container mx-auto flex items-center justify-center gap-3 text-center">
            <span className="hidden sm:inline-block bg-[#A25828] text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
              UK Mainland Delivery
            </span>
            <span className="font-medium tracking-wide text-xs sm:text-[13px]">
              {settings.promoBannerText}
            </span>
            <button
              onClick={() => setRoute({ name: 'shop' })}
              className="underline hover:text-[#E8A87C] font-semibold ml-1 cursor-pointer transition-colors"
            >
              Shop Event &rarr;
            </button>
          </div>
          <button
            onClick={() => setPromoBannerDismissed(true)}
            aria-label="Dismiss banner"
            className="text-stone-400 hover:text-white transition-colors cursor-pointer text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo - Bespoke Original Vector Logo for Plush Comfort UK */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveMegaSilo(null);
                setRoute({ name: 'home' });
              }}
              className="text-left focus:outline-none block"
              title="Plush Comfort UK - Luxury Handcrafted Furniture"
            >
              <BrandLogo variant="header" />
            </a>
          </div>

          {/* Desktop Silo / Mega Menu Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#4A3E37]">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveMegaSilo(null);
                setRoute({ name: 'home' });
              }}
              className={`transition-colors hover:text-[#A25828] cursor-pointer py-2 ${
                isCurrent('home') ? 'text-[#A25828] font-bold border-b-2 border-[#A25828]' : ''
              }`}
            >
              Home
            </a>

            {/* Silo 1: Sofas Mega Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMegaSilo('sofas')}
            >
              <a
                href="/category/sofas"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMegaSilo(activeMegaSilo === 'sofas' ? null : 'sofas');
                  setRoute({ name: 'category', categorySlug: 'sofas' });
                }}
                className={`flex items-center gap-1 transition-colors hover:text-[#A25828] cursor-pointer py-2 ${
                  isCurrent('category', 'sofas') || activeMegaSilo === 'sofas'
                    ? 'text-[#A25828] font-bold border-b-2 border-[#A25828]'
                    : ''
                }`}
              >
                <span>Sofas</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>

            {/* Silo 2: Beds Mega Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMegaSilo('beds')}
            >
              <a
                href="/category/beds"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMegaSilo(activeMegaSilo === 'beds' ? null : 'beds');
                  setRoute({ name: 'category', categorySlug: 'beds' });
                }}
                className={`flex items-center gap-1 transition-colors hover:text-[#A25828] cursor-pointer py-2 ${
                  isCurrent('category', 'beds') || activeMegaSilo === 'beds'
                    ? 'text-[#A25828] font-bold border-b-2 border-[#A25828]'
                    : ''
                }`}
              >
                <span>Beds</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>

            {/* Silo 3: Living & Dining Furniture */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMegaSilo('living')}
            >
              <a
                href="/shop"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMegaSilo(activeMegaSilo === 'living' ? null : 'living');
                  setRoute({ name: 'shop' });
                }}
                className={`flex items-center gap-1 transition-colors hover:text-[#A25828] cursor-pointer py-2 ${
                  activeMegaSilo === 'living'
                    ? 'text-[#A25828] font-bold border-b-2 border-[#A25828]'
                    : ''
                }`}
              >
                <span>Living &amp; Dining</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>

            <a
              href="/shop"
              onClick={(e) => {
                e.preventDefault();
                setActiveMegaSilo(null);
                setRoute({ name: 'shop' });
              }}
              className={`transition-colors hover:text-[#A25828] cursor-pointer py-2 ${
                isCurrent('shop') ? 'text-[#A25828] font-bold border-b-2 border-[#A25828]' : ''
              }`}
            >
              Shop All
            </a>

            {/* Silo 4: Buying Guides */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMegaSilo('guides')}
            >
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMegaSilo(activeMegaSilo === 'guides' ? null : 'guides');
                  setRoute({ name: 'blog' });
                }}
                className={`flex items-center gap-1 transition-colors hover:text-[#A25828] cursor-pointer py-2 ${
                  isCurrent('blog') || activeMegaSilo === 'guides'
                    ? 'text-[#A25828] font-bold border-b-2 border-[#A25828]'
                    : ''
                }`}
              >
                <span>Buying Guides</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>

            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault();
                setActiveMegaSilo(null);
                setRoute({ name: 'about' });
              }}
              className={`transition-colors hover:text-[#A25828] cursor-pointer py-2 ${
                isCurrent('about') ? 'text-[#A25828] font-bold border-b-2 border-[#A25828]' : ''
              }`}
            >
              About
            </a>

            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                setActiveMegaSilo(null);
                setRoute({ name: 'contact' });
              }}
              className={`transition-colors hover:text-[#A25828] cursor-pointer py-2 ${
                isCurrent('contact') ? 'text-[#A25828] font-bold border-b-2 border-[#A25828]' : ''
              }`}
            >
              Contact
            </a>
          </nav>

          {/* Right Action Icons & Primary CTA */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search furniture catalog"
              className="p-2 text-[#4A3E37] hover:text-[#A25828] transition-colors rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Icon with Dynamic Count Badge */}
            <button
              onClick={() => {
                setActiveMegaSilo(null);
                setRoute({ name: 'wishlist' });
              }}
              aria-label="Wishlist saved pieces"
              className="p-2 text-[#4A3E37] hover:text-[#A25828] transition-colors rounded-full hover:bg-stone-100 relative cursor-pointer"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#A25828] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Basket Drawer Trigger with Live Count */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              aria-label="Shopping basket"
              className="p-2 text-[#4A3E37] hover:text-[#A25828] transition-colors rounded-full hover:bg-stone-100 relative cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-[#A25828] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Staff & Owner Restricted Portal */}
            <a
              href="/admin"
              rel="nofollow"
              onClick={(e) => {
                e.preventDefault();
                setActiveMegaSilo(null);
                setRoute({ name: 'admin' });
              }}
              title="Restricted — Staff & Owner Portal Only"
              className="hidden xl:flex items-center gap-1.5 text-xs text-[#7A6A5E] hover:text-[#221C18] border border-[#E8E0D5] hover:border-[#A25828] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer bg-[#FAF8F5]/80 hover:bg-[#F3ECE4]"
            >
              <Lock className="w-3.5 h-3.5 text-[#A25828]" />
              <span className="font-medium">Staff &amp; Owner</span>
            </a>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                setActiveMegaSilo(null);
                setRoute({ name: 'shop' });
              }}
              className="hidden sm:inline-flex items-center justify-center bg-[#A25828] text-white hover:bg-[#8A461A] px-5 py-2.5 rounded-full text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              Shop Now
            </button>

            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="lg:hidden p-2 text-[#221C18] hover:text-[#A25828] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP MEGA MENU DROPDOWN */}
      <MegaMenu activeSilo={activeMegaSilo} onClose={() => setActiveMegaSilo(null)} />

      {/* MOBILE & TABLET SILO ACCORDION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E8E0D5] px-4 pt-4 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-fade-in">
          <div className="space-y-2 text-sm font-medium text-[#221C18]">
            <button
              onClick={() => { setRoute({ name: 'home' }); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#FAF8F5]"
            >
              Home
            </button>

            {/* Silo 1: Sofas Accordion */}
            <div className="border border-[#E8E0D5] rounded-2xl overflow-hidden">
              <button
                onClick={() => setMobileSiloOpen(mobileSiloOpen === 'sofas' ? null : 'sofas')}
                className="w-full flex items-center justify-between p-3.5 bg-[#FAF8F5] text-left font-bold text-[#221C18]"
              >
                <span>Sofas &amp; Sectionals</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSiloOpen === 'sofas' ? 'rotate-180' : ''}`} />
              </button>
              {mobileSiloOpen === 'sofas' && (
                <div className="p-3 bg-white space-y-2 text-xs text-stone-700 divide-y divide-stone-100">
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'sofas' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2 font-bold text-[#A25828]"
                  >
                    View All Sofas &rarr;
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'sofas', subcategorySlug: 'corner-sofas' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2"
                  >
                    Corner &amp; Chaise Sofas
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'sofas', subcategorySlug: '3-seater-sofas' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2"
                  >
                    3-Seater Sofas
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'sofas', subcategorySlug: '2-seater-sofas' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2"
                  >
                    2-Seater Loveseats
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'sofas', subcategorySlug: 'sofa-beds' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2"
                  >
                    Sofa Beds
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'blog-detail', slug: 'uk-sofa-buying-guide' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2 text-stone-500 font-semibold"
                  >
                    Read Sofa Buying Guide ↗
                  </button>
                </div>
              )}
            </div>

            {/* Silo 2: Beds Accordion */}
            <div className="border border-[#E8E0D5] rounded-2xl overflow-hidden">
              <button
                onClick={() => setMobileSiloOpen(mobileSiloOpen === 'beds' ? null : 'beds')}
                className="w-full flex items-center justify-between p-3.5 bg-[#FAF8F5] text-left font-bold text-[#221C18]"
              >
                <span>Beds &amp; Ottoman Frames</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSiloOpen === 'beds' ? 'rotate-180' : ''}`} />
              </button>
              {mobileSiloOpen === 'beds' && (
                <div className="p-3 bg-white space-y-2 text-xs text-stone-700 divide-y divide-stone-100">
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'beds' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2 font-bold text-[#A25828]"
                  >
                    View All Beds &rarr;
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'beds', subcategorySlug: 'ottoman-beds' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2"
                  >
                    Gas-Lift Ottoman Storage Beds
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'beds', subcategorySlug: 'upholstered-beds' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2"
                  >
                    Upholstered Wingback Beds
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'category', categorySlug: 'beds', subcategorySlug: 'divan-beds' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2"
                  >
                    Deep Buttoned Divans
                  </button>
                  <button
                    onClick={() => { setRoute({ name: 'blog-detail', slug: 'uk-bed-sizes-and-storage-guide' }); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2 text-stone-500 font-semibold"
                  >
                    Read UK Bed Sizes Guide ↗
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { setRoute({ name: 'shop' }); setMobileMenuOpen(false); }}
              className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-[#FAF8F5] font-semibold"
            >
              Shop All Collections
            </button>

            <button
              onClick={() => { setRoute({ name: 'blog' }); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#FAF8F5]"
            >
              Furniture Buying Guides
            </button>

            <button
              onClick={() => { setRoute({ name: 'wishlist' }); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#FAF8F5] flex items-center justify-between"
            >
              <span>Saved Wishlist</span>
              {wishlist.length > 0 && (
                <span className="bg-[#A25828] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setRoute({ name: 'account' }); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#FAF8F5]"
            >
              Order History &amp; Live Tracking
            </button>

            <button
              onClick={() => { setRoute({ name: 'about' }); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#FAF8F5]"
            >
              Our Dewsbury Yorkshire Story
            </button>

            <button
              onClick={() => { setRoute({ name: 'contact' }); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-xl hover:bg-[#FAF8F5]"
            >
              Contact Customer Care
            </button>

            <a
              href="/admin"
              rel="nofollow"
              onClick={(e) => {
                e.preventDefault();
                setRoute({ name: 'admin' });
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 rounded-xl bg-stone-100/90 font-medium text-xs text-stone-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#A25828]" />
                <span>Staff &amp; Owner Portal</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded">Staff Only</span>
            </a>
          </div>

          <div className="mt-5 pt-4 border-t border-stone-200 space-y-2">
            <a
              href="https://wa.me/447923119077"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl text-xs font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Showroom (+44 7923 119077)</span>
            </a>
            <button
              onClick={() => { setRoute({ name: 'shop' }); setMobileMenuOpen(false); }}
              className="w-full bg-[#A25828] text-white py-3 rounded-full text-xs font-bold"
            >
              Shop Handcrafted Furniture
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
