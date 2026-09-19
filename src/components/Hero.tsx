import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useDonationModal } from './DonationModalContext';
import { motion } from 'framer-motion';

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
  stats: Array<{ value: string; label: string }>;
}

const FALLBACK_BACKGROUND_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwZW1wb3dlcm1lbnR8ZW58MXx8fHwxNzYyNDU3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080'
];

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
  imageUrl: 'https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwZW1wb3dlcm1lbnR8ZW58MXx8fHwxNzYyNDU3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  stats: DEFAULT_HERO_STATS
};

export function Hero() {
  const { open: openDonationModal } = useDonationModal();
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const backgroundImages = (settings as any)?.backgroundImages?.length > 0 
    ? (settings as any).backgroundImages 
    : (settings.imageUrl ? [settings.imageUrl] : FALLBACK_BACKGROUND_IMAGES);

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

  // Automatic background image carousel with pause functionality
  useEffect(() => {
    if (isPaused || backgroundImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 6000); // Change image every 6 seconds

    return () => clearInterval(interval);
  }, [isPaused, backgroundImages.length]);

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
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((image: string, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-2000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Dark gradient overlay for high contrast & elegance */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/95"></div>
          </div>
        ))}
      </div>

      {/* Ambient background glow orb for modern depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[350px] sm:h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {backgroundImages.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentImageIndex 
                ? 'w-8 bg-emerald-400' 
                : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 hidden xl:block">
        <button
          onClick={scrollToAbout}
          className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors group animate-bounce"
          aria-label="Scroll to learn more"
        >
          <span className="text-xs tracking-wider uppercase font-medium">Scroll Down</span>
          <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />
        </button>
      </div>

      {/* Content Container */}
      <div 
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
          {/* Text Content */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
            }}
            className="space-y-6 sm:space-y-7 flex flex-col items-center w-full"
          >
            {/* Elegant Hero Status Badge */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/70 border border-sky-400/35 backdrop-blur-md shadow-md text-sky-200 hover:border-sky-400/60 transition-all duration-300"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                {settings.badgeText}
              </span>
            </motion.div>

            {/* Title Structure: RESTI (acronym / short name) standing prominently above the expanded initiative name */}
            <div className="flex flex-col items-center gap-2.5 sm:gap-3.5 w-full my-1">
              {/* RESTI — Organization Short Name / Acronym */}
              <motion.div 
                variants={{ hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut" } } }}
                className="inline-block"
              >
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-heading tracking-tight bg-gradient-to-r from-emerald-300 via-sky-200 to-amber-300 bg-clip-text text-transparent drop-shadow-md select-none leading-none">
                  {heroTitle.acronym}
                </span>
              </motion.div>

              {/* Expanded Initiative Title standing directly below RESTI */}
              <motion.h1 
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", delay: 0.1 } } }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-heading text-white tracking-tight leading-snug max-w-3xl mx-auto drop-shadow-sm"
              >
                {heroTitle.expandedTitle}
              </motion.h1>
            </div>

            {/* Subtitle & Tagline */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="max-w-3xl mx-auto space-y-3.5"
            >
              <div className="space-y-3 text-base sm:text-lg md:text-xl font-sans font-normal leading-relaxed text-slate-200/90 drop-shadow-sm text-center">
                {paragraphs.map((para, idx) => (
                  <p key={idx} className="text-center">{para}</p>
                ))}
              </div>

              {motto && (
                <div className="pt-2 flex justify-center">
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
              className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center items-center w-full pt-2"
            >
              <button
                onClick={openDonationModal}
                className="w-full sm:w-auto group bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{settings.primaryButtonText}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300 text-slate-950" />
              </button>
              <button
                onClick={scrollToAbout}
                className="w-full sm:w-auto bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 hover:text-white font-semibold border border-sky-400/35 hover:border-sky-400/60 backdrop-blur-md px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-md active:translate-y-0 cursor-pointer"
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
    </section>
  );
}