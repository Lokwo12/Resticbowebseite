import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, User, Clock, Heart, Image as ImageIcon } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useDonationModal } from './DonationModalContext';

interface NewsArticle {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  summary?: string;
  content: string;
  category: string;
  author: string;
  publishDate: string;
  image: string;
  additionalImages?: string[];
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export function NewsDetail() {
  const { open: openDonationModal } = useDonationModal();
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {

        // 1. Try fetching directly via single article endpoint (supports ID or slug)
        try {
          const directRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${encodeURIComponent(id)}`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );
          if (directRes.ok) {
            const data = await directRes.json();
            if (data.article) {
              const a = data.article;
              setArticle({
                id: a.id || a.key || id,
                slug: a.slug,
                title: a.title || 'Untitled Article',
                description: a.description || a.summary || '',
                summary: a.summary || a.description || '',
                content: a.content || '',
                category: a.category || 'Community',
                author: a.author || 'RESTI Team',
                publishDate: a.publishDate || a.timestamp || new Date().toISOString(),
                image: a.image || '',
                additionalImages: a.additionalImages || [],
                status: a.status,
                seoTitle: a.seoTitle,
                seoDescription: a.seoDescription,
                ogTitle: a.ogTitle,
                ogDescription: a.ogDescription
              });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Direct news endpoint lookup failed, falling back to list lookup:', e);
        }

        // 2. Fallback: query full news list and match by id, key, or slug
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
          
          const found = news.find((item: any) => {
            const v = item.value || item;
            return item.key === id || 
                   item.id === id || 
                   v.id === id ||
                   v.slug === id ||
                   item.slug === id;
          });
          
          if (found) {
            const v = found.value || found;
            setArticle({
              id: found.key || found.id || v.id,
              slug: v.slug,
              title: v.title || '',
              description: v.description || v.summary || '',
              summary: v.summary || v.description || '',
              content: v.content || '',
              category: v.category || 'Community',
              author: v.author || 'RESTI Team',
              publishDate: v.publishDate || v.timestamp || new Date().toISOString(),
              image: v.image || '',
              additionalImages: v.additionalImages || [],
              status: v.status,
              seoTitle: v.seoTitle,
              seoDescription: v.seoDescription,
              ogTitle: v.ogTitle,
              ogDescription: v.ogDescription
            });
          }
        }
      } catch (err) {
        console.error('Error fetching news detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
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

  const calculateReadTime = (content: string) => {
    const text = content.replace(/<[^>]+>/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  if (!article) {
    if (loading) {
      return (
        <div className="bg-gray-50 min-h-screen pt-28 sm:pt-36 pb-24">
          <div className="container mx-auto px-4 max-w-4xl animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-64 bg-slate-200 rounded-2xl w-full" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 min-h-screen pt-28 sm:pt-36 pb-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl text-gray-900 mb-4 font-bold">Article Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The news article you are looking for does not exist, has been scheduled for a future date, or has been removed.
          </p>
          <Link to="/news">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow">
              Back to News
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const readMinutes = calculateReadTime(article.content);

  return (
    <div className="bg-gray-50 min-h-screen pt-28 sm:pt-36 pb-24">
      <SEO 
        title={article.seoTitle || `${article.title} | RESTI CBO`} 
        description={article.seoDescription || article.description || article.content.substring(0, 160).replace(/<[^>]+>/g, '')} 
        image={article.image} 
        type="article"
      />
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Navigation */}
        <Link to="/news" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors font-medium">
          <ArrowLeft size={20} className="mr-2" />
          Back to News
        </Link>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
          {/* Article Image */}
          {article.image && (
            <div className="relative h-72 sm:h-96 bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-10 md:p-12">
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 mb-4 text-xs font-semibold px-3 py-1">
              <Tag size={12} className="mr-1.5" />
              {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
            </Badge>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Calendar size={15} />
                <span>{formatDate(article.publishDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User size={15} />
                <span>By <span className="text-emerald-600 font-semibold">{article.author}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock size={15} />
                <span>{readMinutes} min read</span>
              </div>
            </div>

            {/* Excerpt Summary */}
            {article.description && (
              <p className="text-base sm:text-lg text-gray-600 font-medium italic border-l-4 border-emerald-500 pl-4 py-1 mb-8 leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Rich Text Body */}
            <div 
              className="prose prose-emerald max-w-none text-gray-700 leading-relaxed text-base sm:text-lg"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Additional Gallery Images */}
            {article.additionalImages && article.additionalImages.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={20} className="text-emerald-600" />
                  Field Photo Gallery
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {article.additionalImages.map((imgUrl, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-gray-200 h-48 bg-gray-100">
                      <img
                        src={imgUrl}
                        alt={`${article.title} photo ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => window.open(imgUrl, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Box */}
            <div className="mt-12 bg-emerald-50 rounded-2xl p-6 sm:p-8 text-center md:flex md:items-center md:justify-between md:text-left border border-emerald-100">
              <div className="md:pr-8">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Heart size={18} className="text-emerald-600" fill="currentColor" />
                  <h3 className="text-emerald-900 m-0 font-bold text-lg">Support Our Mission</h3>
                </div>
                <p className="text-emerald-700 text-sm m-0">Your support empowers RESTI CBO to expand community development and share meaningful milestones from the field.</p>
              </div>
              <div className="mt-6 md:mt-0 shrink-0">
                <Button 
                  onClick={openDonationModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 h-auto text-base shadow-md transition-all active:scale-95 rounded-xl"
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
