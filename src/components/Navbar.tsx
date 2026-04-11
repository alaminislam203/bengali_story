import { useAuth } from '../lib/auth-context';
import { useSettings } from '../lib/hooks';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, LogOut, User, Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  onNavigate: (page: string, slug?: string) => void;
  currentPage: string;
}

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { user, profile, isAdmin, login, logout } = useAuth();
  const { settings } = useSettings();
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const navLinks = [
    { name: t('home'), page: 'home' },
    { name: t('blog'), page: 'blog' },
    { name: t('about'), page: 'static', slug: 'about' },
    { name: t('contact'), page: 'static', slug: 'contact' },
  ];

  const handleNavigate = (page: string, slug?: string) => {
    onNavigate(page, slug);
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <button 
              onClick={() => handleNavigate('home')}
              className="flex items-center gap-2 text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.siteName || 'কুড়ানোগল্প.পাতা.বাংলা'} className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                settings?.siteName || 'কুড়ানোগল্প.পাতা.বাংলা'
              )}
            </button>
          </div>
          <div className="hidden md:flex gap-6">
            {navLinks.map((link) => (
              <button 
                key={link.name}
                onClick={() => handleNavigate(link.page, link.slug)}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  (currentPage === link.page && (!link.slug || currentPage === 'static')) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full" title={i18n.language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}>
            <Globe className="h-5 w-5" />
            <span className="sr-only">Toggle Language</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                      <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.displayName && <p className="font-medium">{user.displayName}</p>}
                    {user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuItem onClick={() => handleNavigate('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => handleNavigate('admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={login}>Sign In</Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <button 
                  key={link.name}
                  onClick={() => handleNavigate(link.page, link.slug)}
                  className={`text-lg font-medium transition-colors hover:text-primary text-left py-2 ${
                    (currentPage === link.page && (!link.slug || currentPage === 'static')) ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
