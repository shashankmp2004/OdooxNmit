import React from 'react';
import { useLazyLoad } from '@/hooks/use-lazy-load';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  minHeight?: string;
}

export function LazySection({
  children,
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  minHeight = '200px',
}: LazySectionProps) {
  const { elementRef, isLoaded, isInView } = useLazyLoad({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={elementRef} className={className} style={{ minHeight: isLoaded ? 'auto' : minHeight }}>
      {isLoaded ? (
        children
      ) : (
        fallback || (
          <div 
            className="flex items-center justify-center" 
            style={{ minHeight }}
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        )
      )}
    </div>
  );
}