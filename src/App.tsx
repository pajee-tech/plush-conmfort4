import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { CookieConsent } from './components/CookieConsent';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { BasketPage } from './pages/BasketPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AccountPage } from './pages/AccountPage';
import { WishlistPage } from './pages/WishlistPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { FaqPage } from './pages/FaqPage';
import { PolicyPages } from './pages/PolicyPages';
import { BlogListPage } from './pages/BlogListPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

const AppContent: React.FC = () => {
  const { currentRoute } = useStore();

  // Enforce Google noindex on administrative and private customer checkout pages
  React.useEffect(() => {
    const noIndexRoutes = ['admin', 'checkout', 'basket', 'order-confirmation', 'account'];
    const shouldNoIndex = noIndexRoutes.includes(currentRoute.name);

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }

    let metaGooglebot = document.querySelector('meta[name="googlebot"]');
    if (!metaGooglebot) {
      metaGooglebot = document.createElement('meta');
      metaGooglebot.setAttribute('name', 'googlebot');
      document.head.appendChild(metaGooglebot);
    }

    if (shouldNoIndex) {
      metaRobots.setAttribute('content', 'noindex, nofollow, noarchive');
      metaGooglebot.setAttribute('content', 'noindex, nofollow, noarchive');
    } else {
      metaRobots.setAttribute('content', 'index, follow, max-image-preview:large');
      metaGooglebot.setAttribute('content', 'index, follow, max-image-preview:large');
    }
  }, [currentRoute.name]);

  const renderCurrentView = () => {
    switch (currentRoute.name) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage />;
      case 'category':
        return (
          <CategoryPage
            categorySlug={currentRoute.categorySlug}
            subcategorySlug={currentRoute.subcategorySlug}
          />
        );
      case 'product':
        return <ProductDetailPage slug={currentRoute.slug} />;
      case 'search':
        return <SearchResultsPage query={currentRoute.query} />;
      case 'basket':
        return <BasketPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'order-confirmation':
        return <OrderConfirmationPage orderId={currentRoute.orderId} />;
      case 'account':
        return <AccountPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'delivery':
        return <DeliveryPage />;
      case 'returns':
        return <ReturnsPage />;
      case 'faqs':
        return <FaqPage />;
      case 'privacy':
        return <PolicyPages type="privacy" />;
      case 'terms':
        return <PolicyPages type="terms" />;
      case 'cookies':
        return <PolicyPages type="cookies" />;
      case 'blog':
        return <BlogListPage />;
      case 'blog-detail':
        return <BlogDetailPage slug={currentRoute.slug} />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-[#221C18] bg-[#FAF8F5]">
      <Header />
      <main className="flex-1">
        {renderCurrentView()}
      </main>
      <Footer />
      <CartDrawer />
      <SearchModal />
      <CookieConsent />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
