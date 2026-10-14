import React from 'react';
import { useStore } from '../context/StoreContext';
import { FURNITURE_IMAGES } from '../utils/imageHelper';
import { ShieldCheck, Sparkles, HeartHandshake, Trees, MapPin, Phone } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setRoute, settings } = useStore();

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      {/* Hero Banner */}
      <div className="bg-white border-b border-[#E8E0D5] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A25828]">
            Yorkshire Heritage &amp; Craftsmanship
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#221C18]">
            Crafted for Comfort, Built for Life.
          </h1>
          <p className="text-base sm:text-lg text-[#6B6159] leading-relaxed max-w-2xl mx-auto">
            From our workshops on Calder Road in Dewsbury, Plush Comfort brings together time-honoured British upholstery joinery and modern Scandinavian elegance.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-20">
        {/* Story Section 1: Dewsbury Workshops */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A25828]">
              The Yorkshire Textile Capital
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#221C18]">
              Where True British Furniture Still Gets Made
            </h2>
            <p className="text-sm text-[#5C5047] leading-relaxed">
              West Yorkshire has been the beating heart of British textiles and heavy cloth weaving since the Industrial Revolution. At Plush Comfort, we keep that tradition vibrantly alive. We refuse to cut corners with imported lightweight chipboard or disposable flat-pack frames.
            </p>
            <p className="text-sm text-[#5C5047] leading-relaxed">
              Every sofa and bed frame is bench-built by artisan joiners using sustainable European beech hardwood, double-dowelled joints, and hand-pleated bespoke fabrics. When you buy from us, you support authentic British manufacturing.
            </p>
          </div>

          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-[#FAF7F2] border border-[#E8E0D5] shadow-sm">
            <img
              src="/uploads/products/verona-plush-velvet-corner-sofa-grey-fabric-chesterfield-style-l-shape-settee-with-scatter-cushions-2.png"
              alt="Plush Comfort Dewsbury Workshop Handcrafted Upholstery"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 4 Pillars of Quality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#FAF5EE] text-[#A25828] flex items-center justify-center font-bold">
              <Trees className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#221C18]">FSC Timber</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              100% of our kiln-dried beech and birch frames are certified from responsibly managed European forests.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#FAF5EE] text-[#A25828] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#221C18]">10-Year Warranty</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every structural frame, joint, and spring system is backed by our comprehensive decade guarantee.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#FAF5EE] text-[#A25828] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#221C18]">Stain Resistance</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our velvets and bouclés come treated with spill-shield barriers that resist accidental coffee and wine spills.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#FAF5EE] text-[#A25828] flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#221C18]">30-Day Trial</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Test your sofa or bed in your own home for 30 nights. If you are not completely satisfied, we collect it.
            </p>
          </div>
        </div>

        {/* Visit or Contact Callout */}
        <div className="bg-[#FAF5EE] rounded-3xl p-8 sm:p-12 border border-[#E8DFC5] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#A25828] uppercase">Visit Our Yorkshire Showroom</span>
            <h3 className="font-serif text-2xl font-bold text-[#221C18]">
              {settings.address}
            </h3>
            <p className="text-xs text-stone-600">
              Open {settings.businessHours}. Call {settings.phone} to book a personalized upholstery consultation.
            </p>
          </div>
          <button
            onClick={() => setRoute({ name: 'contact' })}
            className="bg-[#A25828] text-white hover:bg-[#8A461A] px-6 py-3 rounded-full text-xs font-semibold shrink-0 cursor-pointer"
          >
            Contact Customer Team
          </button>
        </div>
      </div>
    </div>
  );
};
