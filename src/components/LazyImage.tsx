import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/src/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export default function LazyImage({ 
  src, 
  alt, 
  className, 
  containerClassName,
  ...props 
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          {...props}
        />
      ) : !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs">
          Failed to load image
        </div>
      )}
    </div>
  );
}
