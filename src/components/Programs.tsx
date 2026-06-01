import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { motion } from 'framer-motion';

interface Program {
  key: string;
  value: {
    title: string;
    description: string;
    image: string;
    category: string;
    createdAt: string;
  };
}

const FALLBACK_PROGRAMS: Program[] = [
  {
    key: 'education',
    value: {
      title: 'Education & Literacy',
      description: 'Providing quality education support, school supplies, and tutoring to children and young adults in Kiryandongo District to unlock their potential.',
      image: 'https://images.unsplash.com/photo-1666281269793-da06484657e8?w=600&q=80',
      category: 'Education',
      createdAt: '',
    },
  },
  {
    key: 'healthcare',
    value: {
      title: 'Community Health & Nutrition',
      description: 'Running mobile health clinics, maternal care programmes, and nutrition campaigns to improve health outcomes for vulnerable families.',
      image: 'https://images.unsplash.com/photo-1706806595136-5afefb45da1a?w=600&q=80',
      category: 'Healthcare',
      createdAt: '',
    },
  },
  {
    key: 'livelihoods',
    value: {
      title: 'Sustainable Livelihoods',
      description: 'Equipping households with vocational skills, microfinance access, and agricultural training to achieve economic independence.',
      image: 'https://images.unsplash.com/photo-1761466977752-de51b3ecce84?w=600&q=80',
      category: 'Livelihoods',
      createdAt: '',
    },
  },
  {
    key: 'wash',
    value: {
      title: 'Clean Water & Sanitation (WASH)',
      description: 'Building boreholes, latrines, and hygiene education hubs to ensure safe water and dignified sanitation for every household.',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
      category: 'Community',
      createdAt: '',
    },
  },
  {
    key: 'women',
    value: {
      title: 'Women Empowerment',
      description: 'Supporting women through savings groups, legal aid, gender-based violence prevention, and leadership training programmes.',
      image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&q=80',
      category: 'Community',
      createdAt: '',
    },
  },
  {
    key: 'youth',
    value: {
      title: 'Youth Development',
      description: 'Mentorship, sports, arts, and civic engagement programmes that build confidence and purpose in the next generation.',
      image: 'https://images.unsplash.com/photo-1641569707854-c80945fb4719?w=600&q=80',
      category: 'Education',
      createdAt: '',
    },
  },
];

export function Programs() {
  const [programs, setPrograms] = useState<Program[]>(FALLBACK_PROGRAMS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionSettings, setSectionSettings] = useState({ title: 'Our Programs', description: 'We run comprehensive programs designed to address the most pressing needs in our community, creating pathways to opportunity and sustainable development.' });

  useEffect(() => {
    fetchPrograms();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.sections?.programs) {
          setSectionSettings(data.settings.sections.programs);
        }
      }
    } catch (err) {
      console.warn('Settings API unavailable.', err);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const fetched: Program[] = data.programs || [];
      // Only replace fallback if the API actually returned programs
      if (fetched.length > 0) setPrograms(fetched);
    } catch (err) {
      // API unreachable — fallback data already set, so just log silently
      console.warn('Programs API unavailable, using fallback data.', err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <section id="programs" className="section-spacing-lg bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
            <BookOpen size={14} />
            What We Do
          </div>
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            {sectionSettings.title}
          </h2>
          <p className="text-xl text-gray-600">
            {sectionSettings.description}
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 animate-[fadeIn_0.3s_ease-out]">
            {error}
          </div>
        )}

        {/* Programs Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {programs.filter(p => p && p.value).map((program, index) => (
            <motion.div
              key={program.key}
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="card-lift group bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-premium-soft transition-all duration-300"
            >
              {program.value.image && (
                <div className="relative aspect-video overflow-hidden bg-slate-100 border-b border-slate-100 flex items-center justify-center">
                  <img
                    src={program.value.image}
                    alt={program.value.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
              )}
              <div className="p-6">
                <div className={`category-chip mb-3 ${
                  program.value.category?.toLowerCase().includes('health') ? 'chip-health' :
                  program.value.category?.toLowerCase().includes('educ') ? 'chip-education' :
                  program.value.category?.toLowerCase().includes('livelihood') || program.value.category?.toLowerCase().includes('agri') ? 'chip-livelihood' :
                  'chip-community'
                }`}>
                  {program.value.category}
                </div>
                <h3 className="text-2xl text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                  {program.value.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-4">
                  {program.value.description}
                </p>
                <Link 
                  to={`/programs/${program.key}`}
                  className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 group/link"
                >
                  Learn More
                  <span className="group-hover/link:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {programs.length === 0 && !error && (
          <div className="text-center py-12 animate-[fadeIn_0.5s_ease-out]">
            <p className="text-lg text-gray-500">No programs available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
