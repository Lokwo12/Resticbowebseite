import { Heart, Users, Target, Award, ArrowRight, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useScrollAnimation, getStaggerDelay } from '../utils/animations';

interface AboutValue {
  icon: string;
  title: string;
  description: string;
}

import { DEFAULT_TRUST_BADGES, TrustBadge } from './About';
import { DEFAULT_WAY_WE_WORK, WayWeWorkSettings } from './SiteSettingsTab';

interface AboutSettings {
  title: string;
  intro: string;
  mission: string;
  vision: string;
  values: AboutValue[];
  story: string[];
  heroVideoUrl: string;
  missionVideoUrl: string;
  timeline: { year: string; title: string; desc: string }[];
  trustBadges?: TrustBadge[];
  wayWeWork?: WayWeWorkSettings;
  storyBadge?: string;
  storyTitle?: string;
  storyImage?: string;
}

const iconMap: Record<string, typeof Heart> = {
  Heart,
  Users,
  Target,
  Award
};



const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  title: 'About RESTI CBO',
  intro: 'Refugee Empowerment For Sustainable Transformation Initiative (RESTI) is a community-rooted organization in Kiryandongo District, Uganda. We transform vulnerable settlements through education, healthcare, sustainable livelihoods, and peacebuilding.',
  mission: 'To empower refugees and host communities in Kiryandongo through locally-driven, sustainable programs in education, healthcare, and economic livelihoods, fostering enduring self-reliance and community cohesion.',
  vision: 'A thriving, self-sustaining society where every refugee and community member enjoys dignity, quality education, reliable healthcare, and equal economic opportunities.',
  values: [
    { icon: 'Heart', title: 'Compassion & Dignity', description: 'We place human dignity, empathy, and active listening at the center of every community initiative.' },
    { icon: 'Users', title: 'Community Ownership', description: 'Solutions are co-designed and driven by refugees and host communities working side-by-side.' },
    { icon: 'Target', title: 'Sustainable Impact', description: 'Focused on long-term, measurable empowerment that builds lasting independence rather than temporary relief.' },
    { icon: 'Award', title: 'Integrity & Transparency', description: 'Committed to rigorous accountability to our community, partners, and donors in all we do.' }
  ],
  story: [
    'RESTI (Refugee Empowerment For Sustainable Transformation Initiative) was founded from the lived experiences and collective determination of community members in Kiryandongo District, Uganda. Recognizing the acute challenges faced by refugee families and host communities—from fragmented educational access to economic vulnerability—we united to create a locally rooted organization dedicated to lasting transformation.',
    'Today, RESTI collaborates closely with district leadership, local elders, refugee youth networks, and humanitarian partners. By combining grassroots trust with structured vocational programs, micro-enterprise training, and digital skills, we turn fragile situations into foundations for sustainable progress.'
  ],
  heroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-children-running-in-a-field-of-grass-32773-large.mp4',
  missionVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-planting-a-seedling-in-the-soil-31518-large.mp4',
  timeline: [
    { year: '2015', title: 'The Beginning', desc: 'A small group of community members gathered to discuss challenges in local education.' },
    { year: '2017', title: 'Official Registration', desc: 'RESTI was officially registered as a CBO, launching our first agriculture initiative.' },
    { year: '2020', title: 'Healthcare Expansion', desc: 'Partnered with local clinics to provide free health screenings to over 5,000 residents.' },
    { year: '2023', title: 'Education Hub', desc: 'Opened a community learning center equipped with modern resources for youth.' },
    { year: 'Present', title: 'Sustainable Future', desc: 'Continuing to expand our reach, directly impacting over 20,000 lives annually.' }
  ],
  trustBadges: DEFAULT_TRUST_BADGES,
  wayWeWork: DEFAULT_WAY_WE_WORK,
  storyBadge: 'Our Story',
  storyTitle: 'From a small village initiative to a district-wide movement.',
  storyImage: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80',
};

