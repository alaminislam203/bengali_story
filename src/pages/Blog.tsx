import { usePosts, useSettings, useCategories } from '../lib/hooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, calculateReadingTime, getBadgeByPoints, cn } from '../lib/utils';
import { ArrowRight, Search, Clock, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import LazyImage from '../components/LazyImage';

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

  return (
    <div className="space-y-12">
      <Helmet>
        <title>Blog | {settings?.siteName || 'গল্পগ্রাম'}</title>
        <meta name="description" content={settings?.siteDescription || 'গল্পগ্রাম - আপনার প্রিয় গল্পের ঠিকানা। একটি আধুনিক বাংলা ব্লগ প্ল্যাটফর্ম।'} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`Blog | ${settings?.siteName || 'গল্পগ্রাম'}`} />
        <meta property="og:description" content={settings?.siteDescription || 'গল্পগ্রাম - আপনার প্রিয় গল্পের ঠিকানা। একটি আধুনিক বাংলা ব্লগ প্ল্যাটফর্ম।'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={`Blog | ${settings?.siteName || 'গল্পগ্রাম'}`} />
        <meta name="twitter:description" content={settings?.siteDescription || 'গল্পগ্রাম - আপনার প্রিয় গল্পের ঠিকানা। একটি আধুনিক বাংলা ব্লগ প্ল্যাটফর্ম।'} />
      </Helmet>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{settings?.siteName || 'The Blog'}</h1>
          <p className="text-muted-foreground mt-2">{settings?.siteDescription || 'Discover stories, thinking, and expertise.'}</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10" 
            placeholder="Search posts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 mr-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" /> Filter by:
        </div>
        <Button 
          variant={selectedCategory === null ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="rounded-full"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button 
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="rounded-full"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardContent>
            </Card>
          ))
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const authorBadge = getBadgeByPoints(post.authorPoints || 0);
            return (
              <Card key={post.id} className="group overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                {post.featuredImage && (
                  <LazyImage 
                    src={post.featuredImage} 
                    alt={post.title}
                    containerClassName="aspect-video"
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                )}
                <CardHeader className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{formatDate(post.createdAt?.toDate())}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <span 
                        className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => onNavigate('author', post.authorId)}
                      >
                        {post.authorName}
                      </span>
                      <div className="flex gap-1">
                        <Badge className={cn("text-[9px] px-1 py-0 h-3.5 border-none text-white", authorBadge.color)}>
                          {authorBadge.name}
                        </Badge>
                        {post.authorBadges && post.authorBadges.length > 0 && (
                          <div className="flex gap-1">
                            {post.authorBadges.slice(0, 1).map(badge => (
                              <Badge key={badge} variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-primary/5 text-primary border-primary/10">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors cursor-pointer" onClick={() => onNavigate('post', post.slug)}>
                    {post.title}
                  </CardTitle>
                  {post.categoryId && (
                    <Badge variant="secondary" className="font-normal w-fit mt-2">
                      {categories.find(c => c.id === post.categoryId)?.name || 'Uncategorized'}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {post.excerpt}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-semibold"
                    onClick={() => onNavigate('post', post.slug)}
                  >
                    Read More <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-24 border-2 border-dashed rounded-xl">
            <h3 className="text-xl font-semibold">No posts found</h3>
            <p className="text-muted-foreground mt-2">We haven't published any posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
