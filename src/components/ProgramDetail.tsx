import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Share2, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useDonationModal } from './DonationModal';

interface Program {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  createdAt: string;
}

export function ProgramDetail() {
  const { open: openDonationModal } = useDonationModal();
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const programs = data.programs || [];
          
          // Find the program with the matching ID
          const found = programs.find((p: any) => p.id === id || p.key === id);
          
          if (found) {
            setProgram({
              id: found.key || found.id,
              title: found.value?.title || found.title || '',
              description: found.value?.description || found.description || '',
              image: found.value?.image || found.image || '',
              category: found.value?.category || found.category || 'general',
              createdAt: found.value?.createdAt || found.createdAt || new Date().toISOString(),
            });
          }
        }
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
      <div className="bg-gray-50 min-h-screen pb-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl text-gray-900 mb-4">Program Not Found</h2>
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
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Navigation */}
        <Link to="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Programs
        </Link>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {/* Hero Image */}
          <div className="relative h-52 sm:h-96 bg-gray-200">
            {program.image ? (
              <img
                src={program.image}
                alt={program.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-100">
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
                <span>Added on {new Date(program.createdAt).toLocaleDateString()}</span>
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
