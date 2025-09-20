"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLazyLoad } from "@/hooks/use-lazy-load";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  blurDataURL?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder = "/placeholder.svg",
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  blurDataURL,
}: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { elementRef, isLoaded } = useLazyLoad({
    threshold: 0.1,
    rootMargin: "100px",
    triggerOnce: true,
  });

  // If priority is true, load immediately without lazy loading
  if (priority) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        fill={fill}
        priority={priority}
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        sizes={sizes}
        quality={quality}
      />
    );
  }

  const shouldLoad = isLoaded;

  return (
    <div
      ref={elementRef}
      className={cn(
        "relative overflow-hidden",
        fill ? "w-full h-full" : "",
        className
      )}
      style={!fill ? { width, height } : undefined}
    >
      {/* Placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}

      {/* Main Image */}
      {shouldLoad && (
        <Image
          src={imageError ? placeholder : src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes}
          quality={quality}
          className={cn(
            "transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
      )}
    </div>
  );
}
