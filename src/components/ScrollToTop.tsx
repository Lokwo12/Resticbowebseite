import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      
      const scrollToElement = () => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      };

      // Execute scroll at multiple intervals to correct for asynchronous layout shifts
      const timeouts = [50, 150, 400, 800, 1500].map(delay => 
        setTimeout(scrollToElement, delay)
      );

      return () => {
        timeouts.forEach(clearTimeout);
      };
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
