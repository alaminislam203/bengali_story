import { useState, ReactNode, useEffect } from 'react';
import { AuthProvider } from './lib/auth-context';
import { Toaster } from '@/components/ui/sonner';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import AntiAdBlock from './components/AntiAdBlock';
import Home from './pages/Home';
import Blog from './pages/Blog';
import PostDetail from './pages/PostDetail';
import AuthorProfile from './pages/AuthorProfile';
import AdminDashboard from './pages/AdminDashboard';
import StaticPage from './pages/StaticPage';
import Profile from './pages/Profile';
import { useAuth } from './lib/auth-context';
import { useSettings } from './lib/hooks';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import './lib/i18n';
import { requestNotificationPermission, onMessageListener } from './lib/notifications';

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
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'home' && <Home onNavigate={navigate} />}
        {currentPage === 'blog' && <Blog onNavigate={navigate} />}
        {currentPage === 'post' && selectedPostSlug && (
          <PostDetail slug={selectedPostSlug} onNavigate={navigate} />
        )}
        {currentPage === 'author' && selectedAuthorId && (
          <AuthorProfile authorId={selectedAuthorId} onNavigate={navigate} />
        )}
        {currentPage === 'admin' && <AdminDashboard onNavigate={navigate} />}
        {currentPage === 'profile' && <Profile />}
        {currentPage === 'static' && selectedPostSlug && (
          <StaticPage slug={selectedPostSlug} />
        )}
      </main>
      <ScrollToTop />
      <AntiAdBlock />
      <footer className="border-t py-12 mt-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-primary mb-2">{settings?.siteName || 'কুড়ানোগল্প.পাতা.বাংলা'}</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {settings?.siteDescription || 'A minimal blog platform built for speed and clarity.'}
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex gap-4 items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs gap-2"
                  onClick={async () => {
                    if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
                      toast.error("Push notifications are not yet fully configured. VAPID key is missing.");
                      return;
                    }
                    const token = await requestNotificationPermission();
                    if (token) {
                      toast.success("Notifications enabled successfully!");
                    } else {
                      toast.error("Failed to enable notifications. Please check your browser permissions.");
                    }
                  }}
                >
                  <Activity className="h-3 w-3" />
                  Enable Notifications
                </Button>
                {settings?.facebookUrl && (
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {settings?.twitterUrl && (
                  <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {settings?.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {settings?.youtubeUrl && (
                  <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  </a>
                )}
              </div>
              <p className="text-xs">© 2026 {settings?.siteName || 'কুড়ানোগল্প.পাতা.বাংলা'}. Built with React & Firebase.</p>
            </div>
          </div>
        </div>
      </footer>
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
