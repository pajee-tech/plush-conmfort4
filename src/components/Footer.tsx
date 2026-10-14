import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setRoute, settings, activeCategories } = useStore();
  const handleNavClick = (url: string, e: React.MouseEvent) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return;
    }
    e.preventDefault();
    if (url.startsWith('/category/')) {
      const parts = url.replace('/category/', '').split('/');
      setRoute({ name: 'category', categorySlug: parts[0], subcategorySlug: parts[1] });
    } else if (url.startsWith('/product/')) {
      setRoute({ name: 'product', slug: url.replace('/product/', '') });
    } else if (url === '/shop') {
      setRoute({ name: 'shop' });
    } else if (url === '/delivery') {
      setRoute({ name: 'delivery' });
    } else if (url === '/returns') {
      setRoute({ name: 'returns' });
    } else if (url === '/faqs') {
      setRoute({ name: 'faqs' });
    } else if (url === '/contact') {
      setRoute({ name: 'contact' });
    } else if (url === '/account') {
      setRoute({ name: 'account' });
    } else if (url === '/wishlist') {
      setRoute({ name: 'wishlist' });
    } else if (url === '/blog') {
      setRoute({ name: 'blog' });
    } else if (url === '/about') {
      setRoute({ name: 'about' });
    } else if (url === '/privacy') {
      setRoute({ name: 'privacy' });
    } else if (url === '/terms') {
      setRoute({ name: 'terms' });
    } else if (url === '/cookies') {
      setRoute({ name: 'cookies' });
    } else if (url === '/admin') {
      setRoute({ name: 'admin' });
    } else {
      setRoute({ name: 'home' });
    }
  };

  const defaultColumns = [
    {
      id: 'col-collections',
      title: 'Collections',
      links: [
        { title: 'Handcrafted Sofas', url: '/category/sofas' },
        { title: 'Corner & Chaise Sofas', url: '/category/corner-sofas' },
        { title: '3-Seater Living Room Sofas', url: '/category/fabric-sofas' },
        { title: 'Bespoke Ottoman Beds', url: '/category/beds-bed-frames' },
        { title: 'Upholstered Wingback Beds', url: '/category/beds-bed-frames' },
        { title: 'Shop All Collections →', url: '/shop' },
      ],
    },
    {
      id: 'col-care',
      title: 'Customer Care',
      links: [
        { title: 'UK Delivery & White Glove', url: '/delivery' },
        { title: '30-Day Comfort Trial & Returns', url: '/returns' },
        { title: 'Track Order & Dispatch', url: '/account' },
        { title: 'Saved Wishlist', url: '/wishlist' },
        { title: 'Frequently Asked Questions', url: '/faqs' },
        { title: 'Contact Dewsbury Showroom', url: '/contact' },
      ],
    },
  ];

  const columnsToRender =
    settings.footerDesign?.columns && settings.footerDesign.columns.length > 0
      ? settings.footerDesign.columns
      : defaultColumns;

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) return;
    setNewsletterSubscribed(true);
  };

  return (
    <footer className="bg-[#FAF7F2] border-t border-[#E8E0D5] text-[#4A3E37]">
      {/* 4 Feature Trust Badges Bar (Matches bottom strip in screenshot) */}
      <div className="border-b border-[#E8E0D5] bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {/* Free Shipping */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5EE] flex items-center justify-center text-[#A25828] shrink-0 border border-[#E8E0D5]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#221C18]">Free UK Delivery</h4>
                <p className="text-xs text-[#736961] mt-0.5">On all orders over £{settings.freeDeliveryThreshold}</p>
              </div>
            </div>

            {/* Easy Returns */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5EE] flex items-center justify-center text-[#A25828] shrink-0 border border-[#E8E0D5]">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#221C18]">30-Day Comfort Trial</h4>
                <p className="text-xs text-[#736961] mt-0.5">Hassle-free UK returns policy</p>
              </div>
            </div>

            {/* Secure Payment */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5EE] flex items-center justify-center text-[#A25828] shrink-0 border border-[#E8E0D5]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#221C18]">Secure Payment</h4>
                <p className="text-xs text-[#736961] mt-0.5">100% encrypted Stripe & Klarna</p>
              </div>
            </div>

            {/* UK Support */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5EE] flex items-center justify-center text-[#A25828] shrink-0 border border-[#E8E0D5]">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#221C18]">UK Customer Support</h4>
                <p className="text-xs text-[#736961] mt-0.5">Mon–Sat 9am–6pm helpline</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Address Column (2 cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="footer" />

            {settings.footerDesign?.aboutText && (
              <p className="text-xs text-[#524842] leading-relaxed">
                {settings.footerDesign.aboutText}
              </p>
            )}

            <div className="space-y-2 text-xs text-[#524842] pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#A25828] shrink-0 mt-0.5" />
                <span>{settings.footerDesign?.address || settings.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#A25828] shrink-0" />
                <a href={`tel:${(settings.footerDesign?.phone || settings.phone).replace(/\s+/g, '')}`} className="hover:text-[#A25828] underline">
                  {settings.footerDesign?.phone || settings.phone}
                </a>
                <span className="text-stone-400">·</span>
                <a
                  href={`https://wa.me/${(settings.footerDesign?.whatsapp || settings.whatsapp || '447923119077').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  WhatsApp Us
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#A25828] shrink-0" />
                <a href={`mailto:${settings.footerDesign?.email || settings.email}`} className="hover:text-[#A25828]">
                  {settings.footerDesign?.email || settings.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#A25828] shrink-0" />
                <span>{settings.footerDesign?.openingHours || settings.businessHours}</span>
              </div>
            </div>

            {/* Social Media Links */}
            {(settings.footerDesign?.socialInstagram || settings.footerDesign?.socialFacebook || settings.footerDesign?.socialPinterest) && (
              <div className="flex items-center gap-3 pt-2 text-xs">
                {settings.footerDesign?.socialInstagram && (
                  <a
                    href={settings.footerDesign.socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8A786A] hover:text-[#A25828] font-medium"
                  >
                    Instagram
                  </a>
                )}
                {settings.footerDesign?.socialFacebook && (
                  <a
                    href={settings.footerDesign.socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8A786A] hover:text-[#A25828] font-medium"
                  >
                    Facebook
                  </a>
                )}
                {settings.footerDesign?.socialPinterest && (
                  <a
                    href={settings.footerDesign.socialPinterest}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8A786A] hover:text-[#A25828] font-medium"
                  >
                    Pinterest
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Footer Columns Managed via Dashboard */}
          {columnsToRender.map((col) => (
            <div key={col.id}>
              <h4 className="font-serif font-bold text-base text-[#221C18] mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-xs">
                {col.links.map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link.url}
                      onClick={(e) => handleNavClick(link.url, e)}
                      className="hover:text-[#A25828] transition-colors cursor-pointer block text-[#524842]"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Column 4: Newsletter & Buying Guides */}
          <div>
            <h4 className="font-serif font-bold text-base text-[#221C18] mb-4">
              Join Our Circle
            </h4>
            <p className="text-xs text-[#6B6159] leading-relaxed mb-3">
              Subscribe for exclusive fabric previews, seasonal sales, and British interior inspiration.
            </p>
            {newsletterSubscribed ? (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thank you! You are subscribed to Plush Comfort updates.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-[#D5C7B7] text-[#221C18] placeholder-stone-400 focus:outline-none focus:border-[#A25828]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#A25828] text-white hover:bg-[#8A461A] text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            )}

            <div className="pt-4">
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  setRoute({ name: 'blog' });
                }}
                className="text-xs font-semibold text-[#A25828] hover:underline block"
              >
                Read UK Buying Guides &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Legal, Payment Badges & Copyright */}
        <div className="border-t border-[#E8E0D5] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8A786A]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>
              {settings.footerDesign?.copyrightText || `© ${new Date().getFullYear()} Plush Comfort UK. All rights reserved.`}
            </span>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                setRoute({ name: 'privacy' });
              }}
              className="hover:text-[#221C18] transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                setRoute({ name: 'terms' });
              }}
              className="hover:text-[#221C18] transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </a>
            <a
              href="/cookies"
              onClick={(e) => {
                e.preventDefault();
                setRoute({ name: 'cookies' });
              }}
              className="hover:text-[#221C18] transition-colors cursor-pointer"
            >
              Cookie Policy
            </a>
            <a
              href="/admin"
              rel="nofollow"
              onClick={(e) => {
                e.preventDefault();
                setRoute({ name: 'admin' });
              }}
              className="hover:text-[#221C18] transition-colors cursor-pointer text-[#8A786A] opacity-80 hover:opacity-100"
            >
              Staff &amp; Owner Portal
            </a>
          </div>

          {/* Payment / Handover Badges */}
          <div className="flex flex-wrap items-center gap-2 text-stone-600 font-sans text-[11px]">
            <span className="px-2.5 py-1 bg-[#FAF5EE] text-[#A25828] font-semibold rounded-lg border border-[#E8CDBB]">
              Cash on Delivery (Pay on Handover)
            </span>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E8E0D5]">
              2-Man Room of Choice
            </span>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E8E0D5]">
              10-Yr Guarantee
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