export function AboutPage() {
  const [settings, setSettings] = useState<AboutSettings>(DEFAULT_ABOUT_SETTINGS);

  const { ref: storyRef, isVisible: storyVisible } = useScrollAnimation();
  const { ref: valuesRef, isVisible: valuesVisible } = useScrollAnimation();
  const { ref: timelineRef, isVisible: timelineVisible } = useScrollAnimation();
  const { ref: videoRef, isVisible: videoVisible } = useScrollAnimation();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` }, signal: controller.signal }
      );
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.about) {
          const fetchedAbout = data.settings.about;
          const merged = { ...DEFAULT_ABOUT_SETTINGS, ...fetchedAbout };
          merged.heroVideoUrl = fetchedAbout.heroVideoUrl || DEFAULT_ABOUT_SETTINGS.heroVideoUrl;
          merged.missionVideoUrl = fetchedAbout.missionVideoUrl || DEFAULT_ABOUT_SETTINGS.missionVideoUrl;
          merged.timeline = Array.isArray(fetchedAbout.timeline) && fetchedAbout.timeline.length > 0 ? fetchedAbout.timeline : DEFAULT_ABOUT_SETTINGS.timeline;
          merged.story = Array.isArray(fetchedAbout.story) && fetchedAbout.story.length > 0 ? fetchedAbout.story : DEFAULT_ABOUT_SETTINGS.story;
          merged.values = Array.isArray(fetchedAbout.values) && fetchedAbout.values.length > 0 ? fetchedAbout.values : DEFAULT_ABOUT_SETTINGS.values;
          merged.trustBadges = Array.isArray(fetchedAbout.trustBadges) && fetchedAbout.trustBadges.length > 0 ? fetchedAbout.trustBadges : DEFAULT_TRUST_BADGES;
          merged.wayWeWork = (fetchedAbout.wayWeWork && Array.isArray(fetchedAbout.wayWeWork.items)) ? fetchedAbout.wayWeWork : DEFAULT_WAY_WE_WORK;
          merged.storyBadge = fetchedAbout.storyBadge || DEFAULT_ABOUT_SETTINGS.storyBadge;
          merged.storyTitle = fetchedAbout.storyTitle || DEFAULT_ABOUT_SETTINGS.storyTitle;
          merged.storyImage = fetchedAbout.storyImage || DEFAULT_ABOUT_SETTINGS.storyImage;
          setSettings(merged);
        }
      }
    } catch (err) {
      // Silently fall back to defaults already shown
    }
  };

  return (
    <div className="bg-gray-50 font-sans overflow-hidden">
      
      {/* ── HERO WITH VIDEO BACKGROUND ── */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover scale-105"
            style={{ filter: 'brightness(0.7) saturate(1.2)' }}
          >
            <source src={settings.heroVideoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/30 via-[#0A192F]/50 to-[#0A192F]/90"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-16 sm:mt-20">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-6 animate-[fadeInUp_0.8s_ease-out] backdrop-blur-sm">
            <Heart size={14} className="text-emerald-400" />
            Our Mission & Journey
          </div>
          <h1 className="text-[32px] sm:text-[36px] lg:text-[48px] font-bold sm:font-extrabold font-heading text-white mb-6 leading-[1.1] animate-[fadeInUp_1s_ease-out_0.2s_both] drop-shadow-2xl">
            {settings.title}
          </h1>
          <p className="text-[17px] font-normal text-gray-200 max-w-3xl mx-auto leading-[1.6] animate-[fadeInUp_1s_ease-out_0.4s_both] drop-shadow-lg">
            {settings.intro}
          </p>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            ref={storyRef}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${storyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500 rounded-3xl translate-x-4 translate-y-4 -z-10 transition-transform group-hover:translate-x-6 group-hover:translate-y-6"></div>
              <img 
                src={settings.storyImage || "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80"} 
                alt={settings.storyTitle || "Community meeting"} 
                className="w-full h-[500px] object-cover rounded-3xl shadow-xl"
              />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">
                {settings.storyBadge || "Our Story"}
              </h2>
              <h3 className="text-[28px] sm:text-[30px] lg:text-[36px] font-bold font-heading text-gray-900 leading-[1.2]">
                {settings.storyTitle || "From a small village initiative to a district-wide movement."}
              </h3>
              {settings.story?.map((paragraph, idx) => (
                <p key={idx} className="text-gray-600 text-[17px] font-normal leading-[1.6]">
                  {paragraph}
                </p>
              ))}
              <div className="pt-6">
                <Link to="/team" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors group">
                  Meet the Team <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION & VISION (PARALLAX VIDEO BG) ── */}
      <section 
        ref={videoRef}
        className="py-32 relative overflow-hidden flex items-center"
      >
        <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${videoVisible ? 'opacity-100' : 'opacity-0'}`}>
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover scale-110 opacity-50 mix-blend-luminosity"
          >
            <source src={settings.missionVideoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#0A192F]/70"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl shadow-2xl hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-emerald-500/30">
                <Target size={28} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 font-heading">Our Mission</h3>
              <p className="text-gray-300 text-lg leading-relaxed">{settings.mission}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl shadow-2xl hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-500/30">
                <Play size={28} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 font-heading">Our Vision</h3>
              <p className="text-gray-300 text-lg leading-relaxed">{settings.vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE WAY WE WORK (Guiding Principles) ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">
              {settings.wayWeWork?.badge || DEFAULT_WAY_WE_WORK.badge}
            </h2>
            <h3 className="text-3xl md:text-5xl font-bold font-heading text-gray-900">
              {settings.wayWeWork?.title || DEFAULT_WAY_WE_WORK.title}
            </h3>
          </div>

          <div 
            ref={valuesRef}
            className={`transition-all duration-1000 ${valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          >
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-premium-soft border border-gray-100">
              <div className="space-y-8 text-gray-700 text-lg leading-relaxed font-normal">
                {(settings.wayWeWork?.intro || DEFAULT_WAY_WE_WORK.intro) && (
                  <p className="text-xl font-medium text-gray-800">
                    {settings.wayWeWork?.intro || DEFAULT_WAY_WE_WORK.intro}
                  </p>
                )}
                {(settings.wayWeWork?.items && settings.wayWeWork.items.length > 0
                  ? settings.wayWeWork.items
                  : DEFAULT_WAY_WE_WORK.items
                ).map((item, index) => (
                  <p key={index}>
                    <strong className="text-emerald-800 text-xl block mb-2">{item.title}</strong>
                    {item.desc}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST & ACCREDITATIONS STRIP ── */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-emerald-700 font-bold uppercase tracking-wider text-xs bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
              Institutional Credibility
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 mt-2.5">
              Recognized & Community-Driven
            </h3>
          </div>
          <div className={`grid gap-4 sm:gap-6 ${
            (settings.trustBadges || DEFAULT_TRUST_BADGES).length <= 2
              ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto'
              : (settings.trustBadges || DEFAULT_TRUST_BADGES).length === 3
                ? 'grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto'
                : 'grid-cols-2 md:grid-cols-4'
          }`}>
            {(settings.trustBadges || DEFAULT_TRUST_BADGES).map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="flex flex-col items-center text-center bg-emerald-50/60 border border-emerald-100/90 rounded-2xl py-6 px-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300"
              >
                <span className="text-3xl mb-2.5 select-none">{item.icon}</span>
                <span className="text-base font-bold font-heading tracking-tight text-emerald-900 leading-snug">{item.label}</span>
                <span className="text-sm text-emerald-700 mt-1 leading-snug font-medium">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900 mb-4">Milestones of Impact</h2>
            <p className="text-gray-600 text-lg">Looking back at our growth and looking forward to the future.</p>
          </div>

          <div ref={timelineRef} className="space-y-12">
            {settings.timeline?.map((item, idx) => (
              <div 
                key={idx} 
                className={`relative pl-8 md:pl-0 flex flex-col md:flex-row gap-6 md:gap-12 transition-all duration-1000 ${timelineVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                {/* Timeline Line */}
                <div className="absolute left-0 md:left-1/2 top-0 bottom-[-3rem] w-px bg-emerald-100 md:-translate-x-1/2"></div>
                
                {/* Dot */}
                <div className="absolute left-[-5px] md:left-1/2 top-1.5 w-3 h-3 bg-emerald-500 rounded-full md:-translate-x-1/2 shadow-lg shadow-emerald-500/40 ring-4 ring-white z-10"></div>

                <div className={`md:w-1/2 ${idx % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12 md:order-2'}`}>
                  <span className="text-emerald-600 font-black text-xl tracking-tight block mb-2">{item.year}</span>
                </div>
                
                <div className={`md:w-1/2 ${idx % 2 === 0 ? 'md:order-2 md:pl-12' : 'md:pr-12 md:text-right'}`}>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
