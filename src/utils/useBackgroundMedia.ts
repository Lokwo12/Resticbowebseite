import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BackgroundMediaItem,
  BackgroundSectionId,
  loadPublicBackgroundMedia,
  normalizeRouteToPageKey,
} from './backgroundMediaData';
import { supabase } from './supabase/client';

// Shared in-memory cache and subscriber listeners for zero-duplicate queries
let cachedMediaItems: BackgroundMediaItem[] = [];
let isInitialFetchDone = false;
let isFetching = false;
const listeners = new Set<(items: BackgroundMediaItem[]) => void>();

function notifyListeners(items: BackgroundMediaItem[]) {
  cachedMediaItems = items;
  listeners.forEach((listener) => listener(items));
}

let realtimeSubscribed = false;

function ensureRealtimeSubscription() {
  if (realtimeSubscribed || typeof window === 'undefined') return;
  realtimeSubscribed = true;

  try {
    supabase
      .channel('shared_public_bg_media_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv_store_2a4be611',
        },
        async (payload: any) => {
          const key = payload?.new?.key || payload?.old?.key;
          if (typeof key === 'string' && key.startsWith('bg_media:')) {
            try {
              const fresh = await loadPublicBackgroundMedia();
              notifyListeners(fresh);
            } catch (err) {
              console.warn('Realtime background media refresh failed:', err);
            }
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Realtime subscription skipped:', err);
  }
}

async function triggerFetch() {
  if (isFetching) return;
  isFetching = true;
  try {
    const items = await loadPublicBackgroundMedia();
    isInitialFetchDone = true;
    notifyListeners(items);
  } catch (err) {
    console.warn('Failed to load background media store:', err);
  } finally {
    isFetching = false;
  }
}

/**
 * Universal hook for consuming background media across the website.
 * - Route-aware: Resolves media using active URL route and canonical page key
 * - Section-aware: Resolves media using display area (e.g. 'page', 'hero', 'programs', etc.)
 * - Strict Precedence:
 *   1. Exact (pageKey + sectionId)
 *   2. Full Page (pageKey + 'page')
 *   3. Parent Page (e.g. 'programs' for program pillar pages)
 *   4. Legacy Homepage Section match (sectionId on 'home')
 *   5. Site-wide Global Ambient Fallback ('global')
 *   6. Clean Brand Fallback (hasBgMedia = false)
 * - Real-time: Subscribes to Supabase Realtime for hot reload without refresh
 */
export function useBackgroundMedia(
  targetSectionId?: BackgroundSectionId | string,
  targetPageKey?: string
) {
  const [mediaItems, setMediaItems] = useState<BackgroundMediaItem[]>(cachedMediaItems);
  const [loading, setLoading] = useState<boolean>(!isInitialFetchDone);

  // Safe route resolution
  let locationPathname = '/';
  try {
    const loc = useLocation();
    locationPathname = loc.pathname;
  } catch {
    if (typeof window !== 'undefined') {
      locationPathname = window.location.pathname;
    }
  }

  const activePageKey = useMemo(() => {
    if (targetPageKey) return targetPageKey;
    const { pageKey } = normalizeRouteToPageKey(locationPathname);
    return pageKey;
  }, [targetPageKey, locationPathname]);

  useEffect(() => {
    ensureRealtimeSubscription();

    const handleUpdate = (items: BackgroundMediaItem[]) => {
      setMediaItems(items);
      setLoading(false);
    };

    listeners.add(handleUpdate);

    if (!isInitialFetchDone) {
      triggerFetch();
    } else {
      setLoading(false);
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await triggerFetch();
    setLoading(false);
  }, []);

  // Global ambient background fallback
  const globalMedia = useMemo(() => {
    const match = mediaItems.find(
      (m: any) =>
        (m.page === 'global' || m.section === 'global' || m.sectionId === 'global') &&
        (m.is_published ?? m.published ?? true)
    );
    return match || null;
  }, [mediaItems]);

  // Hierarchical precedence resolver
  const { sectionMedia, isGlobalFallback, isPageLevel, hasBgMedia } = useMemo(() => {
    const secId = targetSectionId || 'page';

    // 1. Exact match on target page + target section
    const exactMatch = mediaItems.find((m: any) => {
      const isPub = m.is_published ?? m.published ?? true;
      if (!isPub) return false;
      const itemPage = m.page || 'home';
      const itemSec = m.section || m.sectionId || 'page';
      return itemPage === activePageKey && itemSec === secId;
    });

    if (exactMatch) {
      const hasUrl = Boolean(exactMatch.url || (exactMatch.sequence_urls && exactMatch.sequence_urls.length > 0));
      return {
        sectionMedia: exactMatch,
        isGlobalFallback: false,
        isPageLevel: secId === 'page' || secId === 'all',
        hasBgMedia: hasUrl,
      };
    }

    // 2. Full-page background on target page (when requesting a specific section that has no dedicated media)
    if (secId !== 'page' && secId !== 'all') {
      const pageMatch = mediaItems.find((m: any) => {
        const isPub = m.is_published ?? m.published ?? true;
        if (!isPub) return false;
        const itemPage = m.page || 'home';
        const itemSec = m.section || m.sectionId || 'page';
        return itemPage === activePageKey && (itemSec === 'page' || itemSec === 'all');
      });

      if (pageMatch) {
        const hasUrl = Boolean(pageMatch.url || (pageMatch.sequence_urls && pageMatch.sequence_urls.length > 0));
        return {
          sectionMedia: pageMatch,
          isGlobalFallback: false,
          isPageLevel: true,
          hasBgMedia: hasUrl,
        };
      }
    }

    // 3. Parent page fallback for program pillars (e.g. /programs/livelihoods -> /programs)
    if (activePageKey.startsWith('program-') && activePageKey !== 'programs') {
      const parentMatch = mediaItems.find((m: any) => {
        const isPub = m.is_published ?? m.published ?? true;
        if (!isPub) return false;
        return m.page === 'programs' && (m.section === 'page' || m.section === 'all' || m.section === secId);
      });

      if (parentMatch) {
        const hasUrl = Boolean(parentMatch.url || (parentMatch.sequence_urls && parentMatch.sequence_urls.length > 0));
        return {
          sectionMedia: parentMatch,
          isGlobalFallback: false,
          isPageLevel: true,
          hasBgMedia: hasUrl,
        };
      }
    }

    // 4. Legacy homepage section fallback (if page is 'home' or empty)
    if (activePageKey === 'home') {
      const legacySectionMatch = mediaItems.find((m: any) => {
        const isPub = m.is_published ?? m.published ?? true;
        if (!isPub) return false;
        const itemSec = m.section || m.sectionId;
        const itemPage = m.page || 'home';
        return itemPage === 'home' && itemSec === secId;
      });

      if (legacySectionMatch) {
        const hasUrl = Boolean(legacySectionMatch.url || (legacySectionMatch.sequence_urls && legacySectionMatch.sequence_urls.length > 0));
        return {
          sectionMedia: legacySectionMatch,
          isGlobalFallback: false,
          isPageLevel: false,
          hasBgMedia: hasUrl,
        };
      }
    }

    // 5. Global site-wide ambient fallback (except for homepage hero, which has its own independent carousel)
    if (!(activePageKey === 'home' && secId === 'hero') && globalMedia) {
      const hasUrl = Boolean(globalMedia.url || (globalMedia.sequence_urls && globalMedia.sequence_urls.length > 0));
      return {
        sectionMedia: globalMedia,
        isGlobalFallback: true,
        isPageLevel: true,
        hasBgMedia: hasUrl,
      };
    }

    return {
      sectionMedia: null,
      isGlobalFallback: false,
      isPageLevel: false,
      hasBgMedia: false,
    };
  }, [mediaItems, activePageKey, targetSectionId, globalMedia]);

  return {
    mediaItems,
    loading,
    refresh,
    sectionMedia,
    hasBgMedia,
    isGlobalFallback,
    isPageLevel,
    globalMedia,
    activePageKey,
  };
}

/**
 * Convenience hook specifically for whole-page background components.
 * Automatically resolves the active page key and full-page media.
 */
export function usePageBackground(explicitPageKey?: string, explicitSectionId: string = 'page') {
  return useBackgroundMedia(explicitSectionId, explicitPageKey);
}
