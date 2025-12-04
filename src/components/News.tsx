import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Calendar, Loader2 } from 'lucide-react';
import { useScrollAnimation, getStaggerDelay } from '../utils/animations';

interface NewsItem {
  key: string;
  value: {
    title: string;
    content: string;
    image: string;
    timestamp: string;
  };
}

export function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionSettings, setSectionSettings] = useState({ title: 'Latest News & Updates', description: 'Stay informed about our recent activities, success stories, and upcoming events.' });
  const { ref, isVisible } = useScrollAnimation();

  useEffect(() => {
    fetchNews();
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
        if (data.settings?.sections?.news) {
          setSectionSettings(data.settings.sections.news);
        }
      }
    } catch (err) {
      console.error('Error fetching section settings:', err);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNews(data.news || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <section id="news" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-emerald-600" size={48} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="news" className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            {sectionSettings.title}
          </h2>
          <p className="text-lg text-gray-600">
            {sectionSettings.description}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 animate-[fadeIn_0.3s_ease-out]">
            {error}
          </div>
        )}

        {/* News List */}
        <div className="max-w-4xl mx-auto space-y-8">
          {news.filter(n => n && n.value).map((item, index) => (
            <div
              key={item.key}
              className={`group bg-gray-50 rounded-xl p-6 lg:p-8 hover:shadow-xl hover:bg-white transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
              style={{ transitionDelay: isVisible ? getStaggerDelay(index, 100) : '0ms' }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:scale-110 transition-all duration-300">
                  <Calendar className="text-emerald-600 group-hover:text-white transition-colors" size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-2">
                    {formatDate(item.value.timestamp)}
                  </div>
                  <h3 className="text-xl text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    {item.value.title}
                  </h3>
                  <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.value.content }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {news.length === 0 && !error && (
          <div className="text-center py-12 animate-[fadeIn_0.5s_ease-out]">
            <p className="text-gray-500">No news available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
