import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { useDonationModal } from './DonationModalContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { VideoModal } from './VideoModal';
import { loadPublicBackgroundMedia, BackgroundMediaItem } from '../utils/backgroundMediaData';

// Animated counter hook
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// Parse numeric value from stat string like "500+", "10+"
function parseStatValue(val: string): { num: number; suffix: string } {
  const match = val.match(/(\d+)(.*)/);
  if (!match) return { num: 0, suffix: val };
  return { num: parseInt(match[1]), suffix: match[2] || '' };
}

// Animated stat counter tile
function StatCounter({ num, suffix, label, visible, delay }: { num: number; suffix: string; label: string; visible: boolean; delay: number }) {
  const count = useCountUp(num, 1800, visible);
  const displayVal = num === 0 ? '0' : (count >= 1000 ? count.toLocaleString() : count) + suffix;

  return (
    <div
      className="group bg-slate-900/50 hover:bg-slate-900/70 border border-white/10 hover:border-emerald-500/35 p-3.5 sm:p-5 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent group-hover:from-emerald-200 group-hover:to-teal-100 transition-all duration-300 ${visible ? 'counter-animated' : ''}`}>
        {visible ? displayVal : '0'}
      </div>
      <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors duration-300 mt-1.5 break-words leading-tight">
        {label}
      </div>
    </div>
  );
}

// Parse organization acronym (RESTI) and full expanded title
function parseHeroTitle(rawTitle: string): { acronym: string; expandedTitle: string } {
  const defaultAcronym = 'RESTI';
  const defaultExpanded = 'Refugee Empowerment For Sustainable Transformation Initiative';

  if (!rawTitle) {
    return { acronym: defaultAcronym, expandedTitle: defaultExpanded };
  }

  const cleaned = rawTitle.replace(/["“”'']/g, '').trim();

  // If title starts with RESTI followed by the expanded name
  const restiRegex = /(?:^|\s)RESTI(?:\s*[:-]?\s*|\s+)(.*)$/i;
  const match = cleaned.match(restiRegex);
  if (match && match[1]?.trim()) {
    return {
      acronym: defaultAcronym,
      expandedTitle: match[1].trim()
    };
  }

  // If title is just "RESTI"
  if (/^RESTI$/i.test(cleaned)) {
    return {
      acronym: defaultAcronym,
      expandedTitle: defaultExpanded
    };
  }

  // If RESTI appears anywhere in the title, remove it from expandedTitle
  if (/RESTI/i.test(cleaned)) {
    const withoutResti = cleaned.replace(/RESTI/gi, '').replace(/\s{2,}/g, ' ').trim();
    return {
      acronym: defaultAcronym,
      expandedTitle: withoutResti || defaultExpanded
    };
  }

  return {
    acronym: defaultAcronym,
    expandedTitle: cleaned
  };
}

// Parse multi-paragraph subtitle cleanly
function parseSubtitle(rawSubtitle: string): { paragraphs: string[]; motto: string | null } {
  if (!rawSubtitle) return { paragraphs: [], motto: null };
  // Filter out 'Driven by Us, Built for All' completely as requested
  const cleaned = rawSubtitle.replace(/Driven by Us, Built for All/gi, '').trim();
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { paragraphs: [], motto: null };

  return {
    paragraphs: lines,
    motto: null
  };
}

interface HeroSettings {
  badgeText: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  imageUrl: string;
  storyVideoUrl?: string;
  stats: Array<{ value: string; label: string }>;
}

const FALLBACK_BACKGROUND_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?auto=format&fit=crop&w=1920&q=85',
  'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1920&q=85',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=85',
  'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1920&q=85',
  'https://images.unsplash.com/photo-1641569707854-c80945fb4719?auto=format&fit=crop&w=1920&q=85',
];

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 1,
    scale: 1,
  }),
  center: {
    x: '0%',
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'tween' as const, duration: 1.2, ease: [0.25, 1, 0.5, 1] },
      opacity: { duration: 0 },
      scale: { duration: 1.2, ease: [0.25, 1, 0.5, 1] },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'tween' as const, duration: 1.2, ease: [0.25, 1, 0.5, 1] },
      opacity: { duration: 0 },
      scale: { duration: 1.2, ease: [0.25, 1, 0.5, 1] },
    },
  }),
};

