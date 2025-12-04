import { useState, useEffect } from 'react';
import { Newspaper, Calendar, Tag, ArrowRight, Clock } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

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

export function News() {
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
      // Use default settings if fetch fails
      setSectionSettings({
        title: 'Latest News & Updates',
        description: 'Stay informed about our latest activities, success stories, and community impact.'
      });
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
        // Backend returns { news: [...] }
        const articles = data.news || [];
        // Sort by order field and publish date
        articles.sort((a: NewsArticle, b: NewsArticle) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          if (a.order !== b.order) return (a.order || 999) - (b.order || 999);
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        });
        setNewsArticles(articles);
      } else {
        console.error('Failed to fetch news articles');
        setNewsArticles([]);
      }
    } catch (error) {
      console.error('Error loading news data:', error);
      setNewsArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories from news articles
  const allCategories = newsArticles.map(article => article.category).filter(Boolean);
  const uniqueCategories = Array.from(new Set(allCategories));
  const categories = ['all', ...uniqueCategories];

  // Filter news articles based on selected category
  const filteredArticles = selectedCategory === 'all'
    ? newsArticles
    : newsArticles.filter(article => article.category === selectedCategory);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <section id="news" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="news" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <Newspaper className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-emerald-600 mb-4">{sectionSettings.title}</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            {sectionSettings.description}
          </p>
        </div>

        {newsArticles.length === 0 ? (
          // Empty State
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
                    className={`overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white ${
                      article.featured ? 'ring-2 ring-emerald-600' : ''
                    }`}
                  >
                    {/* Article Image */}
                    <div className="relative h-56 bg-gradient-to-br from-emerald-400 to-emerald-600 overflow-hidden">
                      {article.image ? (
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${article.image ? 'hidden' : ''}`}>
                        <Newspaper className="text-white group-hover:scale-110 transition-transform duration-500" size={80} />
                      </div>

                      {/* Featured Badge */}
                      {article.featured && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                            Featured
                          </Badge>
                        </div>
                      )}

                      {/* Category Badge */}
                      {article.category && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                          <Badge className="bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors duration-300">
                            <Tag size={14} className="mr-1" />
                            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Article Info */}
                    <div className="p-6">
                      <h3 className="text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300">
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

                      {/* Read More Button */}
                      <button
                        onClick={() => {
                          // You can implement a modal or navigate to article detail page
                          alert('Article detail view coming soon!');
                        }}
                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-300 group/btn"
                      >
                        <span>Read More</span>
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </button>
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

        {/* Newsletter Subscription CTA */}
        {newsArticles.length > 0 && (
          <div className="mt-20 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-center shadow-xl">
            <div className="max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                <Newspaper className="text-white" size={32} />
              </div>
              <h3 className="text-white mb-4">Stay Updated</h3>
              <p className="text-emerald-50 mb-8 text-lg">
                Subscribe to our newsletter and never miss an update. Get the latest news, stories, and opportunities delivered straight to your inbox.
              </p>
              <button
                onClick={() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-emerald-600 px-8 py-3 rounded-lg hover:bg-emerald-50 transition-all duration-300 shadow-md hover:shadow-xl inline-flex items-center gap-2"
              >
                <span>Subscribe to Newsletter</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}