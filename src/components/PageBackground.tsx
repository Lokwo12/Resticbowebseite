import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageBackground } from '../utils/useBackgroundMedia';
import { BackgroundMediaItem } from '../utils/backgroundMediaData';

interface PageBackgroundProps {
  /** Optional canonical page key override (auto-detected from route if omitted) */
  pageKey?: string;
  /** Optional display area override (defaults to 'page') */
  sectionId?: string;
  /** Positioning mode: 'fixed' (default, pinned across long pages) or 'absolute' */
  positionMode?: 'fixed' | 'absolute';
  className?: string;
}

/**
 * Reusable Page-Level Background Media System for RESTI CBO.
 * - Displays published images, looping muted videos, or photo sequences for the active page
 * - Strictly respects admin visual controls (overlay darkness, color, gradients, blur, focal points)
 * - Keeps media at z-0 behind interactive foreground content (pointer-events-none)
 * - Resilient responsive overrides for mobile and tablet
 * - Automatically yields on homepage ('/') where ScrollingBackgroundSystem is active
 * - Elegant neutral fallback when no background is assigned
 */
export function PageBackground({
  pageKey: explicitPageKey,
  sectionId: explicitSectionId = 'page',
  positionMode = 'fixed',
  className = '',
}: PageBackgroundProps) {
  const location = useLocation();
  const { sectionMedia, hasBgMedia, activePageKey } = usePageBackground(
    explicitPageKey,
    explicitSectionId
  );

  // Auto-yield on homepage root route so ScrollingBackgroundSystem controls the scrolling sections
  if (location.pathname === '/' && !explicitPageKey) {
    return null;
  }

  const [activeSequenceIndex, setActiveSequenceIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reduced motion preference detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handler);
    return () => mediaQuery.removeEventListener?.('change', handler);
  }, []);

  // Window resize tracking for responsive overrides
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Scroll parallax tracking
  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  // Extract sequence URLs if media type is 'sequence'
  const sequenceList: string[] = useMemo(() => {
    if (!sectionMedia) return [];
    const raw =
      (sectionMedia as any).sequence_urls ||
      (sectionMedia as any).sequenceUrls ||
      (sectionMedia as any).sequenceItems;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item: any) => (typeof item === 'string' ? item : item?.url || '')).filter(Boolean);
    }
    return [];
  }, [sectionMedia]);

  // Sequence rotation timer
  useEffect(() => {
    const isSequence =
      sectionMedia?.media_type === 'sequence' || (sectionMedia as any)?.mediaType === 'sequence';
    if (!isSequence || sequenceList.length <= 1) {
      setActiveSequenceIndex(0);
      return;
    }

    const intervalSec = Math.max(3, (sectionMedia as any)?.sequenceIntervalSeconds || 7);
    const timer = setInterval(() => {
      setActiveSequenceIndex((prev) => (prev + 1) % sequenceList.length);
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [sectionMedia, sequenceList]);

  // Active media URL resolution with responsive overrides
  const activeMediaUrl = useMemo(() => {
    if (!sectionMedia) return null;
    const isSequence =
      sectionMedia.media_type === 'sequence' || (sectionMedia as any).mediaType === 'sequence';
    if (isSequence && sequenceList.length > 0) {
      const idx = activeSequenceIndex % sequenceList.length;
      return sequenceList[idx] || sectionMedia.url;
    }

    if (isMobile && sectionMedia.mobile_url) return sectionMedia.mobile_url;
    if (isTablet && sectionMedia.tablet_url) return sectionMedia.tablet_url;
    return sectionMedia.url || null;
  }, [sectionMedia, sequenceList, activeSequenceIndex, isMobile, isTablet]);

  // Manage video autoplay / pause
  useEffect(() => {
    if (!videoRef.current) return;
    if (prefersReducedMotion) {
      videoRef.current.pause();
      return;
    }

    const isVideo =
      sectionMedia?.media_type === 'video' || (sectionMedia as any)?.mediaType === 'video';
    if (isVideo && activeMediaUrl) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.debug('Autoplay hindered:', err);
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [sectionMedia, activeMediaUrl, prefersReducedMotion]);

  // Cinematic parameters
  const rawDarkness =
    (sectionMedia as any)?.overlay_darkness ?? (sectionMedia as any)?.overlayDarkness ?? 40;
  const overlayDarkness = typeof rawDarkness === 'number' ? rawDarkness / 100 : 0.4;

  const blurPixels = useMemo(() => {
    if (!sectionMedia) return 0;
    const bp = (sectionMedia as any)?.blur_percent ?? (sectionMedia as any)?.blurPercent;
    if (typeof bp === 'number') {
      return (bp / 100) * 40;
    }
    const b = (sectionMedia as any)?.blur ?? 0;
    return b <= 8 ? (b / 8) * 40 : b;
  }, [sectionMedia]);

  const objectPosition = useMemo(() => {
    if (isMobile && sectionMedia?.mobile_position) return sectionMedia.mobile_position;
    if (isTablet && sectionMedia?.tablet_position) return sectionMedia.tablet_position;
    return sectionMedia?.position || 'center';
  }, [sectionMedia, isMobile, isTablet]);

  const enableParallax =
    (sectionMedia as any)?.parallax ?? (sectionMedia as any)?.enableParallax ?? true;
  const isVideo =
    sectionMedia?.media_type === 'video' || (sectionMedia as any)?.mediaType === 'video';
  const posterUrl =
    isMobile && sectionMedia?.mobile_poster_url
      ? sectionMedia.mobile_poster_url
      : sectionMedia?.poster_url;
  const overlayColor = sectionMedia?.overlay_color || '#02130c';
  const overlayGradient = sectionMedia?.overlay_gradient || 'none';

  const parallaxOffset =
    enableParallax && !prefersReducedMotion
      ? Math.min(50, Math.max(-50, (scrollY * 0.04) % 70))
      : 0;

  const positionClass =
    positionMode === 'absolute' ? 'absolute inset-0' : 'fixed inset-0';

  // If no media is assigned, render clean subtle brand slate fallback
  if (!hasBgMedia || !activeMediaUrl) {
    return (
      <div
        aria-hidden="true"
        className={`${positionClass} w-full h-full pointer-events-none z-0 overflow-hidden bg-slate-50 transition-colors duration-700 ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${positionClass} w-full h-full pointer-events-none z-0 overflow-hidden transition-colors duration-1000 ${className}`}
      style={{ backgroundColor: '#02130c' }}
    >
      {/* Dynamic media layer with blur and subtle parallax scale */}
      <div
        className="absolute inset-0 w-full h-full transition-all duration-1000 ease-out"
        style={{
          transform: `translate3d(0, ${parallaxOffset}px, 0) scale(${enableParallax ? 1.05 : 1})`,
          filter: blurPixels > 0 ? `blur(${blurPixels}px)` : undefined,
        }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            key={activeMediaUrl}
            src={activeMediaUrl}
            poster={posterUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-opacity duration-1000"
            style={{ objectPosition }}
          />
        ) : (
          <img
            key={activeMediaUrl}
            src={activeMediaUrl}
            alt={sectionMedia?.alt_text || sectionMedia?.title || 'RESTI Background'}
            className="w-full h-full object-cover transition-opacity duration-1000"
            style={{ objectPosition }}
            loading="eager"
          />
        )}
      </div>

      {/* Readability Overlay 1: Solid Color Darkness */}
      {overlayDarkness > 0 && (
        <div
          className="absolute inset-0 w-full h-full transition-opacity duration-700"
          style={{
            backgroundColor:
              overlayColor === 'emerald'
                ? '#022c22'
                : overlayColor === 'navy'
                ? '#0f172a'
                : overlayColor === 'charcoal'
                ? '#18181b'
                : '#000000',
            opacity: overlayDarkness,
          }}
        />
      )}

      {/* Readability Overlay 2: Directional Gradients */}
      {overlayGradient === 'to-b' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      )}
      {overlayGradient === 'to-t' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      )}
      {overlayGradient === 'radial' && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.65)_100%)]" />
      )}
      {overlayGradient === 'vignette' && (
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
      )}

      {/* Top navbar readability protection gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
    </div>
  );
}
export default PageBackground;
