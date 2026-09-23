import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
  Check, X, Upload, ExternalLink, ArrowUpDown, CheckCircle2,
  EyeOff, Sparkles, Loader2, AlertCircle, ArrowRight, Star,
  Quote, Shield, ShieldCheck, ShieldAlert, User, MapPin, Calendar,
  Tag, Clock, Info, CheckSquare, Square, FileText, ChevronRight
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  ImpactStory,
  StoryStatus,
  RESTI_STORY_CATEGORIES,
  cleanStoryText,
  formatStoryDate,
  getBeneficiaryDisplayName,
  normalizeStory
} from '../../utils/storyData';
import { publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';

interface StoriesManagerProps {
  accessToken: string;
  projectId: string;
  userRole?: string;
  userName?: string;
  onUpdate?: () => void;
}

interface FormState {
  id?: string;
  title: string;
  slug: string;
  name: string;
  is_anonymous: boolean;
  role: string;
  location: string;
  category: string;
  program_id: string;
  program_name: string;
  story: string;
  quote: string;
  short_description: string;
  image: string;
  date: string;
  status: StoryStatus;
  is_featured: boolean;
  display_order: number;
  consent_obtained: boolean;
  consent_date: string;
  permission_name: boolean;
  permission_photo: boolean;
  permission_quote: boolean;
  consent_notes: string;
}

const INITIAL_FORM_STATE: FormState = {
  title: '',
  slug: '',
  name: '',
  is_anonymous: false,
  role: '',
  location: 'Kiryandongo District, Uganda',
  category: 'livelihoods',
  program_id: '',
  program_name: '',
  story: '',
  quote: '',
  short_description: '',
  image: '',
  date: new Date().toISOString().split('T')[0],
  status: 'published',
  is_featured: false,
  display_order: 0,
  consent_obtained: true,
  consent_date: new Date().toISOString().split('T')[0],
  permission_name: true,
  permission_photo: true,
  permission_quote: true,
  consent_notes: ''
};

export function StoriesManager({
  accessToken,
  projectId,
  userRole = 'editor',
  userName,
  onUpdate
}: StoriesManagerProps) {
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StoryStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'order'>('date');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<ImpactStory | null>(null);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Preview modal
  const [previewStory, setPreviewStory] = useState<ImpactStory | null>(null);

  // Role permissions
  const canDelete = userRole === 'admin' || userRole === 'super_admin';
  const isReadOnly = userRole === 'viewer';

  // Fetch stories
  const fetchStories = async () => {
    try {
      setRefreshing(true);
      let rawList: any[] = [];
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories?all=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken || publicAnonKey}`
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          rawList = data.stories || [];
        }
      } catch (err) {
        console.warn('API stories fetch failed, falling back to Supabase direct:', err);
      }

      // Supabase KV fallback
      if (!rawList || rawList.length === 0) {
        const { data: kvData, error } = await supabase
          .from('kv_store_2a4be611')
          .select('*')
          .like('key', 'story%');
        if (!error && kvData) {
          rawList = kvData.map(item => ({
            ...(item.value || {}),
            id: item.key,
            key: item.key
          }));
        }
      }

      const normalized = (rawList || []).map(normalizeStory);
      setStories(normalized);
    } catch (err: any) {
      console.error('Error fetching stories:', err);
      toast.error('Failed to load impact stories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [projectId, accessToken]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingStory(null);
    setFormState({
      ...INITIAL_FORM_STATE,
      date: new Date().toISOString().split('T')[0],
      consent_date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (story: ImpactStory) => {
    setEditingStory(story);
    setFormState({
      id: story.id,
      title: story.title || '',
      slug: story.slug || story.id.replace('story:', ''),
      name: story.permission_name === false ? '' : (story.name || ''),
      is_anonymous: story.permission_name === false,
      role: story.role || '',
      location: story.location || 'Kiryandongo District, Uganda',
      category: story.category || 'livelihoods',
      program_id: story.program_id || '',
      program_name: story.program_name || '',
      story: story.story || '',
      quote: story.quote || '',
      short_description: story.short_description || '',
      image: story.image || '',
      date: story.date ? story.date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: story.status || 'published',
      is_featured: Boolean(story.is_featured),
      display_order: story.display_order || 0,
      consent_obtained: story.consent_obtained !== undefined ? story.consent_obtained : true,
      consent_date: story.consent_date ? story.consent_date.split('T')[0] : new Date().toISOString().split('T')[0],
      permission_name: story.permission_name !== undefined ? story.permission_name : true,
      permission_photo: story.permission_photo !== undefined ? story.permission_photo : true,
      permission_quote: story.permission_quote !== undefined ? story.permission_quote : true,
      consent_notes: story.consent_notes || ''
    });
    setIsDialogOpen(true);
  };

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploadingImage(true);
    try {
      // 1. Try edge function upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` },
            body: formData
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setFormState(prev => ({ ...prev, image: data.url }));
            toast.success('Story image uploaded');
            return;
          }
        }
      } catch (err) {
        console.warn('Edge upload failed, trying Supabase storage direct:', err);
      }

      // 2. Direct Supabase Storage fallback
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `story-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('make-2a4be611-uploads')
        .upload(cleanFileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('make-2a4be611-uploads')
        .getPublicUrl(cleanFileName);

      if (publicUrlData?.publicUrl) {
        setFormState(prev => ({ ...prev, image: publicUrlData.publicUrl }));
        toast.success('Story image uploaded successfully');
      } else {
        throw new Error('Could not retrieve public URL for uploaded image');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Story
  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('You have read-only access');
      return;
    }

    if (!formState.title.trim()) {
      toast.error('Please enter a story title');
      return;
    }

    if (!formState.story.trim()) {
      toast.error('Please enter the story narrative');
      return;
    }

    setFormLoading(true);
    try {
      const storyId = editingStory
        ? editingStory.id
        : `story:${crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString() + Math.random().toString(36).substring(2, 7))}`;
      
      const normalizedId = storyId.startsWith('story:') ? storyId : `story:${storyId}`;

      const beneficiaryName = formState.is_anonymous
        ? 'RESTI Program Participant'
        : (formState.name.trim() || 'RESTI Program Participant');

      const payload = {
        id: normalizedId,
        title: formState.title.trim(),
        slug: formState.slug.trim() || normalizedId.replace('story:', ''),
        name: beneficiaryName,
        role: formState.role.trim(),
        location: formState.location.trim() || 'Kiryandongo District, Uganda',
        category: formState.category,
        program_id: formState.program_id,
        program_name: formState.program_name.trim(),
        story: formState.story.trim(),
        quote: formState.quote.trim(),
        short_description: formState.short_description.trim(),
        image: formState.image.trim(),
        date: formState.date ? new Date(formState.date).toISOString() : new Date().toISOString(),
        status: formState.status,
        is_published: formState.status === 'published',
        is_featured: formState.is_featured,
        display_order: Number(formState.display_order) || 0,
        consent_obtained: formState.consent_obtained,
        consent_date: formState.consent_date || formState.date,
        permission_name: !formState.is_anonymous && formState.permission_name,
        permission_photo: formState.permission_photo,
        permission_quote: formState.permission_quote,
        consent_notes: formState.consent_notes.trim(),
        updated_at: new Date().toISOString()
      };

      let saved = false;

      // 1. Try edge function
      try {
        const url = editingStory
          ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stories/${encodeURIComponent(normalizedId)}`
          : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stories`;
        
        const response = await fetch(url, {
          method: editingStory ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          saved = true;
        }
      } catch (err) {
        console.warn('API save error, using Supabase KV fallback:', err);
      }

      // 2. Direct Supabase KV fallback
      if (!saved) {
        const { error: sbError } = await supabase
          .from('kv_store_2a4be611')
          .upsert({
            key: normalizedId,
            value: payload
          });
        if (sbError) throw sbError;
      }

      toast.success(editingStory ? 'Story updated successfully' : 'Story created successfully');
      setIsDialogOpen(false);
      fetchStories();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error saving story:', err);
      toast.error(err.message || 'Failed to save story');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (story: ImpactStory) => {
    if (isReadOnly) {
      toast.error('You have read-only access');
      return;
    }

    const newStatus: StoryStatus = story.status === 'published' ? 'draft' : 'published';
    try {
      const updated = {
        ...story,
        status: newStatus,
        is_published: newStatus === 'published',
        updated_at: new Date().toISOString()
      };

      let saved = false;
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stories/${encodeURIComponent(story.id)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || publicAnonKey}`
            },
            body: JSON.stringify(updated)
          }
        );
        if (res.ok) saved = true;
      } catch (e) {
        console.warn('Toggle status API error, falling back:', e);
      }

      if (!saved) {
        await supabase
          .from('kv_store_2a4be611')
          .upsert({
            key: story.id,
            value: updated
          });
      }

      toast.success(newStatus === 'published' ? 'Story published' : 'Story set to draft');
      fetchStories();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error('Failed to change story status');
    }
  };

  // Delete Story
  const handleDeleteStory = async (storyId: string) => {
    if (!canDelete) {
      toast.error('Only administrators can delete stories');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this impact story? This action cannot be undone.')) {
      return;
    }

    try {
      let deleted = false;
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stories/${encodeURIComponent(storyId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }
          }
        );
        if (res.ok) deleted = true;
      } catch (err) {
        console.warn('API delete error, falling back:', err);
      }

      if (!deleted) {
        await supabase
          .from('kv_store_2a4be611')
          .delete()
          .eq('key', storyId);
      }

      toast.success('Story deleted');
      fetchStories();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error('Failed to delete story');
    }
  };

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      // Status filter
      if (statusFilter !== 'all' && story.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && story.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = story.title?.toLowerCase().includes(q);
        const matchesName = story.name?.toLowerCase().includes(q);
        const matchesStory = story.story?.toLowerCase().includes(q);
        const matchesLocation = story.location?.toLowerCase().includes(q);
        const matchesRole = story.role?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesName && !matchesStory && !matchesLocation && !matchesRole) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'order') {
        return (a.display_order || 0) - (b.display_order || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
  }, [stories, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: stories.length,
      published: stories.filter(s => s.status === 'published').length,
      draft: stories.filter(s => s.status === 'draft').length,
      pending: stories.filter(s => s.status === 'pending_review').length,
      archived: stories.filter(s => s.status === 'archived').length,
      featured: stories.filter(s => s.is_featured).length,
    };
  }, [stories]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <MessageSquare size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase text-emerald-100 border border-white/20">
              <ShieldCheck size={14} className="text-emerald-300" />
              Verified Authentic Impact
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Impact Stories & Field Voices
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Publish real stories from individuals and communities participating in RESTI's programs.
              All stories strictly uphold confidentiality, informed consent, and factual integrity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={fetchStories}
              variant="outline"
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md transition-all rounded-xl"
            >
              <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!isReadOnly && (
              <Button
                onClick={handleOpenCreate}
                className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-lg rounded-xl transition-all"
              >
                <Plus size={18} className="mr-2" />
                Add Impact Story
              </Button>
            )}
          </div>
        </div>

        {/* KPI Counter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-emerald-100 font-medium">Total Stories</div>
            <div className="text-2xl font-black text-white">{stats.total}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-emerald-100 font-medium">Published</div>
            <div className="text-2xl font-black text-emerald-200">{stats.published}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-emerald-100 font-medium">In Review</div>
            <div className="text-2xl font-black text-amber-200">{stats.pending}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-emerald-100 font-medium">Drafts</div>
            <div className="text-2xl font-black text-slate-200">{stats.draft}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-emerald-100 font-medium">Archived</div>
            <div className="text-2xl font-black text-slate-300">{stats.archived}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="text-xs text-emerald-100 font-medium">Featured</div>
            <div className="text-2xl font-black text-yellow-300">{stats.featured}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Stories', count: stats.total },
              { id: 'published', label: 'Published', count: stats.published },
              { id: 'pending_review', label: 'In Review', count: stats.pending },
              { id: 'draft', label: 'Drafts', count: stats.draft },
              { id: 'archived', label: 'Archived', count: stats.archived }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <ArrowUpDown size={13} />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium outline-none focus:border-emerald-500"
            >
              <option value="date">Publication Date</option>
              <option value="order">Display Order</option>
              <option value="title">Story Title</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          {/* Search Input */}
          <div className="sm:col-span-8 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search stories by title, beneficiary name, community, quote, or narrative..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-4 relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700"
            >
              <option value="all">All Program Categories</option>
              {RESTI_STORY_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stories Listing */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="animate-spin text-emerald-600" size={36} />
          <p className="text-sm text-slate-500 font-medium">Loading impact stories...</p>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <MessageSquare size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'No matching stories found'
                : 'No Impact Stories Yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search keywords to find documented stories.'
                : "Document real stories from RESTI's programs and community initiatives to share authentic impact."}
            </p>
          </div>
          {!isReadOnly && (
            <Button
              onClick={handleOpenCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
            >
              <Plus size={16} className="mr-2" />
              Add Your First Story
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const displayName = getBeneficiaryDisplayName(story);
            const isAnonymous = story.permission_name === false;
            const categoryObj = RESTI_STORY_CATEGORIES.find(
              c => c.id === story.category || c.id === story.category?.toLowerCase()
            );
            const categoryLabel = categoryObj ? categoryObj.label : story.category;

            return (
              <div
                key={story.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-emerald-300"
              >
                {/* Image or Photo Container */}
                <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {story.image && story.permission_photo !== false ? (
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center text-emerald-600 p-6 text-center">
                      <Quote size={40} className="text-emerald-400/80 mb-2" />
                      <p className="text-xs font-semibold text-emerald-800">
                        {isAnonymous ? 'Confidential Participant Story' : 'RESTI Field Narrative'}
                      </p>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <Badge className={`text-[10px] font-bold uppercase tracking-wider ${
                      story.status === 'published'
                        ? 'bg-emerald-600 text-white'
                        : story.status === 'pending_review'
                        ? 'bg-amber-500 text-white'
                        : story.status === 'archived'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}>
                      {story.status === 'pending_review' ? 'In Review' : story.status}
                    </Badge>
                    {story.is_featured && (
                      <Badge className="bg-amber-400 text-amber-950 font-bold text-[10px] flex items-center gap-1 shadow-sm">
                        <Star size={10} fill="currentColor" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Consent Badge */}
                  <div className="absolute bottom-3 left-3">
                    {story.consent_obtained ? (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span>{isAnonymous ? 'Pseudonym' : 'Consent Verified'}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600/80 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white">
                        <ShieldAlert size={12} className="text-white" />
                        <span>Consent Needed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col space-y-3">
                  {/* Category Pill */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/80">
                      {categoryLabel}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {formatStoryDate(story.date)}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-slate-800 text-base line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {story.title}
                  </h4>

                  {/* Beneficiary Meta */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5 truncate">
                        <User size={13} className="text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{displayName}</span>
                      </span>
                      {isAnonymous && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          Anonymous
                        </span>
                      )}
                    </div>
                    {story.role && (
                      <p className="text-slate-500 pl-5 text-[11px] truncate">
                        {story.role}
                      </p>
                    )}
                    {story.location && (
                      <p className="text-slate-400 pl-5 text-[11px] flex items-center gap-1 truncate">
                        <MapPin size={10} />
                        {story.location}
                      </p>
                    )}
                  </div>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {story.quote ? `“${story.quote}”` : story.story}
                  </p>

                  {/* Card Footer Actions */}
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {/* Publish / Unpublish Quick Toggle */}
                      {!isReadOnly && (
                        <button
                          onClick={() => handleTogglePublish(story)}
                          title={story.status === 'published' ? 'Unpublish story' : 'Publish story'}
                          className={`p-2 rounded-lg text-xs font-medium transition-all ${
                            story.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {story.status === 'published' ? <CheckCircle2 size={16} /> : <EyeOff size={16} />}
                        </button>
                      )}

                      {/* Preview Button */}
                      <button
                        onClick={() => setPreviewStory(story)}
                        title="Preview Story"
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isReadOnly && (
                        <Button
                          onClick={() => handleOpenEdit(story)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 rounded-lg font-medium"
                        >
                          <Edit size={13} className="mr-1" />
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          onClick={() => handleDeleteStory(story.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT DIALOG */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col my-auto">
            {/* Dialog Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingStory ? 'Edit Impact Story' : 'Document New Impact Story'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ensure story authenticity, accurate program attribution, and documented consent.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStory} className="p-6 space-y-6 flex-1">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} />
                    1. Story Overview
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Story Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    placeholder="e.g. Building Livelihoods Through Modern Beekeeping Skills"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      RESTI Work Category *
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700"
                    >
                      {RESTI_STORY_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      RESTI focuses strictly on verified community resilience, WASH, and livelihoods.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Documentation / Publication Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formState.date}
                      onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Summary / Highlight
                  </label>
                  <input
                    type="text"
                    value={formState.short_description}
                    onChange={(e) => setFormState({ ...formState, short_description: e.target.value })}
                    placeholder="Brief 1-2 sentence highlight for previews and summaries"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Section 2: Beneficiary Details & Privacy */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} />
                    2. Beneficiary & Community Voice
                  </h4>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Protect Participant Privacy (Anonymity)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      If enabled, the participant's name will appear publicly as "RESTI Program Participant".
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formState.is_anonymous}
                    onChange={(e) => setFormState({
                      ...formState,
                      is_anonymous: e.target.checked,
                      permission_name: !e.target.checked
                    })}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Participant Name {!formState.is_anonymous && '*'}
                    </label>
                    <input
                      type="text"
                      disabled={formState.is_anonymous}
                      value={formState.is_anonymous ? 'RESTI Program Participant' : formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Okello John"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role / Community Capacity
                    </label>
                    <input
                      type="text"
                      value={formState.role}
                      onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                      placeholder="e.g. Beekeeping Trainee, VSLA Group Member"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / Settlement
                  </label>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    placeholder="e.g. Bweyale, Kiryandongo District, Uganda"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Participant's Direct Quote (Pull Quote)
                  </label>
                  <textarea
                    rows={2}
                    value={formState.quote}
                    onChange={(e) => setFormState({ ...formState, quote: e.target.value })}
                    placeholder="Direct authentic words spoken by the beneficiary..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Section 3: Story Narrative */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Quote size={14} />
                    3. Detailed Narrative (Actual Program Experience)
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Narrative *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={formState.story}
                    onChange={(e) => setFormState({ ...formState, story: e.target.value })}
                    placeholder="Describe the real background, the specific skills or support received from RESTI, and the documented community or household outcomes..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Do not invent numbers, percentages, or transformation claims. Keep all details grounded in actual recorded program activities.
                  </p>
                </div>
              </div>

              {/* Section 4: Media & Image */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload size={14} />
                    4. Photography & Visual Documentation
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Story Photo URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formState.image}
                      onChange={(e) => setFormState({ ...formState, image: e.target.value })}
                      placeholder="https://... or click Upload Image"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      <span className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors border border-slate-200">
                        {uploadingImage ? (
                          <Loader2 size={16} className="animate-spin text-emerald-600" />
                        ) : (
                          <>
                            <Upload size={14} className="mr-1.5" />
                            Upload
                          </>
                        )}
                      </span>
                    </label>
                  </div>
                </div>

                {formState.image && (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <img
                      src={formState.image}
                      alt="Story preview"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-slate-700">Photo Attached</div>
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, image: '' })}
                        className="text-red-600 hover:underline text-[11px]"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="permission_photo"
                    checked={formState.permission_photo}
                    onChange={(e) => setFormState({ ...formState, permission_photo: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="permission_photo" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Permission to publish photo granted by participant
                  </label>
                </div>
              </div>

              {/* Section 5: Consent & Safeguards */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    5. Informed Consent & Safeguarding Checklist
                  </h4>
                </div>

                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="consent_obtained"
                        checked={formState.consent_obtained}
                        onChange={(e) => setFormState({ ...formState, consent_obtained: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="consent_obtained" className="text-xs font-bold text-emerald-900 cursor-pointer">
                        Informed Consent Formally Obtained
                      </label>
                    </div>
                    <input
                      type="date"
                      value={formState.consent_date}
                      onChange={(e) => setFormState({ ...formState, consent_date: e.target.value })}
                      className="text-xs bg-white border border-emerald-200 rounded-lg px-2.5 py-1 text-emerald-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-100/60">
                    <label className="flex items-center gap-1.5 text-[11px] text-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.permission_name}
                        disabled={formState.is_anonymous}
                        onChange={(e) => setFormState({ ...formState, permission_name: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      <span>Name Permitted</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] text-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.permission_photo}
                        onChange={(e) => setFormState({ ...formState, permission_photo: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      <span>Photo Permitted</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] text-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.permission_quote}
                        onChange={(e) => setFormState({ ...formState, permission_quote: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      <span>Quote Permitted</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Internal Verification Notes (Staff / Field Officer)
                    </label>
                    <input
                      type="text"
                      value={formState.consent_notes}
                      onChange={(e) => setFormState({ ...formState, consent_notes: e.target.value })}
                      placeholder="e.g. Verbal consent recorded by field officer; witnessed by local community leader."
                      className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs outline-none text-emerald-950 placeholder:text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Publishing & Status */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={14} />
                    6. Publishing Controls
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Publication Status *
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700"
                    >
                      <option value="published">Published (Live Publicly)</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="draft">Draft (Private)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Display Order (Ascending)
                    </label>
                    <input
                      type="number"
                      value={formState.display_order}
                      onChange={(e) => setFormState({ ...formState, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer mt-5">
                      <input
                        type="checkbox"
                        checked={formState.is_featured}
                        onChange={(e) => setFormState({ ...formState, is_featured: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        Mark as Featured Story
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md py-3 z-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl shadow-md transition-all"
                >
                  {formLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    editingStory ? 'Update Impact Story' : 'Save & Publish'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STORY PREVIEW MODAL */}
      {previewStory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col my-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-emerald-600" />
                <h3 className="font-bold text-slate-800">Public View Preview</h3>
              </div>
              <button
                onClick={() => setPreviewStory(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image banner */}
              {previewStory.image && previewStory.permission_photo !== false ? (
                <div className="rounded-2xl overflow-hidden h-64 bg-slate-100">
                  <img
                    src={previewStory.image}
                    alt={previewStory.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl p-8 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-800 text-center flex flex-col items-center justify-center space-y-2">
                  <Quote size={36} className="text-emerald-500" />
                  <p className="text-sm font-semibold">Field Narrative Documentation</p>
                </div>
              )}

              {/* Category & Date */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  {previewStory.category}
                </span>
                <span className="text-slate-400">
                  {formatStoryDate(previewStory.date)}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {previewStory.title}
              </h2>

              {/* Beneficiary Meta */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <div className="font-bold text-slate-800">
                    {getBeneficiaryDisplayName(previewStory)}
                  </div>
                  {previewStory.role && (
                    <div className="text-slate-500">{previewStory.role}</div>
                  )}
                  {previewStory.location && (
                    <div className="text-slate-400 text-[11px]">{previewStory.location}</div>
                  )}
                </div>
              </div>

              {/* Quote */}
              {previewStory.quote && previewStory.permission_quote !== false && (
                <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 italic text-slate-700 text-sm bg-emerald-50/40 rounded-r-xl">
                  “{previewStory.quote}”
                </blockquote>
              )}

              {/* Story Narrative */}
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {previewStory.story}
              </div>

              {previewStory.short_description && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-900 block mb-1">
                    Documented Impact & Support
                  </span>
                  <p className="text-xs text-emerald-800">
                    {previewStory.short_description}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setPreviewStory(null)} className="rounded-xl">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoriesManager;
