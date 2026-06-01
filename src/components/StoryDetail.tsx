import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Heart, Quote } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { LoadingScreen } from './LoadingScreen';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useDonationModal } from './DonationModal';

interface Story {
  id: string;
  name: string;
  title: string;
  story: string;
  image: string;
  category: string;
  date: string;
  impact: string;
}

export function StoryDetail() {
  const { open: openDonationModal } = useDonationModal();
  const { id } = useParams<{ id: string }>();
  const [storyData, setStoryData] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const stories = data.stories || [];
          
          // Find the story with the matching ID
          const found = stories.find((item: any) => item.key === id || item.id === id);
          
          if (found) {
            setStoryData({
              id: found.key || found.id,
              name: found.value?.name || found.name || '',
              title: found.value?.title || found.title || '',
              story: found.value?.story || found.story || '',
              category: found.value?.category || found.category || 'general',
              date: found.value?.timestamp || found.value?.date || found.date || new Date().toISOString(),
              image: found.value?.image || found.image || '',
              impact: found.value?.impact || found.impact || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching story detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStory();
    }
  }, [id]);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) return <LoadingScreen />;

  if (!storyData) {
    return (
      <div className="bg-gray-50 min-h-screen pt-28 sm:pt-36 pb-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl text-gray-900 mb-4">Story Not Found</h2>
          <p className="text-gray-600 mb-8">The impact story you are looking for does not exist or has been removed.</p>
          <Link to="/stories">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors">
              Back to Stories
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-28 sm:pt-36 pb-24">
      <SEO 
        title={`${storyData.title} | Impact Story`} 
        description={storyData.impact || storyData.story.substring(0, 150)} 
        image={storyData.image} 
        type="article"
      />
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Navigation */}
        <Link to="/stories" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Impact Stories
        </Link>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {/* Story Image */}
          {storyData.image ? (
            <div className="relative h-[28rem] bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={storyData.image}
                alt={storyData.name}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                <Badge className="bg-emerald-500/90 text-white hover:bg-emerald-600 mb-4 border-none shadow-sm backdrop-blur-sm">
                  <Tag size={12} className="mr-1" />
                  {storyData.category.charAt(0).toUpperCase() + storyData.category.slice(1)}
                </Badge>
                
                <h1 className="text-3xl md:text-5xl font-bold font-heading mb-2 leading-tight drop-shadow-md">
                  {storyData.title}
                </h1>
                <p className="text-emerald-300 text-xl font-medium drop-shadow-sm">
                  {storyData.name}
                </p>
              </div>
            </div>
          ) : (
             <div className="bg-emerald-900 p-8 md:p-12 text-white">
                <Badge className="bg-emerald-500/90 text-white hover:bg-emerald-600 mb-4 border-none shadow-sm backdrop-blur-sm">
                  <Tag size={12} className="mr-1" />
                  {storyData.category.charAt(0).toUpperCase() + storyData.category.slice(1)}
                </Badge>
                
                <h1 className="text-3xl md:text-5xl font-bold font-heading mb-2 leading-tight drop-shadow-md">
                  {storyData.title}
                </h1>
                <p className="text-emerald-300 text-xl font-medium drop-shadow-sm">
                  {storyData.name}
                </p>
             </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
              <Calendar size={16} />
              <span>Published on {formatDate(storyData.date)}</span>
            </div>

            <div className="prose prose-emerald max-w-none text-gray-700 leading-relaxed text-lg mb-10 whitespace-pre-wrap">
              <Quote className="text-emerald-100 w-16 h-16 float-left mr-4 -mt-2" />
              {storyData.story}
            </div>

            {/* Impact Section */}
            {storyData.impact && (
              <div className="mt-8 bg-emerald-50 border-l-4 border-emerald-500 p-6 md:p-8 rounded-r-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="text-emerald-600" size={24} fill="currentColor" />
                  <h3 className="text-xl font-bold text-emerald-900 m-0">The Impact</h3>
                </div>
                <p className="text-emerald-800 text-lg m-0">
                  {storyData.impact}
                </p>
              </div>
            )}

            {/* CTA Box */}
            <div className="mt-12 bg-slate-900 rounded-xl p-8 text-center md:flex md:items-center md:justify-between md:text-left shadow-lg overflow-hidden relative">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
              
              <div className="relative z-10 md:pr-8">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Heart size={20} className="text-emerald-400" fill="currentColor" />
                  <h3 className="text-white m-0 font-bold text-2xl font-heading tracking-tight">Create More Stories Like This</h3>
                </div>
                <p className="text-slate-300 text-base m-0 max-w-lg">
                  Your donation directly funds the programs that change lives in Kiryandongo. Help us write the next success story.
                </p>
              </div>
              <div className="mt-6 md:mt-0 shrink-0 relative z-10">
                <Button 
                  onClick={openDonationModal}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-4 h-auto text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 rounded-xl"
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
