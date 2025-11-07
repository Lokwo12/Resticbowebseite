import { useEffect, useRef, useState } from 'react';

// Hook for scroll-triggered animations
export function useScrollAnimation(options?: { startVisible?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(options?.startVisible ?? false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    const currentRef = ref.current;
    
    if (currentRef) {
      // Check if element is already visible on mount
      const rect = currentRef.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isInViewport) {
        // Element already visible, show immediately
        console.log('🎬 Element already in viewport, showing immediately');
        setIsVisible(true);
      } else {
        // Element not visible, observe it
        console.log('🎬 Element not in viewport, will animate on scroll');
        observer.observe(currentRef);
      }
      
      // SAFETY: Force show after 2 seconds if IntersectionObserver fails
      const fallbackTimer = setTimeout(() => {
        console.log('⏰ Animation fallback triggered - forcing visible');
        setIsVisible(true);
      }, 2000);
      
      return () => {
        clearTimeout(fallbackTimer);
        observer.unobserve(currentRef);
      };
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return { ref, isVisible };
}

// Stagger children animations
export function getStaggerDelay(index: number, baseDelay: number = 100): string {
  return `${index * baseDelay}ms`;
}
