import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, MapPin, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
  Check, X, Globe, Upload, ExternalLink, ArrowUpDown, CheckCircle2,
  EyeOff, Sparkles, Loader2, AlertCircle, ArrowRight, Star, Users,
  Share2, Image as ImageIcon, CheckSquare, Tag, FileText, HelpCircle,
  Building, CalendarCheck, CalendarDays, Compass, Info
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  EventItem,
  EventStatus,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  normalizeEvent,
  slugify,
  isEventUpcoming
} from '../../utils/eventData';
import { publicAnonKey } from '../../utils/supabase/info';

interface EventsManagerProps {
  accessToken: string;
  projectId: string;
  userRole?: string;
  userName?: string;
  onUpdate?: () => void;
}

interface FormState {
  title: string;
  slug: string;
  category: string;
  custom_category: string;
  status: EventStatus;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  address: string;
  short_description: string;
  description: string;
  outcomes: string;
  featured_image: string;
  gallery: string[];
  registration_required: boolean;
  registration_url: string;
  registration_deadline: string;
  contact_email: string;
  contact_phone: string;
  organizer: string;
  related_program: string;
  is_featured: boolean;
  is_published: boolean;
}

export function EventsManager({
  accessToken,
  projectId,
  userRole,
  userName,
  onUpdate
}: EventsManagerProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timelineTab, setTimelineTab] = useState<'all' | 'upcoming' | 'past'>('all');

  // Dialog & Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [previewEvent, setPreviewEvent] = useState<EventItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const initialFormState: FormState = {
    title: '',
    slug: '',
    category: 'Community Activity',
    custom_category: '',
    status: 'upcoming',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    location: '',
    address: '',
    short_description: '',
    description: '',
    outcomes: '',
    featured_image: '',
    gallery: [],
    registration_required: false,
    registration_url: '',
    registration_deadline: '',
    contact_email: 'contact@resticbo.org',
    contact_phone: '+256 700 000000',
    organizer: 'RESTI Community Outreach',
    related_program: '',
    is_featured: false,
    is_published: true
  };

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryInputUrl, setGalleryInputUrl] = useState('');
  const [activeFormTab, setActiveFormTab] = useState<'details' | 'schedule' | 'registration' | 'media'>('details');

  const isReadOnly = userRole === 'viewer';

  // Fetch events from server
  const fetchEvents = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/events`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        // Fallback to public endpoint with all=true
        const fallbackRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events?all=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken || publicAnonKey}`
            }
          }
        );
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const items = (fbData.events || []).map(normalizeEvent);
          setEvents(items);
          return;
        }
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      const items = (data.events || []).map(normalizeEvent);
      setEvents(items);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      toast.error('Could not load events. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [projectId, accessToken]);

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setUploadingImage(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: uploadForm
        }
      );

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Upload failed');
      }

      if (isGallery) {
        setFormData(prev => ({
          ...prev,
          gallery: [...prev.gallery, data.url]
        }));
        toast.success('Gallery photo added successfully');
      } else {
        setFormData(prev => ({ ...prev, featured_image: data.url }));
        toast.success('Featured image uploaded successfully');
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open create
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData(initialFormState);
    setActiveFormTab('details');
    setIsFormOpen(true);
  };

  // Open edit
  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    const cat = evt.category || evt.event_type;
    const isCustomCat = !EVENT_CATEGORIES.includes(cat as any);
    setFormData({
      title: evt.title,
      slug: evt.slug || slugify(evt.title),
      category: isCustomCat ? 'Other' : cat,
      custom_category: isCustomCat ? cat : '',
      status: evt.status,
      start_date: evt.start_date || '',
      end_date: evt.end_date || '',
      start_time: evt.start_time || '',
      end_time: evt.end_time || '',
      location: evt.location || '',
      address: evt.address || '',
      short_description: evt.short_description || '',
      description: evt.description || '',
      outcomes: evt.outcomes || evt.summary || '',
      featured_image: evt.featured_image || evt.image || '',
      gallery: Array.isArray(evt.gallery) ? evt.gallery : [],
      registration_required: evt.registration_required,
      registration_url: evt.registration_url || '',
      registration_deadline: evt.registration_deadline || '',
      contact_email: evt.contact_email || 'contact@resticbo.org',
      contact_phone: evt.contact_phone || '',
      organizer: evt.organizer || 'RESTI Community Outreach',
      related_program: evt.related_program || '',
      is_featured: evt.is_featured,
      is_published: evt.is_published
    });
    setActiveFormTab('details');
    setIsFormOpen(true);
  };

  // Auto-generate slug when title changes (if not editing an existing custom slug)
  const handleTitleChange = (newTitle: string) => {
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: !editingEvent ? slugify(newTitle) : prev.slug
    }));
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('You do not have permission to modify events');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter the event title');
      return;
    }

    if (!formData.start_date) {
      toast.error('Please select the event start date');
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Please enter the event location or venue');
      return;
    }

    const resolvedCategory =
      formData.category === 'Other' && formData.custom_category.trim()
        ? formData.custom_category.trim()
        : formData.category;

    const payload = {
      title: formData.title.trim(),
      slug: (formData.slug.trim() || slugify(formData.title)),
      category: resolvedCategory,
      event_type: resolvedCategory,
      status: formData.status,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      start_time: formData.start_time || undefined,
      end_time: formData.end_time || undefined,
      location: formData.location.trim(),
      address: formData.address.trim() || undefined,
      short_description: formData.short_description.trim() || undefined,
      description: formData.description.trim() || undefined,
      outcomes: formData.outcomes.trim() || undefined,
      summary: formData.outcomes.trim() || undefined,
      featured_image: formData.featured_image || undefined,
      image: formData.featured_image || undefined,
      gallery: formData.gallery,
      registration_required: formData.registration_required,
      registration_url: formData.registration_url.trim() || undefined,
      registration_deadline: formData.registration_deadline || undefined,
      contact_email: formData.contact_email.trim() || undefined,
      contact_phone: formData.contact_phone.trim() || undefined,
      organizer: formData.organizer.trim() || 'RESTI Community Outreach',
      related_program: formData.related_program.trim() || undefined,
      is_featured: formData.is_featured,
      is_published: formData.is_published
    };

    setIsSaving(true);
    try {
      const isEditing = !!editingEvent;
      const url = isEditing
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/events/${editingEvent.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/events`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save event');
      }

      toast.success(isEditing ? 'Event updated successfully' : 'Event created successfully');
      setIsFormOpen(false);
      setEditingEvent(null);
      await fetchEvents();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error saving event:', err);
      toast.error(err.message || 'Could not save event');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle publish
  const handleTogglePublish = async (evt: EventItem) => {
    if (isReadOnly) return;
    const newStatus = !evt.is_published;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/events/${evt.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ is_published: newStatus })
        }
      );

      if (!response.ok) throw new Error('Failed to update publishing status');

      setEvents(prev => prev.map(e => e.id === evt.id ? { ...e, is_published: newStatus } : e));
      toast.success(newStatus ? `"${evt.title}" is now published` : `"${evt.title}" is now in draft mode`);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Could not update status');
    }
  };

  // Quick toggle featured
  const handleToggleFeatured = async (evt: EventItem) => {
    if (isReadOnly) return;
    const newFeatured = !evt.is_featured;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/events/${evt.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ is_featured: newFeatured })
        }
      );

      if (!response.ok) throw new Error('Failed to update featured status');

      setEvents(prev => prev.map(e => e.id === evt.id ? { ...e, is_featured: newFeatured } : e));
      toast.success(newFeatured ? `"${evt.title}" marked as Featured` : `"${evt.title}" removed from Featured`);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Could not update featured flag');
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    if (isReadOnly) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/events/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete event');

      setEvents(prev => prev.filter(e => e.id !== id));
      setDeleteConfirmId(null);
      toast.success('Event deleted successfully');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  // Filtered & Sorted events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      // Timeline filter
      if (timelineTab === 'upcoming' && !isEventUpcoming(evt)) return false;
      if (timelineTab === 'past' && isEventUpcoming(evt)) return false;

      // Status filter
      if (statusFilter === 'published' && !evt.is_published) return false;
      if (statusFilter === 'draft' && evt.is_published) return false;
      if (statusFilter === 'featured' && !evt.is_featured) return false;
      if (['upcoming', 'ongoing', 'completed', 'cancelled', 'postponed'].includes(statusFilter)) {
        if (evt.status !== statusFilter) return false;
      }

      // Category filter
      const cat = evt.category || evt.event_type;
      if (categoryFilter !== 'all' && cat !== categoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesLoc = (evt.location || '').toLowerCase().includes(q);
        const matchesDesc = (evt.description || '').toLowerCase().includes(q);
        const matchesCat = cat.toLowerCase().includes(q);
        const matchesOrg = (evt.organizer || '').toLowerCase().includes(q);
        return matchesTitle || matchesLoc || matchesDesc || matchesCat || matchesOrg;
      }

      return true;
    });
  }, [events, timelineTab, statusFilter, categoryFilter, searchQuery]);

  // Counts
  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter(isEventUpcoming).length;
    const past = events.filter(e => !isEventUpcoming(e)).length;
    const featured = events.filter(e => e.is_featured).length;
    const drafts = events.filter(e => !e.is_published).length;
    return { total, upcoming, past, featured, drafts };
  }, [events]);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-6 md:p-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl px-6 py-6 md:px-8 md:py-7 shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
            <CalendarDays size={32} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Events & Activities Manager
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                {stats.total} {stats.total === 1 ? 'event' : 'events'}
              </span>
            </div>
            <p className="text-sm text-emerald-50 mt-1 font-medium">
              Create, schedule, edit, and organize community workshops, training, meetings, and initiatives
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors disabled:opacity-50"
            title="Refresh events list"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {!isReadOnly && (
            <Button
              onClick={handleOpenCreate}
              className="bg-white text-emerald-800 hover:bg-emerald-50 shadow-md font-semibold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex-1 sm:flex-none flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Create Event</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => { setTimelineTab('all'); setStatusFilter('all'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            timelineTab === 'all' && statusFilter === 'all'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Events</span>
            <Calendar size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <span className="text-[11px] text-slate-400 font-medium">In database</span>
        </div>

        <div
          onClick={() => { setTimelineTab('upcoming'); setStatusFilter('all'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            timelineTab === 'upcoming'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Upcoming</span>
            <Clock size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2">{stats.upcoming}</div>
          <span className="text-[11px] text-blue-600 font-medium">Scheduled ahead</span>
        </div>

        <div
          onClick={() => { setTimelineTab('past'); setStatusFilter('all'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            timelineTab === 'past'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Past</span>
            <CheckCircle2 size={16} className="text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{stats.past}</div>
          <span className="text-[11px] text-slate-500 font-medium">Completed / Archived</span>
        </div>

        <div
          onClick={() => { setTimelineTab('all'); setStatusFilter('featured'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'featured'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Featured</span>
            <Star size={16} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2">{stats.featured}</div>
          <span className="text-[11px] text-amber-600 font-medium">Hero spotlight</span>
        </div>

        <div
          onClick={() => { setTimelineTab('all'); setStatusFilter('draft'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'draft'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">Drafts</span>
            <EyeOff size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-2">{stats.drafts}</div>
          <span className="text-[11px] text-purple-600 font-medium">Unpublished</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        {/* Timeline Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setTimelineTab('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              timelineTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Events ({stats.total})
          </button>
          <button
            onClick={() => setTimelineTab('upcoming')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              timelineTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Upcoming Events ({stats.upcoming})
          </button>
          <button
            onClick={() => setTimelineTab('past')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              timelineTab === 'past'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Past Events ({stats.past})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by title, location, description, organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Categories ({stats.total})</option>
              {EVENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
              <option value="featured">Featured Only</option>
              <option value="upcoming">Upcoming Status</option>
              <option value="ongoing">Ongoing Status</option>
              <option value="completed">Completed Status</option>
              <option value="cancelled">Cancelled Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No events found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || timelineTab !== 'all'
              ? 'No events match your current filter criteria. Try resetting filters.'
              : 'There are currently no events registered. Click "Create Event" to schedule your first activity.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || timelineTab !== 'all') ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setTimelineTab('all');
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            ) : !isReadOnly ? (
              <Button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                <Plus size={15} className="mr-1.5" />
                Create First Event
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredEvents.map(evt => {
            const isUpcoming = isEventUpcoming(evt);
            const imageSrc = evt.featured_image || evt.image;
            const categoryLabel = evt.category || evt.event_type;

            return (
              <div
                key={evt.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative"
              >
                {/* Event Image Banner */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-700">
                      <CalendarDays size={42} className="opacity-40 mb-2" />
                      <span className="text-xs font-semibold opacity-70">RESTI Activity</span>
                    </div>
                  )}

                  {/* Badges on Image */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-white/95 backdrop-blur-md shadow-sm text-emerald-800 border border-emerald-100">
                      {categoryLabel}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {evt.is_featured && (
                        <span className="px-2 py-1 text-[11px] font-bold rounded-full bg-amber-400 text-amber-950 shadow-sm flex items-center gap-1">
                          <Star size={11} className="fill-amber-950" />
                          Featured
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(evt);
                        }}
                        disabled={isReadOnly}
                        className={`px-2 py-1 text-[11px] font-bold rounded-full border shadow-sm transition-all flex items-center gap-1 ${
                          evt.is_published
                            ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                            : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-900'
                        }`}
                        title={evt.is_published ? 'Click to set as Draft' : 'Click to Publish'}
                      >
                        {evt.is_published ? (
                          <>
                            <CheckCircle2 size={11} />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff size={11} />
                            Draft
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Upcoming / Past status badge overlay */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md backdrop-blur-md shadow-sm ${
                      isUpcoming
                        ? 'bg-blue-600/90 text-white'
                        : 'bg-slate-800/80 text-slate-200'
                    }`}>
                      {isUpcoming ? 'Upcoming' : 'Past Event'}
                    </span>
                  </div>
                </div>

                {/* Event Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {evt.title}
                    </h3>

                    {/* Metadata lines */}
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-emerald-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-700">
                          {evt.start_date || 'Date TBD'}
                          {evt.end_date && evt.end_date !== evt.start_date && ` - ${evt.end_date}`}
                        </span>
                        {evt.start_time && (
                          <span className="text-slate-400">
                            • {evt.start_time}{evt.end_time ? ` - ${evt.end_time}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                        <span className="truncate text-slate-700 font-medium">
                          {evt.location || 'Location TBD'}
                        </span>
                      </div>

                      {evt.organizer && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Building size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{evt.organizer}</span>
                        </div>
                      )}
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
                      {evt.short_description || evt.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Registration Status Indicator */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {evt.registration_required ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        <CheckSquare size={11} />
                        Registration Required
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Open to all</span>
                    )}

                    {evt.gallery && evt.gallery.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                        <ImageIcon size={11} />
                        {evt.gallery.length} photos
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-5 py-3 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewEvent(evt)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/70 transition-colors"
                      title="Quick Preview"
                    >
                      <Eye size={13} />
                      Preview
                    </button>

                    <a
                      href={`/events/${evt.slug || evt.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                      title="View public page"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleFeatured(evt)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          evt.is_featured
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-slate-200/60'
                        }`}
                        title={evt.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                      >
                        <Star size={14} className={evt.is_featured ? 'fill-amber-500' : ''} />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(evt)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit size={12} />
                        Edit
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(evt.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Delete event"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete this event?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to permanently delete this event? This action will remove it from the public schedule and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl text-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteEvent(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Delete Event
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  {previewEvent.category || previewEvent.event_type}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{previewEvent.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Slug: /events/{previewEvent.slug || previewEvent.id}</p>
              </div>
              <button
                onClick={() => setPreviewEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {(previewEvent.featured_image || previewEvent.image) && (
                <img
                  src={previewEvent.featured_image || previewEvent.image}
                  alt={previewEvent.title}
                  className="w-full h-56 object-cover rounded-xl border border-slate-200"
                />
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500 block">Date & Time:</span>
                  <span>{previewEvent.start_date} {previewEvent.start_time ? `at ${previewEvent.start_time}` : ''}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Location:</span>
                  <span>{previewEvent.location} {previewEvent.address ? `(${previewEvent.address})` : ''}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Organizer:</span>
                  <span>{previewEvent.organizer || 'RESTI'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Status:</span>
                  <span className="capitalize">{previewEvent.status} • {previewEvent.is_published ? 'Published' : 'Draft'}</span>
                </div>
              </div>

              {previewEvent.short_description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Summary</h4>
                  <p className="text-sm text-slate-700 bg-slate-50/70 p-3 rounded-lg">{previewEvent.short_description}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</h4>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {previewEvent.description || 'No detailed description provided.'}
                </p>
              </div>

              {(previewEvent.outcomes || previewEvent.summary) && (
                <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">Outcomes & Impact</h4>
                  <p className="text-sm text-emerald-950 whitespace-pre-line">
                    {previewEvent.outcomes || previewEvent.summary}
                  </p>
                </div>
              )}

              {previewEvent.registration_required && (
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-900 block">Registration Required</span>
                    {previewEvent.registration_deadline && (
                      <span className="text-blue-700">Deadline: {previewEvent.registration_deadline}</span>
                    )}
                  </div>
                  {previewEvent.registration_url && (
                    <a
                      href={previewEvent.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-1"
                    >
                      Registration Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}

              {previewEvent.gallery && previewEvent.gallery.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Photo Gallery ({previewEvent.gallery.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {previewEvent.gallery.map((url, idx) => (
                      <img key={idx} src={url} alt="Gallery" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`/events/${previewEvent.slug || previewEvent.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                Open full detail page <ExternalLink size={12} />
              </a>
              <Button variant="outline" onClick={() => setPreviewEvent(null)} className="rounded-xl text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingEvent ? 'Edit Event & Activity' : 'Create New Event'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fill in event information, scheduling, registration, and media details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Navigation Tabs */}
            <div className="flex items-center px-6 border-b border-slate-100 bg-white gap-2 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFormTab('details')}
                className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeFormTab === 'details'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Basic Details
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('schedule')}
                className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeFormTab === 'schedule'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Schedule & Venue
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('registration')}
                className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeFormTab === 'registration'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Registration & Contacts
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('media')}
                className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeFormTab === 'media'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                4. Images & Outcomes
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveEvent} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: BASIC DETAILS */}
              {activeFormTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Community WASH Workshop & Clean Water Distribution"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        URL Slug <span className="text-slate-400 font-normal">(SEO-friendly)</span>
                      </label>
                      <div className="flex items-center">
                        <span className="text-xs text-slate-400 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl px-3 py-2.5">
                          /events/
                        </span>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                          placeholder="event-slug"
                          className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      >
                        {EVENT_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.category === 'Other' && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Custom Category Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter category name"
                        value={formData.custom_category}
                        onChange={(e) => setFormData(prev => ({ ...prev, custom_category: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Lifecycle Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as EventStatus }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize text-slate-800"
                      >
                        {EVENT_STATUSES.map(st => (
                          <option key={st} value={st} className="capitalize">{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Related Program <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Water & Sanitation (WASH), Youth Empowerment"
                        value={formData.related_program}
                        onChange={(e) => setFormData(prev => ({ ...prev, related_program: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Short Description <span className="text-slate-400 font-normal">(Displayed on cards, max 200 chars)</span>
                    </label>
                    <textarea
                      rows={2}
                      maxLength={250}
                      placeholder="A concise summary of what this event is about..."
                      value={formData.short_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Description & Agenda
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Detailed overview, agenda, target audience, what participants will learn or achieve..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 leading-relaxed"
                    />
                  </div>

                  {/* Feature & Published Checkboxes */}
                  <div className="pt-2 flex flex-wrap gap-6 border-t border-slate-100">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-800">Publish Immediately</span>
                        <p className="text-xs text-slate-500">Visible on the public Events & Activities page</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-800">Featured Spotlight</span>
                        <p className="text-xs text-slate-500">Highlighted prominently at top of page</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: SCHEDULE & VENUE */}
              {activeFormTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        End Date <span className="text-slate-400 font-normal">(Optional for multi-day)</span>
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        min={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Location / Venue Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Kiryandongo Community Hall, Bweyale Sub-County"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Detailed Address / Directions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Physical directions, landmarks, room number..."
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: REGISTRATION & CONTACT */}
              {activeFormTab === 'registration' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.registration_required}
                        onChange={(e) => setFormData(prev => ({ ...prev, registration_required: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-800">Registration Required</span>
                        <p className="text-xs text-slate-500">Participants must sign up in advance to attend</p>
                      </div>
                    </label>

                    {formData.registration_required && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Registration Link / Form URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://forms.gle/... or website link"
                            value={formData.registration_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, registration_url: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Registration Deadline
                          </label>
                          <input
                            type="date"
                            value={formData.registration_deadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Organizer / Lead Department
                      </label>
                      <input
                        type="text"
                        placeholder="RESTI Community Outreach"
                        value={formData.organizer}
                        onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        placeholder="contact@resticbo.org"
                        value={formData.contact_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+256 700 000000"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: IMAGES & OUTCOMES */}
              {activeFormTab === 'media' && (
                <div className="space-y-6">
                  {/* Featured Banner Image */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Featured Banner Image
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-full sm:w-44 h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {formData.featured_image ? (
                          <img src={formData.featured_image} alt="Featured" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-2 text-slate-400">
                            <ImageIcon size={24} className="mx-auto mb-1" />
                            <span className="text-[10px]">No image selected</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors">
                            {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingImage}
                              onChange={(e) => handleImageUpload(e, false)}
                            />
                          </label>
                          {formData.featured_image && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                              className="p-2 text-xs text-red-600 hover:bg-red-50 rounded-xl"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <input
                          type="url"
                          placeholder="Or paste direct image URL (https://...)"
                          value={formData.featured_image}
                          onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-Photo Gallery */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Event Gallery Photos ({formData.gallery.length})
                    </label>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-colors flex-shrink-0">
                          {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingImage}
                            onChange={(e) => handleImageUpload(e, true)}
                          />
                        </label>

                        <input
                          type="url"
                          placeholder="Or paste image URL"
                          value={galleryInputUrl}
                          onChange={(e) => setGalleryInputUrl(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          disabled={!galleryInputUrl.trim()}
                          onClick={() => {
                            if (!galleryInputUrl.trim()) return;
                            setFormData(prev => ({
                              ...prev,
                              gallery: [...prev.gallery, galleryInputUrl.trim()]
                            }));
                            setGalleryInputUrl('');
                          }}
                          className="text-xs px-3 rounded-xl"
                        >
                          Add
                        </Button>
                      </div>

                      {formData.gallery.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                          {formData.gallery.map((url, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white h-24">
                              <img src={url} alt="gallery" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }))}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary & Outcomes (Especially for past events) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Event Summary & Outcomes <span className="text-slate-400 font-normal">(Crucial for completed activities)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share achievements, participant attendance count, impact metrics, community feedback..."
                      value={formData.outcomes}
                      onChange={(e) => setFormData(prev => ({ ...prev, outcomes: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 leading-relaxed"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      This appears in the "Event Outcomes & Impact" section once the event has taken place.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                  className="rounded-xl text-slate-600"
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  {activeFormTab !== 'details' && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const tabs: Array<'details' | 'schedule' | 'registration' | 'media'> = ['details', 'schedule', 'registration', 'media'];
                        const idx = tabs.indexOf(activeFormTab);
                        if (idx > 0) setActiveFormTab(tabs[idx - 1]);
                      }}
                      className="text-xs"
                    >
                      Back
                    </Button>
                  )}

                  {activeFormTab !== 'media' ? (
                    <Button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'details' | 'schedule' | 'registration' | 'media'> = ['details', 'schedule', 'registration', 'media'];
                        const idx = tabs.indexOf(activeFormTab);
                        if (idx < tabs.length - 1) setActiveFormTab(tabs[idx + 1]);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl flex items-center gap-2"
                    >
                      {isSaving && <Loader2 size={14} className="animate-spin" />}
                      <span>{editingEvent ? 'Save Changes' : 'Create Event'}</span>
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