const DEFAULT_HERO_STATS = [
  { value: '0', label: 'Families Supported' },
  { value: '0', label: 'Active Programs' },
  { value: '0', label: 'Communities Served' }
];

const DEFAULT_HERO_SETTINGS: HeroSettings = {
  badgeText: 'Turning potential into sustainable transformation',
  title: 'Refugee Empowerment For Sustainable Transformation Initiative',
  subtitle: 'RESTI is a community-based organization working alongside refugees and host communities to turn local skills, ideas, and potential into sustainable livelihoods, resilience, and lasting community transformation.',
  primaryButtonText: 'Donate Now',
  secondaryButtonText: 'Learn More',
  imageUrl: 'https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?auto=format&fit=crop&w=1920&q=85',
  storyVideoUrl: '',
  stats: DEFAULT_HERO_STATS
};

export function Hero() {
  const { open: openDonationModal } = useDonationModal();
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  const backgroundImages: string[] = (settings as any)?.backgroundImages?.length > 1
    ? (settings as any).backgroundImages 
    : (settings.imageUrl 
        ? [settings.imageUrl, ...FALLBACK_BACKGROUND_IMAGES.filter(img => img !== settings.imageUrl)] 
        : FALLBACK_BACKGROUND_IMAGES);

  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(new Array(backgroundImages.length).fill(false));
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Stats are above the fold; animate immediately on mount for instant visual engagement
    const timer = setTimeout(() => {
      setStatsVisible(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Preload all background images for smooth transitions
  useEffect(() => {
    setImagesLoaded(new Array(backgroundImages.length).fill(false));
    backgroundImages.forEach((src: string, index: number) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImagesLoaded(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      };
    });
  }, [backgroundImages]);

  // Automatic background image carousel with slow, elegant sliding
  useEffect(() => {
    if (isPaused || backgroundImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 8000); // 8 seconds per slide for a calm, professional experience

    return () => clearInterval(interval);
  }, [isPaused, backgroundImages.length, currentImageIndex]);

  const nextSlide = () => {
    if (backgroundImages.length <= 1) return;
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
  };

  const prevSlide = () => {
    if (backgroundImages.length <= 1) return;
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + backgroundImages.length) % backgroundImages.length);
  };

  const goToSlide = (index: number) => {
    if (index === currentImageIndex || backgroundImages.length <= 1) return;
    setDirection(index > currentImageIndex ? 1 : -1);
    setCurrentImageIndex(index);
  };

  const [hasAdminBgMedia, setHasAdminBgMedia] = useState<boolean>(false);
  const [activeHeroMedia, setActiveHeroMedia] = useState<BackgroundMediaItem | null>(null);

  useEffect(() => {
    checkAdminBackgroundMedia();

    // Hot-reload if background media changes in KV store
    try {
      const channel = supabase
        .channel('hero_bg_media_check')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kv_store_2a4be611' },
          (payload: any) => {
            const key = payload?.new?.key || payload?.old?.key;
            if (typeof key === 'string' && key.startsWith('bg_media:')) {
              checkAdminBackgroundMedia();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {}
  }, []);

  const checkAdminBackgroundMedia = async () => {
    try {
      const items = await loadPublicBackgroundMedia();
      const heroItem = items.find(
        (item) => (item.section === 'hero' || (item as any).sectionId === 'hero') && item.is_published
      );
      setHasAdminBgMedia(Boolean(heroItem));
      setActiveHeroMedia(heroItem || null);
    } catch {
      setHasAdminBgMedia(false);
      setActiveHeroMedia(null);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data?.settings?.hero) {
        setSettings(data.settings.hero);
      }
    } catch (error) {
      console.error('Error fetching hero settings:', error);
      // Default settings already in state — no action needed
    }
  };

  const scrollToAbout = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heroTitle = parseHeroTitle(settings.title || DEFAULT_HERO_SETTINGS.title);
  const { paragraphs, motto } = parseSubtitle(settings.subtitle || DEFAULT_HERO_SETTINGS.subtitle);

  const statsToDisplay = (settings.stats && settings.stats.length > 0)
    ? settings.stats.map(s => s.label.toLowerCase().includes('volunteer') ? { ...s, label: 'Communities Served' } : s)
    : DEFAULT_HERO_STATS;

  return (
    <section id="home" className="relative pt-28 sm:pt-36 lg:pt-40 pb-20 sm:pb-24 min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Carousel with Smooth Horizontal Slide (Fallback when no admin background media is assigned) */}
      {!hasAdminBgMedia && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentImageIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
              style={{
                backgroundImage: `url('${backgroundImages[currentImageIndex]}')`,
              }}
            />
          </AnimatePresence>

          {/* Semi-transparent dark overlay to keep foreground text readable while letting pictures appear clearly */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/45 to-slate-950/70 z-[1]" />
        </div>
      )}

      {/* Ambient background glow orb for modern depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[350px] sm:h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Slide Navigation Arrows (Prev / Next) - only if using local fallback carousel */}
      {!hasAdminBgMedia && backgroundImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-slate-950/40 hover:bg-slate-900/80 text-white/70 hover:text-white border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Previous background photo"
          >
            <ChevronLeft size={22} className="sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-slate-950/40 hover:bg-slate-900/80 text-white/70 hover:text-white border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Next background photo"
          >
            <ChevronRight size={22} className="sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}

      {/* Carousel Indicators - only if using local fallback carousel */}
      {!hasAdminBgMedia && backgroundImages.length > 1 && (
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/40 backdrop-blur-md border border-white/10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {backgroundImages.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                index === currentImageIndex 
                  ? 'w-8 bg-emerald-400 shadow-sm shadow-emerald-400/50' 
                  : 'w-2 bg-white/40 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 hidden xl:block">
        <button
          onClick={scrollToAbout}
          className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors group animate-bounce cursor-pointer"
          aria-label="Scroll to learn more"
        >
          <span className="text-xs tracking-wider uppercase font-medium">Scroll Down</span>
          <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />
        </button>
      </div>

      {/* Content Container */}
      <div className={`relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 ${
        activeHeroMedia?.max_content_width === 'sm' ? 'max-w-2xl' :
        activeHeroMedia?.max_content_width === 'md' ? 'max-w-3xl' :
        activeHeroMedia?.max_content_width === 'lg' ? 'max-w-4xl' :
        activeHeroMedia?.max_content_width === 'xl' ? 'max-w-5xl' :
        activeHeroMedia?.max_content_width === 'full' ? 'max-w-7xl' :
        'max-w-6xl'
      }`}>
        <div className={`flex flex-col w-full mx-auto ${
          activeHeroMedia?.text_align === 'left' ? 'items-start text-left' :
          activeHeroMedia?.text_align === 'right' ? 'items-end text-right' :
          'items-center justify-center text-center max-w-4xl'
        }`}>
          {/* Text Content */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
            }}
            className={`space-y-6 sm:space-y-7 flex flex-col w-full ${
              activeHeroMedia?.text_align === 'left' ? 'items-start' :
              activeHeroMedia?.text_align === 'right' ? 'items-end' :
              'items-center'
            } ${
              activeHeroMedia?.text_backdrop === 'card-translucent'
                ? 'bg-slate-950/65 backdrop-blur-md p-6 sm:p-10 rounded-3xl border border-white/15 shadow-2xl'
                : activeHeroMedia?.text_backdrop === 'subtle-blur'
                ? 'backdrop-blur-sm bg-slate-950/30 p-4 sm:p-6 rounded-2xl'
                : ''
            }`}
          >
            {/* Elegant Hero Status Badge */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="inline-flex items-center justify-center gap-2.5 sm:gap-3 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-emerald-900/90 hover:bg-emerald-800/95 border border-emerald-400/60 backdrop-blur-md shadow-lg shadow-emerald-950/50 transition-all duration-300 ring-1 ring-emerald-500/40 max-w-[95vw] sm:max-w-max"
            >
              <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-300"></span>
              </span>
              <span className="text-sm sm:text-base md:text-lg font-bold text-white tracking-wide drop-shadow-sm text-center leading-normal">
                {settings.badgeText || DEFAULT_HERO_SETTINGS.badgeText}
              </span>
            </motion.div>

            {/* Title Structure: RESTI (acronym / short name) standing prominently above the expanded initiative name */}
            <div className={`flex flex-col gap-2.5 sm:gap-3.5 w-full my-1 ${
              activeHeroMedia?.text_align === 'left' ? 'items-start' :
              activeHeroMedia?.text_align === 'right' ? 'items-end' :
              'items-center'
            }`}>
              {/* RESTi — Organization Short Name / Acronym with clean, crisp edges, bold geometric rounded letterforms, and no shadows */}
              <motion.div 
                variants={{ hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut" } } }}
                className={`inline-flex items-baseline justify-center select-none font-black font-heading tracking-tight leading-none ${
                  activeHeroMedia?.title_size_desktop === 'huge' ? 'text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]' :
                  activeHeroMedia?.title_size_desktop === 'large' ? 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl' :
                  'text-6xl sm:text-7xl md:text-8xl lg:text-9xl'
                } ${
                  activeHeroMedia?.title_size_mobile === 'compact' ? 'max-sm:text-5xl' :
                  activeHeroMedia?.title_size_mobile === 'large' ? 'max-sm:text-7xl' : ''
                }`}
                aria-label="RESTi"
              >
                {/* R: Dark Blue */}
                <span className="text-[#0F294A]">
                  R
                </span>
                {/* E: Light Green */}
                <span className="text-[#388E3C]">
                  E
                </span>
                {/* S: Light Green */}
                <span className="text-[#388E3C]">
                  S
                </span>
                {/* T: Dark Blue */}
                <span className="text-[#0F294A]">
                  T
                </span>
                {/* i: Orange */}
                <span className="text-[#FF6B38]">
                  i
                </span>
              </motion.div>

              {/* Expanded Initiative Title standing directly below RESTI */}
              <motion.h1 
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", delay: 0.1 } } }}
                className={`font-bold sm:font-extrabold font-heading tracking-tight leading-[1.1] max-w-4xl mx-auto ${
                  activeHeroMedia?.title_size_desktop === 'huge' ? 'text-[36px] sm:text-[44px] lg:text-[56px]' :
                  activeHeroMedia?.title_size_desktop === 'large' ? 'text-[34px] sm:text-[40px] lg:text-[52px]' :
                  'text-[32px] sm:text-[36px] lg:text-[48px]'
                } ${
                  activeHeroMedia?.title_size_mobile === 'compact' ? 'max-sm:text-[26px]' :
                  activeHeroMedia?.title_size_mobile === 'large' ? 'max-sm:text-[36px]' : ''
                } ${
                  activeHeroMedia?.text_color === 'stone-900' ? 'text-stone-900' :
                  activeHeroMedia?.text_color === 'emerald-100' ? 'text-emerald-100' :
                  activeHeroMedia?.text_color === 'amber-100' ? 'text-amber-100' :
                  activeHeroMedia?.text_color === 'slate-100' ? 'text-slate-100' :
                  'text-white'
                } ${
                  activeHeroMedia?.text_shadow === 'strong' ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]' :
                  activeHeroMedia?.text_shadow === 'medium' ? 'drop-shadow-lg' :
                  activeHeroMedia?.text_shadow === 'subtle' ? 'drop-shadow-md' :
                  activeHeroMedia?.text_shadow === 'none' ? '' :
                  'drop-shadow-sm'
                }`}
              >
                {heroTitle.expandedTitle}
              </motion.h1>
            </div>

            {/* Subtitle & Tagline */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="max-w-3xl mx-auto space-y-3.5"
            >
              <div className={`space-y-3 text-[17px] font-sans font-normal leading-[1.6] ${
                activeHeroMedia?.text_align === 'left' ? 'text-left' :
                activeHeroMedia?.text_align === 'right' ? 'text-right' :
                'text-center'
              } ${
                activeHeroMedia?.text_backdrop === 'pill-badge'
                  ? 'inline-block bg-slate-950/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10'
                  : ''
              } ${
                activeHeroMedia?.text_color === 'stone-900' ? 'text-stone-800' :
                activeHeroMedia?.text_color === 'emerald-100' ? 'text-emerald-50' :
                activeHeroMedia?.text_color === 'amber-100' ? 'text-amber-50' :
                'text-slate-200/90'
              } ${
                activeHeroMedia?.text_shadow === 'strong' ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]' :
                activeHeroMedia?.text_shadow === 'medium' ? 'drop-shadow-md' :
                activeHeroMedia?.text_shadow === 'subtle' ? 'drop-shadow-sm' :
                ''
              }`}>
                {paragraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {motto && (
                <div className={`pt-2 flex ${
                  activeHeroMedia?.text_align === 'left' ? 'justify-start' :
                  activeHeroMedia?.text_align === 'right' ? 'justify-end' :
                  'justify-center'
                }`}>
                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/60 border border-amber-400/30 text-amber-300 backdrop-blur-md text-xs sm:text-sm font-medium tracking-wide shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="italic font-heading">"{motto}"</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Call to Action Buttons */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center items-center w-full pt-2 flex-wrap"
            >
              <button
                onClick={openDonationModal}
                className="w-full sm:w-auto group bg-resti-green hover:bg-resti-green-dark text-white text-[15px] sm:text-[16px] font-bold px-8 py-3.5 sm:py-4 rounded-[10px] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-resti-green/25 hover:shadow-resti-green/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{settings.primaryButtonText}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300 text-slate-950" />
              </button>

              {settings.storyVideoUrl ? (
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="w-full sm:w-auto group bg-emerald-950/70 hover:bg-emerald-900/90 text-white text-[15px] sm:text-[16px] font-semibold border border-emerald-400/40 hover:border-emerald-400/80 backdrop-blur-md px-7 py-3.5 sm:py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-md active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer ring-1 ring-emerald-500/20"
                >
                  <span className="w-7 h-7 rounded-full bg-emerald-500/30 group-hover:bg-emerald-500 text-emerald-300 group-hover:text-white flex items-center justify-center transition-colors">
                    <Play size={14} className="fill-current translate-x-0.5" />
                  </span>
                  <span>Watch Our Story</span>
                </button>
              ) : null}

              <button
                onClick={scrollToAbout}
                className="w-full sm:w-auto bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 hover:text-white text-[15px] sm:text-[16px] font-semibold border border-sky-400/35 hover:border-sky-400/60 backdrop-blur-md px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-md active:translate-y-0 cursor-pointer"
              >
                {settings.secondaryButtonText}
              </button>
            </motion.div>

            {/* Stats with animated counters */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              ref={statsRef} 
              className="grid grid-cols-3 gap-3 sm:gap-6 pt-8 sm:pt-10 w-full max-w-3xl mx-auto"
            >
              {statsToDisplay.map((stat, index) => {
                const { num, suffix } = parseStatValue(stat.value || '');
                return (
                  <StatCounter key={index} num={num} suffix={suffix} label={stat.label} visible={statsVisible} delay={index * 150} />
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal Player */}
      {settings.storyVideoUrl && (
        <VideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoUrl={settings.storyVideoUrl}
          title="RESTI CBO - Field Story Video"
        />
      )}
    </section>
  );
}