import React from 'react';
import Image from 'next/image';
import { useLazyLoad } from '@/hooks/use-lazy-load';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  ...props
}: LazyImageProps) {
  const { elementRef, isLoaded } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
  });

  if (priority) {
    // If priority is true, load immediately without lazy loading
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        fill={fill}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        {...props}
      />
    );
  }

  return (
    <div ref={elementRef} className={className}>
      {isLoaded ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover"
          fill={fill}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          {...props}
        />
      ) : (
        <div 
          className="animate-pulse bg-gray-200 w-full h-full flex items-center justify-center"
          style={{ 
            width: width ? `${width}px` : '100%', 
            height: height ? `${height}px` : '100%' 
          }}
        >
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
}