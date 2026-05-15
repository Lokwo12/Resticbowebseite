import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quote, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

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

export function ImpactStories() {
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

  if (loading) {
    return (
      <section id="impact" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="impact" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-emerald-600" size={32} />
            <h2 className="text-emerald-600">{sectionSettings.title}</h2>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {sectionSettings.description}
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 border border-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Stories Grid */}
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredStories.map((story) => (
              <Card key={story.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="md:flex">
                  {story.image && (
                    <div className="md:w-1/3 h-64 md:h-auto">
                      <img
                        src={story.image}
                        alt={story.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 md:w-2/3">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-gray-900 mb-1">{story.name}</h3>
                        <p className="text-sm text-emerald-600 mb-2">{story.title}</p>
                      </div>
                      <Quote className="text-emerald-200 flex-shrink-0" size={32} />
                    </div>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {story.story}
                    </p>
                    
                    {story.impact && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-4">
                        <p className="text-sm text-emerald-900">
                          <strong className="block mb-1">Impact:</strong>
                          {story.impact}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{story.category}</Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(story.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No stories available yet. Check back soon!</p>
          </div>
        )}

        {/* View All Stories Button */}
        <div className="text-center mt-12">
          <Link to="/stories">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-xl inline-flex items-center gap-2">
              <span>View All Stories</span>
              <Heart size={20} />
            </button>
          </Link>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="mb-4">Want to Share Your Story?</h3>
          <p className="mb-6 text-emerald-50 max-w-2xl mx-auto">
            Your story could inspire others and show the power of community support. 
            We'd love to hear how Resti Kiryandongo CBO has impacted your life.
          </p>
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-emerald-600 px-8 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
}
