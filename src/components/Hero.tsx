import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useDonationModal } from './DonationModal';
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
  return (
    <div
      className="group hover:scale-105 transition-all duration-500 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-premium-soft hover:shadow-2xl transition-all duration-300 backdrop-blur-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300 drop-shadow-premium-soft transition-all duration-300 ${visible ? 'counter-animated' : ''}`}>
        {visible ? count : 0}{suffix}
      </div>
      <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/80 group-hover:text-white transition-colors duration-300 mt-1 break-words leading-tight">{label}</div>
    </div>
  );
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

const FALLBACK_BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1761039808159-f02b58f07032?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwZGV2ZWxvcG1lbnR8ZW58MXx8fHwxNzY1MjMyNzc0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1641569707854-c80945fb4719?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2x1bnRlZXIlMjBoZWxwaW5nJTIwY2hpbGRyZW58ZW58MXx8fHwxNzY1MTk3NzkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1666281269793-da06484657e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBjbGFzc3Jvb20lMjBhZnJpY2F8ZW58MXx8fHwxNzY1MjMyNzc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1706806595136-5afefb45da1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBoZWFsdGhjYXJlfGVufDF8fHx8MTc2NTIzMjc3NXww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1761466977752-de51b3ecce84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyYWwlMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NjUyMzI3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
];

const DEFAULT_HERO_SETTINGS: HeroSettings = {
  badgeText: 'Making a Difference in Kiryandongo',
  title: 'Empowering Communities Through Action',
  subtitle: 'Resti Kiryandongo CBO is dedicated to improving lives through education, healthcare, and community development initiatives in Kiryandongo District, Uganda.',
  primaryButtonText: 'Donate Now',
  secondaryButtonText: 'Learn More',
  imageUrl: 'https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwZW1wb3dlcm1lbnR8ZW58MXx8fHwxNzYyNDU3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  stats: [
    { value: '500+', label: 'Families Supported' },
    { value: '10+', label: 'Active Programs' },
    { value: '50+', label: 'Volunteers' }
  ]
};

export function Hero() {
  const { open: openDonationModal } = useDonationModal();
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const backgroundImages = (settings as any)?.backgroundImages?.length > 0 
    ? (settings as any).backgroundImages 
    : FALLBACK_BACKGROUND_IMAGES;

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
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 6000); // Change image every 6 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

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

  return (
    <section id="home" className="relative pt-32 lg:pt-40 pb-24 min-h-screen overflow-hidden">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((image: string, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-2000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
          </div>
        ))}
      </div>

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
                ? 'w-8 bg-white' 
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 hidden lg:block">
        <button
          onClick={scrollToAbout}
          className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors group animate-bounce"
          aria-label="Scroll to learn more"
        >
          <span className="text-sm tracking-wider">Scroll Down</span>
          <ChevronDown size={24} className="group-hover:translate-y-1 transition-transform" />
        </button>
      </div>

      {/* Content */}
      <div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-spacing-lg lg:py-32"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
            className="space-y-6"
          >
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="inline-block bg-emerald-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-base hover:scale-105 transition-transform duration-300 shadow-premium-soft hover:shadow-2xl"
            >
              {settings.badgeText}
            </motion.div>
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="text-4xl sm:text-5xl lg:text-7xl text-white drop-shadow-2xl"
            >
              {settings.title}
            </motion.h1>
            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="text-lg sm:text-2xl text-white/95 drop-shadow-premium-soft hover:shadow-2xl transition-all duration-300"
            >
              {settings.subtitle}
            </motion.p>
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={openDonationModal}
                className="group bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-2xl hover:-translate-y-0.5 shadow-premium-soft hover:shadow-2xl transition-all duration-300"
              >
                {settings.primaryButtonText}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button
                onClick={scrollToAbout}
                className="border-2 border-white bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg hover:bg-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 shadow-premium-soft hover:shadow-2xl transition-all duration-300"
              >
                {settings.secondaryButtonText}
              </button>
            </motion.div>

            {/* Stats with animated counters */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              ref={statsRef} 
              className="grid grid-cols-3 gap-3 sm:gap-6 pt-8"
            >
              {(settings.stats || []).map((stat, index) => {
                const { num, suffix } = parseStatValue(stat.value || '');
                return (
                  <StatCounter key={index} num={num} suffix={suffix} label={stat.label} visible={statsVisible} delay={index * 200} />
                );
              })}
            </motion.div>
          </motion.div>

          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            className="relative"
          >
            <div className="aspect-video sm:aspect-square rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 ring-8 ring-white/10 group">
              <img
                src={settings.imageUrl}
                alt="Community empowerment"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 1 }}
              className="absolute -bottom-6 -right-2 lg:-right-6 bg-white p-6 rounded-xl shadow-2xl hidden lg:block hover:shadow-3xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-3xl">🤝</div>
              <div className="mt-2">
                <div className="text-sm text-gray-600">Community Impact</div>
                <div className="text-emerald-600">Growing Daily</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}