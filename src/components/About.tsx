import { Heart, Users, Target, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { motion } from 'framer-motion';

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

const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  title: 'About Refugee Empowerment For Sustainable Transformation Initiative CBO (RESTI)',
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
    'Refugee Empowerment For Sustainable Transformation Initiative CBO (RESTI) was born from a shared vision among community members who recognized the need for organized, sustainable development initiatives in our district. What started as small-scale educational support has grown into a comprehensive community development organization.',
    'Today, we work closely with local government, international partners, and most importantly, the communities we serve, to identify needs, develop solutions, and implement programs that create lasting positive change. Our grassroots approach ensures that every initiative is community-driven and culturally appropriate.'
  ]
};

export function About() {
  const [settings, setSettings] = useState<AboutSettings>(DEFAULT_ABOUT_SETTINGS);

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
          signal: AbortSignal.timeout(6000),
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      
      if (data.settings?.about) {
        const aboutData = data.settings.about;
        setSettings({
          title: aboutData.title || DEFAULT_ABOUT_SETTINGS.title,
          intro: aboutData.intro || DEFAULT_ABOUT_SETTINGS.intro,
          mission: aboutData.mission || DEFAULT_ABOUT_SETTINGS.mission,
          vision: aboutData.vision || DEFAULT_ABOUT_SETTINGS.vision,
          values: (aboutData.values && aboutData.values.length > 0) ? aboutData.values : DEFAULT_ABOUT_SETTINGS.values,
          story: (aboutData.story && aboutData.story.length > 0) ? aboutData.story : DEFAULT_ABOUT_SETTINGS.story
        });
      }
    } catch {
      // Default settings already in state — no action needed
    }
  };

  const displaySettings = settings;

  return (
    <section id="about" className="section-spacing-lg bg-slate-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro (Who we are) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-emerald-50/20 p-8 lg:p-12 rounded-3xl border border-slate-100 shadow-sm hover:shadow-premium-soft transition-all duration-300 mb-16"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Heart size={14} className="fill-emerald-600 text-emerald-600" />
              Community Based Organization
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold font-heading tracking-tight text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 hidden md:block"></span>
              {displaySettings.title}
            </h2>
            <div className="space-y-6">
              <p className="text-xl text-gray-600 leading-relaxed font-normal">
                {displaySettings.intro}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="group bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl shadow-sm hover:shadow-premium-soft hover:-translate-y-1 transition-all duration-300"
          >
            <h3 className="text-3xl text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">Our Mission</h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              {displaySettings.mission}
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-sm hover:shadow-premium-soft hover:-translate-y-1 transition-all duration-300"
          >
            <h3 className="text-3xl text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">Our Vision</h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              {displaySettings.vision}
            </p>
          </motion.div>
        </div>

        {/* The Way We Work (Replaced Core Values) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-8 lg:p-12 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-premium-soft transition-all duration-300 mb-12"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold font-heading tracking-tight text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              The Way We Work
            </h3>
            <div className="space-y-6 text-gray-700 text-lg leading-relaxed font-normal">
              <p>
                Our values guide how we carry out our daily work and how we interact with each other, with communities, and with partners.
              </p>
              <p>
                <strong className="text-emerald-800">We value people.</strong><br />
                All people have inherent dignity and potential. We place communities at the centre of our work, treating everyone with respect regardless of ethnicity, gender, religion, age, or displacement status. We seek to enable people to live normal and peaceful lives, develop their potential, and build hope for the future.
              </p>
              <p>
                <strong className="text-emerald-800">We are committed.</strong><br />
                We aim for lasting change, not short-term assistance. We stay with communities beyond the initial crisis, supporting them as they move from relief to recovery and from potential to sustainable transformation.
              </p>
              <p>
                <strong className="text-emerald-800">We are good stewards.</strong><br />
                We use the resources entrusted to us in the most responsible, efficient, and transparent way. We are accountable to the communities we serve and to the partners and donors who support our work.
              </p>
              <p>
                <strong className="text-emerald-800">We serve with integrity.</strong><br />
                We uphold high standards of personal and organizational integrity. We are open and honest in how we deal and communicate with stakeholders, and we treat people with respect in all our interactions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Story */}
        {displaySettings.story && displaySettings.story.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-emerald-50/20 p-8 lg:p-12 rounded-3xl border border-slate-100 shadow-sm hover:shadow-premium-soft transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold font-heading tracking-tight text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Our Story
              </h3>
              <div className="space-y-6">
                {displaySettings.story.map((paragraph, index) => (
                  <p key={index} className="text-gray-600 text-lg md:text-xl leading-relaxed font-normal">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Trust & Certifications Strip */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="mt-8 md:mt-14 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: '🏛️', label: 'Registered CBO', sub: 'Uganda NGO Bureau' },
            { icon: '🌍', label: '2,500+ Lives', sub: 'Changed & Counting' },
            { icon: '💯', label: '100% Transparent', sub: 'Annual Reports Published' },
            { icon: '🤝', label: 'Community-Led', sub: 'Locally Driven Solutions' },
          ].map((item, index) => (
            <motion.div 
              key={item.label} 
              variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.4 } } }}
              className="flex flex-col items-center text-center bg-emerald-50 border border-emerald-100 rounded-2xl py-5 px-4"
            >
              <span className="text-3xl mb-2">{item.icon}</span>
              <span className="text-base font-bold font-heading tracking-tight text-emerald-800">{item.label}</span>
              <span className="text-sm text-emerald-600 mt-0.5">{item.sub}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
