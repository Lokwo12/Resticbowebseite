import React, { useState, useEffect, useMemo } from 'react';
import {
  Handshake, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye,
  Check, X, Globe, Upload, ExternalLink, ArrowUpDown, CheckCircle2,
  EyeOff, Sparkles, Loader2, Building2, AlertCircle, ArrowRight
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  Partner,
  PARTNER_TYPES,
  PARTNER_PAGE_STRINGS,
  normalizePartner
} from '../../utils/partnerData';
import { publicAnonKey } from '../../utils/supabase/info';

interface PartnersManagerProps {
  accessToken: string;
  projectId: string;
  userRole?: string;
  userName?: string;
  onUpdate?: () => void;
}

export function PartnersManager({
  accessToken,
  projectId,
  userRole,
  userName,
  onUpdate
}: PartnersManagerProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');

  // Dialog & Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [previewPartner, setPreviewPartner] = useState<Partner | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    partner_type: 'Community Partner',
    custom_type: '',
    description: '',
    website_url: '',
    logo_url: '',
    display_order: 1,
    is_published: true,
    since: new Date().getFullYear().toString()
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isReadOnly = userRole === 'viewer';

  // Load partners from backend
  const fetchPartners = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/partners`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        // Fallback to public endpoint with all=true if admin endpoint is unavailable
        const fallbackRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/partners?all=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken || publicAnonKey}`
            }
          }
        );
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const items = (fbData.partners || []).map(normalizePartner);
          setPartners(items);
          return;
        }
        throw new Error('Failed to fetch partners');
      }

      const data = await response.json();
      const items = (data.partners || []).map(normalizePartner);
      setPartners(items);
    } catch (err: any) {
      console.error('Error fetching partners:', err);
      toast.error('Could not load partners. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [projectId, accessToken]);

  // Handle Image Upload to Supabase Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, GIF, or SVG image files are allowed');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setUploadingLogo(true);
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

      setFormData(prev => ({ ...prev, logo_url: data.url }));
      toast.success('Partner logo uploaded successfully');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast.error(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    const nextOrder = partners.length > 0
      ? Math.max(...partners.map(p => p.display_order || 0)) + 1
      : 1;

    setEditingPartner(null);
    setFormData({
      name: '',
      partner_type: 'Community Partner',
      custom_type: '',
      description: '',
      website_url: '',
      logo_url: '',
      display_order: nextOrder,
      is_published: true,
      since: new Date().getFullYear().toString()
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (partner: Partner) => {
    const isCustom = !PARTNER_TYPES.includes(partner.partner_type as any);
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      partner_type: isCustom ? 'Other' : partner.partner_type,
      custom_type: isCustom ? partner.partner_type : '',
      description: partner.description || '',
      website_url: partner.website_url || partner.website || '',
      logo_url: partner.logo_url || partner.logo || '',
      display_order: partner.display_order || 1,
      is_published: partner.is_published,
      since: partner.since || ''
    });
    setIsFormOpen(true);
  };

  // Save Partner (Create or Update)
  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error('You do not have permission to modify partners');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter the partner organization name');
      return;
    }

    const resolvedType =
      formData.partner_type === 'Other' && formData.custom_type.trim()
        ? formData.custom_type.trim()
        : formData.partner_type;

    setIsSaving(true);
    try {
      const isEditing = Boolean(editingPartner);
      const url = isEditing
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/partners/${editingPartner!.key || editingPartner!.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/partners`;

      const payload = {
        name: formData.name.trim(),
        partner_type: resolvedType,
        category: resolvedType,
        description: formData.description.trim(),
        website_url: formData.website_url.trim(),
        website: formData.website_url.trim(),
        logo_url: formData.logo_url.trim(),
        logo: formData.logo_url.trim(),
        display_order: Number(formData.display_order) || 1,
        is_published: formData.is_published,
        published: formData.is_published,
        since: formData.since.trim()
      };

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save partner');
      }

      toast.success(isEditing ? 'Partner updated successfully' : 'Partner added successfully');
      setIsFormOpen(false);
      setEditingPartner(null);
      await fetchPartners();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error saving partner:', err);
      toast.error(err.message || 'Failed to save partner');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Publication Status
  const handleTogglePublish = async (partner: Partner) => {
    if (isReadOnly) {
      toast.error('Permission denied');
      return;
    }

    const newStatus = !partner.is_published;
    try {
      // Optimistic update
      setPartners(prev =>
        prev.map(p => (p.id === partner.id ? { ...p, is_published: newStatus, published: newStatus } : p))
      );

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/partners/${partner.key || partner.id}/toggle-publish`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        }
      });

      if (!res.ok) {
        // Fallback to PUT
        const fallbackRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/partners/${partner.key || partner.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || publicAnonKey}`
            },
            body: JSON.stringify({ ...partner, is_published: newStatus, published: newStatus })
          }
        );
        if (!fallbackRes.ok) throw new Error('Toggle failed');
      }

      toast.success(newStatus ? `${partner.name} published` : `${partner.name} unpublished`);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error('Failed to update publication status');
      await fetchPartners();
    }
  };

  // Delete Partner
  const handleDeletePartner = async (partnerId: string) => {
    if (isReadOnly) {
      toast.error('Permission denied');
      return;
    }

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/partners/${partnerId}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        }
      });

      if (!res.ok) throw new Error('Delete failed');

      setPartners(prev => prev.filter(p => p.id !== partnerId && p.key !== partnerId));
      setDeleteConfirmId(null);
      toast.success('Partner deleted');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete partner');
    }
  };

  // Computed & Filtered Partners
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = partner.name.toLowerCase().includes(q);
        const matchesDesc = partner.description.toLowerCase().includes(q);
        const matchesType = partner.partner_type.toLowerCase().includes(q);
        const matchesWeb = (partner.website_url || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesType && !matchesWeb) return false;
      }

      // Type Filter
      if (typeFilter !== 'all' && partner.partner_type !== typeFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter === 'published' && !partner.is_published) return false;
      if (statusFilter === 'unpublished' && partner.is_published) return false;

      return true;
    });
  }, [partners, searchQuery, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = partners.length;
    const published = partners.filter(p => p.is_published).length;
    const unpublished = total - published;
    const typesCount = new Set(partners.map(p => p.partner_type)).size;
    return { total, published, unpublished, typesCount };
  }, [partners]);

  // Available partner types in current data
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    partners.forEach(p => {
      if (p.partner_type) set.add(p.partner_type);
    });
    return Array.from(set);
  }, [partners]);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-6 md:p-10 space-y-8">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner">
            <Handshake size={32} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Partners & Sponsors</h2>
              <span className="px-3 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
                {stats.total} total
              </span>
            </div>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Manage verified organizations, institutional partners, and sponsors appearing on the RESTI website.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => fetchPartners(true)}
            variant="outline"
            disabled={refreshing}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md rounded-xl h-11 px-4 text-sm font-medium transition-all"
          >
            <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {!isReadOnly && (
            <Button
              onClick={handleOpenCreate}
              className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-md font-semibold rounded-xl h-11 px-5 text-sm transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Add Partner
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Partners</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Published</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.published}</p>
        </div>
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Unpublished / Drafts</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{stats.unpublished}</p>
        </div>
        <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-4">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Partner Types</p>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{stats.typesCount}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, description, or type..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Partner Type Filter */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400 hidden sm:inline" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="all">All Types</option>
              {PARTNER_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
              {availableTypes.filter(t => !PARTNER_TYPES.includes(t as any)).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="unpublished">Draft / Unpublished</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 size={36} className="animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-600">Loading partners...</p>
        </div>
      ) : partners.length === 0 ? (
        /* Empty State (No partners in DB) */
        <div className="text-center py-20 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
            <Handshake size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {PARTNER_PAGE_STRINGS.adminEmptyHeading}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {PARTNER_PAGE_STRINGS.adminEmptyDescription}
          </p>
          {!isReadOnly && (
            <Button
              onClick={handleOpenCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6 py-2.5 shadow-md shadow-emerald-600/10 transition-all flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              Add Partner
            </Button>
          )}
        </div>
      ) : filteredPartners.length === 0 ? (
        /* No Search / Filter Results */
        <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200">
          <Building2 size={32} className="mx-auto text-slate-400 mb-3" />
          <h4 className="text-base font-semibold text-slate-800 mb-1">No partners match your filters</h4>
          <p className="text-xs text-slate-500 mb-4">Try clearing your search query or selecting a different partner type.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setStatusFilter('all');
            }}
            className="text-xs rounded-xl"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* Partners Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => {
            const hasLogo = Boolean(partner.logo_url || partner.logo);
            const logoSrc = partner.logo_url || partner.logo || '';
            const websiteUrl = partner.website_url || partner.website;
            const hasWebsite = Boolean(websiteUrl && websiteUrl !== '#' && websiteUrl.startsWith('http'));

            return (
              <div
                key={partner.id}
                className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col shadow-sm hover:shadow-md ${
                  partner.is_published
                    ? 'border-slate-200 hover:border-emerald-300'
                    : 'border-amber-200 bg-amber-50/10 hover:border-amber-300'
                }`}
              >
                {/* Header & Logo Section */}
                <div className="p-6 border-b border-slate-100 flex items-start gap-4">
                  {/* Logo Container with object-contain */}
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200/80 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {hasLogo ? (
                      <img
                        src={logoSrc}
                        alt={partner.name}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          // Hide broken image and fallback to monogram
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-emerald-100/60 text-emerald-800 font-bold text-base flex items-center justify-center tracking-wider">
                        {partner.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() || 'P'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5"
                      >
                        {partner.partner_type || 'Partner'}
                      </Badge>

                      {/* Publish status badge */}
                      <button
                        onClick={() => handleTogglePublish(partner)}
                        disabled={isReadOnly}
                        title={partner.is_published ? 'Click to unpublish' : 'Click to publish'}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                          partner.is_published
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {partner.is_published ? (
                          <>
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff size={11} className="text-amber-600" />
                            Draft
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate" title={partner.name}>
                      {partner.name}
                    </h3>

                    {partner.since && (
                      <p className="text-xs text-slate-400 mt-0.5">Partner since {partner.since}</p>
                    )}
                  </div>
                </div>

                {/* Description Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {partner.description || <span className="italic text-slate-400">No description provided.</span>}
                  </p>

                  {/* Official Website Link preview */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {websiteUrl && hasWebsite ? (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold truncate max-w-[200px]"
                      >
                        <Globe size={13} />
                        <span className="truncate">{(websiteUrl || '').replace(/^https?:\/\//, '')}</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1 italic">
                        <Globe size={13} />
                        No website linked
                      </span>
                    )}

                    <span className="text-slate-400 font-medium">Order: #{partner.display_order}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-6 py-3.5 bg-slate-50/80 rounded-b-2xl border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewPartner(partner)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
                  >
                    <Eye size={13} />
                    Preview
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(partner)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(partner.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Partner Organization?</h3>
            <p className="text-sm text-slate-600 mb-6">
              This will remove the organization record immediately from Supabase and the public website. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeletePartner(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Partner Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-5 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Handshake size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingPartner ? 'Edit Partner Organization' : 'Add New Partner Organization'}
                  </h3>
                  <p className="text-xs text-slate-500">Enter organization details and official logo</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePartner} className="p-6 space-y-6">
              {/* Organization Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Uganda Red Cross Society, UNICEF, Local CBO..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Partner Type & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Partner Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.partner_type}
                    onChange={(e) => setFormData({ ...formData, partner_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    {PARTNER_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Lower numbers appear first</span>
                </div>
              </div>

              {/* Custom Type (if "Other" selected) */}
              {formData.partner_type === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Specify Partner Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.custom_type}
                    onChange={(e) => setFormData({ ...formData, custom_type: e.target.value })}
                    placeholder="Enter custom partner type..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize the collaboration, focus area, or mutual mission..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Website URL & Partner Since */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://example.org"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Leave empty if no website is available</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Partner Since (Year)
                  </label>
                  <input
                    type="text"
                    value={formData.since}
                    onChange={(e) => setFormData({ ...formData, since: e.target.value })}
                    placeholder="e.g. 2024"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Partner Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Official Organization Logo
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingLogo}
                        asChild
                        className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <span>
                          {uploadingLogo ? (
                            <>
                              <Loader2 size={16} className="animate-spin mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={16} className="mr-2 text-emerald-600" />
                              Upload Official Logo
                            </>
                          )}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>

                    <span className="text-xs text-slate-400">PNG, SVG, WebP, or JPEG (Max 10MB)</span>
                  </div>

                  {/* Logo Preview */}
                  {formData.logo_url && (
                    <div className="relative inline-flex items-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="w-24 h-16 rounded-xl bg-white border border-slate-200/80 p-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={formData.logo_url}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="ml-3 pr-8">
                        <p className="text-xs font-semibold text-slate-800">Logo attached</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{formData.logo_url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo_url: '' })}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove Logo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Publish immediately</p>
                  <p className="text-xs text-slate-500">
                    When enabled, this partner is publicly visible on the RESTI Partners page.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-semibold shadow-md shadow-emerald-600/10"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : editingPartner ? (
                    'Update Partner'
                  ) : (
                    'Add Partner'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Live Card Preview Modal */}
      {previewPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Public Card Preview</span>
              <button
                onClick={() => setPreviewPartner(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Public Card Style Replica */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
              <div className="p-6 flex items-center gap-4 border-b border-slate-50">
                <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-2 flex-shrink-0">
                  {previewPartner.logo_url || previewPartner.logo ? (
                    <img
                      src={previewPartner.logo_url || previewPartner.logo}
                      alt={previewPartner.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center">
                      {previewPartner.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() || 'P'}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    {previewPartner.partner_type || 'Partner'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{previewPartner.name}</h3>
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between">
                <p className="text-slate-600 leading-relaxed text-sm mb-6">
                  {previewPartner.description || 'No description provided.'}
                </p>

                {previewPartner.website_url && previewPartner.website_url !== '#' && (
                  <div className="pt-4 border-t border-slate-50 mt-auto">
                    <a
                      href={previewPartner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold text-sm transition-colors"
                    >
                      <Globe size={16} />
                      <span>Visit Website</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setPreviewPartner(null)}
                className="bg-slate-900 hover:bg-black text-white rounded-xl"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
