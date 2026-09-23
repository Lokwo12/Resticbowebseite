import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quote, ArrowRight, Calendar, User, ShieldCheck, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useScrollAnimation } from '../utils/animations';
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

export function ImpactStories() {
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionSettings, setSectionSettings] = useState(DEFAULT_PAGE_HEADER);
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
          setSectionSettings({
            title: data.settings.sections.stories.title || DEFAULT_PAGE_HEADER.title,
            subtitle: data.settings.sections.stories.description || DEFAULT_PAGE_HEADER.subtitle
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching section settings:', err);
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
        console.warn('API stories fetch error, trying Supabase fallback:', e);
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

      // Filter to only verified published stories
      const published = (rawStories || [])
        .map(normalizeStory)
        .filter(s => s.status === 'published' && (s.title || s.story));

      // Sort: featured first, then display order, then date descending
      published.sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return a.is_featured ? -1 : 1;
        }
        if (typeof a.display_order === 'number' && typeof b.display_order === 'number' && a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });

      // Display up to 3 on the homepage
      setStories(published.slice(0, 3));
    } catch (error) {
      console.error('Error fetching stories for homepage:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-slate-50 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto space-y-4 mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/70 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} className="text-emerald-600" />
            Field Voices & Experiences
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {sectionSettings.title}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {sectionSettings.subtitle}
          </p>
        </div>

        {/* Stories Listing */}
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
        ) : stories.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.map((story) => {
                const displayName = getBeneficiaryDisplayName(story);
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
                      {/* Image / Graphic */}
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
                            <Quote size={44} className="text-emerald-300/60 mb-2" />
                            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-200">
                              Community Narrative
                            </span>
                          </div>
                        )}

                        <div className="absolute top-4 left-4">
                          <span className="inline-block px-3 py-1 bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-bold rounded-xl shadow-md border border-white/50">
                            {categoryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 sm:p-7 flex flex-col flex-1 space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                          {story.title}
                        </h3>

                        {/* Beneficiary Badge */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                            <User size={15} />
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

                        {/* Excerpt */}
                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1">
                          {story.quote ? `“${cleanStoryText(story.quote)}”` : cleanStoryText(story.story)}
                        </p>

                        {/* Footer */}
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

            {/* View All Stories Button */}
            <div className="text-center pt-4">
              <Link to="/stories">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all text-sm">
                  View All Impact Stories
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Dignified Empty State */
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto border border-slate-200/80 shadow-sm space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Quote size={28} className="text-emerald-600" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {EMPTY_STORIES_STATE.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
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
  );
}

export default ImpactStories;
