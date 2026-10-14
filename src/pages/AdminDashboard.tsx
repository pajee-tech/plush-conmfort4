import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Category, Order, BlogPost, StoreSettings, AdminUser } from '../types';
import {
  BarChart3,
  Package,
  Layers,
  ShoppingBag,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  CheckCircle2,
  X,
  Search,
  Eye,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Palette,
  Shield,
  Users,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminAuthGate } from '../components/admin/AdminAuthGate';
import { ProductEditorModal } from '../components/admin/ProductEditorModal';
import { CategoryEditorModal } from '../components/admin/CategoryEditorModal';
import { StoreDesignStudio } from '../components/admin/StoreDesignStudio';
import { AuditLogsViewer } from '../components/admin/AuditLogsViewer';
import { UsersRolesManager } from '../components/admin/UsersRolesManager';
import { CmsDashboard } from '../components/cms/CmsDashboard';
import { WooCommerceProductImporter } from '../components/admin/WooCommerceProductImporter';
import { adminAuthService } from '../services/adminAuthService';

interface AdminDashboardContentProps {
  currentUser: AdminUser;
  onLogout: () => void;
}

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({ currentUser, onLogout }) => {
  const {
    products,
    categories,
    orders,
    blogPosts,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    updateStock,
    toggleProductPublish,
    updateCategory,
    toggleCategoryActive,
    updateOrderStatus,
    cancelOrder,
    updateSettings,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    duplicateBlogPost,
    toggleBlogPostStatus,
    exportProductsCSV,
    importProductsCSV,
    getAnalyticsMetrics,
    setRoute,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'categories' | 'sections' | 'footer' | 'design' | 'audit' | 'users' | 'orders' | 'content' | 'settings' | 'analytics'
  >(() => {
    if (currentUser.role === 'marketer') return 'content';
    if (currentUser.role === 'editor') return 'products';
    return 'overview';
  });

  // Search & Filters in Admin
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showWooImporter, setShowWooImporter] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const metrics = getAnalyticsMetrics();

  // Low stock products alert
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);

  // Handlers for CSV
  const handleDownloadCSV = () => {
    const csvData = exportProductsCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plush_comfort_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
    adminAuthService.logAudit(
      'SETTINGS_UPDATED',
      'settings',
      'Store Settings',
      `${currentUser.name} updated store delivery fees, address, or announcement banner.`
    );
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Build role-accessible tabs
  const isMaster = currentUser.role === 'master_admin';
  const isAdmin = currentUser.role === 'admin' || isMaster;
  const isEditor = currentUser.role === 'editor' || isAdmin;
  const isMarketer = currentUser.role === 'marketer' || isAdmin;

  const availableTabs = [
    ...(isAdmin ? [{ id: 'overview', label: 'Overview', icon: BarChart3 }] : []),
    ...(isEditor ? [{ id: 'products', label: 'Products & Variations', icon: Package }] : []),
    ...(isEditor || isMarketer ? [{ id: 'categories', label: 'Categories & SEO', icon: Layers }] : []),
    ...(isAdmin || isMarketer ? [{ id: 'sections', label: 'Homepage Sections', icon: SlidersHorizontal }] : []),
    ...(isAdmin || isMarketer ? [{ id: 'footer', label: 'Footer Management', icon: FileSpreadsheet }] : []),
    ...(isAdmin || isMarketer ? [{ id: 'design', label: 'Store Design & Hero', icon: Palette }] : []),
    ...(isAdmin ? [{ id: 'audit', label: 'Security & Audit Logs', icon: Shield }] : []),
    ...(isMaster ? [{ id: 'users', label: 'Staff & Roles', icon: Users }] : []),
    ...(isAdmin ? [{ id: 'orders', label: 'Orders & Fulfilment', icon: ShoppingBag }] : []),
    ...(isEditor || isMarketer ? [{ id: 'content', label: 'Content CMS & Guides', icon: FileText }] : []),
    ...(isAdmin ? [{ id: 'analytics', label: 'Analytics', icon: TrendingUp }] : []),
    ...(isAdmin ? [{ id: 'settings', label: 'Store Settings', icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#221C18] pb-24">
      {/* Top Admin Sub-Header */}
      <div className="bg-[#221C18] text-white border-b border-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#A25828] flex items-center justify-center font-serif font-bold text-base shadow-xs">
              PC
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-white leading-none">
                Plush Comfort Administration
              </h1>
              <span className="text-[11px] text-stone-400">
                Calder Road, Dewsbury WF12 9EA · Authenticated Operations Portal
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <div className="hidden sm:flex items-center gap-2 bg-stone-900/90 px-3 py-1.5 rounded-lg border border-stone-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-stone-300 font-medium">{currentUser.name}</span>
              <span className="text-stone-500 font-mono text-[10px]">({currentUser.role})</span>
            </div>
            <button
              onClick={() => setRoute({ name: 'home' })}
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              &larr; View Live Storefront
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer font-bold shadow-xs border border-red-500/50"
              title="Sign out / Logout of Plush Comfort Administration"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <div className="text-xs text-stone-400 pl-2 border-l border-stone-700 font-mono">
              Status: <span className="text-emerald-400 font-semibold">Online</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-stone-800 scrollbar-none">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? 'border-[#A25828] text-white bg-stone-900'
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#A25828]' : ''}`} />
                <span>{tab.label}</span>
                {tab.id === 'products' && lowStockProducts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ==================== 1. OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-xs">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  Total Gross Revenue
                </span>
                <span className="text-3xl font-serif font-bold text-[#221C18] mt-2 block tabular-nums">
                  £{metrics.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <span>&uarr; Direct Workshop Sales</span>
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-xs">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  Total Orders
                </span>
                <span className="text-3xl font-serif font-bold text-[#221C18] mt-2 block tabular-nums">
                  {orders.length}
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  {orders.filter((o) => o.fulfilmentStatus === 'pending').length} pending dispatch
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-xs">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  Catalogue Items
                </span>
                <span className="text-3xl font-serif font-bold text-[#221C18] mt-2 block tabular-nums">
                  {products.length}
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Across {categories.length} furniture collections
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-xs">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  Low Stock Warnings
                </span>
                <span className="text-3xl font-serif font-bold text-amber-600 mt-2 block tabular-nums">
                  {lowStockProducts.length}
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Threshold: &le; 3 units
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-3xl border border-[#E8E0D5] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF2EB] text-[#A25828] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#221C18]">Product Variations</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Manage modular configurations (1 Seater, 2 Seater, 3 Seater, 3+2, 3+3, 2+2, 3+2+1, Bed sizes) with separate pricing and inventory.
                </p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-xs font-bold text-[#A25828] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Products Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-[#E8E0D5] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF2EB] text-[#A25828] flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#221C18]">Store Design Studio</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Update Homepage Hero headings, banners, Mega Menu spotlights, and footer links without modifying code.
                </p>
                <button
                  onClick={() => setActiveTab('design')}
                  className="text-xs font-bold text-[#A25828] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Design Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-[#E8E0D5] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF2EB] text-[#A25828] flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#221C18]">Audit Trail &amp; Staff</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  View who changed what, when, and where. Export security audit logs or create authorized staff accounts.
                </p>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-xs font-bold text-[#A25828] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Security Logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. PRODUCTS TAB ==================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Toolbar */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E0D5] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search products by title, SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowWooImporter(true)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import WooCommerce CSV</span>
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setIsCreatingProduct(true)}
                  className="bg-[#A25828] hover:bg-[#8A461A] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Handcrafted Piece</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-[#E8E0D5] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-stone-700">
                  <thead className="bg-[#FAF8F5] text-stone-500 uppercase tracking-wider text-[10px] border-b border-[#E8E0D5] font-bold">
                    <tr>
                      <th className="py-3 px-4">Photo</th>
                      <th className="py-3 px-4">Name &amp; SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price (£)</th>
                      <th className="py-3 px-4">Variations</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map((p) => {
                        const cat = categories.find((c) => c.id === p.categoryId)?.name || '';
                        const isLowStock = p.stock <= p.lowStockThreshold;

                        return (
                          <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="w-14 h-14 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] p-1 overflow-hidden flex items-center justify-center">
                                <img src={p.images[0]} alt="" className="w-full h-full object-contain" />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-stone-900 block text-xs">{p.name}</span>
                              <span className="text-[11px] text-stone-400 font-mono">SKU: {p.sku}</span>
                            </td>
                            <td className="py-3 px-4 text-stone-600">{cat}</td>
                            <td className="py-3 px-4 font-bold tabular-nums">
                              £{(p.salePrice ?? p.price).toFixed(2)}
                              {p.salePrice && (
                                <span className="block text-[10px] text-stone-400 line-through">
                                  £{p.price.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-[#FAF2EB] text-[#A25828] px-2 py-0.5 rounded-full font-bold text-[10px]">
                                {p.variations?.length || 0} configurations
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={p.stock}
                                  onChange={(e) => updateStock(p.id, parseInt(e.target.value, 10) || 0)}
                                  className={`w-16 px-2 py-1 text-xs border rounded-lg font-mono font-bold ${
                                    isLowStock ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-stone-200'
                                  }`}
                                />
                                {isLowStock && (
                                  <span className="text-[10px] text-amber-600 font-bold">Low</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleProductPublish(p.id)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                  p.isPublished
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {p.isPublished ? 'Published' : 'Draft'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`/product/${p.slug}`}
                                  onClick={(e) => {
                                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                                      e.preventDefault();
                                      setRoute({ name: 'product', slug: p.slug });
                                    }
                                  }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Preview ${p.name} on live storefront`}
                                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-[#A25828] text-stone-700 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 font-semibold text-xs shadow-xs mr-1 border border-stone-200 hover:border-[#A25828]"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </a>
                                <button
                                  onClick={() => duplicateProduct(p.id)}
                                  title="Duplicate piece"
                                  className="p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingProduct(p)}
                                  title="Edit full product with images, variations & SEO"
                                  className="p-1.5 text-stone-400 hover:text-[#A25828] cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete ${p.name}?`)) {
                                      deleteProduct(p.id);
                                      adminAuthService.logAudit('PRODUCT_DELETED', 'products', p.name, `${currentUser.name} deleted product ${p.name}`);
                                    }
                                  }}
                                  title="Delete product"
                                  className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3. CATEGORIES TAB ==================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#221C18]">
                    Category &amp; Silo Management
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage collection banners, parent category nesting, rich text editorial buying guides, and SEO indexation directives.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-6 rounded-2xl border border-[#E8E0D5] bg-[#FAF8F5] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-lg text-[#221C18]">{cat.name}</h4>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {cat.isActive ? 'Active on Storefront' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Slug: <code>/category/{cat.slug}</code> · {cat.subcategories?.length || 0} subcategories
                        </p>
                      </div>

                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="px-3 py-1.5 bg-white border border-[#D5C7B7] hover:border-[#A25828] text-[#A25828] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Edit Details &amp; SEO
                      </button>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2">{cat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. HOMEPAGE SECTIONS, FOOTER & DESIGN TABS ==================== */}
        {activeTab === 'sections' && <StoreDesignStudio initialSubTab="sections" />}
        {activeTab === 'footer' && <StoreDesignStudio initialSubTab="footer" />}
        {activeTab === 'design' && <StoreDesignStudio initialSubTab="hero" />}

        {/* ==================== 5. SECURITY & AUDIT LOGS TAB ==================== */}
        {activeTab === 'audit' && <AuditLogsViewer />}

        {/* ==================== 6. STAFF & ROLES TAB ==================== */}
        {activeTab === 'users' && <UsersRolesManager />}

        {/* ==================== 7. ORDERS TAB ==================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#221C18]">Customer Orders</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage UK fulfillment, courier tracking numbers, and order timelines.
                  </p>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200 font-bold">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total (£)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">{o.orderNumber}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold block">{o.customer.fullName}</span>
                          <span className="text-[11px] text-stone-400 font-mono">{o.customer.email}</span>
                          <span className="text-[10px] text-stone-500 block">{o.customer.postcode}</span>
                        </td>
                        <td className="py-3 px-4">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="truncate max-w-xs">
                              {it.quantity}x {it.name} {it.selectedConfiguration ? `(${it.selectedConfiguration})` : ''}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span className="font-bold text-stone-900 block">£{o.total.toFixed(2)}</span>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            o.paymentMethod === 'cod'
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {o.paymentMethod === 'cod' ? 'Cash on Delivery' : o.paymentMethod?.toUpperCase() || 'PAID'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={o.fulfilmentStatus}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                            className="p-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing (Workshop)</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-stone-400 text-[11px]">UK Mainland</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 8. CONTENT CMS TAB ==================== */}
        {activeTab === 'content' && (
          <CmsDashboard
            blogPosts={blogPosts}
            products={products}
            categories={categories}
            onAddPost={addBlogPost}
            onUpdatePost={updateBlogPost}
            onDeletePost={deleteBlogPost}
            onDuplicatePost={duplicateBlogPost}
            onToggleStatus={toggleBlogPostStatus}
            onNavigateToPost={(slug) => setRoute({ name: 'blog-detail', slug })}
          />
        )}

        {/* ==================== 9. SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] space-y-6 shadow-xs animate-fade-in">
            <h3 className="font-serif font-bold text-xl text-[#221C18]">Core Store Settings</h3>
            {settingsSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl font-semibold text-xs">
                Settings saved successfully!
              </div>
            )}
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Phone Helpline</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Support Email</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Workshop Address</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <label className="block font-semibold mb-1">Free Delivery Threshold (£)</label>
                  <input
                    type="number"
                    value={settingsForm.freeDeliveryThreshold}
                    onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Standard 2-Man Fee (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settingsForm.standardDeliveryFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, standardDeliveryFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">White-Glove Assembly Fee (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settingsForm.whiteGloveDeliveryFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whiteGloveDeliveryFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#A25828] text-white px-8 py-3 rounded-full font-bold hover:bg-[#8A461A] cursor-pointer"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

        {/* ==================== 10. ANALYTICS TAB ==================== */}
        {activeTab === 'analytics' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] space-y-6 shadow-xs animate-fade-in">
            <h3 className="font-serif font-bold text-xl text-[#221C18]">First-Party Storefront Analytics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Product Views</span>
                <span className="text-2xl font-bold block mt-1">{metrics.productViews ? Object.values(metrics.productViews).reduce((a, b) => a + b, 0) : 0}</span>
              </div>
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Add to Cart</span>
                <span className="text-2xl font-bold block mt-1">{metrics.addToCartCount}</span>
              </div>
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Purchases</span>
                <span className="text-2xl font-bold block mt-1">{metrics.purchaseCount}</span>
              </div>
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Conversion Rate</span>
                <span className="text-2xl font-bold block mt-1 text-[#A25828]">{metrics.conversionRate}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Editor Modal */}
      {(editingProduct || isCreatingProduct) && (
        <ProductEditorModal
          product={editingProduct}
          isNew={isCreatingProduct}
          onClose={() => {
            setEditingProduct(null);
            setIsCreatingProduct(false);
          }}
          onSave={(savedProduct) => {
            if (isCreatingProduct) {
              addProduct(savedProduct);
              adminAuthService.logAudit(
                'PRODUCT_CREATED',
                'products',
                savedProduct.name,
                `${currentUser.name} created product ${savedProduct.name} (SKU: ${savedProduct.sku})`
              );
              setIsCreatingProduct(false);
            } else {
              updateProduct(savedProduct);
              adminAuthService.logAudit(
                'PRODUCT_UPDATED',
                'products',
                savedProduct.name,
                `${currentUser.name} updated product ${savedProduct.name} (Price: £${savedProduct.price})`
              );
              setEditingProduct(null);
            }
          }}
        />
      )}

      {/* Category Editor Modal */}
      {editingCategory && (
        <CategoryEditorModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={(savedCategory) => {
            updateCategory(savedCategory);
            adminAuthService.logAudit(
              'CATEGORY_UPDATED',
              'categories',
              savedCategory.name,
              `${currentUser.name} updated category ${savedCategory.name} SEO and content.`
            );
            setEditingCategory(null);
          }}
        />
      )}

      {/* WooCommerce Importer Modal */}
      {showWooImporter && (
        <WooCommerceProductImporter onClose={() => setShowWooImporter(false)} />
      )}
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  return (
    <AdminAuthGate>
      {({ user, onLogout }) => (
        <AdminDashboardContent currentUser={user} onLogout={onLogout} />
      )}
    </AdminAuthGate>
  );
};
