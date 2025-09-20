"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLazyLoad } from "@/hooks/use-lazy-load";

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  animationClass?: string;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  id?: string;
  fallback?: ReactNode;
  minHeight?: string;
}

export function LazySection({
  children,
  className,
  animationClass = "animate-fade-up",
  delay = 0,
  threshold = 0.1,
  rootMargin = "50px",
  id,
  fallback,
  minHeight = "200px",
}: LazySectionProps) {
  const { elementRef, isLoaded, isInView } = useLazyLoad({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div
      ref={elementRef}
      id={id}
      className={cn(
        "transition-opacity duration-1000",
        isLoaded ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        transitionDelay: isLoaded ? `${delay}ms` : "0ms",
        minHeight: isLoaded ? "auto" : minHeight,
      }}
    >
      {isLoaded ? (
        <div
          className={cn(
            "transition-all duration-1000",
            isInView && isLoaded ? animationClass : "translate-y-8 opacity-0"
          )}
          style={{
            transitionDelay: isLoaded ? `${delay}ms` : "0ms",
          }}
        >
          {children}
        </div>
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
