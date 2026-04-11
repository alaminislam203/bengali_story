import { usePopularPosts } from '../lib/hooks';
import { Eye } from 'lucide-react';

interface PopularPostsProps {
  onNavigate: (page: string, slug?: string) => void;
}

export default function PopularPosts({ onNavigate }: PopularPostsProps) {
  const { posts, loading } = usePopularPosts(5);

  if (loading) return <p>Loading popular posts...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold border-b pb-2">Popular Posts</h3>
      <div className="space-y-4">
        {posts.map((post) => (
          <div 
            key={post.id} 
            className="group cursor-pointer space-y-1"
            onClick={() => onNavigate('post', post.slug)}
          >
            <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{post.viewCount || 0} views</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
