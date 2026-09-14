import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { LoadingScreen } from './LoadingScreen';
import { useDonationModal } from './DonationModalContext';

interface Program {
  key: string;
  value: {
    id?: string;
    title: string;
    description: string;
    image: string;
    category: string;
    createdAt?: string;
  };
}

const FALLBACK_PROGRAMS: Program[] = [
  {
    key: 'education',
    value: {
      id: 'education',
      title: 'Education & Literacy',
      description: 'Providing quality education support, school supplies, and tutoring to children and young adults in Kiryandongo District to unlock their potential.',
      image: 'https://images.unsplash.com/photo-1666281269793-da06484657e8?w=600&q=80',
      category: 'Education',
      createdAt: '2026-01-01',
    },
  },
  {
    key: 'healthcare',
    value: {
      id: 'healthcare',
      title: 'Community Health & Nutrition',
      description: 'Running mobile health clinics, maternal care programmes, and nutrition campaigns to improve health outcomes for vulnerable families.',
      image: 'https://images.unsplash.com/photo-1706806595136-5afefb45da1a?w=600&q=80',
      category: 'Healthcare',
      createdAt: '2026-01-01',
    },
  },
  {
    key: 'livelihoods',
    value: {
      id: 'livelihoods',
      title: 'Sustainable Livelihoods',
      description: 'Equipping households with vocational skills, microfinance access, and agricultural training to achieve economic independence.',
      image: 'https://images.unsplash.com/photo-1761466977752-de51b3ecce84?w=600&q=80',
      category: 'Livelihoods',
      createdAt: '2026-01-01',
    },
  },
  {
    key: 'wash',
    value: {
      id: 'wash',
      title: 'Clean Water & Sanitation (WASH)',
      description: 'Building boreholes, latrines, and hygiene education hubs to ensure safe water and dignified sanitation for every household.',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
      category: 'Community',
      createdAt: '2026-01-01',
    },
  },
  {
    key: 'women',
    value: {
      id: 'women',
      title: 'Women Empowerment',
      description: 'Supporting women through savings groups, legal aid, gender-based violence prevention, and leadership training programmes.',
      image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&q=80',
      category: 'Community',
      createdAt: '2026-01-01',
    },
  },
  {
    key: 'youth',
    value: {
      id: 'youth',
      title: 'Youth Development',
      description: 'Mentorship, sports, arts, and civic engagement programmes that build confidence and purpose in the next generation.',
      image: 'https://images.unsplash.com/photo-1641569707854-c80945fb4719?w=600&q=80',
      category: 'Education',
      createdAt: '2026-01-01',
    },
  },
];

export function ProgramsPage() {
  const { open: openDonationModal } = useDonationModal();
  const [programs, setPrograms] = useState<Program[]>(FALLBACK_PROGRAMS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const fetched: Program[] = data.programs || [];
        if (fetched.length > 0) {
          setPrograms(fetched);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live programs, displaying default programs.', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(programs.map(p => (p.value?.category || 'general').toLowerCase())))];

  const filteredPrograms = programs.filter(program => {
    if (!program || !program.value) return false;
    const categoryMatch = selectedCategory === 'all' || (program.value.category || '').toLowerCase() === selectedCategory;
    const titleMatch = (program.value.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (program.value.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && (titleMatch || descMatch);
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-slate-50 min-h-screen pb-24" style={{ paddingTop: '120px' }}>
      <SEO 
        title="Our Programs | RESTI — Refugee Empowerment For Sustainable Transformation Initiative" 
        description="Explore our community programs in education, healthcare, sustainable livelihoods, and community development in Kiryandongo District, Uganda." 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <BookOpen size={16} />
            Our Initiatives
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Community-Driven Programs
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            We deliver targeted, high-impact programs designed to empower vulnerable families, refugees, and host communities across Kiryandongo District.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Programs Grid */}
        {filteredPrograms.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program) => {
              const programId = (program.value?.id || program.key || '').replace(/^program:/, '');
              return (
                <div
                  key={program.key || programId}
                  className="card-lift group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                >
                  {program.value.image ? (
                    <div className="relative aspect-video overflow-hidden bg-slate-100 border-b border-slate-100 flex items-center justify-center">
                      <img
                        src={program.value.image}
                        alt={program.value.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-emerald-50 border-b border-emerald-100 flex items-center justify-center text-emerald-600">
                      <BookOpen size={48} />
                    </div>
                  )}

                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 mb-3">
                        {program.value.category || 'General'}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                        {program.value.title}
                      </h2>
                      <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                        {program.value.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to={`/programs/${programId}`}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm inline-flex items-center gap-1.5 group/link"
                      >
                        Read Full Program
                        <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                      </Link>

                      <button
                        type="button"
                        onClick={openDonationModal}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Donate to support this program"
                      >
                        <Heart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No programs found</h3>
            <p className="text-sm text-slate-500 mb-6">Try adjusting your search query or selecting a different category filter.</p>
            <button
              type="button"
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Support Banner */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">Want to support these programs?</h3>
            <p className="text-emerald-100 text-sm sm:text-base max-w-xl">
              100% of your public contributions go straight to field resources, tools, education supplies, and medical equipment.
            </p>
          </div>
          <button
            type="button"
            onClick={openDonationModal}
            className="px-8 py-3.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            Make a Donation
          </button>
        </div>
      </div>
    </div>
  );
}
