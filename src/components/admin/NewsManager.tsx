import React, { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, Plus, Search, Filter, Calendar, User, Tag, 
  ExternalLink, Edit, Trash2, Eye, EyeOff, Star, Upload, 
  Image as ImageIcon, CheckCircle, AlertCircle, Clock, 
  ArrowUpDown, LayoutGrid, List, Sparkles, Share2, Globe, 
  ChevronLeft, ChevronRight, X, Copy, Check, RefreshCw,
  FileText, Link as LinkIcon, AlertTriangle
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { projectId as defaultProjectId, publicAnonKey } from '../../utils/supabase/info';

export interface NewsArticleItem {
  id: string;
  key?: string;
  title: string;
  slug: string;
  description: string;
  summary?: string;
  content: string;
  image: string;
  additionalImages?: string[];
  category: string;
  author: string;
  publishDate: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NewsManagerProps {
  accessToken: string;
  projectId?: string;
  userRole?: string;
  userName?: string;
  onUpdate?: () => void;
}

const CATEGORIES = [
  'Community',
  'Programs',
  'WASH',
  'Environment & Climate',
  'Livelihoods',
  'Community Development',
  'Events',
  'Partnerships',
  'Announcements',
  'Organizational News'
];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote'],
    ['link', 'image'],
    ['clean']
  ]
};

