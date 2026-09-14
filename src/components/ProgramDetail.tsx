import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Share2, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { LoadingScreen } from './LoadingScreen';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useDonationModal } from './DonationModalContext';

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  createdAt: string;
}

const FALLBACK_PROGRAMS: Record<string, Program> = {
  education: {
    id: 'education',
    title: 'Education & Literacy',
    description: 'Providing quality education support, school supplies, and tutoring to children and young adults in Kiryandongo District to unlock their potential.',
    image: 'https://images.unsplash.com/photo-1666281269793-da06484657e8?w=600&q=80',
    category: 'Education',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  healthcare: {
    id: 'healthcare',
    title: 'Community Health & Nutrition',
    description: 'Running mobile health clinics, maternal care programmes, and nutrition campaigns to improve health outcomes for vulnerable families.',
    image: 'https://images.unsplash.com/photo-1706806595136-5afefb45da1a?w=600&q=80',
    category: 'Healthcare',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  livelihoods: {
    id: 'livelihoods',
    title: 'Sustainable Livelihoods',
    description: 'Equipping households with vocational skills, microfinance access, and agricultural training to achieve economic independence.',
    image: 'https://images.unsplash.com/photo-1761466977752-de51b3ecce84?w=600&q=80',
    category: 'Livelihoods',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  wash: {
    id: 'wash',
    title: 'Clean Water & Sanitation (WASH)',
    description: 'Building boreholes, latrines, and hygiene education hubs to ensure safe water and dignified sanitation for every household.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
    category: 'Community',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  women: {
    id: 'women',
    title: 'Women Empowerment',
    description: 'Supporting women through savings groups, legal aid, gender-based violence prevention, and leadership training programmes.',
    image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&q=80',
    category: 'Community',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  youth: {
    id: 'youth',
    title: 'Youth Development',
    description: 'Mentorship, sports, arts, and civic engagement programmes that build confidence and purpose in the next generation.',
    image: 'https://images.unsplash.com/photo-1641569707854-c80945fb4719?w=600&q=80',
    category: 'Education',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

export function ProgramDetail() {
  const { open: openDonationModal } = useDonationModal();
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true);
        const cleanId = (id || '').replace(/^program:/, '').trim().toLowerCase();
        let matchedProgram: Program | null = FALLBACK_PROGRAMS[cleanId] || null;

        // Try single program API route
        try {
          const singleRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${encodeURIComponent(cleanId)}`,
            {
              headers: { Authorization: `Bearer ${publicAnonKey}` },
              signal: AbortSignal.timeout(6000),
            }
          );
          if (singleRes.ok) {
            const singleData = await singleRes.json();
            if (singleData.program) {
              const p = singleData.program;
              matchedProgram = {
                id: (p.value?.id || p.key || cleanId).replace(/^program:/, ''),
                title: p.value?.title || p.title || '',
                description: p.value?.description || p.description || '',
                image: p.value?.image || p.image || '',
                category: p.value?.category || p.category || 'general',
                createdAt: p.value?.createdAt || p.createdAt || new Date().toISOString(),
              };
            }
          }
        } catch {
          // Fall through to full list search
        }

        // If not found yet, fetch full list from API
        if (!matchedProgram) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
            {
              headers: { Authorization: `Bearer ${publicAnonKey}` },
              signal: AbortSignal.timeout(6000),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const programs = data.programs || [];
            
            const found = programs.find((p: any) => {
              const pKey = (p.key || '').replace(/^program:/, '').trim().toLowerCase();
              const pId = (p.value?.id || p.id || '').replace(/^program:/, '').trim().toLowerCase();
              const pTitle = (p.value?.title || p.title || '').trim().toLowerCase().replace(/\s+/g, '-');
              return (
                pKey === cleanId ||
                pId === cleanId ||
                pTitle === cleanId ||
                p.key === id ||
                p.id === id ||
                p.value?.id === id
              );
            });
            
            if (found) {
              matchedProgram = {
                id: (found.value?.id || found.key || cleanId).replace(/^program:/, ''),
                title: found.value?.title || found.title || '',
                description: found.value?.description || found.description || '',
                image: found.value?.image || found.image || '',
                category: found.value?.category || found.category || 'general',
                createdAt: found.value?.createdAt || found.createdAt || new Date().toISOString(),
              };
            }
          }
        }

        setProgram(matchedProgram);
      } catch (err) {
        console.error('Error fetching program detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProgram();
    }
  }, [id]);

  if (loading) return <LoadingScreen />;

  if (!program) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24 flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <div className="max-w-md mx-auto px-4 text-center">
          <h2 className="text-2xl text-gray-900 mb-4 font-bold">Program Not Found</h2>
          <p className="text-gray-600 mb-8">The program you are looking for does not exist or has been removed.</p>
          <Link to="/">
            <Button>
              <ArrowLeft size={18} className="mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24" style={{ paddingTop: '120px' }}>
      <SEO 
        title={`${program.title} | Program`} 
        description={program.description.substring(0, 150)} 
        image={program.image} 
        type="website"
      />
      <div className="max-w-6xl mx-auto px-4">
        {/* Navigation */}
        <Link to="/#programs" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Programs
        </Link>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {/* Hero Image */}
          <div className="relative h-52 sm:h-96 bg-slate-950 flex items-center justify-center overflow-hidden">
            {program.image ? (
              <img
                src={program.image}
                alt={program.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-950">
                <Heart size={80} className="text-emerald-500" />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
              <Badge className="bg-emerald-600 text-white mb-3">
                <Tag size={12} className="mr-1" />
                {program.category.charAt(0).toUpperCase() + program.category.slice(1)}
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-bold text-white">{program.title}</h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {program.createdAt && !isNaN(new Date(program.createdAt).getTime())
                    ? `Added on ${new Date(program.createdAt).toLocaleDateString()}`
                    : 'Ongoing Program'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 size={16} className="cursor-pointer hover:text-emerald-600" />
                <span>Share</span>
              </div>
            </div>

            <div className="prose prose-emerald max-w-none text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
              {program.description}
            </div>

            {/* CTA Box */}
            <div className="mt-12 bg-emerald-50 rounded-xl p-8 text-center md:flex md:items-center md:justify-between md:text-left">
              <div>
                <h3 className="text-emerald-900 mb-2">Support This Program</h3>
                <p className="text-emerald-700 text-sm">Your donation directly funds this initiative and creates lasting impact.</p>
              </div>
              <div className="mt-6 md:mt-0">
                <Button 
                  onClick={openDonationModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 h-auto text-base"
                >
                  Donate Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
