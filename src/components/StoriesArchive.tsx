import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Quote, Heart, Tag, Search, ArrowRight, Calendar, MapPin,
  User, ShieldCheck, Filter, Sparkles, BookOpen, Layers
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { SEO } from './SEO';
import {
  ImpactStory,
  RESTI_STORY_CATEGORIES,
  DEFAULT_PAGE_HEADER,
  EMPTY_STORIES_STATE,
  cleanStoryText,
  formatStoryDate,
  getBeneficiaryDisplayName,
  normalizeStory
} from '../utils/storyData';

export function StoriesArchive() {
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [headerInfo, setHeaderInfo] = useState(DEFAULT_PAGE_HEADER);

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
          setHeaderInfo({
            title: data.settings.sections.stories.title || DEFAULT_PAGE_HEADER.title,
            subtitle: data.settings.sections.stories.description || DEFAULT_PAGE_HEADER.subtitle
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching section settings, using official defaults:', err);
    }
  };

  const fetchStories = async () => {
    try {
      let rawStories: any[] = [];
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
          rawStories = data.stories || [];
        }
      } catch (e) {
        console.warn('API stories fetch error, falling back to Supabase:', e);
      }

      if (!rawStories || rawStories.length === 0) {
        try {
          const { data: kvData } = await supabase
            .from('kv_store_2a4be611')
            .select('*')
            .like('key', 'story%');
          if (kvData && kvData.length > 0) {
            rawStories = kvData.map((s: any) => ({
              ...(s.value || {}),
              id: s.key,
              key: s.key
            }));
          }
        } catch (sbErr) {
          console.error('Supabase KV stories fetch error:', sbErr);
        }
      }

      // Filter to only valid, published stories
      const normalized = (rawStories || [])
        .map(normalizeStory)
        .filter(s => s.status === 'published' && (s.title || s.story));

      normalized.sort((a, b) => {
        if (typeof a.display_order === 'number' && typeof b.display_order === 'number' && a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });

      setStories(normalized);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categories present in actual stories
  const categoryFilters = useMemo(() => {
    const activeCategories = new Set(stories.map(s => s.category?.toLowerCase()));
    const relevantCategories = RESTI_STORY_CATEGORIES.filter(cat => 
      activeCategories.has(cat.id.toLowerCase()) || activeCategories.has(cat.label.toLowerCase())
    );

    return [
      { id: 'all', label: 'All Stories' },
      ...relevantCategories
    ];
  }, [stories]);

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = story.category?.toLowerCase();
        if (cat !== selectedCategory.toLowerCase()) {
          const matchLabel = RESTI_STORY_CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase();
          if (cat !== matchLabel) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = story.title?.toLowerCase().includes(q);
        const matchesName = story.name?.toLowerCase().includes(q);
        const matchesStory = story.story?.toLowerCase().includes(q);
        const matchesLocation = story.location?.toLowerCase().includes(q);
        const matchesRole = story.role?.toLowerCase().includes(q);
        const matchesQuote = story.quote?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesName && !matchesStory && !matchesLocation && !matchesRole && !matchesQuote) {
          return false;
        }
      }

      return true;
    });
  }, [stories, selectedCategory, searchQuery]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO
        title="RESTI CBO | Impact Stories"
        description={headerInfo.subtitle}
      />

      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white pt-36 sm:pt-44 pb-20 sm:pb-28 overflow-hidden">
        {/* Decorative subtle texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-emerald-200 text-xs sm:text-sm font-semibold border border-white/15 shadow-inner">
            <ShieldCheck size={16} className="text-emerald-300" />
            Verified Field Experiences
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
            {headerInfo.title}
          </h1>

          <p className="text-emerald-100/90 max-w-3xl mx-auto text-base sm:text-lg lg:text-xl font-normal leading-relaxed">
            {headerInfo.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-20 pb-24">
        {/* Controls Bar: Search & Category Pills */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search stories by keyword, participant, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Total Count Badge */}
            <div className="text-xs text-slate-500 font-medium self-end md:self-center">
              Showing <span className="font-bold text-slate-800">{filteredStories.length}</span> documented {filteredStories.length === 1 ? 'story' : 'stories'}
            </div>
          </div>

          {/* Category Tabs */}
          {categoryFilters.length > 2 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stories Grid / Empty State */}
        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4">
                  <div className="h-48 bg-slate-200 rounded-2xl" />
                  <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStories.map((story) => {
                const displayName = getBeneficiaryDisplayName(story);
                const isAnonymous = story.permission_name === false;
                const categoryObj = RESTI_STORY_CATEGORIES.find(
                  c => c.id === story.category || c.id === story.category?.toLowerCase()
                );
                const categoryLabel = categoryObj ? categoryObj.label : story.category;

                return (
                  <Card
                    key={story.id}
                    className="overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 bg-white border border-slate-200/80 rounded-3xl flex flex-col group"
                  >
                    <Link to={`/stories/${story.slug || story.id.replace('story:', '')}`} className="flex flex-col flex-1">
                      {/* Image / Header Graphic */}
                      <div className="relative h-56 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100 flex-shrink-0">
                        {story.image && story.permission_photo !== false ? (
                          <img
                            src={story.image}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-teal-800 flex flex-col items-center justify-center p-6 text-center text-white">
                            <Quote size={48} className="text-emerald-300/60 mb-2" />
                            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-200">
                              Community Narrative
                            </span>
                          </div>
                        )}

                        {/* Category Tag on top of image */}
                        <div className="absolute top-4 left-4">
                          <span className="inline-block px-3 py-1 bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-bold rounded-xl shadow-md border border-white/50">
                            {categoryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 sm:p-7 flex flex-col flex-1 space-y-4">
                        {/* Title */}
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                          {story.title}
                        </h2>

                        {/* Beneficiary & Location */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                            <User size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 truncate">
                              {displayName}
                            </div>
                            {story.role && (
                              <div className="text-slate-500 text-[11px] truncate">
                                {story.role}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pull Quote or Narrative Excerpt */}
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1">
                          {story.quote ? `“${cleanStoryText(story.quote)}”` : cleanStoryText(story.story)}
                        </p>

                        {/* Footer Meta & Read Story CTA */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto text-xs">
                          <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
                            <Calendar size={12} />
                            {formatStoryDate(story.date)}
                          </span>

                          <span className="font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1 transition-colors">
                            Read Story
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Dignified Empty State */
            <div className="bg-white rounded-3xl p-12 sm:p-16 text-center max-w-2xl mx-auto border border-slate-200/80 shadow-sm space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <Quote size={32} className="text-emerald-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {EMPTY_STORIES_STATE.title}
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                  {EMPTY_STORIES_STATE.message}
                </p>
              </div>

              <div className="pt-2">
                <Link to={EMPTY_STORIES_STATE.buttonLink}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all">
                    {EMPTY_STORIES_STATE.buttonText}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default StoriesArchive;
