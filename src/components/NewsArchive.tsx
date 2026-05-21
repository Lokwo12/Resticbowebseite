import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, Tag, ArrowRight, Clock } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { LoadingScreen } from './LoadingScreen';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  publishDate: string;
  image: string;
  featured: boolean;
  order: number;
}

export function NewsArchive() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sectionSettings, setSectionSettings] = useState({
    title: 'Latest News & Updates',
    description: 'Stay informed about our latest activities, success stories, and community impact.'
  });

  useEffect(() => {
    loadNewsData();
    loadSectionSettings();
  }, []);

  const loadSectionSettings = async () => {
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
    } catch (error) {
      console.error('Error loading section settings:', error);
    }
  };

  const loadNewsData = async () => {
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
        const articles: NewsArticle[] = (data.news || []).map((item: any) => ({
          id: item.key || item.id || '',
          title: item.value?.title || item.title || '',
          content: item.value?.content || item.content || '',
          image: item.value?.image || item.image || '',
          category: item.value?.category || item.category || 'general',
          author: item.value?.author || item.author || 'Admin',
          publishDate: item.value?.timestamp || item.value?.publishDate || item.publishDate || item.value?.date || new Date().toISOString(),
          featured: item.value?.featured ?? item.featured ?? false,
          order: item.value?.order ?? item.order ?? 999,
        }));
        
        articles.sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          if ((a.order || 999) !== (b.order || 999)) return (a.order || 999) - (b.order || 999);
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        });
        setNewsArticles(articles);
      }
    } catch (error) {
      console.error('Error loading news data:', error);
    } finally {
      setLoading(false);
    }
  };

  const allCategories = newsArticles.map(article => article.category).filter(Boolean);
  const uniqueCategories = Array.from(new Set(allCategories));
  const categories = ['all', ...uniqueCategories];

  const filteredArticles = selectedCategory === 'all'
    ? newsArticles
    : newsArticles.filter(article => article.category === selectedCategory);

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

  const truncateContent = (content: string | undefined, maxLength: number = 150) => {
    const plainText = (content ?? '').replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-32 sm:pt-40 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <Newspaper className="text-white" size={32} />
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
          
          {newsArticles.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                <Newspaper size={48} className="text-gray-400" />
              </div>
              <h3 className="text-gray-900 mb-3">No News Articles Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Our latest news and updates will be available here soon. Check back later to stay informed about our activities and impact!
              </p>
            </div>
          ) : (
            <>
              {/* Category Filter */}
              {categories.length > 1 && (
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-6 py-3 rounded-full transition-all duration-300 ${
                        selectedCategory === category
                          ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      {category === 'all' ? 'All News' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              {/* News Articles Grid */}
              {filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredArticles.map((article) => (
                    <Card
                      key={article.id}
                      className={`overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white border border-gray-100 ${
                        article.featured ? 'ring-2 ring-emerald-600' : ''
                      }`}
                    >
                      <div className="relative h-56 bg-slate-50 overflow-hidden flex items-center justify-center">
                        {article.image ? (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${article.image ? 'hidden' : ''}`}>
                          <Newspaper className="text-white group-hover:scale-110 transition-transform duration-500" size={80} />
                        </div>

                        {article.featured && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                              Featured
                            </Badge>
                          </div>
                        )}

                        {article.category && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                            <Badge className="bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors duration-300">
                              <Tag size={14} className="mr-1" />
                              {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300">
                          {article.title}
                        </h3>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(article.publishDate)}</span>
                          </div>
                          {article.author && (
                            <div className="flex items-center gap-1">
                              <span>by</span>
                              <span className="text-emerald-600">{article.author}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                          {truncateContent(article.content)}
                        </p>

                        <Link
                          to={`/news/${article.id}`}
                          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-300 group/btn"
                        >
                          <span>Read More</span>
                          <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No news articles found in this category.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
