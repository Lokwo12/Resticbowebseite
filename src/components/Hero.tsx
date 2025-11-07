import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from 'figma:asset/2b36c5cb8ddf5552ba2d3e612fd68401a7bb193e.png';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface HeroSettings {
  badgeText: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  imageUrl: string;
  stats: Array<{ value: string; label: string }>;
}

const fallbackHeroSettings: HeroSettings = {
  badgeText: 'Making a Difference in Kiryandongo',
  title: 'Empowering Communities Through Action',
  subtitle:
    'Resti Kiryandongo CBO is dedicated to improving lives through education, healthcare, and community development initiatives in Kiryandongo District, Uganda.',
  primaryButtonText: 'Donate Now',
  secondaryButtonText: 'Learn More',
  imageUrl: logo,
  stats: [
    { value: '500+', label: 'Families Supported' },
    { value: '10+', label: 'Active Programs' },
    { value: '50+', label: 'Volunteers' },
  ],
};

export function Hero() {
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);

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
      const heroData = data.settings?.hero ?? {};
      const trimmedImageUrl = typeof heroData.imageUrl === 'string' ? heroData.imageUrl.trim() : '';
      const sanitizedImageUrl =
        trimmedImageUrl &&
        !trimmedImageUrl.toLowerCase().includes('placeholder') &&
        !trimmedImageUrl.includes('unsplash.com')
          ? trimmedImageUrl
          : fallbackHeroSettings.imageUrl;

      setSettings({
        ...fallbackHeroSettings,
        ...heroData,
        imageUrl: sanitizedImageUrl,
      });
    } catch (error) {
      console.error('Error fetching hero settings:', error);
      setSettings(fallbackHeroSettings);
    } finally {
      setLoading(false);
    }
  };

  const scrollToDonate = () => {
    const element = document.getElementById('donate');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAbout = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading || !settings) {
    return (
      <section id="home" className="pt-16 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-4"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="pt-16 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 animate-[fadeInUp_0.8s_ease-out]">
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm animate-[fadeIn_0.5s_ease-out] hover:scale-105 transition-transform duration-300">
              {settings.badgeText}
            </div>
            <h1 className="text-4xl lg:text-6xl text-gray-900 animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
              {settings.title}
            </h1>
            <p className="text-xl text-gray-600 animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
              {settings.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
              <button
                onClick={scrollToDonate}
                className="group bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5"
              >
                {settings.primaryButtonText}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button
                onClick={scrollToAbout}
                className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-lg hover:bg-emerald-50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                {settings.secondaryButtonText}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 animate-[fadeInUp_0.8s_ease-out_0.8s_both]">
              {settings.stats.map((stat, index) => (
                <div key={index} className="group hover:scale-105 transition-transform duration-300">
                  <div className="text-3xl text-emerald-600 group-hover:text-emerald-700 transition-colors">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative animate-[fadeInRight_0.8s_ease-out_0.4s_both]">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-500">
              <img
                src={settings.imageUrl}
                alt="Community empowerment"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg hidden lg:block animate-[fadeIn_0.8s_ease-out_1s_both] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="text-3xl">🤝</div>
              <div className="mt-2">
                <div className="text-sm text-gray-600">Community Impact</div>
                <div className="text-emerald-600">Growing Daily</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
