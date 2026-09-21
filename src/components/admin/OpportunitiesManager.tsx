import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye, 
  Clock, MapPin, Calendar, CheckCircle2, AlertCircle, Globe, 
  Mail, ExternalLink, Archive, FileText, ChevronRight, X,
  User, Phone, Download, Check, AlertTriangle, Briefcase,
  Layers, ArrowUpDown, MoreHorizontal, MessageSquare, Send
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { 
  OpportunityItem, 
  OpportunityCategory, 
  OpportunityStatus, 
  WorkArrangement,
  CandidateApplication,
  OPPORTUNITY_CATEGORIES,
  WORK_ARRANGEMENTS,
  INITIAL_OPPORTUNITIES,
  computeOpportunityStatus,
  getCategoryBadgeClasses,
  getStatusBadgeClasses
} from '../../utils/opportunitiesData';
import { supabase } from '../../utils/supabase/client';
import { publicAnonKey } from '../../utils/supabase/info';

interface OpportunitiesManagerProps {
  accessToken: string;
  projectId: string;
  userRole?: string;
  userName?: string;
  onUpdate?: () => void;
}

export function OpportunitiesManager({
  accessToken,
  projectId,
  userRole,
  userName,
  onUpdate
}: OpportunitiesManagerProps) {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(INITIAL_OPPORTUNITIES);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'archived' | 'applications'>('active');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workArrangementFilter, setWorkArrangementFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityItem | null>(null);
  const [editorTab, setEditorTab] = useState<'basic' | 'content' | 'application'>('basic');
  const [isSaving, setIsSaving] = useState(false);

  // Preview & Application Modal states
  const [previewItem, setPreviewItem] = useState<OpportunityItem | null>(null);
  const [viewingApplication, setViewingApplication] = useState<CandidateApplication | null>(null);

  // Deletion Modal
  const [itemToDelete, setItemToDelete] = useState<OpportunityItem | null>(null);
  const [appToDelete, setAppToDelete] = useState<CandidateApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const defaultFormState: Partial<OpportunityItem> = {
    title: '',
    category: 'Jobs',
    type: 'Full-Time',
    workArrangement: 'Field-Based',
    location: 'Kiryandongo District',
    duration: '12 Months',
    shortDescription: '',
    description: '',
    responsibilities: [''],
    requirements: [''],
    benefits: [''],
    isOngoing: false,
    deadline: '',
    status: 'Open',
    applicationMethod: 'internal',
    applicationEmail: 'careers@resticbo.org',
    applicationUrl: '',
    applicationInstructions: 'Submit your resume and cover letter using our online application form.'
  };

  const [formData, setFormData] = useState<Partial<OpportunityItem>>(defaultFormState);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);

  // Fetch opportunities
  const fetchOpportunities = async () => {
    try {
      setRefreshing(true);
      // Try backend edge function
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities`,
        {
          headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` },
          signal: AbortSignal.timeout(6000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const opps: any[] = data.opportunities || [];
        if (opps.length > 0) {
          const parsed = opps.map((item: any) => {
            const v = item.value || item;
            return {
              id: item.key ? item.key.replace(/^opportunity:/, '') : (item.id || v.id),
              key: item.key || item.id,
              title: v.title || 'Untitled Opportunity',
              category: v.category || 'Jobs',
              type: v.type || 'Full-Time',
              workArrangement: v.workArrangement || 'Field-Based',
              location: v.location || 'Kiryandongo District',
              duration: v.duration || 'Ongoing',
              shortDescription: v.shortDescription || v.description || '',
              description: v.description || '',
              responsibilities: Array.isArray(v.responsibilities) ? v.responsibilities : [],
              requirements: Array.isArray(v.requirements) ? v.requirements : [],
              benefits: Array.isArray(v.benefits) ? v.benefits : [],
              isOngoing: Boolean(v.isOngoing),
              deadline: v.deadline || '',
              status: v.status || 'Open',
              applicationMethod: v.applicationMethod || 'internal',
              applicationEmail: v.applicationEmail || 'careers@resticbo.org',
              applicationUrl: v.applicationUrl || '',
              applicationInstructions: v.applicationInstructions || '',
              createdAt: v.createdAt || v.created_at,
              updatedAt: v.updatedAt || v.updated_at
            } as OpportunityItem;
          });
          setOpportunities(parsed);
          return;
        }
      }

      // Fallback: check direct Supabase kv_store
      const { data: kvData } = await supabase
        .from('kv_store_2a4be611')
        .select('*')
        .like('key', 'opportunity:%');

      if (kvData && kvData.length > 0) {
        const parsed = kvData.map((item: any) => {
          const v = item.value || {};
          return {
            id: item.key.replace(/^opportunity:/, ''),
            key: item.key,
            title: v.title || 'Untitled Opportunity',
            category: v.category || 'Jobs',
            type: v.type || 'Full-Time',
            workArrangement: v.workArrangement || 'Field-Based',
            location: v.location || 'Kiryandongo District',
            duration: v.duration || 'Ongoing',
            shortDescription: v.shortDescription || v.description || '',
            description: v.description || '',
            responsibilities: Array.isArray(v.responsibilities) ? v.responsibilities : [],
            requirements: Array.isArray(v.requirements) ? v.requirements : [],
            benefits: Array.isArray(v.benefits) ? v.benefits : [],
            isOngoing: Boolean(v.isOngoing),
            deadline: v.deadline || '',
            status: v.status || 'Open',
            applicationMethod: v.applicationMethod || 'internal',
            applicationEmail: v.applicationEmail || 'careers@resticbo.org',
            applicationUrl: v.applicationUrl || '',
            applicationInstructions: v.applicationInstructions || '',
            createdAt: v.createdAt || v.created_at,
            updatedAt: v.updatedAt || v.updated_at
          } as OpportunityItem;
        });
        setOpportunities(parsed);
      } else {
        setOpportunities(INITIAL_OPPORTUNITIES);
      }
    } catch (err) {
      console.warn('Could not fetch opportunities remotely, using local state.', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch applications
  const fetchApplications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunity-applications`,
        {
          headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` },
          signal: AbortSignal.timeout(6000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.applications)) {
          setApplications(data.applications);
          return;
        }
      }

      // Fallback query kv_store_2a4be611 for applications
      const { data: kvApps } = await supabase
        .from('kv_store_2a4be611')
        .select('*')
        .like('key', 'opportunity_app:%');

      if (kvApps && kvApps.length > 0) {
        const parsed = kvApps.map((row: any) => ({
          id: row.key.replace(/^opportunity_app:/, ''),
          key: row.key,
          ...row.value
        }));
        parsed.sort((a: any, b: any) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
        setApplications(parsed);
      }
    } catch (err) {
      console.warn('Could not fetch applications from API', err);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchApplications();
  }, [projectId, accessToken]);

  // Open creation modal
  const handleOpenCreate = () => {
    setEditingOpportunity(null);
    setFormData(defaultFormState);
    setIsCustomCat(false);
    setCustomCategory('');
    setEditorTab('basic');
    setIsEditorOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (opp: OpportunityItem) => {
    setEditingOpportunity(opp);
    const isStandard = OPPORTUNITY_CATEGORIES.includes(opp.category as any);
    setIsCustomCat(!isStandard);
    setCustomCategory(!isStandard ? opp.category : '');
    setFormData({
      ...opp,
      responsibilities: (opp.responsibilities && opp.responsibilities.length > 0) ? opp.responsibilities : [''],
      requirements: (opp.requirements && opp.requirements.length > 0) ? opp.requirements : [''],
      benefits: (opp.benefits && opp.benefits.length > 0) ? opp.benefits : ['']
    });
    setEditorTab('basic');
    setIsEditorOpen(true);
  };

  // Save opportunity
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Please enter an opportunity title');
      return;
    }

    setIsSaving(true);
    try {
      const finalCategory = isCustomCat && customCategory.trim() 
        ? customCategory.trim() 
        : (formData.category || 'Jobs');

      const payload = {
        ...formData,
        category: finalCategory,
        responsibilities: (formData.responsibilities || []).filter(r => r && r.trim()),
        requirements: (formData.requirements || []).filter(r => r && r.trim()),
        benefits: (formData.benefits || []).filter(b => b && b.trim()),
        updatedAt: new Date().toISOString()
      };

      if (editingOpportunity) {
        // Update existing
        const oppKey = editingOpportunity.key || `opportunity:${editingOpportunity.id}`;
        const cleanId = oppKey.replace(/^opportunity:/, '');
        
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${cleanId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || publicAnonKey}`
            },
            body: JSON.stringify(payload)
          }
        );

        // Also update Supabase kv_store directly as guarantee
        await supabase.from('kv_store_2a4be611').upsert({
          key: oppKey,
          value: { id: cleanId, ...payload }
        });

        setOpportunities(prev => prev.map(o => (o.id === editingOpportunity.id || o.key === oppKey) ? { ...o, ...payload } as OpportunityItem : o));
        toast.success('Opportunity updated successfully');
      } else {
        // Create new
        const newId = 'opp-' + Date.now();
        const oppKey = `opportunity:${newId}`;
        const newOpp: OpportunityItem = {
          id: newId,
          key: oppKey,
          createdAt: new Date().toISOString(),
          ...payload
        } as OpportunityItem;

        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || publicAnonKey}`
            },
            body: JSON.stringify(newOpp)
          }
        );

        await supabase.from('kv_store_2a4be611').upsert({
          key: oppKey,
          value: newOpp
        });

        setOpportunities(prev => [newOpp, ...prev]);
        toast.success('Opportunity created successfully');
      }

      setIsEditorOpen(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error saving opportunity:', err);
      toast.error('Failed to save opportunity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick 1-click Status toggle
  const handleToggleStatus = async (opp: OpportunityItem, targetStatus: OpportunityStatus) => {
    try {
      const oppKey = opp.key || `opportunity:${opp.id}`;
      const cleanId = oppKey.replace(/^opportunity:/, '');
      const updatedOpp = { ...opp, status: targetStatus, updatedAt: new Date().toISOString() };

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${cleanId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ status: targetStatus })
        }
      );

      await supabase.from('kv_store_2a4be611').upsert({
        key: oppKey,
        value: updatedOpp
      });

      setOpportunities(prev => prev.map(o => (o.id === opp.id || o.key === oppKey) ? updatedOpp : o));
      toast.success(`Opportunity marked as ${targetStatus}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  // Delete opportunity
  const confirmDeleteOpportunity = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const oppKey = itemToDelete.key || `opportunity:${itemToDelete.id}`;
      const cleanId = oppKey.replace(/^opportunity:/, '');

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${cleanId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }
        }
      );

      await supabase.from('kv_store_2a4be611').delete().eq('key', oppKey);

      setOpportunities(prev => prev.filter(o => o.id !== itemToDelete.id && o.key !== oppKey));
      toast.success('Opportunity deleted');
      setItemToDelete(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to delete opportunity');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete application
  const confirmDeleteApplication = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    try {
      const appKey = appToDelete.key || `opportunity_app:${appToDelete.id}`;
      const cleanId = appKey.replace(/^opportunity_app:/, '');

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunity-applications/${cleanId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }
        }
      );

      await supabase.from('kv_store_2a4be611').delete().eq('key', appKey);

      setApplications(prev => prev.filter(a => a.id !== appToDelete.id && a.key !== appKey));
      toast.success('Application deleted');
      setAppToDelete(null);
    } catch (err) {
      toast.error('Failed to delete application');
    } finally {
      setIsDeleting(false);
    }
  };

  // Update application status
  const handleUpdateApplicationStatus = async (app: CandidateApplication, newStatus: CandidateApplication['status']) => {
    try {
      const appKey = app.key || `opportunity_app:${app.id}`;
      const cleanId = appKey.replace(/^opportunity_app:/, '');
      const updated = { ...app, status: newStatus, updatedAt: new Date().toISOString() };

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunity-applications/${cleanId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      await supabase.from('kv_store_2a4be611').upsert({
        key: appKey,
        value: updated
      });

      setApplications(prev => prev.map(a => (a.id === app.id || a.key === appKey) ? updated : a));
      toast.success(`Application marked as ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update application status');
    }
  };

  // List filtering
  const categorizedOpportunities = useMemo(() => {
    return opportunities.map(opp => ({
      ...opp,
      computedStatus: computeOpportunityStatus(opp)
    }));
  }, [opportunities]);

  const activeOpportunities = useMemo(() => {
    return categorizedOpportunities.filter(o => 
      o.computedStatus === 'Open' || 
      o.computedStatus === 'Closing Soon' || 
      o.computedStatus === 'Ongoing'
    );
  }, [categorizedOpportunities]);

  const archivedOpportunities = useMemo(() => {
    return categorizedOpportunities.filter(o => 
      o.computedStatus === 'Closed' || 
      o.computedStatus === 'Draft' || 
      o.computedStatus === 'Archived'
    );
  }, [categorizedOpportunities]);

  // Current filtered list depending on active sub-tab
  const displayedOpportunities = useMemo(() => {
    const list = activeSubTab === 'active' ? activeOpportunities : archivedOpportunities;
    return list.filter(opp => {
      const matchesSearch = 
        !searchQuery ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || opp.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || opp.computedStatus === statusFilter;
      const matchesArrangement = workArrangementFilter === 'all' || opp.workArrangement === workArrangementFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesArrangement;
    });
  }, [activeSubTab, activeOpportunities, archivedOpportunities, searchQuery, categoryFilter, statusFilter, workArrangementFilter]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        app.fullName.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.opportunityTitle.toLowerCase().includes(q)
      );
    });
  }, [applications, searchQuery]);

  // Dynamic Categories from existing data
  const availableCategories = useMemo(() => {
    const set = new Set<string>(OPPORTUNITY_CATEGORIES);
    opportunities.forEach(o => {
      if (o.category) set.add(o.category);
    });
    return Array.from(set);
  }, [opportunities]);

  // Helpers for bullet fields
  const handleAddBullet = (field: 'responsibilities' | 'requirements' | 'benefits') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const handleUpdateBullet = (field: 'responsibilities' | 'requirements' | 'benefits', index: number, value: string) => {
    setFormData(prev => {
      const list = [...(prev[field] || [])];
      list[index] = value;
      return { ...prev, [field]: list };
    });
  };

  const handleRemoveBullet = (field: 'responsibilities' | 'requirements' | 'benefits', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 flex-shrink-0">
              <Target size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  Opportunities ({activeOpportunities.length})
                </h2>
                {refreshing && <RefreshCw size={18} className="animate-spin text-purple-600" />}
              </div>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
                Manage jobs, internships, volunteer roles, consultancies, fellowships, and review incoming candidate applications.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { fetchOpportunities(); fetchApplications(); }}
              className="p-3 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              title="Refresh Opportunities"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <Button
              onClick={handleOpenCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl shadow-md flex items-center gap-2"
            >
              <Plus size={18} />
              Add Opportunity
            </Button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'active'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Active Opportunities</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
              {activeOpportunities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('archived')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'archived'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Archive size={16} />
            <span>Archived & Closed</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
              {archivedOpportunities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('applications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'applications'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText size={16} />
            <span>Applications Received</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
              {applications.length}
            </span>
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                {applications.filter(a => a.status === 'pending').length} New
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab !== 'applications' ? (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by title, location or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Work Arrangement Filter */}
            <select
              value={workArrangementFilter}
              onChange={(e) => setWorkArrangementFilter(e.target.value)}
              className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">All Arrangements</option>
              {WORK_ARRANGEMENTS.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Closing Soon">Closing Soon</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Closed">Closed</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Showing {displayedOpportunities.length} of {activeSubTab === 'active' ? activeOpportunities.length : archivedOpportunities.length} opportunities</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg ${viewMode === 'table' ? 'bg-slate-200 font-semibold text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg ${viewMode === 'cards' ? 'bg-slate-200 font-semibold text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Card View
              </button>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Opportunity</th>
                    <th className="px-5 py-3.5">Category & Type</th>
                    <th className="px-5 py-3.5">Location & Mode</th>
                    <th className="px-5 py-3.5">Deadline</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-center">Applications</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedOpportunities.map((opp) => {
                    const appsForOpp = applications.filter(a => a.opportunityId === opp.id || a.opportunityTitle === opp.title);
                    return (
                      <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-900 max-w-xs">
                          <p className="font-semibold line-clamp-1">{opp.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{opp.shortDescription || opp.description}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClasses(opp.category)}`}>
                            {opp.category}
                          </span>
                          <span className="block text-xs text-slate-500 mt-1">{opp.type}</span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin size={13} className="text-slate-400" />
                            <span className="line-clamp-1">{opp.location}</span>
                          </div>
                          <span className="text-slate-500 mt-0.5 inline-block">{opp.workArrangement} • {opp.duration || 'Flexible'}</span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {opp.isOngoing || opp.deadline?.toLowerCase() === 'ongoing' ? (
                            <span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-md">Ongoing</span>
                          ) : (
                            <div>
                              <span className="font-medium text-slate-700">{opp.deadline || 'No deadline'}</span>
                              {opp.computedStatus === 'Closing Soon' && (
                                <span className="block text-[11px] text-amber-700 font-semibold mt-0.5">Closing Soon</span>
                              )}
                              {opp.computedStatus === 'Closed' && (
                                <span className="block text-[11px] text-red-600 font-semibold mt-0.5">Expired</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeClasses(opp.computedStatus)}`}>
                            {opp.computedStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => {
                              setActiveSubTab('applications');
                              setSearchQuery(opp.title);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 transition-colors"
                          >
                            <User size={12} />
                            <span>{appsForOpp.length}</span>
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewItem(opp)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                              title="Preview Opportunity Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(opp)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Opportunity"
                            >
                              <Edit size={15} />
                            </button>
                            
                            {/* Quick status button */}
                            {opp.computedStatus === 'Open' || opp.computedStatus === 'Ongoing' ? (
                              <button
                                onClick={() => handleToggleStatus(opp, 'Closed')}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all"
                                title="Close Opportunity"
                              >
                                <AlertCircle size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(opp, 'Open')}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Reopen / Publish Opportunity"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}

                            {opp.status !== 'Archived' ? (
                              <button
                                onClick={() => handleToggleStatus(opp, 'Archived')}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                                title="Archive Opportunity"
                              >
                                <Archive size={15} />
                              </button>
                            ) : null}

                            <button
                              onClick={() => setItemToDelete(opp)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Opportunity"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedOpportunities.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <Target size={24} />
                        </div>
                        <p className="font-semibold text-slate-700">No opportunities match your filter</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or reset filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedOpportunities.map((opp) => {
                const appsForOpp = applications.filter(a => a.opportunityId === opp.id || a.opportunityTitle === opp.title);
                return (
                  <div 
                    key={opp.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClasses(opp.category)}`}>
                          {opp.category}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClasses(opp.computedStatus)}`}>
                          {opp.computedStatus}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-2">{opp.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                        {opp.shortDescription || opp.description}
                      </p>

                      <div className="space-y-1.5 text-xs text-slate-500 mb-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{opp.location} ({opp.workArrangement})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>Deadline: {opp.isOngoing ? 'Ongoing' : (opp.deadline || 'None')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          <span>Applications: {appsForOpp.length} candidate(s)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setPreviewItem(opp)}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                      >
                        Preview View
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(opp)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setItemToDelete(opp)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Applications Received Tab */
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Submitted Applications ({applications.length})</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review and manage candidate submissions received through internal application forms.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Role Applied For</th>
                  <th className="px-5 py-3.5">Date Submitted</th>
                  <th className="px-5 py-3.5">Resume / CV</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <p className="font-semibold">{app.fullName}</p>
                      <p className="text-xs text-slate-500">{app.email} • {app.phone || 'No phone'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-800 text-xs">{app.opportunityTitle}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Download size={13} />
                          <span>View Resume</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None attached</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={app.status || 'pending'}
                        onChange={(e) => handleUpdateApplicationStatus(app, e.target.value as any)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none ${
                          app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          app.status === 'under_review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          app.status === 'offered' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                        <option value="offered">Offered</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingApplication(app)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Read Cover Letter & Details"
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          onClick={() => setAppToDelete(app)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Application"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      <FileText size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No applications found</p>
                      <p className="text-xs text-slate-400">Applications submitted through the website form will automatically appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingOpportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure opportunity details, requirements, duration, and application method.
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setEditorTab('basic')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  editorTab === 'basic' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Basic Info & Mode
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('content')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  editorTab === 'content' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Descriptions & Requirements
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('application')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  editorTab === 'application' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Application Settings & Deadline
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {editorTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Opportunity Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Livelihoods & Agro-Enterprise Field Officer"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Category
                      </label>
                      <select
                        value={isCustomCat ? 'custom' : (formData.category || 'Jobs')}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsCustomCat(true);
                          } else {
                            setIsCustomCat(false);
                            setFormData({ ...formData, category: e.target.value as any });
                          }
                        }}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        {OPPORTUNITY_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="custom">+ Add Custom Category...</option>
                      </select>
                      {isCustomCat && (
                        <input
                          type="text"
                          placeholder="Enter custom category name..."
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full mt-2 px-4 py-2 text-sm bg-purple-50 border border-purple-200 rounded-xl focus:outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Opportunity Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Full-Time, Volunteer, Internship, Contract"
                        value={formData.type || ''}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Work Arrangement
                      </label>
                      <select
                        value={formData.workArrangement || 'Field-Based'}
                        onChange={(e) => setFormData({ ...formData, workArrangement: e.target.value as any })}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        {WORK_ARRANGEMENTS.map(w => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kiryandongo District"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12 Months, 6 Months, Ongoing"
                        value={formData.duration || ''}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Publication Status
                    </label>
                    <select
                      value={formData.status || 'Open'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="Open">Open (Active on Website)</option>
                      <option value="Ongoing">Ongoing (Indefinite / Always Open)</option>
                      <option value="Draft">Draft (Hidden from Public)</option>
                      <option value="Closed">Closed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              )}

              {editorTab === 'content' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Short Description / Card Excerpt *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief 1-2 sentence overview for cards and preview summaries..."
                      value={formData.shortDescription || ''}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Detailed Overview / About the Opportunity
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Comprehensive explanation of what this role or opportunity aims to achieve..."
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {/* Responsibilities list */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Key Responsibilities
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddBullet('responsibilities')}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Line
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.responsibilities || []).map((resp, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Facilitate community health education workshops..."
                            value={resp}
                            onChange={(e) => handleUpdateBullet('responsibilities', i, e.target.value)}
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet('responsibilities', i)}
                            className="p-1.5 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements list */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Requirements & Qualifications
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddBullet('requirements')}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Line
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.requirements || []).map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Diploma or Degree in Agriculture or related field..."
                            value={req}
                            onChange={(e) => handleUpdateBullet('requirements', i, e.target.value)}
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet('requirements', i)}
                            className="p-1.5 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits list */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Benefits & What We Offer
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddBullet('benefits')}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Line
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.benefits || []).map((ben, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Monthly stipend and field allowance..."
                            value={ben}
                            onChange={(e) => handleUpdateBullet('benefits', i, e.target.value)}
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet('benefits', i)}
                            className="p-1.5 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editorTab === 'application' && (
                <div className="space-y-6">
                  {/* Deadline & Ongoing Flag */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isOngoingCheckbox"
                        checked={Boolean(formData.isOngoing)}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          isOngoing: e.target.checked,
                          deadline: e.target.checked ? 'Ongoing' : ''
                        })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <label htmlFor="isOngoingCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                        Mark as Ongoing Opportunity (No fixed closing deadline)
                      </label>
                    </div>

                    {!formData.isOngoing && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                          Application Deadline Date
                        </label>
                        <input
                          type="date"
                          value={formData.deadline || ''}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Opportunities automatically mark as closed and hide from public view after this date.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Application Method Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                      Application Method *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col ${
                        formData.applicationMethod === 'internal'
                          ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="appMethod"
                            checked={formData.applicationMethod === 'internal'}
                            onChange={() => setFormData({ ...formData, applicationMethod: 'internal' })}
                            className="text-purple-600"
                          />
                          <span className="text-xs font-bold text-slate-800">Internal Form</span>
                        </div>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          Candidates apply directly through RESTI's online portal with CV upload.
                        </span>
                      </label>

                      <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col ${
                        formData.applicationMethod === 'email'
                          ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="appMethod"
                            checked={formData.applicationMethod === 'email'}
                            onChange={() => setFormData({ ...formData, applicationMethod: 'email' })}
                            className="text-purple-600"
                          />
                          <span className="text-xs font-bold text-slate-800">Direct Email</span>
                        </div>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          Candidates submit materials directly to a verified RESTI email address.
                        </span>
                      </label>

                      <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col ${
                        formData.applicationMethod === 'external'
                          ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            name="appMethod"
                            checked={formData.applicationMethod === 'external'}
                            onChange={() => setFormData({ ...formData, applicationMethod: 'external' })}
                            className="text-purple-600"
                          />
                          <span className="text-xs font-bold text-slate-800">External URL</span>
                        </div>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          Redirects candidate to an external portal or partner application form.
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.applicationMethod === 'email' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                        Verified Application Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. careers@resticbo.org"
                        value={formData.applicationEmail || ''}
                        onChange={(e) => setFormData({ ...formData, applicationEmail: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  )}

                  {formData.applicationMethod === 'external' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                        External Application URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://forms.gle/... or https://partner.org/apply"
                        value={formData.applicationUrl || ''}
                        onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Application Instructions for Candidates
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Please submit your CV and cover letter in PDF format. Early submissions are encouraged."
                      value={formData.applicationInstructions || ''}
                      onChange={(e) => setFormData({ ...formData, applicationInstructions: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  {editorTab !== 'application' ? (
                    <Button
                      type="button"
                      onClick={() => setEditorTab(editorTab === 'basic' ? 'content' : 'application')}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl"
                    >
                      Next Step <ChevronRight size={14} className="ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                    >
                      {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                      {editingOpportunity ? 'Save Changes' : 'Publish Opportunity'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-8 p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClasses(previewItem.category)}`}>
                    {previewItem.category}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClasses(computeOpportunityStatus(previewItem))}`}>
                    {computeOpportunityStatus(previewItem)}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">{previewItem.title}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {previewItem.location} • {previewItem.workArrangement} • {previewItem.duration || 'Flexible'}
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">About This Opportunity</h4>
                <p className="leading-relaxed whitespace-pre-wrap">{previewItem.description || previewItem.shortDescription}</p>
              </div>

              {previewItem.responsibilities?.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Key Responsibilities</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {previewItem.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {previewItem.requirements?.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Requirements & Qualifications</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {previewItem.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {previewItem.benefits && previewItem.benefits.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Benefits & Offer</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {previewItem.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/70 text-xs">
                <div>
                  <span className="font-bold text-slate-700">Deadline: </span>
                  <span>{previewItem.isOngoing ? 'Ongoing' : (previewItem.deadline || 'None')}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Application Method: </span>
                  <span className="capitalize">{previewItem.applicationMethod}</span>
                </div>
                {previewItem.applicationInstructions && (
                  <div>
                    <span className="font-bold text-slate-700">Instructions: </span>
                    <span>{previewItem.applicationInstructions}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION DETAILS MODAL */}
      {viewingApplication && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full my-8 p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Candidate Application</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{viewingApplication.fullName}</h3>
                <p className="text-xs text-slate-500">{viewingApplication.email} • {viewingApplication.phone || 'No phone'}</p>
              </div>
              <button
                onClick={() => setViewingApplication(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-700">Applied for: </span>
                <span className="text-slate-900 font-semibold">{viewingApplication.opportunityTitle}</span>
                <span className="block text-slate-400 mt-1">Submitted: {new Date(viewingApplication.appliedAt || Date.now()).toLocaleString()}</span>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Cover Letter / Message</h4>
                <div className="p-4 bg-slate-50 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed text-xs border border-slate-100">
                  {viewingApplication.coverLetter || 'No cover letter submitted.'}
                </div>
              </div>

              {viewingApplication.resumeUrl && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Attached Resume / CV</h4>
                  <a
                    href={viewingApplication.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download size={14} /> Download CV ({viewingApplication.resumeName || 'Document'})
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingApplication(null)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {(itemToDelete || appToDelete) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {itemToDelete ? 'Delete Opportunity?' : 'Delete Application?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {itemToDelete 
                  ? `Are you sure you want to permanently delete "${itemToDelete.title}"? This action cannot be undone.`
                  : `Are you sure you want to delete the application submitted by ${appToDelete?.fullName}? This action cannot be undone.`
                }
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setItemToDelete(null); setAppToDelete(null); }}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={itemToDelete ? confirmDeleteOpportunity : confirmDeleteApplication}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
