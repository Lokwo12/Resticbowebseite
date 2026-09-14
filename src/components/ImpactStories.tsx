import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quote, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useScrollAnimation, getStaggerDelay } from '../utils/animations';

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

const FALLBACK_STORIES: Story[] = [
  {
    id: 'story-grace',
    name: 'Grace Akello',
    title: 'Tailoring Graduate & Micro-Enterprise Owner',
    story: 'After arriving in Kiryandongo with four children, I had no stable income. Through RESTI\'s vocational training, I learned tailoring, received a starter kit, and now run a small business that pays for my children\'s school fees and healthcare.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    category: 'Livelihoods',
    date: '2024-02-15',
    impact: 'Self-reliant enterprise supporting a household of 5'
  },
  {
    id: 'story-emmanuel',
    name: 'Emmanuel Deng',
    title: 'Digital Literacy & Peace Ambassador',
    story: 'RESTI\'s youth resource center opened the door to computer skills and peace dialogue. Today, I mentor other refugee youth in digital literacy and help bridge cross-community ties across the settlement.',
    image: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&auto=format&fit=crop&q=80',
    category: 'Education',
    date: '2024-03-10',
    impact: 'Trained over 40 youth in basic computing and community leadership'
  },
  {
    id: 'story-mariam',
    name: 'Mariam Nyayan',
    title: 'VSLA Group Treasurer & Farmer',
    story: 'Joining RESTI\'s Village Savings and Loan Association gave our women\'s group access to collective micro-credit. We leased land, planted drought-resilient crops, and secured food security for our families.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    category: 'Women Empowerment',
    date: '2024-01-22',
    impact: '25-woman cooperative with 100% micro-loan repayment'
  }
];

export function ImpactStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sectionSettings, setSectionSettings] = useState({ title: 'Impact Stories', description: 'Read inspiring stories from the lives we\'ve touched and the communities we\'ve transformed.' });
  const { ref, isVisible } = useScrollAnimation({ startVisible: true });

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
        const rawStories = data.stories || [];
        const validStories = rawStories.filter((s: Story) => 
          !['story:1', 'story:2', '1', '2'].includes(s.id) &&
          (!s.name || !s.name.toLowerCase().includes('john'))
        );
        setStories(validStories.length > 0 ? validStories : FALLBACK_STORIES);
      } else {
        setStories(FALLBACK_STORIES);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories(FALLBACK_STORIES);
    } finally {
      setLoading(false);
    }
  };

  const displayStories = stories.length > 0 ? stories : FALLBACK_STORIES;
  const categories = ['all', ...Array.from(new Set(displayStories.map(s => s.category)))];
  const filteredStories = selectedCategory === 'all' 
    ? displayStories 
    : displayStories.filter(s => s.category === selectedCategory);

  if (loading) {
    return (
      <section id="impact" className="section-spacing-lg bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="impact" ref={ref} className={`relative section-spacing-lg transition-all duration-700 overflow-hidden bg-[#0A192F] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      
      {/* Dignified Ambient Background with subtle glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            <Heart size={14} fill="currentColor" />
            Real Impact & Voices
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-6">
            {sectionSettings.title}
          </h2>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
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
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-all duration-300'
                    : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Stories Grid */}
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((story) => (
              <Card key={story.id} className="overflow-hidden hover:shadow-premium-soft hover:-translate-y-1 transition-all duration-300 group flex flex-col border-0 shadow-md rounded-2xl" style={{ transitionDelay: getStaggerDelay(filteredStories.indexOf(story)) }}>
                <Link to={`/stories/${story.id}`} className="block flex-grow flex flex-col">
                  {/* Uniform image area */}
                <div className="relative h-52 overflow-hidden bg-slate-50 border-b border-slate-100 flex-shrink-0 flex items-center justify-center">
                  {story.image ? (
                    <img
                      src={story.image}
                      alt={story.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Quote className="text-white/30" size={64} />
                    </div>
                  )}
                </div>

                {/* Card content */}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-xl text-gray-900 mb-1 line-clamp-1">{story.name}</h3>
                      <p className="text-base text-emerald-600 mb-2">{story.title}</p>
                    </div>
                    <Quote className="text-emerald-200 flex-shrink-0" size={28} />
                  </div>

                  <p className="text-gray-600 mb-4 leading-relaxed text-base line-clamp-4 flex-grow">
                    {story.story}
                  </p>

                  {story.impact && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-4">
                      <p className="text-base text-emerald-900">
                        <strong className="block mb-1">Impact:</strong>
                        {story.impact}
                      </p>
                    </div>
                  )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <Badge variant="secondary">{story.category}</Badge>
                      <span className="text-emerald-600 font-semibold text-base flex items-center group-hover:text-emerald-700 transition-colors">
                        Read Story <Heart size={14} className="ml-1" fill="currentColor" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No stories available yet. Check back soon!</p>
          </div>
        )}

        {/* View All Stories Button */}
        <div className="text-center mt-12">
          <Link to="/stories">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 font-semibold">
              <span>View All Stories</span>
              <Heart size={20} />
            </button>
          </Link>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold font-heading mb-4">Want to Share Your Story?</h3>
          <p className="mb-6 text-emerald-50 max-w-2xl mx-auto text-lg md:text-xl">
            Your story could inspire others and show the power of community resilience. 
            We'd love to hear how RESTI has supported you or your community.
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
