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

interface HomeProps {
  onNavigate: (page: string, slug?: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { posts, loading } = usePosts({ status: 'published' });
  const { settings } = useSettings();

  const pinnedPosts = posts.filter(p => p.isPinned).slice(0, 3);
  const latestPosts = posts.filter(p => !p.isPinned).slice(0, 6);

  return (
    <div className="space-y-12">
      <Helmet>
        <title>{settings?.siteName || 'কুড়ানোগল্প.পাতা.বাংলা'} | Home</title>
        <meta name="description" content={settings?.siteDescription || 'Explore the latest insights in technology, design, and culture.'} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={settings?.siteName || 'কুড়ানোগল্প.পাতা.বাংলা'} />
        <meta property="og:description" content={settings?.siteDescription || 'Explore the latest insights in technology, design, and culture.'} />
        <meta property="og:image" content={settings?.logoUrl || "https://picsum.photos/seed/blog/1200/630"} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={settings?.siteName || 'কুড়ানোগল্প.পাতা.বাংলা'} />
        <meta name="twitter:description" content={settings?.siteDescription || 'Explore the latest insights in technology, design, and culture.'} />
        <meta name="twitter:image" content={settings?.logoUrl || "https://picsum.photos/seed/blog/1200/630"} />
      </Helmet>

      {/* Notice Board */}
      {settings?.noticeEnabled && settings?.noticeText && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Notice Board</h3>
            <p className="text-sm md:text-base text-foreground mt-1 leading-relaxed">
              {settings.noticeText}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center space-y-6">
        <AdSpace slot="adHeader" className="w-full max-w-4xl mb-8 flex justify-center" />
        <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          {settings?.siteName || 'Insights for the'} <span className="text-primary">{settings?.siteName ? '' : 'Modern Mind'}</span>
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {settings?.siteDescription || 'Explore the latest in technology, design, and culture. A minimal blog platform built for speed and clarity.'}
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => onNavigate('blog')}>Read the Blog</Button>
          <Button size="lg" variant="outline">Learn More</Button>
        </div>
      </section>

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-primary rotate-45" />
            <h2 className="text-2xl font-bold tracking-tight">Featured Stories</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedPosts.map((post) => {
              const authorBadge = getBadgeByPoints(post.authorPoints || 0);
              return (
                <Card key={post.id} className="group overflow-hidden border-primary/20 bg-primary/5 hover:shadow-lg transition-shadow">
                  {post.featuredImage && (
                    <LazyImage 
                      src={post.featuredImage} 
                      alt={post.title}
                      containerClassName="aspect-video"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Badge variant="default" className="h-4 text-[9px] px-1.5 uppercase tracking-widest">Featured</Badge>
                      <span>•</span>
                      <span 
                        className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => onNavigate('author', post.authorId)}
                      >
                        {post.authorName}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors cursor-pointer" onClick={() => onNavigate('post', post.slug)}>
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-semibold"
                      onClick={() => onNavigate('post', post.slug)}
                    >
                      Read Featured <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Latest Posts</h2>
              <Button variant="ghost" onClick={() => onNavigate('blog')}>
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
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
              ) : latestPosts.length > 0 ? (
                latestPosts.map((post) => {
                  const authorBadge = getBadgeByPoints(post.authorPoints || 0);
                  return (
                    <Card key={post.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                      {post.featuredImage && (
                        <LazyImage 
                          src={post.featuredImage} 
                          alt={post.title}
                          containerClassName="aspect-video"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <CardHeader>
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
                                <>
                                  {post.authorBadges.slice(0, 1).map(badge => (
                                    <Badge key={badge} variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-primary/5 text-primary border-primary/10">
                                      {badge}
                                    </Badge>
                                  ))}
                                  {post.authorBadges.length > 1 && (
                                    <span className="text-[9px] text-muted-foreground">+{post.authorBadges.length - 1}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{calculateReadingTime(post.content)}</span>
                          </div>
                        </div>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3 text-sm">
                          {post.excerpt}
                        </p>
                      </CardContent>
                      <CardFooter>
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
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No posts found. Check back later!
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-12">
          <PopularPosts onNavigate={onNavigate} />
          <AdSpace slot="adSidebar" className="w-full flex justify-center border rounded-lg p-4 bg-muted/30" />
          
          <Card>
            <CardContent className="pt-6">
              <NewsletterForm />
            </CardContent>
          </Card>
        </aside>
      </div>
      
      <AdSpace slot="adFooter" className="w-full flex justify-center py-8 border-t" />
    </div>
  );
}
