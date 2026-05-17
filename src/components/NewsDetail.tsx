import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, User, Clock } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useDonationModal } from './DonationModal';
import { Heart } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  publishDate: string;
  image: string;
}

export function NewsDetail() {
  const { open: openDonationModal } = useDonationModal();
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const news = data.news || [];
          
          // Find the article with the matching ID
          const found = news.find((item: any) => item.key === id || item.id === id);
          
          if (found) {
            setArticle({
              id: found.key || found.id,
              title: found.value?.title || found.title || '',
              content: found.value?.content || found.content || '',
              category: found.value?.category || found.category || 'general',
              author: found.value?.author || found.author || 'Admin',
              publishDate: found.value?.timestamp || found.value?.publishDate || found.publishDate || new Date().toISOString(),
              image: found.value?.image || found.image || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching news detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
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

  if (!article) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl text-gray-900 mb-4">Article Not Found</h2>
          <p className="text-gray-600 mb-8">The news article you are looking for does not exist or has been removed.</p>
          <Link to="/news">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors">
              Back to News
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Navigation */}
        <Link to="/news" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to News
        </Link>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {/* Article Image */}
          {article.image && (
            <div className="relative h-96 bg-gray-200">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12">
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 mb-4">
              <Tag size={12} className="mr-1" />
              {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
            </Badge>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{article.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formatDate(article.publishDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>by <span className="text-emerald-600 font-medium">{article.author}</span></span>
              </div>
            </div>

            <div 
              className="prose prose-emerald max-w-none text-gray-700 leading-relaxed text-lg"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* CTA Box */}
            <div className="mt-12 bg-emerald-50 rounded-xl p-8 text-center md:flex md:items-center md:justify-between md:text-left border border-emerald-100">
              <div className="md:pr-8">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Heart size={18} className="text-emerald-600" fill="currentColor" />
                  <h3 className="text-emerald-900 m-0 font-bold">Support Our Mission</h3>
                </div>
                <p className="text-emerald-700 text-sm m-0">Your donation helps us continue sharing stories like this and making a real impact in Kiryandongo.</p>
              </div>
              <div className="mt-6 md:mt-0 shrink-0">
                <Button 
                  onClick={openDonationModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 h-auto text-base shadow-md transition-all active:scale-95"
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
