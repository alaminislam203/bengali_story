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
import { LayoutDashboard, LogOut, User, Menu, X, Sun, Moon, Globe, Plus } from 'lucide-react';
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 md:h-20 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden rounded-full hover:bg-primary/10" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <button 
              onClick={() => handleNavigate('home')}
              className="flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight hover:opacity-80 transition-all active:scale-95"
            >
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.siteName || 'গল্পগ্রাম'} className="h-8 md:h-10 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {settings?.siteName || 'গল্পগ্রাম'}
                </span>
              )}
            </button>
          </div>
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <button 
                key={link.name}
                onClick={() => handleNavigate(link.page, link.slug)}
                className={`text-sm font-medium transition-all hover:text-primary relative py-1 ${
                  (currentPage === link.page && (!link.slug || currentPage === 'static')) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.name}
                {(currentPage === link.page && (!link.slug || currentPage === 'static')) && (
                  <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full hover:bg-primary/10" title={i18n.language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}>
              <Globe className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-primary/10">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          
          {user && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex rounded-full border-primary/20 hover:bg-primary/5 text-primary gap-2"
              onClick={() => handleNavigate('profile')}
            >
              <Plus className="h-4 w-4" /> {t('write')}
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {user.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent className="w-64 p-2 rounded-2xl shadow-2xl border-muted/20" align="end">
                <div className="flex items-center gap-3 p-3 mb-2 bg-muted/30 rounded-xl">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || ''} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-bold text-sm">{user.displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuItem className="rounded-lg h-10 cursor-pointer" onClick={() => handleNavigate('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem className="rounded-lg h-10 cursor-pointer" onClick={() => handleNavigate('admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Console</span>
                  </DropdownMenuItem>
                )}
                <div className="h-px bg-muted my-2" />
                <DropdownMenuItem className="rounded-lg h-10 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button className="rounded-full px-6 shadow-lg shadow-primary/20" onClick={() => login('google')}>
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-16 md:top-20 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 top-16 md:top-20 z-50 w-3/4 max-w-xs bg-background border-r shadow-2xl md:hidden"
            >
              <div className="flex flex-col p-6 gap-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Menu</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full h-8 w-8">
                      <Globe className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8">
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {navLinks.map((link, i) => (
                  <motion.button 
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleNavigate(link.page, link.slug)}
                    className={`text-xl font-semibold transition-all hover:text-primary text-left py-2 flex items-center justify-between group ${
                      (currentPage === link.page && (!link.slug || currentPage === 'static')) ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {link.name}
                    <div className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
                
                {!user && (
                  <div className="mt-auto pt-6 border-t space-y-4">
                    <p className="text-sm text-muted-foreground">Join our community to share your stories.</p>
                    <Button className="w-full justify-start gap-2" onClick={() => login('google')}>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Sign in with Google
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
