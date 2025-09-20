'use client'

import { useEffect, useRef, useState } from 'react'

interface UseLazyLoadingOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useLazyLoading(options: UseLazyLoadingOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // If already triggered and triggerOnce is true, don't observe again
    if (triggerOnce && hasTriggered) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting
        
        if (isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasTriggered(true)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce, hasTriggered])

  return { isVisible, elementRef }
}

// Hook for lazy loading with animation classes
export function useLazyAnimation(
  animationClass: string = 'animate-fade-in-up',
  options: UseLazyLoadingOptions = {}
) {
  const { isVisible, elementRef } = useLazyLoading(options)
  
  const animatedRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const element = animatedRef.current
    if (!element) return
    
    if (isVisible) {
      element.classList.add(animationClass)
    }
  }, [isVisible, animationClass])
  
  return { 
    isVisible, 
    elementRef, 
    animatedRef,
    className: isVisible ? animationClass : 'opacity-0 transform translate-y-8'
  }
}