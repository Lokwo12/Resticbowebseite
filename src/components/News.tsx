import { useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useScrollAnimation, getStaggerDelay } from '../utils/animations';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface RawNewsItem {
  key: string;
  value: {
    title?: string;
    content?: string;
    image?: string;
    timestamp?: string;
  };
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  htmlContent: string;
  image: string;
  timestamp: string;
  formattedDate: string;
  relativeDate: string;
  excerpt: string;
}

export function News() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionSettings, setSectionSettings] = useState({ title: 'Latest News & Updates', description: 'Stay informed about our recent activities, success stories, and upcoming events.' });
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      const formattedNews = formatNewsArticles((data.news || []) as RawNewsItem[]);
      setNews(formattedNews.length > 0 ? formattedNews : getFallbackArticles());
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news from the server. Showing recent highlights instead.');
      setNews(getFallbackArticles());
    } finally {
      setLoading(false);
    }
  };

  const topArticles = useMemo(() => news.slice(0, 4), [news]);
  const featuredArticle = topArticles[0];
  const supportingArticles = topArticles.slice(1);

  const openArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedArticle(null);
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
    <section id="news" className="py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles size={16} />
            Updates from the field
          </div>
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-4">
            {sectionSettings.title}
          </h2>
          <p className="text-lg text-gray-600">
            {sectionSettings.description}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-8 animate-[fadeIn_0.3s_ease-out]">
            {error}
          </div>
        )}

        {news.length === 0 && !error && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-dashed border-emerald-200 rounded-2xl p-12 text-center shadow-sm">
              <h3 className="text-xl text-gray-900 mb-3">No updates yet</h3>
              <p className="text-gray-500 mb-6">Check back soon for fresh stories from our programs and community initiatives.</p>
              <Button
                variant="outline"
                className="inline-flex items-center gap-2"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Return to top
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {news.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-10">
            {featuredArticle && (
              <article
                className={`relative overflow-hidden rounded-3xl bg-white shadow-lg border border-emerald-100 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: isVisible ? getStaggerDelay(0, 120) : '0ms' }}
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-emerald-200/40">
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-8 lg:p-10">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
                    <Calendar size={16} />
                    <span>{featuredArticle.formattedDate}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">{featuredArticle.relativeDate}</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl text-gray-900 mb-4 leading-tight">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {featuredArticle.excerpt}
                  </p>
                  <Button
                    onClick={() => openArticle(featuredArticle)}
                    className="inline-flex items-center gap-2"
                  >
                    Read full story
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </article>
            )}

            <div className="space-y-6">
              {supportingArticles.length > 0 && supportingArticles.map((article, index) => (
                <article
                  key={article.id}
                  className={`group bg-white border border-gray-200/80 rounded-2xl p-6 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
                  style={{ transitionDelay: isVisible ? getStaggerDelay(index + 1, 120) : '0ms' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                      <Calendar className="text-emerald-600 group-hover:text-white transition-colors" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
                        <span>{article.formattedDate}</span>
                        <span className="text-gray-300">•</span>
                        <span>{article.relativeDate}</span>
                      </div>
                      <h4 className="text-xl text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      <p className="text-gray-600 line-clamp-3 mb-4">
                        {article.excerpt}
                      </p>
                      <button
                        onClick={() => openArticle(article)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-2"
                        type="button"
                      >
                        Read full story
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {news.length > 4 && (
                <div className={`rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-6 text-center transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <p className="text-gray-500 mb-4">We have {news.length - 4} more community stories in our archive.</p>
                  <Button
                    variant="ghost"
                    className="inline-flex items-center gap-2"
                    onClick={() => openArticle(news[4])}
                  >
                    Browse additional stories
                    <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? null : closeDialog())}>
        <DialogContent className="max-w-3xl">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-gray-900">
                  {selectedArticle.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Calendar size={18} className="text-emerald-600" />
                  <span>{selectedArticle.formattedDate}</span>
                  <span className="text-gray-300">•</span>
                  <span>{selectedArticle.relativeDate}</span>
                </div>
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full rounded-xl object-cover max-h-72"
                />
                <div
                  className="prose prose-emerald max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.htmlContent }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1528873981-36c6afde7b85?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1542317854-0d6d3fc9385d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1600&q=80'
];

const asPlainText = (html?: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const createExcerpt = (text: string, length: number = 160) => {
  if (text.length <= length) return text;
  const shortened = text.slice(0, length);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : length)}…`;
};

const formatNewsArticles = (items: RawNewsItem[]): NewsArticle[] => {
  return items
    .filter((item): item is RawNewsItem => Boolean(item && item.value))
    .map((item, index) => {
      const {
        title = 'Untitled Update',
        content = '',
        image = '',
        timestamp = new Date().toISOString(),
      } = item.value || {};

      const safeImage = image && image.trim().length > 0 ? image : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
      const publishedDate = parseDateOrNow(timestamp);
      const normalizedTimestamp = publishedDate.toISOString();

      return {
        id: item.key,
        title,
        content: asPlainText(content),
        htmlContent: content,
        image: safeImage,
        timestamp: normalizedTimestamp,
        formattedDate: formatDate(publishedDate),
        relativeDate: formatRelativeTime(publishedDate),
        excerpt: createExcerpt(asPlainText(content)),
      } satisfies NewsArticle;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const getFallbackArticles = (): NewsArticle[] => {
  return FALLBACK_NEWS.map((item, index) => {
    const publishedDate = parseDateOrNow(item.timestamp);

    return {
      id: `fallback-news-${index}`,
      title: item.title,
      content: item.content,
      htmlContent: `<p>${item.content}</p>`,
      image: item.image ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
      timestamp: item.timestamp,
      formattedDate: formatDate(publishedDate),
      relativeDate: formatRelativeTime(publishedDate),
      excerpt: createExcerpt(item.content),
    } satisfies NewsArticle;
  });
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatRelativeTime = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const FALLBACK_NEWS = [
  {
    title: 'Community Health Camp Reaches 200 Families',
    content:
      'Our mobile clinic provided vital healthcare services, immunizations, and health education to more than 200 community members across four villages this month. Thank you to our volunteer nurses and supporters who made this possible.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'New School Library Welcomes Its First Readers',
    content:
      'Students at Kiryandongo Primary School can now access a fully stocked library thanks to our partners and donors. Over 1,000 books covering literacy, science, and the arts are now available to young learners.',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Youth Skills Training Graduates 35 New Artisans',
    content:
      'Our latest cohort completed six weeks of intensive training in tailoring, carpentry, and digital literacy. Graduates received starter kits to launch their own micro-enterprises and support their families.',
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Clean Water Project Expands to Two New Villages',
    content:
      'Thanks to community volunteers and supporters, two additional boreholes were completed, providing reliable access to safe drinking water for 600 residents. Maintenance training was also delivered to local caretakers.',
    timestamp: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    image: 'https://images.unsplash.com/photo-1478479474071-8a3014d422c8?auto=format&fit=crop&w=1600&q=80',
  },
];

const parseDateOrNow = (value?: string) => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
