import { usePosts, useSettings } from '../lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, calculateReadingTime, getBadgeByPoints, cn } from '../lib/utils';
import { ArrowRight, Clock, Megaphone, Pin } from 'lucide-react';
import PopularPosts from '../components/PopularPosts';
import AdSpace from '../components/AdSpace';
import { Helmet } from 'react-helmet-async';
import NewsletterForm from '../components/NewsletterForm';
import { Badge } from '@/components/ui/badge';
import LazyImage from '../components/LazyImage';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

interface HomeProps {
  onNavigate: (page: string, slug?: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { posts, loading } = usePosts({ status: 'published' });
  const { settings } = useSettings();

  const pinnedPosts = posts.filter(p => p.isPinned).slice(0, 3);
  const latestPosts = posts.filter(p => !p.isPinned).slice(0, 6);

  return (
    <div className="space-y-24 pb-20">
      <Helmet>
        <title>{settings?.siteName || 'গল্পগ্রাম'} | Home</title>
        <meta name="description" content={settings?.siteDescription || 'গল্পগ্রাম - আপনার প্রিয় গল্পের ঠিকানা। একটি আধুনিক বাংলা ব্লগ প্ল্যাটফর্ম।'} />
      </Helmet>

      {/* Notice Board */}
      {settings?.noticeEnabled && settings?.noticeText && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="bg-primary/10 p-2 rounded-full shrink-0">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground/80 leading-relaxed">
            {settings.noticeText}
          </p>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 md:py-40 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>
        
        <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 max-w-4xl"
          >
            <Badge variant="outline" className="px-6 py-1.5 border-primary/20 text-primary bg-primary/5 rounded-full text-sm font-medium">
              ✨ আপনার প্রিয় গল্পের ঠিকানা
            </Badge>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[1.1] bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              {settings?.siteName || 'গল্পগ্রাম'}
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-2xl text-muted-foreground leading-relaxed">
              {settings?.siteDescription || 'গল্পগ্রাম - একটি আধুনিক বাংলা ব্লগ প্ল্যাটফর্ম। যেখানে প্রতিটি শব্দের মাঝে লুকিয়ে থাকে একটি নতুন গল্প।'}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95" onClick={() => onNavigate('blog')}>
              গল্পগুলো পড়ুন <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full border-muted-foreground/20 hover:bg-primary/5 transition-all active:scale-95" onClick={() => onNavigate('static', 'about')}>
              আমাদের সম্পর্কে
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pinned Posts - Featured Section */}
      {pinnedPosts.length > 0 && (
        <section className="space-y-12">
          <div className="flex flex-col items-center text-center gap-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Featured Stories</h2>
            <div className="h-1.5 w-20 bg-primary rounded-full" />
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {pinnedPosts.map((post) => (
              <motion.div key={post.id} variants={itemVariants}>
                <div 
                  className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-2xl shadow-primary/5"
                  onClick={() => onNavigate('post', post.slug)}
                >
                  <LazyImage 
                    src={post.featuredImage || `https://picsum.photos/seed/${post.id}/800/1000`} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
                    <div className="space-y-4">
                      <Badge className="bg-white/20 backdrop-blur-md border-none text-white hover:bg-white/30">Featured</Badge>
                      <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <span>{post.authorName}</span>
                        <span>•</span>
                        <span>{calculateReadingTime(post.content)} read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-16">
          <section className="space-y-10">
            <div className="flex items-center justify-between border-b pb-6">
              <h2 className="text-3xl font-bold tracking-tight">Latest Stories</h2>
              <Button variant="ghost" className="rounded-full hover:bg-primary/5" onClick={() => onNavigate('blog')}>
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="grid gap-10 sm:grid-cols-2"
            >
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-64 w-full rounded-3xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : latestPosts.length > 0 ? (
                latestPosts.map((post) => {
                  const authorBadge = getBadgeByPoints(post.authorPoints || 0);
                  return (
                    <motion.div key={post.id} variants={itemVariants}>
                      <div 
                        className="group space-y-6 cursor-pointer"
                        onClick={() => onNavigate('post', post.slug)}
                      >
                        <div className="aspect-[16/10] rounded-3xl overflow-hidden relative shadow-xl shadow-primary/5">
                          <LazyImage 
                            src={post.featuredImage || `https://picsum.photos/seed/${post.id}/800/500`} 
                            alt={post.title}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                            <span>{formatDate(post.createdAt?.toDate())}</span>
                            <span>•</span>
                            <span>{calculateReadingTime(post.content)} read</span>
                          </div>
                          <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            <span className="font-bold text-sm">{post.authorName}</span>
                            <Badge className={cn("text-[9px] px-1.5 py-0 h-4 border-none text-white", authorBadge.color)}>
                              {authorBadge.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
                  <p className="text-muted-foreground">No stories found. Check back later!</p>
                </div>
              )}
            </motion.div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-16">
          <PopularPosts onNavigate={onNavigate} />
          
          <div className="sticky top-24 space-y-16">
            <AdSpace slot="adSidebar" className="w-full flex justify-center border rounded-3xl p-6 bg-muted/20" />
            
            <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
              <NewsletterForm />
            </div>
          </div>
        </aside>
      </div>
      
      <AdSpace slot="adFooter" className="w-full flex justify-center py-12 border-t" />
    </div>
  );
}
