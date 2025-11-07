import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Calendar, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    fetchNews();
  }, []);

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
    <section id="news" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            Latest News & Updates
          </h2>
          <p className="text-lg text-gray-600">
            Stay informed about our recent activities, success stories, and upcoming events.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* News List */}
        <div className="max-w-4xl mx-auto space-y-8">
          {news.filter(n => n && n.value).map((item) => (
            <div
              key={item.key}
              className="bg-gray-50 rounded-xl p-6 lg:p-8 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-emerald-600" size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-2">
                    {formatDate(item.value.timestamp)}
                  </div>
                  <h3 className="text-xl text-gray-900 mb-3">
                    {item.value.title}
                  </h3>
                  <p className="text-gray-700">
                    {item.value.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {news.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500">No news available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
