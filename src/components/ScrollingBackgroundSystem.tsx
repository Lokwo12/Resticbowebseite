import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  BackgroundMediaItem,
  BackgroundSectionId,
  SECTION_METADATA,
  loadPublicBackgroundMedia,
  normalizeBackgroundMedia
} from '../utils/backgroundMediaData';
import { supabase } from '../utils/supabase/client';

interface ScrollingBackgroundSystemProps {
  /** Optional active section override */
  activeSectionId?: BackgroundSectionId;
  /** Section IDs to observe (defaults to standard core homepage sections) */
  sectionIds?: BackgroundSectionId[];
}

const DEFAULT_SECTIONS: BackgroundSectionId[] = [
  'hero',
  'about',
  'programs',
  'impact',
  'gallery',
  'partners',
  'donate',
  'contact'
];

/**
 * High-performance, cinematic background scrolling system.
 * - Uses IntersectionObserver to detect which homepage section is predominantly in view.
 * - Dynamically loads admin-managed media items from Supabase (Edge function & direct table fallback).
 * - Smoothly crossfades between background media with configurable overlay darkness & blur.
 * - Plays looped video when visible; automatically pauses offscreen or when reduced motion is requested.
 * - Falls back to a clean, elegant neutral brand gradient when a section has no assigned media.
 * - Positioned with pointer-events-none and z-index behind interactive content.
 */
