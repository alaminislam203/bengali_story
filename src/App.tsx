import { useState, ReactNode, useEffect } from 'react';
import { AuthProvider } from './lib/auth-context';
import { Toaster } from '@/components/ui/sonner';
import Navbar from './components/Navbar';
import AdSpace from './components/AdSpace';
import ScrollToTop from './components/ScrollToTop';
import AntiAdBlock from './components/AntiAdBlock';
import Home from './pages/Home';
import Blog from './pages/Blog';
import PostDetail from './pages/PostDetail';
import AuthorProfile from './pages/AuthorProfile';
import AdminDashboard from './pages/AdminDashboard';
import StaticPage from './pages/StaticPage';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import Notifications from './pages/Notifications';
import { useAuth } from './lib/auth-context';
import { useSettings } from './lib/hooks';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import './lib/i18n';
import { requestNotificationPermission, onMessageListener } from './lib/notifications';
import Footer from './components/Footer';
import AISecurityGuard from './components/AISecurityGuard';
import { motion, AnimatePresence } from 'motion/react';

import { toast } from 'sonner';

function ThemeWrapper({ children }: { children: ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    // Listen for foreground messages
    const unsubscribe = onMessageListener((payload) => {
      console.log('Foreground message received:', payload);
      toast.info(payload.notification?.title || 'New Notification', {
        description: payload.notification?.body || '',
      });
    });
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Apply primary color
      if (settings.primaryColor) {
        // Convert hex to hsl for Tailwind variables if needed, 
        // but for simplicity we can just set a style property or use a library.
        // Tailwind 4 uses CSS variables.
        root.style.setProperty('--color-primary', settings.primaryColor);
        // We might need to adjust foreground colors too, but let's start with primary.
      }

      // Apply font family
      if (settings.fontFamily) {
        root.style.setProperty('--font-sans', `'${settings.fontFamily}', ui-sans-serif, system-ui, sans-serif`);
        
        // Dynamically load Google Font if not Inter
        if (settings.fontFamily !== 'Inter') {
          const fontId = 'dynamic-font';
          let link = document.getElementById(fontId) as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          const fontName = settings.fontFamily.replace(/\s+/g, '+');
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
        }
      }
    }
  }, [settings]);

  return <>{children}</>;
}

function AppContent() {
  const { loading } = useAuth();
  const { settings } = useSettings();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navigate = (page: string, slug?: string) => {
    setCurrentPage(page);
    if (page === 'author' && slug) {
      setSelectedAuthorId(slug);
    } else if (slug) {
      setSelectedPostSlug(slug);
    }
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Navbar onNavigate={navigate} currentPage={currentPage} />
      <AdSpace slot="adHeader" className="container mx-auto px-4 py-4 flex justify-center" />
      <main className="container mx-auto px-4 py-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + (selectedPostSlug || '') + (selectedAuthorId || '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {currentPage === 'home' && <Home onNavigate={navigate} />}
            {currentPage === 'blog' && <Blog onNavigate={navigate} />}
            {currentPage === 'feed' && <Feed onNavigate={navigate} />}
            {currentPage === 'notifications' && <Notifications onNavigate={navigate} />}
            {currentPage === 'post' && selectedPostSlug && (
              <PostDetail slug={selectedPostSlug} onNavigate={navigate} />
            )}
            {currentPage === 'author' && selectedAuthorId && (
              <AuthorProfile authorId={selectedAuthorId} onNavigate={navigate} />
            )}
            {currentPage === 'admin' && <AdminDashboard onNavigate={navigate} />}
            {currentPage === 'profile' && <Profile onNavigate={navigate} />}
            {currentPage === 'static' && selectedPostSlug && (
              <StaticPage slug={selectedPostSlug} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <ScrollToTop />
      <AntiAdBlock />
      <AISecurityGuard />
      <Footer onNavigate={navigate} />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeWrapper>
        <AppContent />
      </ThemeWrapper>
    </AuthProvider>
  );
}
