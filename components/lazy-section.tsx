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
}

export function LazySection({
  children,
  className,
  animationClass = "animate-fade-up",
  delay = 0,
  threshold = 0.1,
  rootMargin = "50px",
  id,
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
      }}
    >
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
    </div>
  );
}
