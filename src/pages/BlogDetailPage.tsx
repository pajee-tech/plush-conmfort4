import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import {
  ChevronRight,
  Clock,
  Calendar,
  User,
  ArrowLeft,
  Share2,
  BookOpen,
  Layers,
  Sparkles,
  Link2,
  CheckCircle2,
  Quote,
  ShieldCheck,
} from 'lucide-react';

interface BlogDetailPageProps {
  slug: string;
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ slug }) => {
  const { blogPosts, products, categories, setRoute } = useStore();
  const [copiedLink, setCopiedLink] = useState(false);

  const post = blogPosts.find((b) => b.slug === slug);

  // Sync document title and meta description
  useEffect(() => {
    if (post) {
      document.title = post.seoTitle || `${post.title} | Plush Comfort UK`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', post.seoDescription || post.excerpt);
      }
    }
  }, [post]);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#221C18]">Furniture Guide Not Found</h1>
        <p className="text-stone-500 mt-2 text-sm">
          The requested guide or article may have been moved, updated, or unpublished.
        </p>
        <button
          onClick={() => setRoute({ name: 'blog' })}
          className="mt-6 bg-[#A25828] text-white px-6 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
        >
          Return to Furniture Journal
        </button>
      </div>
    );
  }

  const isPillar = post.contentType === 'pillar_page' || post.type === 'pillar';

  // Find parent pillar if cluster
  const parentPillar = !isPillar
    ? blogPosts.find((b) => (post.parentPillarId && b.id === post.parentPillarId) || (post.pillarSlug && b.slug === post.pillarSlug))
    : null;

  // Find child cluster articles if pillar
  const clusterChildren = isPillar
    ? blogPosts.filter((b) => b.id !== post.id && b.isPublished && (b.parentPillarId === post.id || b.pillarSlug === post.slug))
    : [];

  // Linked commercial products
  const relatedProducts = products.filter(
    (p) => p.isPublished && (post.relatedProductIds?.includes(p.id) || p.categoryId === post.relatedCategorySlug)
  ).slice(0, 3);

  // Custom click handler for internal links inside markdown
  const handleInternalLinkClick = (url: string) => {
    if (url.startsWith('/product/')) {
      const prodSlug = url.replace('/product/', '').split('?')[0];
      setRoute({ name: 'product', slug: prodSlug });
    } else if (url.startsWith('/category/')) {
      const catSlug = url.replace('/category/', '').split('?')[0];
      setRoute({ name: 'category', categorySlug: catSlug });
    } else if (url.startsWith('/blog/')) {
      const blogSlug = url.replace('/blog/', '').split('?')[0];
      setRoute({ name: 'blog-detail', slug: blogSlug });
    } else if (url === '/shop') {
      setRoute({ name: 'shop' });
    } else if (url === '/delivery') {
      setRoute({ name: 'delivery' });
    } else if (url === '/returns') {
      setRoute({ name: 'returns' });
    } else if (url === '/faqs') {
      setRoute({ name: 'faqs' });
    } else if (url === '/about') {
      setRoute({ name: 'about' });
    } else if (url === '/contact') {
      setRoute({ name: 'contact' });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper to render inline links and formatting
  const renderInlineFormatted = (line: string) => {
    // Regex for markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(line)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(line.substring(lastIndex, matchIndex));
      }

      const anchorText = match[1];
      const targetUrl = match[2];

      parts.push(
        <button
          key={`${matchIndex}-${targetUrl}`}
          type="button"
          onClick={() => handleInternalLinkClick(targetUrl)}
          className="text-[#A25828] hover:text-[#8A461A] font-semibold underline underline-offset-2 transition-colors cursor-pointer inline"
        >
          {anchorText}
        </button>
      );

      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return parts;
  };

  // Rich Content Parser (Headings, Tables, Blockquotes, Lists, Paragraphs)
  const renderRichContent = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    const flushTable = (keyIndex: number) => {
      if (tableBuffer.length === 0) return;
      const rows = tableBuffer.map((r) =>
        r.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length)
      );
      const headerRow = rows[0] || [];
      const bodyRows = rows.slice(2); // Skip separator row

      elements.push(
        <div key={`table-${keyIndex}`} className="my-6 overflow-x-auto rounded-2xl border border-[#E8E0D5] bg-white shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm">
            {headerRow.length > 0 && (
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D5] text-[#221C18] font-bold">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="py-3 px-4 sm:px-6">{cell}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#EFEAE2]">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-3 px-4 sm:px-6 text-stone-700">
                      {renderInlineFormatted(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Table row check
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableBuffer.push(trimmed);
        return;
      } else if (inTable) {
        flushTable(index);
      }

      // Skip empty lines
      if (!trimmed) return;

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="font-serif font-bold text-xl sm:text-2xl text-[#221C18] mt-8 mb-3">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="font-serif font-bold text-2xl sm:text-3xl text-[#221C18] mt-10 mb-4 pb-2 border-b border-[#E8E0D5]/70">
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        // Main H1 is already in header, but render if used inside body
        elements.push(
          <h2 key={index} className="font-serif font-bold text-2xl sm:text-3xl text-[#221C18] mt-8 mb-4">
            {trimmed.replace('# ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('> ')) {
        // Blockquote / Craftsman Tip
        elements.push(
          <blockquote key={index} className="my-6 p-5 bg-[#FAF5EE] rounded-2xl border-l-4 border-[#A25828] text-xs sm:text-sm text-[#4A3E37] space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-[#A25828] text-xs uppercase tracking-wider mb-1">
              <Quote className="w-3.5 h-3.5" />
              <span>Yorkshire Upholstery Insight</span>
            </div>
            <div>{renderInlineFormatted(trimmed.replace('> ', ''))}</div>
          </blockquote>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Bullet list
        elements.push(
          <li key={index} className="ml-5 list-disc text-sm sm:text-base text-[#4A3E37] my-1.5 leading-relaxed">
            {renderInlineFormatted(trimmed.replace(/^[-*]\s+/, ''))}
          </li>
        );
      } else if (/^\d+\.\s+/.test(trimmed)) {
        // Numbered list
        elements.push(
          <li key={index} className="ml-5 list-decimal text-sm sm:text-base text-[#4A3E37] my-1.5 leading-relaxed">
            {renderInlineFormatted(trimmed.replace(/^\d+\.\s+/, ''))}
          </li>
        );
      } else if (trimmed === '---') {
        elements.push(<hr key={index} className="my-8 border-[#E8E0D5]" />);
      } else {
        // Regular paragraph
        elements.push(
          <p key={index} className="text-sm sm:text-base text-[#4A3E37] leading-relaxed my-4">
            {renderInlineFormatted(trimmed)}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return elements;
  };

  const schemaOrgJsonLd = {
    '@context': 'https://schema.org',
    '@type': isPillar ? 'Article' : 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.coverImage,
    datePublished: post.publishDate,
    dateModified: post.lastUpdated || post.publishDate,
    author: {
      '@type': 'Person',
      name: post.author,
      jobTitle: post.authorRole || 'Master Craftsman',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Plush Comfort UK',
      logo: {
        '@type': 'ImageObject',
        url: 'https://plushcomfort.uk/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonicalUrl || `https://plushcomfort.uk/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJsonLd) }}
      />

      {/* 1. BREADCRUMBS WITH SILO HIERARCHY */}
      <div className="bg-white border-b border-[#E8E0D5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs text-[#8A786A] overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setRoute({ name: 'home' })}
              className="hover:text-[#A25828] cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <button
              onClick={() => setRoute({ name: 'blog' })}
              className="hover:text-[#A25828] cursor-pointer"
            >
              Buying Guides
            </button>
            {parentPillar && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <button
                  onClick={() => setRoute({ name: 'blog-detail', slug: parentPillar.slug })}
                  className="hover:text-[#A25828] cursor-pointer truncate max-w-[200px]"
                >
                  {parentPillar.title}
                </button>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-[#221C18] truncate max-w-[280px]">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Article Meta Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 text-xs text-[#8A786A] font-medium flex-wrap">
            <span className="bg-[#FAF5EE] text-[#A25828] px-3 py-1 rounded-md font-bold uppercase tracking-wider border border-[#E8DFC5] text-[10px]">
              {post.contentType === 'pillar_page' ? 'Flagship Pillar Buying Guide' : post.contentType.replace('_', ' ')}
            </span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-[#E8E0D5] font-semibold text-stone-700 text-xs">
              {post.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{post.publishDate}</span>
            </span>
            {post.lastUpdated && post.lastUpdated !== post.publishDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">Updated {post.lastUpdated}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{post.readTime}</span>
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#221C18] leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-[#6B6159] leading-relaxed font-sans">
            {post.excerpt}
          </p>

          {/* Author Byline Box */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E8E0D5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#A25828] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                {post.author.charAt(0)}
              </div>
              <div>
                <span className="font-bold block text-sm text-[#221C18]">{post.author}</span>
                <span className="text-xs text-stone-500">
                  {post.authorRole || 'Master Craftsman & Workshop Team · Calder Road, Dewsbury'}
                </span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="text-stone-600 hover:text-[#A25828] p-2.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer border border-[#E8E0D5] bg-white shadow-2xs flex items-center gap-1.5"
                title="Share article"
              >
                <Share2 className="w-4 h-4" />
                {copiedLink && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-[#FAF7F2] border border-[#E8E0D5] mb-10 shadow-sm relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-3 right-4 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md font-mono">
            Plush Comfort UK Workshop
          </span>
        </div>

        {/* CLUSTER BACKLINK BANNER (If this is a supporting cluster article) */}
        {parentPillar && (
          <div className="mb-10 p-5 bg-[#FAF5EE] rounded-3xl border border-[#E8DFC5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#A25828] flex items-center justify-center shrink-0 border border-[#E8DFC5]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A25828] block">
                  Part of Pillar Topic Cluster
                </span>
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#221C18]">
                  {parentPillar.title}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setRoute({ name: 'blog-detail', slug: parentPillar.slug })}
              className="bg-[#A25828] hover:bg-[#8A461A] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              Explore Full Pillar Guide &rarr;
            </button>
          </div>
        )}

        {/* TOPICAL CLUSTER CHILDREN ACCORDION (If this is a flagship pillar page) */}
        {isPillar && clusterChildren.length > 0 && (
          <div className="mb-10 p-6 bg-white rounded-3xl border border-[#E8E0D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#A25828]" />
                <h3 className="font-serif font-bold text-lg text-[#221C18]">
                  In This Topic Cluster ({clusterChildren.length} Supporting Articles)
                </h3>
              </div>
              <span className="text-xs text-stone-500">Curated by our Dewsbury craftsmen</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clusterChildren.map((child) => (
                <div
                  key={child.id}
                  onClick={() => setRoute({ name: 'blog-detail', slug: child.slug })}
                  className="p-3.5 bg-[#FAF8F5] hover:bg-[#FAF5EE] rounded-2xl border border-[#E8E0D5] hover:border-[#D5C7B7] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="truncate pr-2">
                    <span className="text-[10px] font-bold uppercase text-[#A25828] block">
                      {child.contentType.replace('_', ' ')}
                    </span>
                    <h5 className="font-serif font-bold text-xs sm:text-sm text-[#221C18] truncate group-hover:text-[#A25828] transition-colors">
                      {child.title}
                    </h5>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#A25828] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Article Body Content Formatted with Rich Rendering */}
        <article className="prose prose-stone prose-lg max-w-none text-[#3C322C] leading-relaxed">
          {renderRichContent(post.content)}
        </article>

        {/* Contextual Commercial Products Strip (Section 8.D) */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#E8E0D5]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A25828] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Recommended in this guide</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#221C18] mb-6">
              Handcrafted British Pieces Featured Above
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* 10-Year Yorkshire Craftsmanship Trust Box */}
        <div className="mt-16 p-6 sm:p-8 bg-[#FAF5EE] rounded-3xl border border-[#E8DFC5] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif font-bold text-lg sm:text-xl text-[#221C18]">
              Have a bespoke sizing or fabric question?
            </h4>
            <p className="text-xs text-[#6B6159] leading-relaxed">
              Our Dewsbury upholstery team offers complimentary fabric swatches and live room measurements via WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setRoute({ name: 'contact' })}
              className="bg-[#A25828] hover:bg-[#8A461A] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Contact Workshop Team
            </button>
            <button
              onClick={() => setRoute({ name: 'shop' })}
              className="bg-white border border-[#D5C7B7] text-stone-800 px-4 py-2.5 rounded-full text-xs font-semibold hover:border-black transition-colors cursor-pointer"
            >
              Browse All Furniture
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setRoute({ name: 'blog' })}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#A25828] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to All Furniture Buying Guides &amp; Journal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