export function ScrollingBackgroundSystem({
  activeSectionId: controlledSectionId,
  sectionIds = DEFAULT_SECTIONS
}: ScrollingBackgroundSystemProps) {
  const [mediaItems, setMediaItems] = useState<BackgroundMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectedSectionId, setDetectedSectionId] = useState<BackgroundSectionId>('hero');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Determine current active section (controlled or auto-detected)
  const currentSectionId: BackgroundSectionId = controlledSectionId || detectedSectionId;

  // Detect user preference for reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handler);
    return () => mediaQuery.removeEventListener?.('change', handler);
  }, []);

  // Subtle parallax scroll tracking
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

  // Load public media from Supabase / Edge function
  const refreshMedia = useCallback(async () => {
    try {
      const items = await loadPublicBackgroundMedia();
      setMediaItems(items);
    } catch (err) {
      console.warn('Failed to load background media:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMedia();

    // Subscribe to realtime updates on kv_store_2a4be611 for instant hot-reload
    try {
      const channel = supabase
        .channel('public_bg_media_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kv_store_2a4be611'
          },
          (payload: any) => {
            const key = payload?.new?.key || payload?.old?.key;
            if (typeof key === 'string' && key.startsWith('bg_media:')) {
              refreshMedia();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription skipped:', err);
    }
  }, [refreshMedia]);

  // Observe homepage sections using IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined' || controlledSectionId) return;

    // Track intersection ratio for each target section
    const visibleRatios: Record<string, number> = {};

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        visibleRatios[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });

      // Find section with highest visible ratio
      let bestId: string = 'hero';
      let bestRatio = 0;

      Object.entries(visibleRatios).forEach(([id, ratio]) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });

      if (bestRatio > 0.15) {
        const mappedId: BackgroundSectionId =
          bestId === 'home' ? 'hero' :
          bestId === 'stories' ? 'impact' :
          (bestId as BackgroundSectionId);
        setDetectedSectionId(mappedId);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-10% 0px -25% 0px',
      threshold: [0.1, 0.25, 0.5, 0.75, 0.9]
    });
    observerRef.current = observer;

    // Attach to section DOM elements (mapping canonical keys to DOM IDs if needed)
    sectionIds.forEach((id) => {
      const domId = id === 'hero' ? 'home' : id === 'impact' ? 'stories' : id;
      const el = document.getElementById(domId) || document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, controlledSectionId]);

  // Find media item assigned to current section or fallback to 'global'
  const currentMedia = useMemo(() => {
    // 1. Homepage section specific match
    const matching = mediaItems.filter((m: any) => {
      const isPub = m.is_published ?? m.isPublished ?? m.published ?? true;
      if (!isPub) return false;
      const itemPage = m.page || 'home';
      const itemSection = m.section || m.sectionId;
      return (itemPage === 'home' || !m.page) && itemSection === currentSectionId;
    });

    if (matching.length > 0) {
      matching.sort((a: any, b: any) => {
        const orderA = a.display_order ?? a.orderIndex ?? a.order ?? 1;
        const orderB = b.display_order ?? b.orderIndex ?? b.order ?? 1;
        return orderA - orderB;
      });
      return matching[0];
    }

    // 2. Full homepage ambient background fallback (if configured)
    const homeAmbientMatching = mediaItems.filter((m: any) => {
      const isPub = m.is_published ?? m.isPublished ?? m.published ?? true;
      if (!isPub) return false;
      const itemPage = m.page || 'home';
      const itemSection = m.section || m.sectionId;
      return itemPage === 'home' && (itemSection === 'page' || itemSection === 'all');
    });
    if (homeAmbientMatching.length > 0) {
      return homeAmbientMatching[0];
    }

    // 3. Site-wide global ambient background fallback
    const globalMatching = mediaItems.filter((m: any) => {
      const isPub = m.is_published ?? m.isPublished ?? m.published ?? true;
      if (!isPub) return false;
      const itemPage = m.page;
      const itemSection = m.section || m.sectionId;
      return (itemPage === 'global' || itemSection === 'global') && isPub;
    });
    if (globalMatching.length > 0) {
      return globalMatching[0];
    }

    return null;
  }, [mediaItems, currentSectionId]);

  // Extract sequence items / URLs uniformly
  const sequenceList: string[] = useMemo(() => {
    if (!currentMedia) return [];
    const rawSeq = (currentMedia as any).sequence_urls || (currentMedia as any).sequenceItems || (currentMedia as any).sequenceUrls;
    if (Array.isArray(rawSeq) && rawSeq.length > 0) {
      return rawSeq.map((entry: any) => (typeof entry === 'string' ? entry : entry?.url || '')).filter(Boolean);
    }
    return [];
  }, [currentMedia]);

  // Sequence crossfade timer (if mediaType is 'sequence' and has multiple items)
  useEffect(() => {
    const isSequence = (currentMedia as any)?.media_type === 'sequence' || (currentMedia as any)?.mediaType === 'sequence';
    if (!isSequence || sequenceList.length <= 1) {
      setActiveMediaIndex(0);
      return;
    }

    const intervalSeconds = Math.max(3, (currentMedia as any)?.sequenceIntervalSeconds || 7);
    const timer = setInterval(() => {
      setActiveMediaIndex((prev) => (prev + 1) % sequenceList.length);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [currentMedia, sequenceList]);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Track responsive screen width
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Manage video playback (pause when off-screen or reduced motion)
  useEffect(() => {
    if (!videoRef.current) return;
    if (prefersReducedMotion) {
      videoRef.current.pause();
      return;
    }

    const isVideo = (currentMedia as any)?.media_type === 'video' || (currentMedia as any)?.mediaType === 'video';
    if (isVideo) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay policy: muted videos typically succeed, catch safely if blocked
          console.debug('Autoplay hindered:', err);
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [currentMedia, prefersReducedMotion]);

  // Compute active media URL with responsive device-specific overrides
  const activeMediaUrl = useMemo(() => {
    if (!currentMedia) return null;
    const isSequence = (currentMedia as any).media_type === 'sequence' || (currentMedia as any).mediaType === 'sequence';
    if (isSequence && sequenceList.length > 0) {
      const idx = activeMediaIndex % sequenceList.length;
      return sequenceList[idx] || (currentMedia as any).url || (currentMedia as any).mediaUrl;
    }

    // Check device-specific overrides (mobile_url, tablet_url)
    if (isMobile && (currentMedia as any).mobile_url) {
      return (currentMedia as any).mobile_url;
    }
    if (isTablet && (currentMedia as any).tablet_url) {
      return (currentMedia as any).tablet_url;
    }

    return (currentMedia as any).url || (currentMedia as any).mediaUrl || null;
  }, [currentMedia, sequenceList, activeMediaIndex, isMobile, isTablet]);

  // Current styling parameters supporting both snake_case and camelCase
  const rawDarkness = (currentMedia as any)?.overlay_darkness ?? (currentMedia as any)?.overlayDarkness ?? 45;
  const overlayDarkness = typeof rawDarkness === 'number' ? rawDarkness / 100 : 0.45;
  
  // Calculate blur radius in pixels (100% = 40px)
  const blurPixels = useMemo(() => {
    if (!currentMedia) return 0;
    const bp = (currentMedia as any)?.blur_percent ?? (currentMedia as any)?.blurPercent;
    if (typeof bp === 'number') {
      return (bp / 100) * 40;
    }
    const b = (currentMedia as any)?.blur ?? (currentMedia as any)?.blurAmount ?? 0;
    // Legacy pixel values <= 8px were on the old scale where 8px was max blur
    return b <= 8 ? (b / 8) * 40 : b;
  }, [currentMedia]);

  const focalX = (currentMedia as any)?.focalPointX ?? 50;
  const focalY = (currentMedia as any)?.focalPointY ?? 50;

  // Responsive position overrides
  const objectPosition = useMemo(() => {
    if (isMobile && (currentMedia as any)?.mobile_position) {
      return (currentMedia as any).mobile_position;
    }
    if (isTablet && (currentMedia as any)?.tablet_position) {
      return (currentMedia as any).tablet_position;
    }
    return (currentMedia as any)?.position || (currentMedia as any)?.objectPosition || 'center';
  }, [currentMedia, isMobile, isTablet]);

  const enableParallax = (currentMedia as any)?.parallax ?? (currentMedia as any)?.enableParallax ?? true;
  const isVideo = (currentMedia as any)?.media_type === 'video' || (currentMedia as any)?.mediaType === 'video';
  const posterUrl = (isMobile && (currentMedia as any)?.mobile_poster_url)
    ? (currentMedia as any).mobile_poster_url
    : (currentMedia as any)?.poster_url || (currentMedia as any)?.posterUrl;
  const overlayColor = (currentMedia as any)?.overlay_color || (currentMedia as any)?.overlayColor || '#02130c';
  const overlayGradient = (currentMedia as any)?.overlay_gradient || 'none';

  // Parallax subtle translateY calculation
  const parallaxOffset = (enableParallax && !prefersReducedMotion)
    ? Math.min(60, Math.max(-60, (scrollY * 0.05) % 80))
    : 0;

  // If no media is assigned to this section, render clean subtle neutral background
  const hasCustomMedia = !!currentMedia && !!activeMediaUrl;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden transition-colors duration-1000"
      style={{
        backgroundColor: hasCustomMedia ? '#031b11' : '#f8fafc' // Deep emerald slate for media, light clean slate for fallback
      }}
    >
      {/* Dynamic media layer */}
      {hasCustomMedia && (
        <div
          className="absolute inset-0 w-full h-full transition-all duration-1000 ease-out"
          style={{
            transform: `translate3d(0, ${parallaxOffset}px, 0) scale(${enableParallax ? 1.05 : 1})`,
            filter: blurPixels > 0 ? `blur(${blurPixels}px)` : undefined
          }}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              key={activeMediaUrl}
              src={activeMediaUrl!}
              poster={posterUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover transition-opacity duration-1000"
              style={{
                objectPosition: objectPosition === 'custom' ? `${focalX}% ${focalY}%` : objectPosition
              }}
            />
          ) : (
            <div
              key={activeMediaUrl}
              className="w-full h-full bg-cover bg-no-repeat transition-all duration-1000 ease-in-out"
              style={{
                backgroundImage: `url("${activeMediaUrl}")`,
                backgroundPosition: objectPosition === 'custom' ? `${focalX}% ${focalY}%` : objectPosition
              }}
            />
          )}
        </div>
      )}

      {/* Neutral ambient brand gradients when no custom media is assigned */}
      {!hasCustomMedia && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 opacity-100 transition-opacity duration-1000" />
      )}

      {/* Overlays & Cinematic Tuning — ONLY active when custom media is present */}
      {hasCustomMedia && (
        <>
          {/* Configurable Darkness / Color Overlay */}
          <div
            className="absolute inset-0 w-full h-full transition-all duration-700 pointer-events-none"
            style={{
              backgroundColor: overlayColor,
              opacity: overlayDarkness
            }}
          />

          {/* Optional Gradient Overlay for text contrast */}
          {overlayGradient === 'to-b' && (
            <div className="absolute inset-0 w-full h-full pointer-events-none bg-gradient-to-b from-black/80 via-black/40 to-black/80 opacity-90" />
          )}
          {overlayGradient === 'to-t' && (
            <div className="absolute inset-0 w-full h-full pointer-events-none bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-90" />
          )}
          {overlayGradient === 'radial' && (
            <div className="absolute inset-0 w-full h-full pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.85)_100%)]" />
          )}

          {/* Vignette & cinematic contrast gradient */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none opacity-35 mix-blend-multiply bg-[radial-gradient(ellipse_at_center,_transparent_0%,_black_100%)]"
          />
        </>
      )}
    </div>
  );
}
