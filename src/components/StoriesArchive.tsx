import { useState, useEffect } from 'react';
import { Quote, Heart, Tag } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { LoadingScreen } from './LoadingScreen';

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

export function StoriesArchive() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sectionSettings, setSectionSettings] = useState({ title: 'Impact Stories', description: 'Read inspiring stories from the lives we\'ve touched and the communities we\'ve transformed.' });

  useEffect(() => {
    fetchStories();
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

      if (response.ok) {
        const data = await response.json();
        if (data.settings?.sections?.stories) {
          setSectionSettings(data.settings.sections.stories);
        }
      }
    } catch (err) {
      console.error('Error fetching section settings:', err);
    }
  };

  const fetchStories = async () => {
    try {
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
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(stories.map(s => s.category)))];
  const filteredStories = selectedCategory === 'all' 
    ? stories 
    : stories.filter(s => s.category === selectedCategory);

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-12 sm:pt-20 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{sectionSettings.title}</h1>
          <p className="text-emerald-50 max-w-3xl mx-auto text-lg">
            {sectionSettings.description}
          </p>
        </div>
      </div>

      {/* Main Content (Overlapping Card Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 border border-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Stories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Stories Grid */}
          {filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStories.map((story) => (
                <Card key={story.id} className="overflow-hidden hover:shadow-xl transition-all duration-500 bg-white border border-gray-100 group flex flex-col">
                  {/* Uniform image area */}
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 flex-shrink-0">
                    {story.image ? (
                      <img
                        src={story.image}
                        alt={story.name}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Quote className="text-white/30" size={64} />
                      </div>
                    )}
                  </div>

                  {/* Card content */}
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors duration-300 line-clamp-1">{story.name}</h3>
                        <p className="text-sm text-emerald-600">{story.title}</p>
                      </div>
                      <Quote className="text-emerald-200 flex-shrink-0" size={28} />
                    </div>

                    <p className="text-gray-600 mb-4 leading-relaxed text-sm line-clamp-4 flex-grow">
                      {story.story}
                    </p>

                    {story.impact && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-4">
                        <p className="text-sm text-emerald-900">
                          <strong className="block mb-1">Impact:</strong>
                          {story.impact}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                        <Tag size={12} className="mr-1" />
                        {story.category.charAt(0).toUpperCase() + story.category.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(story.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No stories available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
