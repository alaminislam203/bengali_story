import { usePosts, useSettings, useCategories } from '../lib/hooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, calculateReadingTime, getBadgeByPoints, cn } from '../lib/utils';
import { ArrowRight, Search, Clock, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Helmet } from 'react-helmet-async';
import LazyImage from '../components/LazyImage';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4
    }
  }
};

interface BlogProps {
  onNavigate: (page: string, slug?: string) => void;
}

export default function Blog({ onNavigate }: BlogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { posts, loading } = usePosts({ 
    status: 'published',
    categoryId: selectedCategory || undefined
  });
  const { categories } = useCategories();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const regularPosts = filteredPosts.slice(1);

  return (
    <div className="space-y-16 pb-20">
      <Helmet>
        <title>Blog | {settings?.siteName || 'গল্পগ্রাম'}</title>
        <meta name="description" content={settings?.siteDescription || 'গল্পগ্রাম - আপনার প্রিয় গল্পের ঠিকানা। একটি আধুনিক বাংলা ব্লগ প্ল্যাটফর্ম।'} />
      </Helmet>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              {settings?.siteName || 'The Blog'}
            </h1>
            <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
              {settings?.siteDescription || 'Discover stories, thinking, and expertise from our community.'}
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-12 h-12 rounded-full border-muted-foreground/20 focus:border-primary transition-all" 
              placeholder="Search stories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-3 items-center pb-2 overflow-x-auto no-scrollbar">
          <Button 
            variant={selectedCategory === null ? 'default' : 'secondary'} 
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="rounded-full px-6"
          >
            All Stories
          </Button>
          {categories.map((cat) => (
            <Button 
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'secondary'} 
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="rounded-full px-6"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-none bg-muted/30">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-16">
          {/* Featured Post */}
          {!selectedCategory && !searchQuery && featuredPost && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group cursor-pointer"
              onClick={() => onNavigate('post', featuredPost.slug)}
            >
              <div className="grid md:grid-cols-2 gap-8 items-center bg-muted/20 rounded-3xl overflow-hidden p-4 md:p-8 hover:bg-muted/30 transition-colors">
                <div className="aspect-[16/10] md:aspect-square lg:aspect-video rounded-2xl overflow-hidden">
                  <LazyImage 
                    src={featuredPost.featuredImage || 'https://picsum.photos/seed/featured/1200/800'} 
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20">Featured</Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(featuredPost.createdAt?.toDate())}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-lg text-muted-foreground line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-3 pt-4">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarFallback>{featuredPost.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{featuredPost.authorName}</span>
                      <span className="text-xs text-muted-foreground">{calculateReadingTime(featuredPost.content)} read</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Regular Posts Grid */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          >
            {(selectedCategory || searchQuery ? filteredPosts : regularPosts).map((post) => {
              const authorBadge = getBadgeByPoints(post.authorPoints || 0);
              return (
                <motion.div key={post.id} variants={itemVariants}>
                  <div 
                    className="group flex flex-col h-full cursor-pointer"
                    onClick={() => onNavigate('post', post.slug)}
                  >
                    <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-6 relative">
                      <LazyImage 
                        src={post.featuredImage || `https://picsum.photos/seed/${post.id}/800/500`} 
                        alt={post.title}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      {post.categoryId && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="glass-card border-none backdrop-blur-md">
                            {categories.find(c => c.id === post.categoryId)?.name || 'Story'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
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
                      
                      <div className="flex items-center gap-3 pt-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{post.authorName}</span>
                            <Badge className={cn("text-[9px] px-1.5 py-0 h-4 border-none text-white", authorBadge.color)}>
                              {authorBadge.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-32 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-2xl font-bold">No stories found</h3>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">We couldn't find any stories matching your criteria. Try adjusting your search or filters.</p>
          <Button variant="outline" className="mt-6 rounded-full" onClick={() => {setSelectedCategory(null); setSearchQuery('');}}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
