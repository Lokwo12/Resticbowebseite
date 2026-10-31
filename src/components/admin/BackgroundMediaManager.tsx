import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Film, Image as ImageIcon, Plus, Trash2, Edit3, Eye, Upload, 
  Check, X, AlertCircle, RefreshCw, Layers, Sliders, Shield, 
  Play, Pause, ArrowUp, ArrowDown, ExternalLink, HelpCircle,
  Sparkles, CheckCircle2, Video, Globe, Info, Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';
import {
  BackgroundMediaItem,
  BackgroundSectionId,
  BackgroundMediaType,
  RESTI_PROGRAM_PILLARS,
  SECTION_METADATA,
  PAGE_METADATA,
  PAGE_CATEGORIES,
  PageCategory,
  normalizeBackgroundMedia,
  evaluateTextContrast
} from '../../utils/backgroundMediaData';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DraggableDialog } from '../DraggableDialog';
import { Monitor, Tablet, Smartphone, Type, SlidersHorizontal } from 'lucide-react';

interface BackgroundMediaManagerProps {
  userRole: string;
  userName: string;
  accessToken?: string;
  onUpdate?: () => void;
}

export function BackgroundMediaManager({
  userRole,
  userName,
  accessToken,
  onUpdate
}: BackgroundMediaManagerProps) {
  const [items, setItems] = useState<BackgroundMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Overview
  const [overviewTab, setOverviewTab] = useState<'pages' | 'sections'>('pages');
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'sequence'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog & Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BackgroundMediaItem | null>(null);
  const [previewItem, setPreviewItem] = useState<BackgroundMediaItem | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [formActiveTab, setFormActiveTab] = useState<'general' | 'responsive' | 'text' | 'cinematic'>('general');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    alt_text: '',
    page: 'home' as string,
    section: 'hero' as string,
    media_type: 'image' as BackgroundMediaType,
    url: '',
    poster_url: '',
    sequence_urls: [] as string[],
    
    // Responsive Overrides
    mobile_url: '',
    tablet_url: '',
    mobile_poster_url: '',
    mobile_position: 'center' as 'center' | 'top' | 'bottom',
    tablet_position: 'center' as 'center' | 'top' | 'bottom',

    // Cinematic & Overlay
    overlay_darkness: 50,
    overlay_color: 'black',
    overlay_gradient: 'none' as 'none' | 'to-b' | 'to-t' | 'radial' | 'vignette',
    blur: 0,
    blur_percent: 0,
    parallax: true,
    position: 'center' as 'center' | 'top' | 'bottom',
    transition_duration: 1000,

    // Text Readability & Presentation
    text_color: 'white' as 'white' | 'slate-100' | 'emerald-100' | 'amber-100' | 'stone-900',
    text_shadow: 'subtle' as 'none' | 'subtle' | 'medium' | 'strong',
    text_backdrop: 'none' as 'none' | 'subtle-blur' | 'pill-badge' | 'card-translucent',
    text_align: 'center' as 'center' | 'left' | 'right',
    max_content_width: 'xl' as 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full',
    title_size_desktop: 'default' as 'default' | 'large' | 'huge',
    title_size_mobile: 'default' as 'default' | 'compact' | 'large',

    program_pillar: 'General / Cross-Cutting',
    display_order: 1,
    is_published: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const sequenceInputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = userRole === 'viewer';
  const canDelete = userRole === 'admin' || userRole === 'super-admin';

  // Helper to ensure freshest auth session token
  const getAuthToken = async (): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return session.access_token;
    } catch {}
    return accessToken || publicAnonKey;
  };

  // Fetch Background Media from Backend with Dual-Layer Fallback
  const fetchMedia = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const token = await getAuthToken();

      // 1. First attempt: Edge Function Admin Endpoint
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/background-media`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const list = (data.backgrounds || []).map(normalizeBackgroundMedia);
          list.sort((a: BackgroundMediaItem, b: BackgroundMediaItem) => a.display_order - b.display_order);
          setItems(list);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } catch (err) {
        console.warn('Admin background-media endpoint error, falling back to direct database query:', err);
      }

      // 2. Fallback: Direct Supabase KV Store query
      const { data: kvData, error: kvErr } = await supabase
        .from('kv_store_2a4be611')
        .select('key, value')
        .like('key', 'bg_media:%');

      if (!kvErr && Array.isArray(kvData)) {
        const list = kvData.map(r => normalizeBackgroundMedia({ key: r.key, ...(r.value || {}) }));
        list.sort((a, b) => a.display_order - b.display_order);
        setItems(list);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching background media:', error);
      toast.error('Failed to load background media');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Handle File Upload (supports JPG, PNG, WebP, AVIF, MP4, WebM)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'url' | 'poster_url' | 'sequence') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    setUploadProgress('Preparing file...');

    try {
      const token = await getAuthToken();

      if (targetField === 'sequence') {
        // Upload multiple sequence images
        const uploadedUrls: string[] = [...formData.sequence_urls];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(`Uploading photo ${i + 1} of ${files.length}...`);

          const uploadForm = new FormData();
          uploadForm.append('file', file);

          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: uploadForm
            }
          );
          const data = await res.json();
          if (res.ok && data.url) {
            uploadedUrls.push(data.url);
          } else {
            throw new Error(data.error || 'Failed to upload sequence item');
          }
        }

        setFormData(prev => ({ ...prev, sequence_urls: uploadedUrls }));
        toast.success(`Added ${files.length} photos to sequence`);
      } else {
        const file = files[0];
        const isVideo = file.type.startsWith('video/');
        setUploadProgress(`Uploading ${isVideo ? 'video' : 'image'} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

        const uploadForm = new FormData();
        uploadForm.append('file', file);

        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: uploadForm
          }
        );

        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || 'Upload failed');
        }

        if (targetField === 'poster_url') {
          setFormData(prev => ({ ...prev, poster_url: data.url }));
          toast.success('Video poster image uploaded');
        } else {
          setFormData(prev => ({
            ...prev,
            url: data.url,
            media_type: isVideo ? 'video' : prev.media_type === 'video' ? 'image' : prev.media_type
          }));
          toast.success(`${isVideo ? 'Video' : 'Background image'} uploaded successfully`);
        }
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
      setUploadProgress('');
      if (e.target) e.target.value = '';
    }
  };

  // Open Form for Create
  const handleOpenCreate = (preselectedSection?: BackgroundSectionId | string, preselectedPage?: string) => {
    const targetPage = preselectedPage || 'home';
    const defaultSec = preselectedSection || (targetPage === 'home' ? 'hero' : (PAGE_METADATA[targetPage]?.defaultSection || 'page'));
    const sectionItems = items.filter(i => (i.page || 'home') === targetPage && i.section === defaultSec);
    const nextOrder = sectionItems.length > 0
      ? Math.max(...sectionItems.map(i => i.display_order)) + 1
      : 1;

    setEditingItem(null);
    setFormActiveTab('general');
    setFormData({
      title: '',
      alt_text: '',
      page: targetPage,
      section: defaultSec,
      media_type: 'image',
      url: '',
      poster_url: '',
      sequence_urls: [],

      // Responsive Overrides
      mobile_url: '',
      tablet_url: '',
      mobile_poster_url: '',
      mobile_position: 'center',
      tablet_position: 'center',

      // Cinematic & Overlay
      overlay_darkness: 50,
      overlay_color: 'black',
      overlay_gradient: 'none',
      blur: 0,
      blur_percent: 0,
      parallax: true,
      position: 'center',
      transition_duration: 1000,

      // Text Readability & Presentation
      text_color: 'white',
      text_shadow: 'subtle',
      text_backdrop: 'none',
      text_align: 'center',
      max_content_width: 'xl',
      title_size_desktop: 'default',
      title_size_mobile: 'default',

      program_pillar: 'General / Cross-Cutting',
      display_order: nextOrder,
      is_published: true
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (item: BackgroundMediaItem) => {
    setEditingItem(item);
    setFormActiveTab('general');
    const itemPage = item.page || 'home';
    setFormData({
      title: item.title,
      alt_text: item.alt_text,
      page: itemPage,
      section: item.section || 'page',
      media_type: item.media_type,
      url: item.url,
      poster_url: item.poster_url || '',
      sequence_urls: item.sequence_urls || [],

      // Responsive Overrides
      mobile_url: item.mobile_url || '',
      tablet_url: item.tablet_url || '',
      mobile_poster_url: item.mobile_poster_url || '',
      mobile_position: item.mobile_position || 'center',
      tablet_position: item.tablet_position || 'center',

      // Cinematic & Overlay
      overlay_darkness: item.overlay_darkness,
      overlay_color: item.overlay_color || 'black',
      overlay_gradient: item.overlay_gradient || 'none',
      blur: item.blur,
      blur_percent: typeof item.blur_percent === 'number'
        ? item.blur_percent
        : (item.blur <= 8 ? Math.round((item.blur / 8) * 100) : Math.round((item.blur / 40) * 100)),
      parallax: item.parallax,
      position: item.position,
      transition_duration: item.transition_duration,

      // Text Readability & Presentation
      text_color: item.text_color || 'white',
      text_shadow: item.text_shadow || 'subtle',
      text_backdrop: item.text_backdrop || 'none',
      text_align: item.text_align || 'center',
      max_content_width: item.max_content_width || 'xl',
      title_size_desktop: item.title_size_desktop || 'default',
      title_size_mobile: item.title_size_mobile || 'default',

      program_pillar: item.program_pillar || 'General / Cross-Cutting',
      display_order: item.display_order,
      is_published: item.is_published
    });
    setIsFormOpen(true);
  };

  // Save Background Media (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('You have read-only access');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title or label');
      return;
    }

    if (formData.media_type === 'sequence') {
      if (!formData.sequence_urls || formData.sequence_urls.length === 0) {
        toast.error('Please upload at least one image for the photo sequence');
        return;
      }
    } else {
      if (!formData.url.trim()) {
        toast.error(`Please upload or provide a ${formData.media_type === 'video' ? 'video' : 'background image'} URL`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const token = await getAuthToken();
      const id = editingItem ? editingItem.id : crypto.randomUUID();
      const payload: Partial<BackgroundMediaItem> = {
        id,
        key: `bg_media:${id}`,
        title: formData.title.trim(),
        alt_text: formData.alt_text.trim(),
        page: formData.page || 'home',
        section: formData.section || 'page',
        media_type: formData.media_type,
        url: formData.media_type === 'sequence' ? (formData.sequence_urls[0] || '') : formData.url.trim(),
        poster_url: formData.poster_url.trim(),
        sequence_urls: formData.sequence_urls,

        // Responsive overrides
        mobile_url: formData.mobile_url.trim() || undefined,
        tablet_url: formData.tablet_url.trim() || undefined,
        mobile_poster_url: formData.mobile_poster_url.trim() || undefined,
        mobile_position: formData.mobile_position,
        tablet_position: formData.tablet_position,

        // Cinematic & Overlay
        overlay_darkness: Number(formData.overlay_darkness),
        overlay_color: formData.overlay_color,
        overlay_gradient: formData.overlay_gradient,
        blur: Math.round(((Number(formData.blur_percent ?? formData.blur) / 100) * 40) * 10) / 10,
        blur_percent: Number(formData.blur_percent ?? formData.blur),
        parallax: Boolean(formData.parallax),
        position: formData.position,
        transition_duration: Number(formData.transition_duration),

        // Text Readability & Presentation
        text_color: formData.text_color,
        text_shadow: formData.text_shadow,
        text_backdrop: formData.text_backdrop,
        text_align: formData.text_align,
        max_content_width: formData.max_content_width,
        title_size_desktop: formData.title_size_desktop,
        title_size_mobile: formData.title_size_mobile,

        program_pillar: formData.program_pillar,
        display_order: Number(formData.display_order),
        is_published: Boolean(formData.is_published),
        created_at: editingItem?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 1. Send to Edge Function API
      let apiSuccess = false;
      try {
        const url = editingItem
          ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/background-media/${id}`
          : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/background-media`;

        const res = await fetch(url, {
          method: editingItem ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('Edge function save failed, writing directly to Supabase KV store:', apiErr);
      }

      // 2. Direct Supabase KV Store upsert (ensures zero data loss)
      const kvRes = await supabase
        .from('kv_store_2a4be611')
        .upsert({
          key: `bg_media:${id}`,
          value: payload
        });

      if (kvRes.error && !apiSuccess) {
        throw new Error(kvRes.error.message || 'Failed to save background media');
      }

      toast.success(editingItem ? 'Background media updated' : 'Background media created');
      setIsFormOpen(false);
      fetchMedia();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save background media');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (item: BackgroundMediaItem) => {
    if (isReadOnly) return;
    try {
      const nextPublished = !item.is_published;
      const updated = { ...item, is_published: nextPublished, updated_at: new Date().toISOString() };

      const token = await getAuthToken();
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/background-media/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated)
      }).catch(() => {});

      await supabase.from('kv_store_2a4be611').upsert({
        key: item.key || `bg_media:${item.id}`,
        value: updated
      });

      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      toast.success(nextPublished ? 'Background published to website' : 'Background unpublished (draft)');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  // Delete Background Media
  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast.error('Only administrators can delete media');
      return;
    }
    try {
      const token = await getAuthToken();
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/background-media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});

      await supabase.from('kv_store_2a4be611').delete().eq('key', `bg_media:${id}`);

      setItems(prev => prev.filter(i => i.id !== id));
      setDeleteConfirmId(null);
      toast.success('Background media removed');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to delete background media');
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemPage = item.page || 'home';
      if (pageFilter !== 'all' && itemPage !== pageFilter) return false;
      if (sectionFilter !== 'all' && item.section !== sectionFilter) return false;
      if (statusFilter === 'published' && !item.is_published) return false;
      if (statusFilter === 'draft' && item.is_published) return false;
      if (typeFilter !== 'all' && item.media_type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pageLabel = PAGE_METADATA[itemPage]?.label.toLowerCase() || '';
        return (
          item.title.toLowerCase().includes(q) ||
          item.alt_text.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          itemPage.toLowerCase().includes(q) ||
          pageLabel.includes(q) ||
          (item.program_pillar && item.program_pillar.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, pageFilter, sectionFilter, statusFilter, typeFilter, searchQuery]);

  // Section summary: check which homepage sections have published media
  const sectionSummary = useMemo(() => {
    const summary: Record<string, BackgroundMediaItem[]> = {};
    Object.keys(SECTION_METADATA).forEach(sec => {
      summary[sec] = items.filter(i => (i.page === 'home' || !i.page) && i.section === sec && i.is_published);
    });
    return summary;
  }, [items]);

  // Page summary: check which individual pages have published media
  const pageSummary = useMemo(() => {
    const summary: Record<string, BackgroundMediaItem[]> = {};
    Object.keys(PAGE_METADATA).forEach(pageKey => {
      summary[pageKey] = items.filter(i => (i.page || 'home') === pageKey && i.is_published);
    });
    return summary;
  }, [items]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-3 backdrop-blur-sm border border-white/15">
              <Film size={14} />
              <span>Cinematic Visual Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Background Media Manager
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Upload, organize, and assign cinematic background photographs and videos across the website. Control crossfade transitions, overlay darkness, parallax motion, and program pillar themes directly without writing code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => fetchMedia(true)}
              variant="outline"
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs sm:text-sm h-10"
            >
              <RefreshCw size={14} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!isReadOnly && (
              <Button
                onClick={() => handleOpenCreate()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/20 h-10 px-4"
              >
                <Plus size={16} className="mr-1.5" />
                Add Background
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="text-xs text-slate-300 font-medium">Total Backgrounds</div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{items.length}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="text-xs text-emerald-300 font-medium">Live on Website</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
              {items.filter(i => i.is_published).length}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="text-xs text-cyan-300 font-medium">Video Backgrounds</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-1">
              {items.filter(i => i.media_type === 'video').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="text-xs text-amber-300 font-medium">Drafts / Inactive</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">
              {items.filter(i => !i.is_published).length}
            </div>
          </div>
        </div>
      </div>

      {/* Website Overview Cards (Pages & Sections) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-emerald-600" />
              <span>Background Coverage & Assignment Map</span>
            </h3>
            <span className="text-xs text-slate-500">Inspect coverage across all 26 website pages or 11 homepage scrolling sections</span>
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setOverviewTab('pages')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                overviewTab === 'pages'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Individual Pages ({Object.keys(PAGE_METADATA).length})
            </button>
            <button
              type="button"
              onClick={() => setOverviewTab('sections')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                overviewTab === 'sections'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Homepage Sections ({Object.keys(SECTION_METADATA).length})
            </button>
          </div>
        </div>

        {overviewTab === 'pages' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto p-1">
            {Object.values(PAGE_METADATA).map(page => {
              const assigned = pageSummary[page.key] || [];
              const isSelected = pageFilter === page.key;
              const primaryMedia = assigned[0];

              return (
                <div
                  key={page.key}
                  onClick={() => setPageFilter(isSelected ? 'all' : page.key)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {page.label}
                      </span>
                      {assigned.length > 0 ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active background live" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" title="Neutral brand / global fallback" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] mb-2">
                      <span className="text-slate-400 font-mono">{page.path}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 capitalize">{page.category}</span>
                    </div>

                    <div className="text-[11px] line-clamp-1 mb-2">
                      {assigned.length > 0 ? (
                        <span className="text-emerald-700 font-medium">
                          {assigned.length} live media ({primaryMedia.media_type})
                        </span>
                      ) : (
                        <span className="text-slate-400">Clean brand / global fallback</span>
                      )}
                    </div>
                  </div>

                  {primaryMedia && (primaryMedia.url || primaryMedia.poster_url) ? (
                    <div className="h-14 rounded-xl overflow-hidden bg-slate-900 relative shrink-0">
                      {primaryMedia.media_type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs">
                          <Video size={14} className="text-emerald-400 mr-1" /> Video Active
                        </div>
                      ) : (
                        <img
                          src={primaryMedia.url || primaryMedia.poster_url}
                          alt={primaryMedia.alt_text || primaryMedia.title}
                          className="w-full h-full object-cover opacity-80"
                        />
                      )}
                      <div
                        className="absolute inset-0 bg-black"
                        style={{ opacity: primaryMedia.overlay_darkness / 100 }}
                      />
                    </div>
                  ) : (
                    <div className="h-14 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-between px-3 text-[11px] text-slate-400 shrink-0">
                      <span>No custom media</span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreate(undefined, page.key);
                          }}
                          className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                        >
                          + Set
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(Object.entries(SECTION_METADATA) as [BackgroundSectionId, any][]).map(([secId, meta]) => {
              const assigned = sectionSummary[secId] || [];
              const isSelected = sectionFilter === secId;
              const primaryMedia = assigned[0];

              return (
                <div
                  key={secId}
                  onClick={() => setSectionFilter(isSelected ? 'all' : secId)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {meta.label}
                    </span>
                    {assigned.length > 0 ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active background live" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" title="Using neutral fallback" />
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                    {assigned.length > 0 ? (
                      <span className="text-emerald-700 font-medium">
                        {assigned.length} live media ({primaryMedia.media_type})
                      </span>
                    ) : (
                      <span className="text-slate-400">Neutral brand fallback</span>
                    )}
                  </div>

                  {primaryMedia && (primaryMedia.url || primaryMedia.poster_url) ? (
                    <div className="h-14 rounded-xl overflow-hidden bg-slate-900 relative">
                      {primaryMedia.media_type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs">
                          <Video size={16} className="text-emerald-400 mr-1" /> Video Active
                        </div>
                      ) : (
                        <img
                          src={primaryMedia.url || primaryMedia.poster_url}
                          alt={primaryMedia.alt_text || primaryMedia.title}
                          className="w-full h-full object-cover opacity-80"
                        />
                      )}
                      <div
                        className="absolute inset-0 bg-black"
                        style={{ opacity: primaryMedia.overlay_darkness / 100 }}
                      />
                    </div>
                  ) : (
                    <div className="h-14 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[11px] text-slate-400">
                      No custom media
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Page Filter */}
          <select
            value={pageFilter}
            onChange={e => setPageFilter(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[200px]"
          >
            <option value="all">All Pages ({Object.keys(PAGE_METADATA).length})</option>
            {PAGE_CATEGORIES.map(category => (
              <optgroup key={category.id} label={category.label}>
                {Object.values(PAGE_METADATA).filter(p => p.category === category.id).map(page => (
                  <option key={page.key} value={page.key}>{page.label}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Sections / Areas</option>
            {Object.entries(SECTION_METADATA).map(([id, meta]) => (
              <option key={id} value={id}>{meta.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Media Types</option>
            <option value="image">Single Image</option>
            <option value="video">Cinematic Video</option>
            <option value="sequence">Photo Sequence</option>
          </select>

          {pageFilter !== 'all' || sectionFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || searchQuery ? (
            <button
              onClick={() => {
                setPageFilter('all');
                setSectionFilter('all');
                setStatusFilter('all');
                setTypeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold px-2"
            >
              Reset Filters
            </button>
          ) : null}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by label or page..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Background Items Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-emerald-600" />
          <p className="text-sm font-medium">Loading background media...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Film size={28} />
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-2">No background media found</h4>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {pageFilter !== 'all'
              ? `No background media assigned to ${PAGE_METADATA[pageFilter]?.label || pageFilter} yet.`
              : sectionFilter !== 'all'
                ? `No background media assigned to ${SECTION_METADATA[sectionFilter as BackgroundSectionId]?.label || sectionFilter} yet.`
                : 'Add your first background photograph or video to enhance the website\'s visual experience.'}
          </p>
          {!isReadOnly && (
            <Button
              onClick={() => handleOpenCreate(sectionFilter !== 'all' ? sectionFilter as BackgroundSectionId : undefined, pageFilter !== 'all' ? pageFilter : undefined)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm"
            >
              <Plus size={16} className="mr-1.5" />
              Upload First Background
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const itemPageKey = item.page || 'home';
            const pageMeta = PAGE_METADATA[itemPageKey] || { label: itemPageKey, path: '/' };
            const areaLabel = pageMeta.displayAreas?.find(a => a.id === item.section)?.label || SECTION_METADATA[item.section as BackgroundSectionId]?.label || item.section;
            const previewUrl = item.media_type === 'sequence'
              ? (item.sequence_urls?.[0] || item.url)
              : (item.url || item.poster_url);

            return (
              <Card
                key={item.id}
                className="overflow-hidden border border-slate-200/90 rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Media Preview Box */}
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    {item.media_type === 'video' ? (
                      <div className="w-full h-full relative flex items-center justify-center">
                        {item.poster_url ? (
                          <img
                            src={item.poster_url}
                            alt={item.alt_text || item.title}
                            className="w-full h-full object-cover opacity-80"
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover opacity-80"
                            muted
                            loop
                            playsInline
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-lg">
                            <Play size={20} className="ml-0.5 text-emerald-400" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt={item.alt_text || item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ objectPosition: item.position }}
                      />
                    )}

                    {/* Darkness Overlay Simulator */}
                    <div
                      className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                      style={{ opacity: item.overlay_darkness / 100 }}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                      <Badge className="bg-black/75 backdrop-blur-md text-white border border-white/20 text-xs font-semibold max-w-[70%] truncate">
                        {pageMeta.label} • {areaLabel}
                      </Badge>
                      <Badge
                        className={`text-xs font-bold ${
                          item.is_published
                            ? 'bg-emerald-600/90 text-white border border-emerald-400'
                            : 'bg-amber-600/90 text-white border border-amber-400'
                        }`}
                      >
                        {item.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>

                    {/* Bottom Media Type Indicator */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                        {item.media_type === 'video' && <Video size={12} className="text-cyan-400" />}
                        {item.media_type === 'sequence' && <Layers size={12} className="text-amber-400" />}
                        {item.media_type === 'image' && <ImageIcon size={12} className="text-emerald-400" />}
                        <span className="capitalize">{item.media_type}</span>
                        {item.media_type === 'sequence' && (
                          <span className="text-amber-300">({item.sequence_urls?.length || 0})</span>
                        )}
                      </span>
                      <span className="text-[11px] font-medium text-slate-200 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                        {item.overlay_darkness}% Overlay
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-mono">
                          {pageMeta.path}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {pageMeta.category}
                        </span>
                      </div>
                      {item.alt_text ? (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                          Alt: "{item.alt_text}"
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle size={12} /> Alt text recommended
                        </p>
                      )}
                    </div>

                    {item.program_pillar && item.program_pillar !== 'General / Cross-Cutting' && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                        <Sparkles size={11} /> {item.program_pillar}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">Position:</span> <span className="capitalize font-medium text-slate-700">{item.position}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Parallax:</span> <span className="font-medium text-slate-700">{item.parallax ? 'Active' : 'Disabled'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Duration:</span> <span className="font-medium text-slate-700">{item.transition_duration}ms</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Order:</span> <span className="font-medium text-slate-700">#{item.display_order}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="Preview full background"
                    >
                      <Eye size={16} />
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Edit background settings"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete background"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {!isReadOnly && (
                    <Button
                      onClick={() => handleTogglePublish(item)}
                      variant={item.is_published ? 'outline' : 'default'}
                      size="sm"
                      className={`rounded-xl text-xs font-semibold h-8 ${
                        item.is_published
                          ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {item.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <DraggableDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Background Media' : 'Add Background Media'}
        defaultWidth={780}
        headerColor="#084C24"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-2 pb-2">
            <button
              type="button"
              onClick={() => setFormActiveTab('general')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                formActiveTab === 'general'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ImageIcon size={14} />
              <span>General Media</span>
            </button>
            <button
              type="button"
              onClick={() => setFormActiveTab('responsive')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                formActiveTab === 'responsive'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Smartphone size={14} />
              <span>Responsive Overrides</span>
            </button>
            <button
              type="button"
              onClick={() => setFormActiveTab('text')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                formActiveTab === 'text'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Type size={14} />
              <span>Text & Contrast</span>
            </button>
            <button
              type="button"
              onClick={() => setFormActiveTab('cinematic')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                formActiveTab === 'cinematic'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Cinematic & Overlay</span>
            </button>
          </div>

          {/* TAB 1: General Media */}
          {formActiveTab === 'general' && (
            <div className="space-y-5">
          {/* Title & Page/Section Destination */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Internal Label / Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Hero - Refugee Youth Vocational Training"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Page / Destination <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.page}
                  onChange={e => {
                    const newPage = e.target.value;
                    const defaultSec = PAGE_METADATA[newPage]?.defaultSection || (newPage === 'home' ? 'hero' : 'page');
                    setFormData(prev => ({ ...prev, page: newPage, section: defaultSec }));
                  }}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {PAGE_CATEGORIES.map(category => {
                    const categoryPages = Object.values(PAGE_METADATA).filter(p => p.category === category.id);
                    if (categoryPages.length === 0) return null;
                    return (
                      <optgroup key={category.id} label={category.label}>
                        {categoryPages.map(page => (
                          <option key={page.key} value={page.key}>
                            {page.label} ({page.path})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {PAGE_METADATA[formData.page]?.description || 'Website target page'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Display Area / Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.section}
                  onChange={e => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {(PAGE_METADATA[formData.page]?.displayAreas || [
                    { id: 'page', label: 'Full Page Background', description: 'Renders behind this page' }
                  ]).map(area => (
                    <option key={area.id} value={area.id}>
                      {area.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {PAGE_METADATA[formData.page]?.displayAreas.find(a => a.id === formData.section)?.description || 'Selected visual display area on this page'}
                </p>
              </div>
            </div>
          </div>

          {/* Media Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Background Experience Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, media_type: 'image' }))}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  formData.media_type === 'image'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ImageIcon size={20} className={formData.media_type === 'image' ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="text-xs font-bold">Single Photograph</span>
                <span className="text-[10px] text-slate-500">Still photo with parallax</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, media_type: 'sequence' }))}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  formData.media_type === 'sequence'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Layers size={20} className={formData.media_type === 'sequence' ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="text-xs font-bold">Photo Sequence</span>
                <span className="text-[10px] text-slate-500">Crossfading photo story</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, media_type: 'video' }))}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  formData.media_type === 'video'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Video size={20} className={formData.media_type === 'video' ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="text-xs font-bold">Cinematic Video</span>
                <span className="text-[10px] text-slate-500">Muted looping MP4</span>
              </button>
            </div>
          </div>

          {/* Media Upload & URL Input */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={14} className="text-emerald-600" />
                <span>Media File or Direct URL</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {formData.media_type === 'video' ? 'MP4 / WebM up to 50MB' : 'JPEG / PNG / WebP / AVIF up to 15MB'}
              </span>
            </div>

            {formData.media_type === 'sequence' ? (
              /* Sequence Media Manager */
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={sequenceInputRef}
                    onChange={e => handleUpload(e, 'sequence')}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => sequenceInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                  >
                    <Upload size={14} className="mr-1.5" />
                    {uploadingFile ? uploadProgress || 'Uploading...' : 'Upload Photos to Sequence'}
                  </Button>
                  <span className="text-xs text-slate-500">
                    {formData.sequence_urls.length} photos in sequence
                  </span>
                </div>

                {formData.sequence_urls.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                    {formData.sequence_urls.map((seqUrl, idx) => (
                      <div key={idx} className="relative group h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                        <img src={seqUrl} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded font-bold">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            sequence_urls: prev.sequence_urls.filter((_, i) => i !== idx)
                          }))}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Single Media or Video URL */
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.url}
                    onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder={formData.media_type === 'video' ? 'Paste MP4 video URL or upload below...' : 'Paste image URL or upload below...'}
                    className="flex-1 text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={e => handleUpload(e, 'url')}
                    accept={formData.media_type === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-4"
                  >
                    <Upload size={14} className="mr-1.5" />
                    {uploadingFile ? 'Uploading...' : 'Browse File'}
                  </Button>
                </div>

                {uploadProgress && (
                  <p className="text-xs text-emerald-700 font-medium animate-pulse">{uploadProgress}</p>
                )}

                {/* Video Poster Image Input (for videos only) */}
                {formData.media_type === 'video' && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Video Poster Fallback Image (shown on mobile or while video buffers)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.poster_url}
                        onChange={e => setFormData(prev => ({ ...prev, poster_url: e.target.value }))}
                        placeholder="Poster image URL..."
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                      />
                      <input
                        type="file"
                        ref={posterInputRef}
                        onChange={e => handleUpload(e, 'poster_url')}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => posterInputRef.current?.click()}
                        disabled={uploadingFile}
                        variant="outline"
                        className="rounded-xl text-xs px-3"
                      >
                        Upload Poster
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accessible Alt Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Accessible Alternative Text (for screen readers & SEO)
            </label>
            <input
              type="text"
              value={formData.alt_text}
              onChange={e => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
              placeholder="e.g. Refugee students learning computer programming skills in Kiryandongo"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Program Pillar Tagging */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              RESTI Program Area Theme
            </label>
            <select
              value={formData.program_pillar}
              onChange={e => setFormData(prev => ({ ...prev, program_pillar: e.target.value }))}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {RESTI_PROGRAM_PILLARS.map(pillar => (
                <option key={pillar} value={pillar}>{pillar}</option>
              ))}
            </select>
          </div>

          {/* Close TAB 1 */}
            </div>
          )}

          {/* TAB 2: Responsive Overrides (Mobile & Tablet) */}
          {formActiveTab === 'responsive' && (
            <div className="space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="text-emerald-600" size={18} />
                <h4 className="text-sm font-bold text-slate-900">Mobile & Tablet Specific Overrides</h4>
              </div>
              <p className="text-xs text-slate-600">
                Supply optimized vertical crops or lighter media files for phones and tablets to accelerate loading speed and ensure subjects are perfectly framed.
              </p>

              {/* Mobile Phone Overrides */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Smartphone size={14} className="text-emerald-600" />
                  <span>Smartphone Override (Viewports &lt; 640px)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Media URL (Optional)</label>
                    <input
                      type="text"
                      value={formData.mobile_url}
                      onChange={e => setFormData(prev => ({ ...prev, mobile_url: e.target.value }))}
                      placeholder="Leave empty to use default desktop media"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Crop / Alignment</label>
                    <select
                      value={formData.mobile_position}
                      onChange={e => setFormData(prev => ({ ...prev, mobile_position: e.target.value as any }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                    >
                      <option value="center">Center (Balanced)</option>
                      <option value="top">Top (Headroom / Sky)</option>
                      <option value="bottom">Bottom (Foreground subjects)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tablet Overrides */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Tablet size={14} className="text-emerald-600" />
                  <span>Tablet Override (640px – 1024px)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tablet Media URL (Optional)</label>
                    <input
                      type="text"
                      value={formData.tablet_url}
                      onChange={e => setFormData(prev => ({ ...prev, tablet_url: e.target.value }))}
                      placeholder="Leave empty to use default desktop media"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tablet Crop / Alignment</label>
                    <select
                      value={formData.tablet_position}
                      onChange={e => setFormData(prev => ({ ...prev, tablet_position: e.target.value as any }))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                    >
                      <option value="center">Center (Balanced)</option>
                      <option value="top">Top (Headroom)</option>
                      <option value="bottom">Bottom (Foreground)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Text Readability & Presentation */}
          {formActiveTab === 'text' && (
            <div className="space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="text-emerald-600" size={18} />
                  <h4 className="text-sm font-bold text-slate-900">Foreground Text Readability & Sizing</h4>
                </div>
                {/* Real-time WCAG Contrast Badge */}
                {(() => {
                  const check = evaluateTextContrast(formData.overlay_darkness, formData.text_color);
                  return (
                    <Badge className={`text-xs ${
                      check.level === 'success' ? 'bg-emerald-600 text-white' :
                      check.level === 'info' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {check.label}
                    </Badge>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Text Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Foreground Text Color</label>
                  <select
                    value={formData.text_color}
                    onChange={e => setFormData(prev => ({ ...prev, text_color: e.target.value as any }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="white">Crisp White (Optimal for Dark Overlays)</option>
                    <option value="slate-100">Soft Slate (95% White)</option>
                    <option value="emerald-100">Subtle Emerald Tint</option>
                    <option value="amber-100">Warm Amber Glow</option>
                    <option value="stone-900">Deep Charcoal / Stone (For Light Overlays)</option>
                  </select>
                </div>

                {/* Text Shadow */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Legibility Text Shadow</label>
                  <select
                    value={formData.text_shadow}
                    onChange={e => setFormData(prev => ({ ...prev, text_shadow: e.target.value as any }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="subtle">Subtle Drop Shadow (Clean)</option>
                    <option value="medium">Medium Drop Shadow (Recommended)</option>
                    <option value="strong">Strong Cinematic Glow Shadow</option>
                    <option value="none">No Shadow</option>
                  </select>
                </div>

                {/* Text Card / Backdrop */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Frosted Text Backdrop</label>
                  <select
                    value={formData.text_backdrop}
                    onChange={e => setFormData(prev => ({ ...prev, text_backdrop: e.target.value as any }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="none">None (Full Immersion)</option>
                    <option value="subtle-blur">Subtle Frosted Blur Behind Content</option>
                    <option value="pill-badge">Pill Container Around Subtitle</option>
                    <option value="card-translucent">Full Translucent Glass Card (Max Contrast)</option>
                  </select>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Text Alignment</label>
                  <select
                    value={formData.text_align}
                    onChange={e => setFormData(prev => ({ ...prev, text_align: e.target.value as any }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="center">Centered (Default Hero)</option>
                    <option value="left">Left Aligned</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>

                {/* Max Content Width */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Container Max Width</label>
                  <select
                    value={formData.max_content_width}
                    onChange={e => setFormData(prev => ({ ...prev, max_content_width: e.target.value as any }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="sm">Narrow Focus (Small)</option>
                    <option value="md">Medium Reading Width</option>
                    <option value="lg">Standard Balanced</option>
                    <option value="xl">Extra Wide (Default)</option>
                    <option value="full">Full Section Width</option>
                  </select>
                </div>

                {/* Title Size Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title Scale on Mobile</label>
                  <select
                    value={formData.title_size_mobile}
                    onChange={e => setFormData(prev => ({ ...prev, title_size_mobile: e.target.value as any }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="default">Standard Responsive</option>
                    <option value="compact">Compact (Avoid Wrapping)</option>
                    <option value="large">Large & Punchy</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Cinematic Controls & Contrast Tuning */}
          {formActiveTab === 'cinematic' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-600" />
                <span>Cinematic Controls & Contrast Tuning</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Overlay Darkness Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Darkness Overlay (Text Legibility)</span>
                    <span className="text-emerald-700 font-bold">{formData.overlay_darkness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={formData.overlay_darkness}
                    onChange={e => setFormData(prev => ({ ...prev, overlay_darkness: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500">Recommended: 45%–65% for crisp white text contrast</span>
                </div>

                {/* Overlay Gradient Style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Overlay Gradient Style
                  </label>
                  <select
                    value={formData.overlay_gradient}
                    onChange={e => setFormData(prev => ({ ...prev, overlay_gradient: e.target.value as any }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="none">Flat Even Darkness</option>
                    <option value="to-b">Top-to-Bottom Shading</option>
                    <option value="to-t">Bottom-to-Top Shading</option>
                    <option value="radial">Cinematic Spotlight (Radial)</option>
                    <option value="vignette">Deep Vignette Edges</option>
                  </select>
                </div>

                {/* Blur Slider (0-100%) */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Background Blur</span>
                    <span className="text-emerald-700 font-bold">{formData.blur_percent ?? Math.min(100, Math.round((formData.blur / 8) * 100))}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.blur_percent ?? (formData.blur <= 8 ? Math.round((formData.blur / 8) * 100) : Math.round((formData.blur / 40) * 100))}
                    onChange={e => {
                      const pct = parseInt(e.target.value) || 0;
                      const px = Math.round(((pct / 100) * 40) * 10) / 10;
                      setFormData(prev => ({ ...prev, blur_percent: pct, blur: px }));
                    }}
                    className="w-full accent-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500">0% = ultra-sharp focus; 10–25% = soft cinematic backdrop; 50%+ = frosted glass abstraction</span>
                </div>

                {/* Image Positioning */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Desktop Focal Point / Alignment
                  </label>
                  <select
                    value={formData.position}
                    onChange={e => setFormData(prev => ({ ...prev, position: e.target.value as any }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="center">Center (Balanced)</option>
                    <option value="top">Top (Subject Near Top)</option>
                    <option value="bottom">Bottom (Subject Near Bottom)</option>
                  </select>
                </div>

                {/* Transition Duration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Crossfade Duration ({formData.transition_duration}ms)
                  </label>
                  <select
                    value={formData.transition_duration}
                    onChange={e => setFormData(prev => ({ ...prev, transition_duration: parseInt(e.target.value) }))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="500">Fast (500ms)</option>
                    <option value="1000">Normal / Smooth (1000ms)</option>
                    <option value="1500">Cinematic (1500ms)</option>
                    <option value="2500">Slow Crossfade (2500ms)</option>
                  </select>
                </div>
              </div>

              {/* Parallax Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                <div>
                  <span className="text-xs font-bold text-slate-800">Subtle Scroll Parallax</span>
                  <p className="text-[11px] text-slate-500">Gentle depth motion as visitors scroll through the page</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.parallax}
                  onChange={e => setFormData(prev => ({ ...prev, parallax: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Publication & Order */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={e => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Publish Immediately</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Display Order:</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={formData.display_order}
                  onChange={e => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                  className="w-16 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-5 font-bold"
              >
                {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Background'}
              </Button>
            </div>
          </div>
        </form>
      </DraggableDialog>

      {/* Live Preview Modal */}
      {previewItem && (
        <DraggableDialog
          open={Boolean(previewItem)}
          onClose={() => setPreviewItem(null)}
          title={`Live Simulation: ${previewItem.title}`}
          defaultWidth={920}
          headerColor="#0F172A"
        >
          <div className="space-y-4">
            {/* Viewport Switcher */}
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider px-2">Device Simulation:</span>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewViewport === 'desktop'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Monitor size={14} />
                  <span>Desktop (100%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('tablet')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewViewport === 'tablet'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Tablet size={14} />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewViewport === 'mobile'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>Mobile (375px)</span>
                </button>
              </div>

              {/* Contrast Evaluator Pill */}
              {(() => {
                const check = evaluateTextContrast(previewItem.overlay_darkness, previewItem.text_color);
                return (
                  <Badge className={`text-xs ${
                    check.level === 'success' ? 'bg-emerald-600 text-white' :
                    check.level === 'info' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {check.label}
                  </Badge>
                );
              })()}
            </div>

            {/* Simulated Frame Container */}
            <div className="flex justify-center bg-slate-900/50 p-4 rounded-2xl overflow-x-auto">
              <div
                className={`relative transition-all duration-300 rounded-2xl overflow-hidden bg-slate-950 flex flex-col justify-center items-center text-center p-6 sm:p-10 text-white border border-slate-800 shadow-2xl ${
                  previewViewport === 'mobile' ? 'w-[375px] min-h-[480px]' :
                  previewViewport === 'tablet' ? 'w-[768px] min-h-[440px]' :
                  'w-full min-h-[400px]'
                }`}
              >
                {/* Background Layer (Responsive url & position override support) */}
                {(() => {
                  const activeUrl = previewViewport === 'mobile' && previewItem.mobile_url
                    ? previewItem.mobile_url
                    : previewViewport === 'tablet' && previewItem.tablet_url
                    ? previewItem.tablet_url
                    : previewItem.media_type === 'sequence'
                    ? (previewItem.sequence_urls?.[0] || previewItem.url)
                    : previewItem.url;

                  const activePos = previewViewport === 'mobile' && previewItem.mobile_position
                    ? previewItem.mobile_position
                    : previewViewport === 'tablet' && previewItem.tablet_position
                    ? previewItem.tablet_position
                    : previewItem.position;

                  return previewItem.media_type === 'video' ? (
                    <video
                      src={activeUrl}
                      poster={previewViewport === 'mobile' ? (previewItem.mobile_poster_url || previewItem.poster_url) : previewItem.poster_url}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{
                        objectPosition: activePos,
                        filter: previewItem.blur ? `blur(${previewItem.blur}px)` : undefined
                      }}
                    />
                  ) : (
                    <img
                      src={activeUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        objectPosition: activePos,
                        filter: previewItem.blur ? `blur(${previewItem.blur}px)` : undefined
                      }}
                    />
                  );
                })()}

                {/* Darkness Overlay */}
                <div
                  className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                  style={{ opacity: previewItem.overlay_darkness / 100 }}
                />

                {/* Configured Gradient Overlay */}
                {previewItem.overlay_gradient === 'to-b' ? (
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none" />
                ) : previewItem.overlay_gradient === 'to-t' ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                ) : previewItem.overlay_gradient === 'radial' ? (
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
                ) : previewItem.overlay_gradient === 'vignette' ? (
                  <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)' }} />
                ) : null}

                {/* Sample Foreground Section Content Styled with Admin Controls */}
                <div className={`relative z-10 w-full ${
                  previewItem.max_content_width === 'sm' ? 'max-w-sm' :
                  previewItem.max_content_width === 'md' ? 'max-w-md' :
                  previewItem.max_content_width === 'lg' ? 'max-w-lg' :
                  'max-w-xl'
                } ${
                  previewItem.text_align === 'left' ? 'text-left items-start' :
                  previewItem.text_align === 'right' ? 'text-right items-end' :
                  'text-center items-center'
                } ${
                  previewItem.text_backdrop === 'card-translucent'
                    ? 'bg-slate-950/65 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl'
                    : previewItem.text_backdrop === 'subtle-blur'
                    ? 'backdrop-blur-sm bg-slate-950/30 p-4 rounded-2xl'
                    : ''
                } flex flex-col gap-3.5`}>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-300 text-xs font-bold border border-emerald-400/35">
                      {SECTION_METADATA[previewItem.section]?.label || previewItem.section}
                    </span>
                  </div>

                  <h3 className={`font-extrabold tracking-tight ${
                    previewItem.title_size_desktop === 'huge' ? 'text-3xl sm:text-5xl' :
                    previewItem.title_size_desktop === 'large' ? 'text-2xl sm:text-4xl' :
                    'text-2xl sm:text-3xl'
                  } ${
                    previewItem.text_color === 'stone-900' ? 'text-stone-900' :
                    previewItem.text_color === 'emerald-100' ? 'text-emerald-100' :
                    previewItem.text_color === 'amber-100' ? 'text-amber-100' :
                    previewItem.text_color === 'slate-100' ? 'text-slate-100' :
                    'text-white'
                  } ${
                    previewItem.text_shadow === 'strong' ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]' :
                    previewItem.text_shadow === 'medium' ? 'drop-shadow-lg' :
                    previewItem.text_shadow === 'subtle' ? 'drop-shadow-md' :
                    ''
                  }`}>
                    Sample Foreground Headline
                  </h3>

                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    previewItem.text_backdrop === 'pill-badge'
                      ? 'inline-block bg-slate-950/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10'
                      : ''
                  } ${
                    previewItem.text_color === 'stone-900' ? 'text-stone-800' :
                    previewItem.text_color === 'emerald-100' ? 'text-emerald-50' :
                    previewItem.text_color === 'amber-100' ? 'text-amber-50' :
                    'text-slate-200'
                  } ${
                    previewItem.text_shadow === 'strong' ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]' :
                    previewItem.text_shadow === 'medium' ? 'drop-shadow-md' :
                    ''
                  }`}>
                    Simulating headings, paragraphs, and action buttons against this background with {previewItem.overlay_darkness}% overlay and {previewItem.overlay_gradient !== 'none' ? `${previewItem.overlay_gradient} gradient` : 'standard shading'}.
                  </p>

                  <div className={`flex items-center gap-3 pt-2 ${
                    previewItem.text_align === 'left' ? 'justify-start' :
                    previewItem.text_align === 'right' ? 'justify-end' :
                    'justify-center'
                  }`}>
                    <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg">
                      Primary Action
                    </span>
                    <span className="px-4 py-2 rounded-xl bg-white/20 text-white font-bold text-xs border border-white/30 backdrop-blur-sm">
                      Learn More
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center text-xs text-slate-500 px-2 gap-2">
              <span>Section: <strong>{SECTION_METADATA[previewItem.section]?.label}</strong></span>
              <span>Overlay: <strong>{previewItem.overlay_darkness}% ({previewItem.overlay_gradient || 'none'})</strong> | Blur: <strong>{previewItem.blur}px</strong> | Text: <strong>{previewItem.text_color || 'white'}</strong></span>
              <Button size="sm" variant="outline" onClick={() => setPreviewItem(null)} className="rounded-xl text-xs">
                Close Simulation
              </Button>
            </div>
          </div>
        </DraggableDialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DraggableDialog
          open={Boolean(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Background Media"
          defaultWidth={460}
          headerColor="#DC2626"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to remove this background media? If this is the only published background for its section, the section will revert to the clean neutral brand fallback.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </DraggableDialog>
      )}
    </div>
  );
}
