import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
  Check, X, Upload, ExternalLink, Download, ArrowUpDown, CheckCircle2,
  EyeOff, Sparkles, Loader2, AlertCircle, ArrowRight, Star,
  FileSpreadsheet, Presentation, FileCode, Image as ImageIcon,
  File, FolderOpen, Calendar, User, Tag, HelpCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  ResourceItem,
  RESOURCE_CATEGORIES,
  normalizeResource,
  getFileExtension
} from '../../utils/resourceData';
import { publicAnonKey } from '../../utils/supabase/info';

interface ResourcesManagerProps {
  accessToken: string;
  projectId: string;
  userRole?: string;
  userName?: string;
  onUpdate?: () => void;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  custom_category: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: string;
  year: string;
  author: string;
  publication_date: string;
  display_order: number;
  is_featured: boolean;
  is_published: boolean;
}

export function ResourcesManager({
  accessToken,
  projectId,
  userRole,
  userName,
  onUpdate
}: ResourcesManagerProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Dialog & Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const initialFormState: FormState = {
    title: '',
    description: '',
    category: 'Reports & Publications',
    custom_category: '',
    file_url: '',
    file_name: '',
    file_type: 'PDF',
    file_size: '',
    year: new Date().getFullYear().toString(),
    author: 'RESTI CBO',
    publication_date: new Date().toISOString().split('T')[0],
    display_order: 1,
    is_featured: false,
    is_published: true
  };

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const isReadOnly = userRole === 'viewer';
  const canDelete = userRole === 'admin' || userRole === 'super-admin';

  // Fetch resources from server
  const fetchResources = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      // Use all=true query param to retrieve all resources including drafts
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/resources?all=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data = await response.json();
      const items = (data.resources || []).map(normalizeResource);
      setResources(items);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      toast.error('Could not load resources. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [projectId, accessToken]);

  // Handle document file upload to Supabase Storage via /upload-document
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 25MB
    if (file.size > 26214400) {
      toast.error('File size exceeds 25MB limit');
      return;
    }

    setUploadingFile(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-document`,
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
        throw new Error(data.error || 'Document upload failed');
      }

      const ext = getFileExtension(file.name);
      setFormData(prev => ({
        ...prev,
        file_url: data.url,
        file_name: file.name,
        file_type: ext,
        file_size: data.fileSize || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        // Set default title if empty
        title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      }));

      toast.success('Document uploaded successfully');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploadingFile(false);
    }
  };

  // Open create modal
  const handleOpenCreate = () => {
    const nextOrder = resources.length > 0
      ? Math.max(...resources.map(r => r.display_order || 0)) + 1
      : 1;

    setEditingResource(null);
    setFormData({
      ...initialFormState,
      display_order: nextOrder
    });
    setIsFormOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (res: ResourceItem) => {
    setEditingResource(res);
    const isCustomCat = !RESOURCE_CATEGORIES.includes(res.category as any);
    setFormData({
      title: res.title,
      description: res.description,
      category: isCustomCat ? 'Other' : res.category,
      custom_category: isCustomCat ? res.category : '',
      file_url: res.file_url,
      file_name: res.file_name,
      file_type: res.file_type,
      file_size: res.file_size,
      year: res.year || new Date().getFullYear().toString(),
      author: res.author || 'RESTI CBO',
      publication_date: res.publication_date ? res.publication_date.split('T')[0] : new Date().toISOString().split('T')[0],
      display_order: res.display_order || 1,
      is_featured: res.is_featured,
      is_published: res.is_published
    });
    setIsFormOpen(true);
  };

  // Save Resource (Create or Update)
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('You do not have permission to modify resources');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter the document title');
      return;
    }

    if (!formData.file_url.trim()) {
      toast.error('Please upload a document file or specify a file URL');
      return;
    }

    const resolvedCategory =
      formData.category === 'Other' && formData.custom_category.trim()
        ? formData.custom_category.trim()
        : formData.category;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: resolvedCategory,
      file_url: formData.file_url.trim(),
      fileUrl: formData.file_url.trim(),
      file_name: formData.file_name.trim() || formData.file_url.split('/').pop()?.split('?')[0] || 'document',
      fileName: formData.file_name.trim() || formData.file_url.split('/').pop()?.split('?')[0] || 'document',
      file_type: formData.file_type.trim().toUpperCase() || 'PDF',
      fileType: formData.file_type.trim().toUpperCase() || 'PDF',
      file_size: formData.file_size.trim(),
      fileSize: formData.file_size.trim(),
      year: formData.year.trim() || (formData.publication_date ? new Date(formData.publication_date).getFullYear().toString() : ''),
      author: formData.author.trim(),
      publication_date: formData.publication_date,
      date: formData.publication_date,
      display_order: Number(formData.display_order) || 1,
      order: Number(formData.display_order) || 1,
      is_featured: formData.is_featured,
      isFeatured: formData.is_featured,
      is_published: formData.is_published,
      isPublished: formData.is_published
    };

    setIsSaving(true);
    try {
      const isEditing = !!editingResource;
      const url = isEditing
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources/${editingResource.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources`;

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
        throw new Error(data.error || 'Failed to save resource');
      }

      toast.success(isEditing ? 'Resource updated successfully' : 'Resource published successfully');
      setIsFormOpen(false);
      setEditingResource(null);
      await fetchResources();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error saving resource:', err);
      toast.error(err.message || 'Could not save resource');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle publish / draft
  const handleTogglePublish = async (res: ResourceItem) => {
    if (isReadOnly) return;
    const newStatus = !res.is_published;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources/${res.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ is_published: newStatus })
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      setResources(prev => prev.map(r => r.id === res.id ? { ...r, is_published: newStatus, isPublished: newStatus } : r));
      toast.success(newStatus ? `"${res.title}" is now published` : `"${res.title}" moved to drafts`);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Could not update status');
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (res: ResourceItem) => {
    if (isReadOnly) return;
    const newFeatured = !res.is_featured;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources/${res.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ is_featured: newFeatured })
        }
      );

      if (!response.ok) throw new Error('Failed to update featured flag');

      setResources(prev => prev.map(r => r.id === res.id ? { ...r, is_featured: newFeatured, isFeatured: newFeatured } : r));
      toast.success(newFeatured ? `"${res.title}" marked as Featured` : `"${res.title}" removed from Featured`);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Could not update featured flag');
    }
  };

  // Delete resource
  const handleDeleteResource = async (id: string) => {
    if (!canDelete) {
      toast.error('Only administrators can delete resources');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete resource');

      setResources(prev => prev.filter(r => r.id !== id));
      setDeleteConfirmId(null);
      toast.success('Resource deleted successfully');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete resource');
    }
  };

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      // Status filter
      if (statusFilter === 'published' && !res.is_published) return false;
      if (statusFilter === 'draft' && res.is_published) return false;
      if (statusFilter === 'featured' && !res.is_featured) return false;

      // Category filter
      if (categoryFilter !== 'all' && res.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && res.file_type.toUpperCase() !== typeFilter.toUpperCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesDesc = res.description.toLowerCase().includes(q);
        const matchesCat = res.category.toLowerCase().includes(q);
        const matchesAuthor = (res.author || '').toLowerCase().includes(q);
        const matchesYear = (res.year || '').includes(q);
        return matchesTitle || matchesDesc || matchesCat || matchesAuthor || matchesYear;
      }

      return true;
    });
  }, [resources, statusFilter, categoryFilter, typeFilter, searchQuery]);

  // KPI stats
  const stats = useMemo(() => {
    const total = resources.length;
    const published = resources.filter(r => r.is_published).length;
    const drafts = resources.filter(r => !r.is_published).length;
    const featured = resources.filter(r => r.is_featured).length;
    const uniqueCategories = new Set(resources.map(r => r.category)).size;
    return { total, published, drafts, featured, uniqueCategories };
  }, [resources]);

  // File icon helper
  const renderFileIcon = (fileType: string) => {
    const type = (fileType || '').toUpperCase();
    if (type === 'PDF') {
      return <FileText size={18} className="text-red-500" />;
    }
    if (['XLS', 'XLSX', 'CSV'].includes(type)) {
      return <FileSpreadsheet size={18} className="text-emerald-600" />;
    }
    if (['PPT', 'PPTX'].includes(type)) {
      return <Presentation size={18} className="text-orange-500" />;
    }
    if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(type)) {
      return <ImageIcon size={18} className="text-blue-500" />;
    }
    return <File size={18} className="text-slate-500" />;
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-6 md:p-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 rounded-2xl px-6 py-6 md:px-8 md:py-7 shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
            <FolderOpen size={32} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Resources & Downloads Manager
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                {stats.total} {stats.total === 1 ? 'document' : 'documents'}
              </span>
            </div>
            <p className="text-sm text-teal-50 mt-1 font-medium">
              Upload, organize, categorize, publish, and manage verified institutional reports, policies, and files
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => fetchResources(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors disabled:opacity-50"
            title="Refresh resources list"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {!isReadOnly && (
            <Button
              onClick={handleOpenCreate}
              className="bg-white text-teal-800 hover:bg-teal-50 shadow-md font-semibold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex-1 sm:flex-none flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Add Resource</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Docs</span>
            <FileText size={16} className="text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <span className="text-[11px] text-slate-400 font-medium">In database</span>
        </div>

        <div
          onClick={() => setStatusFilter('published')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'published'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Published</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-2">{stats.published}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Visible to public</span>
        </div>

        <div
          onClick={() => setStatusFilter('draft')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'draft'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">Drafts</span>
            <EyeOff size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-2">{stats.drafts}</div>
          <span className="text-[11px] text-purple-600 font-medium">Unpublished</span>
        </div>

        <div
          onClick={() => setStatusFilter('featured')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'featured'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Featured</span>
            <Star size={16} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2">{stats.featured}</div>
          <span className="text-[11px] text-amber-600 font-medium">Hero spotlight</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-50/70 border-slate-200/80 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Categories</span>
            <Tag size={16} className="text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{stats.uniqueCategories}</div>
          <span className="text-[11px] text-slate-400 font-medium">Active categories</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Bar */}
        <div className="relative md:col-span-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search by title, description, category, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
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
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {RESOURCE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
            <option value="featured">Featured Only</option>
          </select>
        </div>

        {/* File Format Filter */}
        <div className="md:col-span-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Formats</option>
            <option value="PDF">PDF Documents</option>
            <option value="DOCX">Word Documents</option>
            <option value="XLSX">Excel Sheets</option>
            <option value="PPTX">PowerPoint</option>
            <option value="CSV">CSV Data</option>
          </select>
        </div>
      </div>

      {/* Resources List / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={28} className="text-teal-600" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No documents found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No documents match your current filter criteria. Try clearing filters.'
              : 'There are currently no resources registered in the database. Click "Add Resource" to upload your first document.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all') ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            ) : !isReadOnly ? (
              <Button onClick={handleOpenCreate} className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                <Plus size={15} className="mr-1.5" />
                Upload First Resource
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative"
            >
              <div className="space-y-4">
                {/* Card Header: Icon, Category & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {renderFileIcon(res.file_type)}
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {res.category}
                      </span>
                      <div className="text-[11px] text-slate-500 font-medium mt-1">
                        <span className="font-bold text-slate-700">{res.file_type}</span>
                        {res.file_size && <span> • {res.file_size}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {res.is_featured && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-amber-950 shadow-sm flex items-center gap-1">
                        <Star size={10} className="fill-amber-950" />
                        Featured
                      </span>
                    )}

                    <button
                      onClick={() => handleTogglePublish(res)}
                      disabled={isReadOnly}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full border shadow-sm transition-all flex items-center gap-1 ${
                        res.is_published
                          ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                          : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-900'
                      }`}
                      title={res.is_published ? 'Click to unpublish (move to Draft)' : 'Click to publish'}
                    >
                      {res.is_published ? (
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

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug line-clamp-2">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {res.description || 'No description provided.'}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-xs text-slate-500 pt-1">
                  {res.file_name && (
                    <div className="truncate text-slate-400 text-[11px] font-mono">
                      File: {res.file_name}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span>{res.year ? `Year: ${res.year}` : ''}</span>
                    <span className="truncate max-w-[150px]">{res.author ? `By: ${res.author}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewResource(res)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Quick Preview"
                  >
                    <Eye size={13} />
                    Preview
                  </button>

                  <a
                    href={res.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 px-2 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                    title="Direct download file"
                  >
                    <Download size={13} />
                  </a>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleFeatured(res)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        res.is_featured
                          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                      }`}
                      title={res.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                    >
                      <Star size={14} className={res.is_featured ? 'fill-amber-500' : ''} />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(res)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Edit size={12} />
                      Edit
                    </button>

                    {canDelete && (
                    <button
                      onClick={() => setDeleteConfirmId(res.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                      title="Delete resource"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {canDelete && deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete this resource?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to permanently delete this document? This action will remove it from the public downloads page and cannot be undone.
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
                onClick={() => handleDeleteResource(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Delete Resource
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {renderFileIcon(previewResource.file_type)}
                </div>
                <div>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
                    {previewResource.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{previewResource.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">File Type:</span>
                  <span className="font-bold">{previewResource.file_type}</span>
                </div>
                {previewResource.file_size && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">File Size:</span>
                    <span>{previewResource.file_size}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Year / Date:</span>
                  <span>{previewResource.year || 'N/A'} {previewResource.publication_date ? `(${previewResource.publication_date.split('T')[0]})` : ''}</span>
                </div>
                {previewResource.author && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Author / Department:</span>
                    <span>{previewResource.author}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <span className="font-bold capitalize">{previewResource.is_published ? 'Published' : 'Draft'}</span>
                </div>
              </div>

              {previewResource.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</h4>
                  <p className="text-sm text-slate-600 bg-slate-50/60 p-3 rounded-lg leading-relaxed">
                    {previewResource.description}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">File Storage URL</h4>
                <p className="text-xs text-slate-600 font-mono break-all bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {previewResource.file_url}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={previewResource.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Download size={14} />
                <span>Download / View File</span>
              </a>

              <Button variant="outline" onClick={() => setPreviewResource(null)} className="rounded-xl text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingResource ? 'Edit Resource' : 'Add New Resource'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload file, categorize, and specify metadata for the public Downloads page
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

            {/* Form Content */}
            <form onSubmit={handleSaveResource} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* File Upload Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Document File <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-200 rounded-xl transition-colors shadow-sm flex-shrink-0">
                    {uploadingFile ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    <span>{uploadingFile ? 'Uploading...' : 'Choose File to Upload'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={handleFileUpload}
                    />
                  </label>

                  <div className="flex-1 text-xs text-slate-500 truncate">
                    {formData.file_name ? (
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{formData.file_name}</span>
                        {formData.file_size && <span className="text-slate-400">({formData.file_size})</span>}
                      </span>
                    ) : (
                      <span>Supported: PDF, Word, Excel, PPT, CSV (Max 25MB)</span>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="url"
                    placeholder="Or paste direct external file URL (https://...)"
                    value={formData.file_url}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      file_url: e.target.value,
                      file_type: getFileExtension(e.target.value)
                    }))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Annual Financial Accountability Report 2025"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                  >
                    {RESOURCE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    File Type / Format
                  </label>
                  <input
                    type="text"
                    placeholder="PDF, DOCX, XLSX..."
                    value={formData.file_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_type: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase font-semibold"
                  />
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
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description / Abstract
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide a brief factual summary of the document contents, scope, or purpose..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 leading-relaxed"
                />
              </div>

              {/* Author, Year, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Author / Org
                  </label>
                  <input
                    type="text"
                    placeholder="RESTI CBO"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    placeholder="2026"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formData.publication_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, publication_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Display Order */}
              <div className="w-full sm:w-1/3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Toggles */}
              <div className="pt-3 flex flex-wrap gap-6 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">Publish Immediately</span>
                    <p className="text-xs text-slate-500">Visible on the public Resources & Downloads page</p>
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
                    <p className="text-xs text-slate-500">Highlighted in the top Featured Resources section</p>
                  </div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                  className="rounded-xl text-slate-600"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving || uploadingFile}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 px-5 py-2.5 shadow-sm"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingResource ? 'Save Changes' : 'Publish Resource'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourcesManager;
