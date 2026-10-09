import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

/**
 * Transforms standard video URLs (YouTube watch, YouTube Shorts, youtu.be, Vimeo)
 * into embeddable iframe URLs. Returns null if direct video file.
 */
export function getEmbedVideoUrl(url: string): { type: 'embed' | 'direct'; url: string } | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // 1. YouTube watch or share links
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'embed',
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`
    };
  }

  // 2. YouTube Shorts
  const ytShortMatch = cleanUrl.match(/youtube\.com\/shorts\/([^"&?/\s]{11})/i);
  if (ytShortMatch && ytShortMatch[1]) {
    return {
      type: 'embed',
      url: `https://www.youtube-nocookie.com/embed/${ytShortMatch[1]}?autoplay=1&rel=0`
    };
  }

  // 3. Vimeo
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'embed',
      url: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&title=0&byline=0&portrait=0`
    };
  }

  // 4. Direct video file (.mp4, .webm, etc.)
  return {
    type: 'direct',
    url: cleanUrl
  };
}

export function VideoModal({ isOpen, onClose, videoUrl, title = 'Video Player' }: VideoModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !videoUrl) return null;

  const parsed = getEmbedVideoUrl(videoUrl);
  if (!parsed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-4xl bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-white/10 text-white">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-semibold tracking-wide truncate max-w-xs sm:max-w-md">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close video"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player Container 16:9 */}
        <div className="relative w-full pb-[56.25%] bg-black">
          {parsed.type === 'embed' ? (
            <iframe
              src={parsed.url}
              title={title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              src={parsed.url}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    </div>
  );
}
