import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Tag, Heart, Quote, User, MapPin,
  ShieldCheck, ArrowRight, BookOpen, Share2, Check
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { SEO } from './SEO';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useDonationModal } from './DonationModalContext';
import {
  ImpactStory,
  RESTI_STORY_CATEGORIES,
  cleanStoryText,
  formatStoryDate,
  getBeneficiaryDisplayName,
  normalizeStory
} from '../utils/storyData';
import { toast } from 'sonner';

export function StoryDetail() {
  const { open: openDonationModal } = useDonationModal();
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<ImpactStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        let stories: any[] = [];
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories?all=true`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            stories = data.stories || [];
          }
        } catch (e) {
          console.warn('API fetch failed, trying Supabase:', e);
        }

        if (!stories || stories.length === 0) {
          try {
            const { data: kvData } = await supabase
              .from('kv_store_2a4be611')
              .select('*')
              .like('key', 'story%');
            if (kvData) {
              stories = kvData.map((s: any) => ({
                ...(s.value || {}),
                id: s.key,
                key: s.key
              }));
            }
          } catch (sbErr) {
            console.error('Supabase KV stories fetch error:', sbErr);
          }
        }

        const normalizedList = (stories || []).map(normalizeStory);

        // Find story by id, key, or slug
        const targetId = id?.toLowerCase();
        const found = normalizedList.find((item) => {
          const itemKey = (item.key || item.id || '').toLowerCase();
          const cleanItemKey = itemKey.replace('story:', '');
          const itemSlug = (item.slug || '').toLowerCase();
          return (
            itemKey === targetId ||
            itemKey === `story:${targetId}` ||
            cleanItemKey === targetId ||
            itemSlug === targetId
          );
        });

        if (found) {
          setStory(found);
        }
      } catch (err) {
        console.error('Error fetching story detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStory();
    }
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Story link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pt-36 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-pulse space-y-6">
          <div className="h-6 bg-slate-200 rounded-lg w-40" />
          <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
          <div className="h-80 bg-slate-200 rounded-3xl w-full" />
          <div className="space-y-3 pt-6">
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="h-4 bg-slate-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="bg-slate-50 min-h-screen pt-36 pb-24 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Quote size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Story Not Found</h2>
          <p className="text-sm text-slate-600">
            The impact story you are looking for is currently unavailable or has been archived.
          </p>
          <div className="pt-2">
            <Link to="/stories">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                <ArrowLeft size={16} className="mr-2" />
                Back to Impact Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getBeneficiaryDisplayName(story);
  const isAnonymous = story.permission_name === false;
  const categoryObj = RESTI_STORY_CATEGORIES.find(
    c => c.id === story.category || c.id === story.category?.toLowerCase()
  );
  const categoryLabel = categoryObj ? categoryObj.label : story.category;

  return (
    <div className="bg-slate-50 min-h-screen pt-32 sm:pt-40 pb-24">
      <SEO
        title={`${story.title} | RESTI Impact Stories`}
        description={story.quote || story.short_description || cleanStoryText(story.story).substring(0, 160)}
        image={story.permission_photo !== false ? story.image : undefined}
        type="article"
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/stories"
            className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to All Impact Stories
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            {copied ? 'Link Copied' : 'Share Story'}
          </button>
        </div>

        {/* Story Card Article */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          {/* Hero Image / Emblem */}
          {story.image && story.permission_photo !== false ? (
            <div className="relative h-72 sm:h-96 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block px-3.5 py-1 bg-white/95 backdrop-blur-md text-emerald-900 text-xs font-bold rounded-xl shadow-md border border-white/40">
                  {categoryLabel}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="inline-block px-3.5 py-1 bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold rounded-xl border border-white/20 self-start mb-4">
                {categoryLabel}
              </div>
              <Quote size={56} className="text-emerald-300/40 mb-2" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Verified RESTI Field Narrative
              </span>
            </div>
          )}

          <div className="p-6 sm:p-10 lg:p-12 space-y-8">
            {/* Header info */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {story.title}
              </h1>

              {/* Beneficiary Meta Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{displayName}</span>
                      {isAnonymous && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-normal">
                          Protected Identity
                        </span>
                      )}
                    </div>
                    {story.role && (
                      <div className="text-slate-600 text-xs">{story.role}</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-slate-500 text-xs">
                  {story.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-emerald-600" />
                      {story.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-emerald-600" />
                    {formatStoryDate(story.date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pull Quote */}
            {story.quote && story.permission_quote !== false && (
              <blockquote className="border-l-4 border-emerald-500 pl-6 py-4 bg-emerald-50/50 rounded-r-2xl italic text-slate-800 text-base sm:text-lg font-medium leading-relaxed">
                “{cleanStoryText(story.quote)}”
              </blockquote>
            )}

            {/* Story Narrative */}
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base sm:text-lg whitespace-pre-line space-y-4">
              {cleanStoryText(story.story)}
            </div>

            {/* Documented Support Box */}
            {story.short_description && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Documented Community & Program Context
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {cleanStoryText(story.short_description)}
                </p>
              </div>
            )}

            {/* Call to Action Row */}
            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link to="/programs" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold">
                  <BookOpen size={16} className="mr-2" />
                  Explore Our Programs
                </Button>
              </Link>

              <Button
                onClick={() => openDonationModal()}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20"
              >
                <Heart size={16} className="mr-2" fill="currentColor" />
                Support Community Initiatives
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default StoryDetail;
