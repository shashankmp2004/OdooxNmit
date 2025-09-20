'use client'

import { ReactNode } from 'react'
import { useLazyAnimation } from '@/hooks/use-lazy-loading'

interface LazySectionProps {
  children: ReactNode
  className?: string
  id?: string
  animationType?: 'fade-up' | 'fade-left' | 'fade-right'
  threshold?: number
  rootMargin?: string
}

export function LazySection({
  children,
  className = '',
  id,
  animationType = 'fade-up',
  threshold = 0.1,
  rootMargin = '50px'
}: LazySectionProps) {
  const animationClass = `animate-${animationType.replace('-', '-in-')}`
  
  const { isVisible, elementRef } = useLazyAnimation(animationClass, {
    threshold,
    rootMargin,
    triggerOnce: true
  })

  return (
    <section
      ref={elementRef}
      id={id}
      className={`lazy-section ${className} ${
        isVisible ? animationClass : 'opacity-0 transform translate-y-8'
      }`}
      style={{
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
      }}
    >
      {children}
    </section>
  )
}
