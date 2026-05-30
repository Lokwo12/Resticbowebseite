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
}

const iconMap: Record<string, typeof Heart> = {
  Heart,
  Users,
  Target,
  Award
};



const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  title: 'About Resti Kiryandongo CBO',
  intro: 'Founded with a mission to empower and uplift communities in Kiryandongo District, we are a community-based organization dedicated to creating sustainable positive change through collaborative action and locally-driven solutions.',
  mission: 'To empower communities in Kiryandongo through sustainable development programs in education, healthcare, and economic empowerment, fostering self-reliance and improved quality of life for all.',
  vision: 'A thriving, self-sustaining community where every individual has access to quality education, healthcare, and opportunities for economic prosperity.',
  values: [
    { icon: 'Heart', title: 'Compassion', description: 'We approach every initiative with empathy and understanding for community needs.' },
    { icon: 'Users', title: 'Community', description: 'Working together with local leaders and residents to create lasting change.' },
    { icon: 'Target', title: 'Impact', description: 'Focused on measurable outcomes that improve quality of life.' },
    { icon: 'Award', title: 'Excellence', description: 'Committed to delivering high-quality programs and services.' }
  ],
  story: [
    'Resti Kiryandongo CBO was born from a shared vision among community members who recognized the need for organized, sustainable development initiatives in our district. What started as small-scale educational support has grown into a comprehensive community development organization.',
    'Today, we work closely with local government, international partners, and most importantly, the communities we serve, to identify needs, develop solutions, and implement programs that create lasting positive change. Our grassroots approach ensures that every initiative is community-driven and culturally appropriate.'
  ],
  heroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-children-running-in-a-field-of-grass-32773-large.mp4',
  missionVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-planting-a-seedling-in-the-soil-31518-large.mp4',
  timeline: [
    { year: '2015', title: 'The Beginning', desc: 'A small group of community members gathered to discuss challenges in local education.' },
    { year: '2017', title: 'Official Registration', desc: 'Resti Kiryandongo was officially registered as a CBO, launching our first agriculture initiative.' },
    { year: '2020', title: 'Healthcare Expansion', desc: 'Partnered with local clinics to provide free health screenings to over 5,000 residents.' },
    { year: '2023', title: 'Education Hub', desc: 'Opened a community learning center equipped with modern resources for youth.' },
    { year: 'Present', title: 'Sustainable Future', desc: 'Continuing to expand our reach, directly impacting over 20,000 lives annually.' }
  ]
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

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-20">
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-widest uppercase mb-6 animate-[fadeInUp_0.8s_ease-out] drop-shadow-md">
            Our Journey
          </span>
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-white mb-6 leading-tight animate-[fadeInUp_1s_ease-out_0.2s_both] drop-shadow-2xl">
            {settings.title}
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed animate-[fadeInUp_1s_ease-out_0.4s_both] drop-shadow-lg font-medium">
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
                src="https://images.unsplash.com/photo-1593113589914-07553282245b?q=80&w=1200" 
                alt="Community meeting" 
                className="w-full h-[500px] object-cover rounded-3xl shadow-xl"
              />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">Our Story</h2>
              <h3 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 leading-tight">
                From a small village initiative to a district-wide movement.
              </h3>
              {settings.story?.map((paragraph, idx) => (
                <p key={idx} className="text-gray-600 text-lg leading-relaxed">
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

      {/* ── CORE VALUES ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">Guiding Principles</h2>
            <h3 className="text-3xl md:text-5xl font-bold font-heading text-gray-900">Our Core Values</h3>
          </div>

          <div 
            ref={valuesRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {settings.values?.map((val, idx) => {
              const Icon = iconMap[val.icon] || Heart;
              return (
                <div 
                  key={idx}
                  className={`bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-100 transition-all duration-700 group ${valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Icon size={28} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{val.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{val.description}</p>
                </div>
              );
            })}
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
