import { useSettings } from '../lib/hooks';
import { Button } from '@/components/ui/button';
import { Activity, Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { requestNotificationPermission } from '../lib/notifications';
import { toast } from 'sonner';

interface FooterProps {
  onNavigate: (page: string, slug?: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { settings } = useSettings();

  return (
    <footer className="relative mt-20 border-t bg-muted/30 pt-20 pb-10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <div className="space-y-6">
            <button 
              onClick={() => onNavigate('home')}
              className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            >
              {settings?.siteName || 'গল্পগ্রাম'}
            </button>
            <p className="text-muted-foreground leading-relaxed">
              {settings?.siteDescription || 'গল্পগ্রাম - আপনার প্রিয় গল্পের ঠিকানা। আমরা বিশ্বাস করি প্রতিটি গল্পের একটি নিজস্ব জগত আছে।'}
            </p>
            <div className="flex gap-4">
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-muted/20 hover:border-primary/30 hover:text-primary transition-all">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings?.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-muted/20 hover:border-primary/30 hover:text-primary transition-all">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-muted/20 hover:border-primary/30 hover:text-primary transition-all">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings?.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-muted/20 hover:border-primary/30 hover:text-primary transition-all">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <button onClick={() => onNavigate('home')} className="text-muted-foreground hover:text-primary transition-colors">Home</button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="text-muted-foreground hover:text-primary transition-colors">Latest Stories</button>
              </li>
              <li>
                <button onClick={() => onNavigate('static', 'about')} className="text-muted-foreground hover:text-primary transition-colors">About Us</button>
              </li>
              <li>
                <button onClick={() => onNavigate('static', 'contact')} className="text-muted-foreground hover:text-primary transition-colors">Contact</button>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Legal</h3>
            <ul className="space-y-4">
              <li>
                <button onClick={() => onNavigate('static', 'privacy')} className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</button>
              </li>
              <li>
                <button onClick={() => onNavigate('static', 'terms')} className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</button>
              </li>
              <li>
                <button onClick={() => onNavigate('static', 'cookies')} className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</button>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">Enable push notifications to never miss a new story.</p>
            <Button 
              variant="outline" 
              className="w-full rounded-full border-primary/20 hover:bg-primary/5 text-primary gap-2"
              onClick={async () => {
                if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
                  toast.error("Push notifications are not yet fully configured.");
                  return;
                }
                const token = await requestNotificationPermission();
                if (token) {
                  toast.success("Notifications enabled!");
                }
              }}
            >
              <Activity className="h-4 w-4" />
              Enable Notifications
            </Button>
          </div>
        </div>

        <div className="pt-10 border-t border-muted/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">
            © 2026 {settings?.siteName || 'গল্পগ্রাম'}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Built with React & Firebase</span>
            <span className="h-4 w-px bg-muted/20" />
            <span>v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