export function NewsManager({
  accessToken,
  projectId = defaultProjectId,
  userRole,
  userName,
  onUpdate
}: NewsManagerProps) {
  const isReadOnly = userRole === 'viewer';
  const canDelete = userRole === 'admin' || userRole === 'super-admin';
  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'updated'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'seo' | 'preview'>('content');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState<boolean>(false);
  const [copiedSlug, setCopiedSlug] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);
  const [uploadingGallery, setUploadingGallery] = useState<boolean>(false);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<NewsArticleItem | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Form State
  const defaultFormState: Partial<NewsArticleItem> = {
    title: '',
    slug: '',
    description: '',
    content: '',
    image: '',
    additionalImages: [],
    category: 'Community',
    author: userName || 'RESTI Communications Team',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'published',
    featured: false,
    seoTitle: '',
    seoDescription: '',
    ogTitle: '',
    ogDescription: ''
  };

  const [formData, setFormData] = useState<Partial<NewsArticleItem>>(defaultFormState);

  // Slug generator helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'article';
  };

  // Fetch all articles
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news?limit=500`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      
      const parsed: NewsArticleItem[] = (data.news || []).map((item: any) => {
        const v = item.value || item;
        const key = item.key || item.id || v.id || '';
        return {
          id: key,
          key: key,
          title: v.title || 'Untitled Article',
          slug: v.slug || slugify(v.title || key),
          description: v.description || v.summary || '',
          summary: v.description || v.summary || '',
          content: v.content || '',
          image: v.image || '',
          additionalImages: Array.isArray(v.additionalImages) ? v.additionalImages : [],
          category: v.category || 'Community',
          author: v.author || 'RESTI Team',
          publishDate: v.publishDate || v.timestamp || v.createdAt || new Date().toISOString(),
          status: (v.status || 'published') as any,
          featured: Boolean(v.featured),
          seoTitle: v.seoTitle || v.title || '',
          seoDescription: v.seoDescription || v.description || v.summary || '',
          ogTitle: v.ogTitle || v.seoTitle || v.title || '',
          ogDescription: v.ogDescription || v.seoDescription || '',
          timestamp: v.timestamp || v.publishDate,
          createdAt: v.createdAt || v.timestamp,
          updatedAt: v.updatedAt || v.timestamp
        };
      });

      setArticles(parsed);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      toast.error('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [projectId, accessToken]);

  // Handle Title Change with Auto Slug
  const handleTitleChange = (newTitle: string) => {
    setFormData(prev => {
      const updated = { ...prev, title: newTitle };
      if (!isSlugManuallyEdited) {
        updated.slug = slugify(newTitle);
      }
      if (!prev.seoTitle || prev.seoTitle === prev.title) {
        updated.seoTitle = newTitle;
      }
      return updated;
    });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setIsSlugManuallyEdited(false);
    setFormData({
      ...defaultFormState,
      author: userName || 'RESTI Communications Team',
      publishDate: new Date().toISOString().split('T')[0]
    });
    setActiveTab('content');
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (article: NewsArticleItem) => {
    setEditingId(article.id);
    setIsSlugManuallyEdited(true);
    setFormData({
      title: article.title,
      slug: article.slug || slugify(article.title),
      description: article.description || article.summary || '',
      content: article.content,
      image: article.image || '',
      additionalImages: article.additionalImages || [],
      category: article.category || 'Community',
      author: article.author || userName || 'RESTI Communications Team',
      publishDate: article.publishDate ? article.publishDate.split('T')[0] : new Date().toISOString().split('T')[0],
      status: article.status || 'published',
      featured: Boolean(article.featured),
      seoTitle: article.seoTitle || article.title,
      seoDescription: article.seoDescription || article.description,
      ogTitle: article.ogTitle || article.seoTitle || article.title,
      ogDescription: article.ogDescription || article.seoDescription
    });
    setActiveTab('content');
    setIsEditorOpen(true);
  };

  // Quick 1-click Publish / Unpublish toggle
  const handleToggleStatus = async (article: NewsArticleItem) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const cleanKey = article.id.replace(/^news:/, '');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${cleanKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({
            ...article,
            status: nextStatus
          })
        }
      );

      if (!response.ok) throw new Error('Status update failed');
      
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status: nextStatus } : a));
      toast.success(`Article marked as ${nextStatus}`);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error('Failed to change article status');
    }
  };

  // Toggle Featured status
  const handleToggleFeatured = async (article: NewsArticleItem) => {
    const nextFeatured = !article.featured;
    try {
      const cleanKey = article.id.replace(/^news:/, '');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${cleanKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({
            ...article,
            featured: nextFeatured
          })
        }
      );

      if (!response.ok) throw new Error('Featured toggle failed');
      
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, featured: nextFeatured } : a));
      toast.success(nextFeatured ? 'Article featured on homepage' : 'Article unfeatured');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error toggling featured:', err);
      toast.error('Failed to update featured state');
    }
  };

  // Image Upload helper
  const uploadImageFile = async (file: File): Promise<string | null> => {
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` },
        body: formDataObj
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  // Handle Cover Image Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        setFormData(prev => ({ ...prev, image: url }));
        toast.success('Cover image uploaded successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle Additional Gallery Image Upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageFile(files[i]);
        if (url) newUrls.push(url);
      }
      setFormData(prev => ({
        ...prev,
        additionalImages: [...(prev.additionalImages || []), ...newUrls]
      }));
      toast.success(`Uploaded ${newUrls.length} image(s)`);
    } catch (err: any) {
      toast.error(err.message || 'Gallery upload failed');
    } finally {
      setUploadingGallery(false);
    }
  };

  // Remove Gallery Image
  const handleRemoveGalleryImage = (idxToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: (prev.additionalImages || []).filter((_, idx) => idx !== idxToRemove)
    }));
  };

  // Save Article (Create or Update)
  const handleSaveArticle = async (e: React.FormEvent) => {
    if (isReadOnly) {
      toast.error('Permission denied: Viewers cannot create or modify articles.');
      return;
    }
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Article title is required');
      setActiveTab('content');
      return;
    }
    if (!formData.content?.trim()) {
      toast.error('Article content cannot be empty');
      setActiveTab('content');
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const cleanKey = editingId ? editingId.replace(/^news:/, '') : '';
      const endpoint = isEditing
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${cleanKey}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`;
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        title: formData.title?.trim(),
        slug: formData.slug || slugify(formData.title || ''),
        description: formData.description || '',
        summary: formData.description || '',
        category: formData.category || 'Community',
        author: formData.author || userName || 'RESTI Communications Team',
        publishDate: formData.publishDate || new Date().toISOString(),
        status: formData.status || 'published',
        featured: Boolean(formData.featured),
        seoTitle: formData.seoTitle || formData.title,
        seoDescription: formData.seoDescription || formData.description
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to save article');

      toast.success(isEditing ? 'Article updated successfully' : 'News article created successfully');
      setIsEditorOpen(false);
      await fetchArticles();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error saving article:', err);
      toast.error(err.message || 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Single Delete
  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const cleanKey = deleteTarget.id.replace(/^news:/, '');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${cleanKey}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );
      if (!response.ok) throw new Error('Delete failed');
      toast.success('Article deleted successfully');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchArticles();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete article');
    }
  };

  // Confirm Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/bulk-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ ids: selectedIds })
        }
      );
      if (!response.ok) throw new Error('Bulk delete failed');
      toast.success(`${selectedIds.length} articles deleted successfully`);
      setSelectedIds([]);
      setIsBulkDeleting(false);
      setShowDeleteModal(false);
      await fetchArticles();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to bulk delete');
    }
  };

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    let list = [...articles];

    // Status filter
    if (selectedStatus !== 'all') {
      list = list.filter(a => a.status === selectedStatus);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.author?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === 'updated') {
        return new Date(b.updatedAt || b.publishDate).getTime() - new Date(a.updatedAt || a.publishDate).getTime();
      }
      return 0;
    });

    return list;
  }, [articles, selectedStatus, selectedCategory, searchQuery, sortBy]);

  // Counts for status pills
  const statusCounts = useMemo(() => {
    return {
      all: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      draft: articles.filter(a => a.status === 'draft').length,
      scheduled: articles.filter(a => a.status === 'scheduled').length,
      archived: articles.filter(a => a.status === 'archived').length,
    };
  }, [articles]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredArticles.slice(start, start + itemsPerPage);
  }, [filteredArticles, currentPage, itemsPerPage]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedArticles.length && paginatedArticles.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedArticles.map(a => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return d;
    }
  };

  // Word count & reading time
  const readingStats = useMemo(() => {
    const text = (formData.content || '').replace(/<[^>]+>/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [formData.content]);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-6 md:p-10 space-y-8">
      
      {/* 1. Header with exact requested text */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 rounded-2xl p-6 md:p-8 shadow-lg text-white">
        <div className="flex items-start md:items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner flex-shrink-0">
            <Newspaper size={36} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                News & Updates
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 border border-white/30 text-violet-100">
                News Articles ({articles.length})
              </span>
            </div>
            <p className="text-sm md:text-base text-violet-100/90 mt-2 max-w-2xl font-normal leading-relaxed">
              Manage RESTI CBO news, announcements, program updates, community activities, events, and organizational developments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <Button
            onClick={fetchArticles}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent rounded-xl px-3.5 py-2.5"
            title="Refresh articles"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-white text-violet-800 hover:bg-violet-50 font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} className="stroke-[2.5]" />
            + Add News Article
          </Button>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {(['all', 'published', 'draft', 'scheduled', 'archived'] as const).map(statusKey => {
            const isActive = selectedStatus === statusKey;
            const count = statusCounts[statusKey];
            return (
              <button
                key={statusKey}
                onClick={() => {
                  setSelectedStatus(statusKey);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Category, Sorting & View Switcher */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search articles by title, author, keyword..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
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

            {/* Category Dropdown */}
            <div className="relative w-full sm:w-48">
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>

            {/* View Switcher Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white shadow-sm text-violet-700' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'cards' ? 'bg-white shadow-sm text-violet-700' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-900">
            <span className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center text-xs">
              {selectedIds.length}
            </span>
            <span>articles selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setIsBulkDeleting(true);
                setShowDeleteModal(true);
              }}
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 border-red-200 rounded-xl"
            >
              <Trash2 size={14} className="mr-1.5" />
              Delete Selected
            </Button>
            <Button
              onClick={() => setSelectedIds([])}
              variant="outline"
              size="sm"
              className="rounded-xl text-slate-600"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* 3. News Articles List Content */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading news articles...</p>
        </div>
      ) : articles.length === 0 ? (
        /* Exact empty state specified in prompt */
        <div className="text-center py-24 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-100/80 border border-violet-200 flex items-center justify-center mx-auto mb-4 text-violet-600 shadow-sm">
            <Newspaper size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No news articles yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Create your first article to share RESTI's latest activities, community updates, program achievements, and announcements.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Plus size={16} className="mr-2" />
            Create Your First Article
          </Button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-slate-200 p-8">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-700 mb-1">No matching articles found</h4>
          <p className="text-xs text-slate-500 mb-4">Try clearing your search query or status filter.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="rounded-xl"
          >
            Reset Filters
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedArticles.length && paginatedArticles.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Article</th>
                <th className="p-4">Category</th>
                <th className="p-4">Author</th>
                <th className="p-4">Published Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Featured</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedArticles.map(article => {
                const isSelected = selectedIds.includes(article.id);
                return (
                  <tr
                    key={article.id}
                    className={`hover:bg-violet-50/40 transition-colors ${
                      isSelected ? 'bg-violet-50/60' : ''
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(article.id)}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {article.image ? (
                            <img
                              src={article.image}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              onError={e => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Newspaper size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div className="max-w-xs md:max-w-sm">
                          <p className="font-semibold text-slate-800 line-clamp-1 hover:text-violet-600 transition-colors cursor-pointer" onClick={() => handleOpenEdit(article)}>
                            {article.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="font-mono text-[11px] text-slate-500">/news/{article.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                        {article.category}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-600">
                      {article.author}
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      {formatDate(article.publishDate)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        article.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : article.status === 'draft'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : article.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          article.status === 'published' ? 'bg-emerald-500' :
                          article.status === 'draft' ? 'bg-amber-500' :
                          article.status === 'scheduled' ? 'bg-blue-500' : 'bg-slate-400'
                        }`} />
                        {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(article)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          article.featured ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-slate-400'
                        }`}
                        title={article.featured ? 'Featured on homepage' : 'Mark as featured'}
                      >
                        <Star size={18} fill={article.featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick View on public site */}
                        <a
                          href={`/news/${article.slug || article.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="View on public site"
                        >
                          <ExternalLink size={15} />
                        </a>

                        {/* Quick 1-click status toggle */}
                        <button
                          onClick={() => handleToggleStatus(article)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            article.status === 'published'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={article.status === 'published' ? 'Unpublish (set to Draft)' : 'Publish immediately'}
                        >
                          {article.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(article)}
                          className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
                          title="Edit article"
                        >
                          <Edit size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            setDeleteTarget(article);
                            setIsBulkDeleting(false);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete article"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedArticles.map(article => {
            const isSelected = selectedIds.includes(article.id);
            return (
              <div
                key={article.id}
                className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden relative group ${
                  isSelected
                    ? 'border-violet-500 ring-2 ring-violet-400 shadow-md'
                    : 'border-slate-200 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                {/* Select Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelectOne(article.id)}
                  className="absolute top-3 left-3 z-20 w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer shadow"
                />

                {/* Cover Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Newspaper size={40} className="text-slate-300" />
                  )}

                  {/* Status pill overlay */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md ${
                      article.status === 'published'
                        ? 'bg-emerald-500/90 text-white'
                        : article.status === 'draft'
                        ? 'bg-amber-500/90 text-white'
                        : article.status === 'scheduled'
                        ? 'bg-blue-500/90 text-white'
                        : 'bg-slate-600/90 text-white'
                    }`}>
                      {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                    </span>
                  </div>

                  {/* Category Pill */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
                      {article.category}
                    </span>
                  </div>

                  {/* Featured star badge */}
                  {article.featured && (
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="p-1 rounded-lg bg-amber-400 text-white shadow-sm flex items-center justify-center">
                        <Star size={14} fill="currentColor" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 group-hover:text-violet-600 transition-colors mb-2 cursor-pointer" onClick={() => handleOpenEdit(article)}>
                      {article.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {article.description || article.content.replace(/<[^>]+>/g, '').slice(0, 120)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 mb-3">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {article.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(article.publishDate)}
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleFeatured(article)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            article.featured ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-slate-500'
                          }`}
                          title="Toggle Featured"
                        >
                          <Star size={15} fill={article.featured ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(article)}
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            article.status === 'published' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={article.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {article.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleOpenEdit(article)}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-3 rounded-lg border-violet-200 text-violet-700 hover:bg-violet-50"
                        >
                          <Edit size={12} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            setDeleteTarget(article);
                            setIsBulkDeleting(false);
                            setShowDeleteModal(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-2.5 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredArticles.length)} of {filteredArticles.length} articles
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="rounded-xl px-2.5 h-8"
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl font-semibold transition-all ${
                    currentPage === pageNum
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="rounded-xl px-2.5 h-8"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* 5. FULL-FEATURED ARTICLE EDITOR MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Newspaper size={20} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800">
                    {editingId ? 'Edit News Article' : 'Create News Article'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingId ? 'Update and refine article content and metadata' : 'Compose and publish a story across RESTI CBO channels'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex items-center gap-2 px-6 md:px-8 border-b border-slate-100 bg-white">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'content'
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText size={15} />
                Content & Body
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'media'
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <ImageIcon size={15} />
                Cover & Media
                {formData.image && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'seo'
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Globe size={15} />
                SEO & Social
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'preview'
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye size={15} />
                Live Preview
              </button>
            </div>

            {/* Modal Body with Form */}
            <form onSubmit={handleSaveArticle} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              {/* TAB 1: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Article Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Article Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => handleTitleChange(e.target.value)}
                      placeholder="e.g., Clean Water Project Brings Safe Drinking Water to 4,000 Residents"
                      className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-medium text-slate-800"
                      required
                    />
                  </div>

                  {/* Slug Input with Preview */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <LinkIcon size={14} className="text-violet-600" />
                        URL Slug (SEO-Friendly Permanent Link)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const s = slugify(formData.title || '');
                          setFormData(prev => ({ ...prev, slug: s }));
                          setIsSlugManuallyEdited(false);
                          toast.success('Slug regenerated from title');
                        }}
                        className="text-[11px] text-violet-600 hover:underline font-semibold"
                      >
                        Reset to Title Slug
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline whitespace-nowrap">
                        https://resticbo.org/news/
                      </span>
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={e => {
                          setIsSlugManuallyEdited(true);
                          setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }));
                        }}
                        placeholder="article-url-slug"
                        className="flex-1 px-3 py-2 text-xs md:text-sm font-mono bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://resticbo.org/news/${formData.slug || ''}`);
                          setCopiedSlug(true);
                          setTimeout(() => setCopiedSlug(false), 2000);
                          toast.success('Slug URL copied to clipboard');
                        }}
                        className="h-9 px-3 rounded-lg text-xs"
                      >
                        {copiedSlug ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Clean URL format for sharing and indexing. Legacy article IDs are automatically supported for backward compatibility.
                    </p>
                  </div>

                  {/* Metadata Row: Category, Author, Publish Date, Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category || 'Community'}
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Author */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Author / Byline
                      </label>
                      <input
                        type="text"
                        value={formData.author || ''}
                        onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="e.g., RESTI Communications Team"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>

                    {/* Publication Date */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Publication Date
                      </label>
                      <input
                        type="date"
                        value={formData.publishDate ? formData.publishDate.split('T')[0] : ''}
                        onChange={e => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status || 'published'}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer font-semibold"
                      >
                        <option value="published">Published (Live)</option>
                        <option value="draft">Draft (Internal Only)</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Featured Article Toggle */}
                  <div className="flex items-center justify-between p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Star size={20} className={formData.featured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Featured Article</p>
                        <p className="text-xs text-slate-500">Pin this article to the top of homepage news and archive highlights</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.featured)}
                        onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Short Summary / Excerpt */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Short Summary / Excerpt <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {(formData.description || '').length} characters (Recommended: 120-180)
                      </span>
                    </div>
                    <textarea
                      value={formData.description || ''}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief overview summarizing key milestones or announcements for cards, search results, and newsletter snippets..."
                      rows={3}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* Rich Text Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Full Article Content <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{readingStats.words} words</span>
                        <span>•</span>
                        <span>~{readingStats.minutes} min read</span>
                      </span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <ReactQuill
                        theme="snow"
                        value={formData.content || ''}
                        onChange={value => setFormData(prev => ({ ...prev, content: value }))}
                        modules={QUILL_MODULES}
                        placeholder="Write the full narrative of this news update, including quotes, program data, background, and community impact..."
                        className="news-quill-editor"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEDIA */}
              {activeTab === 'media' && (
                <div className="space-y-8">
                  {/* Featured Cover Image */}
                  <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Featured Cover Image</h4>
                        <p className="text-xs text-slate-500">Main high-resolution photo displayed on cards, social cards, and article banner</p>
                      </div>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="text-xs text-red-600 hover:underline font-semibold"
                        >
                          Remove Cover
                        </button>
                      )}
                    </div>

                    {formData.image ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 group h-64 bg-slate-900 flex items-center justify-center">
                        <img
                          src={formData.image}
                          alt="Cover Preview"
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-slate-50">
                            Replace Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-white hover:border-violet-400 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
                          <Upload size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">
                          {uploadingCover ? 'Uploading cover photo...' : 'Upload Featured Cover Photo'}
                        </p>
                        <p className="text-xs text-slate-400 mb-4">
                          PNG, JPG, WebP up to 10MB (Recommended: 1200x630px)
                        </p>
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition-all">
                          <span>Browse File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            disabled={uploadingCover}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {/* Direct URL Alternative */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Or enter image URL directly</label>
                      <input
                        type="url"
                        value={formData.image || ''}
                        onChange={e => setFormData(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Additional Images Gallery */}
                  <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Additional Images & Field Gallery</h4>
                        <p className="text-xs text-slate-500">Supporting photos rendered in the article gallery and slideshow</p>
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-xl text-xs shadow-sm">
                        <Plus size={14} />
                        <span>Add Photos</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryUpload}
                          disabled={uploadingGallery}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {uploadingGallery && (
                      <p className="text-xs text-violet-600 font-medium animate-pulse">Uploading gallery photos...</p>
                    )}

                    {(formData.additionalImages && formData.additionalImages.length > 0) ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.additionalImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group h-32 bg-slate-900">
                            <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete photo"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No additional gallery photos added yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SEO & SOCIAL */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* SEO Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        SEO Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.seoTitle || ''}
                        onChange={e => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                        placeholder="Search engine title..."
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">{(formData.seoTitle || '').length} / 60 characters</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        SEO Meta Description
                      </label>
                      <textarea
                        value={formData.seoDescription || ''}
                        onChange={e => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                        placeholder="Search snippet summary..."
                        rows={2}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">{(formData.seoDescription || '').length} / 160 characters</p>
                    </div>
                  </div>

                  {/* Google Search Result Preview Simulation */}
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Globe size={14} className="text-violet-600" />
                      Google Search Result Snippet Preview
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 max-w-xl space-y-1 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">RESTI CBO</span>
                        <span>› news › {formData.slug || 'article-slug'}</span>
                      </div>
                      <h4 className="text-blue-700 text-lg hover:underline cursor-pointer font-medium leading-snug">
                        {formData.seoTitle || formData.title || 'Untitled Article'} | RESTI CBO
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {formData.seoDescription || formData.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Social Share Preview (Open Graph) */}
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Share2 size={14} className="text-violet-600" />
                      Social Media Card Preview (Facebook, LinkedIn, Twitter)
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-md overflow-hidden shadow-sm">
                      <div className="h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                        {formData.image ? (
                          <img src={formData.image} alt="OG Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Newspaper size={36} className="text-slate-300" />
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">resticbo.org</span>
                        <h5 className="font-bold text-slate-800 text-sm line-clamp-1">{formData.ogTitle || formData.title || 'Article Title'}</h5>
                        <p className="text-xs text-slate-500 line-clamp-2">{formData.ogDescription || formData.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LIVE PREVIEW */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  {formData.status !== 'published' && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-xs font-medium">
                      <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                      <span>
                        <strong>Preview Mode:</strong> This article is currently marked as <strong>{formData.status?.toUpperCase()}</strong> and will not be displayed on the public website until set to Published.
                      </span>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {/* Cover */}
                    {formData.image && (
                      <div className="relative h-72 bg-slate-900 flex items-center justify-center overflow-hidden">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="p-8 md:p-12 space-y-6">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
                        <Tag size={12} />
                        {formData.category}
                      </span>

                      <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                        {formData.title || 'Untitled Article Title'}
                      </h1>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-6 border-b border-slate-100">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <User size={14} className="text-violet-600" />
                          By {formData.author || 'RESTI Team'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(formData.publishDate)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {readingStats.minutes} min read
                        </span>
                      </div>

                      {/* Excerpt Lead */}
                      {formData.description && (
                        <p className="text-base md:text-lg text-slate-600 font-medium italic border-l-4 border-violet-500 pl-4 py-1 leading-relaxed">
                          {formData.description}
                        </p>
                      )}

                      {/* HTML Content Body */}
                      <div 
                        className="prose prose-violet max-w-none text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-slate-400 italic">No content body written yet.</p>' }}
                      />

                      {/* Gallery in Preview */}
                      {formData.additionalImages && formData.additionalImages.length > 0 && (
                        <div className="pt-8 border-t border-slate-100 space-y-3">
                          <h4 className="font-bold text-slate-800 text-sm">Field Gallery Photos</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {formData.additionalImages.map((img, i) => (
                              <div key={i} className="rounded-xl overflow-hidden h-36 bg-slate-100 border border-slate-200">
                                <img src={img} alt={`Gallery photo ${i + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition-all"
                  >
                    {isSaving ? 'Saving...' : editingId ? 'Update Article' : 'Publish Article'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION DIALOG */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {isBulkDeleting ? `Delete ${selectedIds.length} Articles?` : 'Delete News Article?'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isBulkDeleting 
                  ? `Are you sure you want to permanently delete these ${selectedIds.length} articles? This action cannot be undone.`
                  : `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                  setIsBulkDeleting(false);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={isBulkDeleting ? handleConfirmBulkDelete : handleConfirmSingleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
