import { Heart, Users, Target, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
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
}

const iconMap: Record<string, typeof Heart> = {
  Heart,
  Users,
  Target,
  Award
};

export function About() {
  const [settings, setSettings] = useState<AboutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  // Start visible since About is near top of page
  const { ref, isVisible } = useScrollAnimation({ startVisible: true });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const defaultSettings = {
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
      ]
    };

    try {
      console.log('🔄 Fetching About settings...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('📡 About fetch response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      console.log('📦 Raw API response:', data);
      console.log('📄 About settings from API:', data.settings?.about);
      
      // Check if we have valid about settings
      if (data.settings?.about) {
        const aboutData = data.settings.about;
        
        const mergedSettings = {
          title: aboutData.title || defaultSettings.title,
          intro: aboutData.intro || defaultSettings.intro,
          mission: aboutData.mission || defaultSettings.mission,
          vision: aboutData.vision || defaultSettings.vision,
          values: (aboutData.values && aboutData.values.length > 0) ? aboutData.values : defaultSettings.values,
          story: (aboutData.story && aboutData.story.length > 0) ? aboutData.story : defaultSettings.story
        };
        
        console.log('✅ Setting merged About settings:', mergedSettings);
        setSettings(mergedSettings);
      } else {
        // No about settings, use defaults
        console.log('⚠️ No about settings found in API, using defaults');
        console.log('✅ Setting default About settings:', defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('❌ Error fetching about settings:', error);
      // Set default settings if fetch fails
      console.log('✅ Setting default About settings (error fallback):', defaultSettings);
      setSettings(defaultSettings);
    } finally {
      console.log('🏁 About fetch complete, loading = false');
      setLoading(false);
    }
  };

  console.log('🎨 About component render - loading:', loading, 'settings:', settings);

  if (loading) {
    console.log('⏳ Showing loading skeleton');
    return (
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          </div>
        </div>
      </section>
    );
  }
  
  // Ensure settings exists (fallback to defaults if somehow null)
  const displaySettings = settings || {
    title: 'About Resti Kiryandongo CBO',
    intro: 'Founded with a mission to empower and uplift communities in Kiryandongo District.',
    mission: 'To empower communities in Kiryandongo through sustainable development programs.',
    vision: 'A thriving, self-sustaining community.',
    values: [],
    story: []
  };
  
  console.log('🎯 About component rendering with displaySettings:', displaySettings);

  return (
    <section id="about" className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            {displaySettings.title}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            {displaySettings.intro}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className={`group bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: '200ms' }}>
            <h3 className="text-2xl text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">Our Mission</h3>
            <p className="text-gray-700 leading-relaxed">
              {displaySettings.mission}
            </p>
          </div>
          <div className={`group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '300ms' }}>
            <h3 className="text-2xl text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">Our Vision</h3>
            <p className="text-gray-700 leading-relaxed">
              {displaySettings.vision}
            </p>
          </div>
        </div>

        {/* Values */}
        {displaySettings.values && displaySettings.values.length > 0 && (
          <div className="mb-12">
            <h3 className={`text-2xl text-gray-900 text-center mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>Our Core Values</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displaySettings.values.map((value, index) => {
              const IconComponent = iconMap[value.icon] || Heart;
              return (
                <div
                  key={index}
                  className={`group p-6 border border-gray-200 rounded-xl hover:shadow-xl hover:border-emerald-200 hover:-translate-y-2 transition-all duration-500 bg-white ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: isVisible ? getStaggerDelay(index, 100) : '0ms' }}
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:scale-110 transition-all duration-300">
                    <IconComponent className="text-emerald-600 group-hover:text-white transition-colors" size={24} />
                  </div>
                  <h4 className="text-lg text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{value.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* Story */}
        {displaySettings.story && displaySettings.story.length > 0 && (
          <div className={`bg-gray-50 p-8 lg:p-12 rounded-2xl hover:shadow-lg transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '800ms' }}>
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl text-gray-900 mb-6">Our Story</h3>
              {displaySettings.story.map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
