import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye, 
  Clock, MapPin, Calendar, CheckCircle2, AlertCircle, Globe, 
  Mail, ExternalLink, Archive, FileText, ChevronRight, X,
  User, Phone, Download, Check, AlertTriangle, Briefcase,
  Layers, ArrowUpDown, MoreHorizontal, MessageSquare, Send,
  Settings, Sparkles, Loader2
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
  OpportunitiesSettings,
  DEFAULT_OPPORTUNITIES_SETTINGS,
  OPPORTUNITY_CATEGORIES,
  WORK_ARRANGEMENTS,
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
  const isReadOnly = userRole === 'viewer';
  const canDelete = userRole === 'admin' || userRole === 'super-admin';
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'archived' | 'applications'>('active');

  // Empty state configuration
  const [emptySettings, setEmptySettings] = useState<OpportunitiesSettings>(DEFAULT_OPPORTUNITIES_SETTINGS);
  const [isEmptySettingsModalOpen, setIsEmptySettingsModalOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
        setOpportunities([]);
      }
    } catch (err) {
      console.warn('Could not fetch opportunities remotely, using empty state.', err);
      setOpportunities([]);
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
        setApplications(data.applications || []);
        return;
      }

      // Fallback direct kv_store
      const { data: kvData } = await supabase
        .from('kv_store_2a4be611')
        .select('*')
        .like('key', 'opportunity_app:%');

      if (kvData) {
        const parsed = kvData.map((item: any) => ({
          ...item.value,
          id: item.key.replace(/^opportunity_app:/, ''),
          key: item.key
        }));
        setApplications(parsed);
      }
    } catch (err) {
      console.warn('Error fetching candidate applications:', err);
    }
  };

  // Fetch Empty State & Inquiries Settings
  const fetchEmptySettings = async () => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities/settings`,
        {
          headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setEmptySettings(prev => ({ ...prev, ...data.settings }));
          return;
        }
      }

      // Fallback kv_store
      const { data: kvSetting } = await supabase
        .from('kv_store_2a4be611')
        .select('*')
        .eq('key', 'opportunities_settings')
        .maybeSingle();

      if (kvSetting && kvSetting.value) {
        setEmptySettings(prev => ({ ...prev, ...kvSetting.value }));
      }
    } catch (err) {
      console.warn('Error fetching opportunities settings:', err);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchApplications();
    fetchEmptySettings();
  }, [projectId, accessToken]);

  // Save Empty State Settings
  const handleSaveEmptySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ settings: emptySettings })
        }
      );

      if (res.ok) {
        toast.success('Empty state notice and inquiry settings saved successfully!');
        setIsEmptySettingsModalOpen(false);
      } else {
        // Fallback save to direct KV
        const { error } = await supabase
          .from('kv_store_2a4be611')
          .upsert({
            key: 'opportunities_settings',
            value: emptySettings
          });

        if (!error) {
          toast.success('Empty state notice saved successfully!');
          setIsEmptySettingsModalOpen(false);
        } else {
          toast.error('Failed to save settings: ' + error.message);
        }
      }
    } catch (err: any) {
      console.error('Error saving empty state settings:', err);
      toast.error('Network error saving settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Open create modal
  const handleOpenCreate = () => {
    setEditingOpportunity(null);
    setFormData(defaultFormState);
    setCustomCategory('');
    setIsCustomCat(false);
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
    if (isReadOnly) {
      toast.error('Permission denied: Viewers cannot create or edit opportunities.');
      return;
    }
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Please enter an opportunity title');
      return;
    }

    try {
      setIsSaving(true);
      const chosenCategory = isCustomCat && customCategory.trim() ? customCategory.trim() : (formData.category || 'Jobs');
      
      const payload: Partial<OpportunityItem> = {
        ...formData,
        category: chosenCategory,
        responsibilities: (formData.responsibilities || []).filter(r => r && r.trim() !== ''),
        requirements: (formData.requirements || []).filter(r => r && r.trim() !== ''),
        benefits: (formData.benefits || []).filter(b => b && b.trim() !== ''),
        isOngoing: Boolean(formData.isOngoing)
      };

      const endpoint = editingOpportunity 
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${editingOpportunity.id || editingOpportunity.key}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities`;
      
      const method = editingOpportunity ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingOpportunity ? 'Opportunity updated successfully' : 'Opportunity created successfully');
        setIsEditorOpen(false);
        fetchOpportunities();
        if (onUpdate) onUpdate();
      } else {
        const recordId = (editingOpportunity ? (editingOpportunity.id || editingOpportunity.key) : null) || crypto.randomUUID();
        const fullKey = recordId.startsWith('opportunity:') ? recordId : `opportunity:${recordId}`;
        const directPayload = {
          ...payload,
          id: recordId.replace(/^opportunity:/, ''),
          key: fullKey,
          updatedAt: new Date().toISOString(),
          createdAt: editingOpportunity?.createdAt || new Date().toISOString()
        };

        const { error } = await supabase
          .from('kv_store_2a4be611')
          .upsert({
            key: fullKey,
            value: directPayload
          });

        if (!error) {
          toast.success(editingOpportunity ? 'Opportunity updated' : 'Opportunity created');
          setIsEditorOpen(false);
          fetchOpportunities();
          if (onUpdate) onUpdate();
        } else {
          toast.error('Failed to save opportunity: ' + error.message);
        }
      }
    } catch (err: any) {
      console.error('Error saving opportunity:', err);
      toast.error('Network error saving opportunity');
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Status Toggle
  const handleToggleStatus = async (opp: OpportunityItem, newStatus: OpportunityStatus) => {
    try {
      const oppKey = opp.key || `opportunity:${opp.id}`;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${opp.id || opp.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus}`);
        setOpportunities(prev => prev.map(item => (item.id === opp.id ? { ...item, status: newStatus } : item)));
        if (onUpdate) onUpdate();
      } else {
        await supabase
          .from('kv_store_2a4be611')
          .upsert({
            key: oppKey,
            value: { ...opp, status: newStatus, updatedAt: new Date().toISOString() }
          });
        toast.success(`Status updated to ${newStatus}`);
        setOpportunities(prev => prev.map(item => (item.id === opp.id ? { ...item, status: newStatus } : item)));
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete Opportunity
  const handleConfirmDeleteOpportunity = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${itemToDelete.id || itemToDelete.key}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }
        }
      );

      if (res.ok) {
        toast.success('Opportunity deleted');
        setOpportunities(prev => prev.filter(i => i.id !== itemToDelete.id));
        setItemToDelete(null);
        if (onUpdate) onUpdate();
      } else {
        const oppKey = itemToDelete.key || `opportunity:${itemToDelete.id}`;
        await supabase.from('kv_store_2a4be611').delete().eq('key', oppKey);
        toast.success('Opportunity deleted');
        setOpportunities(prev => prev.filter(i => i.id !== itemToDelete.id));
        setItemToDelete(null);
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error('Failed to delete opportunity');
    } finally {
      setIsDeleting(false);
    }
  };

  // Update Application Status
  const handleUpdateApplicationStatus = async (appId: string, newStatus: CandidateApplication['status'], notes?: string) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunity-applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify({ status: newStatus, notes })
      });

      if (res.ok) {
        toast.success(`Applicant status updated to ${newStatus.replace('_', ' ')}`);
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus, notes: notes !== undefined ? notes : a.notes } : a));
      } else {
        const appKey = appId.startsWith('opportunity_app:') ? appId : `opportunity_app:${appId}`;
        const app = applications.find(a => a.id === appId);
        if (app) {
          await supabase.from('kv_store_2a4be611').upsert({
            key: appKey,
            value: { ...app, status: newStatus, notes: notes !== undefined ? notes : app.notes, updatedAt: new Date().toISOString() }
          });
          toast.success('Status updated');
          setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus, notes: notes !== undefined ? notes : a.notes } : a));
        }
      }
    } catch (err) {
      toast.error('Failed to update applicant status');
    }
  };

  // Delete Application
  const handleConfirmDeleteApp = async () => {
    if (!appToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunity-applications/${appToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }
      });

      if (res.ok) {
        toast.success('Application deleted');
        setApplications(prev => prev.filter(a => a.id !== appToDelete.id));
        setAppToDelete(null);
      } else {
        const appKey = appToDelete.key || `opportunity_app:${appToDelete.id}`;
        await supabase.from('kv_store_2a4be611').delete().eq('key', appKey);
        toast.success('Application deleted');
        setApplications(prev => prev.filter(a => a.id !== appToDelete.id));
        setAppToDelete(null);
      }
    } catch (err) {
      toast.error('Failed to delete application');
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed Opportunities with real-time expiration logic
  const computedOpportunities = useMemo(() => {
    return opportunities.map(opp => ({
      ...opp,
      computedStatus: computeOpportunityStatus(opp)
    }));
  }, [opportunities]);

  // Active vs Archived split
  const activeOpportunities = useMemo(() => {
    return computedOpportunities.filter(o => o.computedStatus !== 'Closed' && o.computedStatus !== 'Archived');
  }, [computedOpportunities]);

  const archivedOpportunities = useMemo(() => {
    return computedOpportunities.filter(o => o.computedStatus === 'Closed' || o.computedStatus === 'Archived');
  }, [computedOpportunities]);

  // Filtered displayed list
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
                Manage jobs, internships, consultancies, fellowships, and review incoming candidate applications.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { fetchOpportunities(); fetchApplications(); fetchEmptySettings(); }}
              className="p-3 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              title="Refresh Opportunities & Settings"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <Button
              onClick={() => setIsEmptySettingsModalOpen(true)}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold px-4 py-3 rounded-xl shadow-sm flex items-center gap-2"
              title="Configure what visitors see when there are no active opportunities"
            >
              <Settings size={18} className="text-purple-600" />
              <span>Empty State Notice</span>
            </Button>
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
            <span>Closed & Archived</span>
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
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              applications.filter(a => a.status === 'pending').length > 0
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-white/20'
            }`}>
              {applications.length}
            </span>
          </button>
        </div>
      </div>

      {/* Notice Banner when 0 Active Opportunities exist */}
      {activeSubTab === 'active' && activeOpportunities.length === 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 flex-shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle size={22} />
            </div>
            <div>
              <h4 className="text-base font-bold text-amber-950">Currently, there are no active opportunities published</h4>
              <p className="text-xs text-amber-800/90 mt-0.5 max-w-2xl leading-relaxed">
                Visitors on the public Opportunities page currently see the customized empty state notice: <span className="font-semibold italic">"{emptySettings.emptyTitle}"</span>. You can edit this notice, update contact details, or publish a new opportunity at any time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsEmptySettingsModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Settings size={14} />
              Edit Empty State Notice
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus size={14} />
              Add Opportunity
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeSubTab === 'applications' ? (
        /* ================= APPLICATIONS MANAGEMENT ================= */
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name, email, or position..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Resume / CV</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{app.fullName}</div>
                      <div className="text-xs text-slate-400 font-normal">{app.email}</div>
                      {app.phone && <div className="text-xs text-slate-400 font-normal">{app.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {app.opportunityTitle}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(app.appliedAt || app.createdAt || '').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value as any)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border focus:outline-none ${
                          app.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          app.status === 'under_review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          app.status === 'shortlisted' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          app.status === 'offered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold"
                        >
                          <Download size={13} />
                          View CV
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">None attached</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingApplication(app)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                          title="View Full Application"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setAppToDelete(app)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Application"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No candidate applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= OPPORTUNITIES LIST ================= */
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search position, location, or summary..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {availableCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Closing Soon">Closing Soon</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Closed">Closed</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>

              {/* Arrangement Filter */}
              <select
                value={workArrangementFilter}
                onChange={(e) => setWorkArrangementFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Arrangements</option>
                {WORK_ARRANGEMENTS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Arrangement & Location</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Live Status</th>
                  <th className="py-3 px-4">Applications</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedOpportunities.map((opp) => {
                  const appsForOpp = applications.filter(a => a.opportunityId === opp.id || a.opportunityTitle === opp.title);
                  return (
                    <tr key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                        <div className="truncate">{opp.title}</div>
                        <div className="text-xs text-slate-400 font-normal truncate max-w-sm">{opp.shortDescription}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClasses(opp.category)}`}>
                          {opp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>{opp.workArrangement}</div>
                        <div className="text-slate-400">{opp.location}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {opp.isOngoing ? (
                          <span className="text-blue-600 font-semibold">Ongoing</span>
                        ) : opp.deadline ? (
                          new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        ) : (
                          'None set'
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClasses(opp.computedStatus)}`}>
                          {opp.computedStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${appsForOpp.length > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                          {appsForOpp.length} applicant{appsForOpp.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT EMPTY STATE & INQUIRY NOTICE MODAL */}
      {/* ========================================================================= */}
      {isEmptySettingsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-800 text-white relative">
              <button
                onClick={() => setIsEmptySettingsModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-2">
                <Settings size={13} />
                Portal Customization
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
                Empty State & Inquiries Notice
              </h3>
              <p className="text-xs text-purple-100/80 mt-1">
                Configure the message, buttons, and contact notice shown to visitors when there are no active opportunities.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEmptySettings} className="p-6 sm:p-8 overflow-y-auto space-y-6 max-h-[75vh]">
              {/* Section 1: Empty state card */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 border-b border-purple-100 pb-2 flex items-center gap-2">
                  <Briefcase size={14} />
                  Main Empty State Card
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empty State Title
                  </label>
                  <input
                    type="text"
                    required
                    value={emptySettings.emptyTitle}
                    onChange={(e) => setEmptySettings({ ...emptySettings, emptyTitle: e.target.value })}
                    placeholder="e.g. No current opportunities"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empty State Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={emptySettings.emptyMessage}
                    onChange={(e) => setEmptySettings({ ...emptySettings, emptyMessage: e.target.value })}
                    placeholder="Message informing visitors about upcoming opportunities or how to stay in touch..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      required
                      value={emptySettings.emptyButtonText}
                      onChange={(e) => setEmptySettings({ ...emptySettings, emptyButtonText: e.target.value })}
                      placeholder="e.g. Contact RESTI"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Button Link / Destination
                    </label>
                    <input
                      type="text"
                      required
                      value={emptySettings.emptyButtonLink}
                      onChange={(e) => setEmptySettings({ ...emptySettings, emptyButtonLink: e.target.value })}
                      placeholder="e.g. /contact"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: General Inquiry Callout Banner */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-2">
                    <Mail size={14} />
                    Inquiries & Proposals Callout Banner
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={emptySettings.showInquiriesBox}
                      onChange={(e) => setEmptySettings({ ...emptySettings, showInquiriesBox: e.target.checked })}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Display Banner</span>
                  </label>
                </div>

                {emptySettings.showInquiriesBox && (
                  <div className="space-y-3 pl-2 border-l-2 border-purple-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Banner Heading
                      </label>
                      <input
                        type="text"
                        value={emptySettings.inquiriesTitle}
                        onChange={(e) => setEmptySettings({ ...emptySettings, inquiriesTitle: e.target.value })}
                        placeholder="e.g. Don't see a role that matches your skills?"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Banner Description
                      </label>
                      <textarea
                        rows={3}
                        value={emptySettings.inquiriesDescription}
                        onChange={(e) => setEmptySettings({ ...emptySettings, inquiriesDescription: e.target.value })}
                        placeholder="Invitation for general collaboration, proposals, or inquiries..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Inquiry Email
                        </label>
                        <input
                          type="email"
                          value={emptySettings.inquiriesEmail}
                          onChange={(e) => setEmptySettings({ ...emptySettings, inquiriesEmail: e.target.value })}
                          placeholder="careers@resticbo.org"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email Subject
                        </label>
                        <input
                          type="text"
                          value={emptySettings.inquiriesSubject}
                          onChange={(e) => setEmptySettings({ ...emptySettings, inquiriesSubject: e.target.value })}
                          placeholder="General Inquiry / Partnership Proposal"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Box */}
              <div className="pt-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
                  Live Preview on Public Site:
                </span>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                    <Briefcase size={18} />
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">{emptySettings.emptyTitle || 'No current opportunities'}</h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {emptySettings.emptyMessage || 'We do not currently have any open opportunities.'}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs">
                      {emptySettings.emptyButtonText || 'Contact RESTI'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmptySettingsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Save Empty State Notice
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPPORTUNITY CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-800 text-white relative">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
                {editingOpportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
              </h3>
              <p className="text-xs text-purple-100/80 mt-1">
                Fill out the role information, responsibilities, and application method.
              </p>

              {/* Editor Tabs */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-500/30">
                <button
                  type="button"
                  onClick={() => setEditorTab('basic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    editorTab === 'basic' ? 'bg-white text-purple-800' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  1. Basic Information
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('content')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    editorTab === 'content' ? 'bg-white text-purple-800' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  2. Responsibilities & Requirements
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('application')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    editorTab === 'application' ? 'bg-white text-purple-800' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  3. Application Settings
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="p-6 sm:p-8 overflow-y-auto space-y-4 max-h-[75vh]">
              {editorTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Position Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Lead Agricultural Officer"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <div className="space-y-2">
                        <select
                          value={isCustomCat ? '__custom__' : (formData.category || 'Jobs')}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setIsCustomCat(true);
                            } else {
                              setIsCustomCat(false);
                              setFormData({ ...formData, category: e.target.value });
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          {OPPORTUNITY_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="__custom__">+ Create New Category...</option>
                        </select>

                        {isCustomCat && (
                          <input
                            type="text"
                            required
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="Enter custom category name"
                            className="w-full px-3.5 py-2 rounded-xl border border-purple-300 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        )}
                      </div>
                    </div>

                    {/* Work Arrangement */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Work Arrangement
                      </label>
                      <select
                        value={formData.workArrangement || 'Field-Based'}
                        onChange={(e) => setFormData({ ...formData, workArrangement: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        {WORK_ARRANGEMENTS.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Location */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Location / Base
                      </label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Kiryandongo District"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Duration / Contract Period
                      </label>
                      <input
                        type="text"
                        value={formData.duration || ''}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g. 6 Months / 1 Year / Ongoing"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Short Summary / Excerpt (Displayed on Cards)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.shortDescription || ''}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="Brief 2-3 sentence overview..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Full Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Role Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Comprehensive overview of the role and team background..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Status & Ongoing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status || 'Open'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="Open">Open</option>
                        <option value="Closing Soon">Closing Soon</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Closed">Closed</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Deadline
                      </label>
                      <input
                        type="date"
                        disabled={formData.isOngoing}
                        value={formData.deadline || ''}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100"
                      />
                      <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.isOngoing)}
                          onChange={(e) => setFormData({ ...formData, isOngoing: e.target.checked })}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs text-slate-600">Mark as Ongoing (No deadline)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {editorTab === 'content' && (
                <div className="space-y-6">
                  {/* Responsibilities */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Key Responsibilities
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddBullet('responsibilities')}
                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                      >
                        <Plus size={13} /> Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.responsibilities || []).map((resp, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={resp}
                            onChange={(e) => handleUpdateBullet('responsibilities', i, e.target.value)}
                            placeholder={`Responsibility #${i + 1}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet('responsibilities', i)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Requirements & Qualifications
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddBullet('requirements')}
                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                      >
                        <Plus size={13} /> Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.requirements || []).map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => handleUpdateBullet('requirements', i, e.target.value)}
                            placeholder={`Requirement #${i + 1}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet('requirements', i)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        What We Offer / Benefits
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddBullet('benefits')}
                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                      >
                        <Plus size={13} /> Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.benefits || []).map((ben, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ben}
                            onChange={(e) => handleUpdateBullet('benefits', i, e.target.value)}
                            placeholder={`Benefit #${i + 1}`}
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet('benefits', i)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Application Method
                    </label>
                    <select
                      value={formData.applicationMethod || 'internal'}
                      onChange={(e) => setFormData({ ...formData, applicationMethod: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="internal">Internal Application Form (Collect CV & Cover Letter)</option>
                      <option value="email">Verified Email Submission (mailto: link)</option>
                      <option value="external">External Application Portal / URL</option>
                    </select>
                  </div>

                  {formData.applicationMethod === 'email' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Application Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.applicationEmail || ''}
                        onChange={(e) => setFormData({ ...formData, applicationEmail: e.target.value })}
                        placeholder="careers@resticbo.org"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {formData.applicationMethod === 'external' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        External Application URL
                      </label>
                      <input
                        type="url"
                        value={formData.applicationUrl || ''}
                        onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                        placeholder="https://partnerportal.org/apply/role-123"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Special Application Instructions (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.applicationInstructions || ''}
                      onChange={(e) => setFormData({ ...formData, applicationInstructions: e.target.value })}
                      placeholder="e.g. Please note that refugee community members and women are strongly encouraged to apply..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        {editingOpportunity ? 'Update Opportunity' : 'Publish Opportunity'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPPORTUNITY PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-100">
            <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-800 text-white relative">
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  {previewItem.category}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-900/50 text-purple-200">
                  {previewItem.workArrangement}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-heading">{previewItem.title}</h3>
              <p className="text-xs text-purple-100/90 mt-1">
                {previewItem.location} • {previewItem.duration || 'Ongoing'}
              </p>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 max-h-[70vh] text-sm text-slate-700">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">Description</h4>
                <p className="whitespace-pre-line text-slate-700">{previewItem.description || previewItem.shortDescription}</p>
              </div>

              {previewItem.responsibilities && previewItem.responsibilities.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Key Responsibilities</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {previewItem.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {previewItem.requirements && previewItem.requirements.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Qualifications & Requirements</h4>
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
                  <span className="font-semibold text-slate-600">Application Method: </span>
                  <span className="capitalize">{previewItem.applicationMethod}</span>
                </div>
                {previewItem.applicationInstructions && (
                  <div>
                    <span className="font-semibold text-slate-600">Instructions: </span>
                    <span>{previewItem.applicationInstructions}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANDIDATE APPLICATION VIEW MODAL */}
      {/* ========================================================================= */}
      {viewingApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-100">
            <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-800 text-white relative">
              <button
                onClick={() => setViewingApplication(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  Candidate Application
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-heading">{viewingApplication.fullName}</h3>
              <p className="text-xs text-purple-100/90 mt-1">
                Applied for: <span className="font-semibold">{viewingApplication.opportunityTitle}</span>
              </p>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 max-h-[70vh] text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div>
                  <span className="font-semibold text-slate-500 block">Email Address</span>
                  <span className="text-slate-900 font-medium">{viewingApplication.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Phone</span>
                  <span className="text-slate-900 font-medium">{viewingApplication.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Applied Date</span>
                  <span className="text-slate-900 font-medium">
                    {new Date(viewingApplication.appliedAt || viewingApplication.createdAt || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">Cover Letter / Statement</h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-slate-800 whitespace-pre-line leading-relaxed">
                  {viewingApplication.coverLetter || 'No cover letter submitted.'}
                </div>
              </div>

              {viewingApplication.resumeUrl && (
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">Attached Resume / Document</h4>
                  <a
                    href={viewingApplication.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-semibold transition-colors"
                  >
                    <Download size={14} />
                    Download / View Document ({viewingApplication.resumeName || 'Resume'})
                  </a>
                </div>
              )}

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">Reviewer Internal Notes</h4>
                <textarea
                  rows={2}
                  value={viewingApplication.notes || ''}
                  onChange={(e) => {
                    const updated = { ...viewingApplication, notes: e.target.value };
                    setViewingApplication(updated);
                  }}
                  onBlur={() => {
                    handleUpdateApplicationStatus(viewingApplication.id, viewingApplication.status, viewingApplication.notes);
                  }}
                  placeholder="Add private evaluation notes for RESTI HR..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500 text-xs"
                />
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">Update Application Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'under_review', 'shortlisted', 'offered', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        handleUpdateApplicationStatus(viewingApplication.id, st, viewingApplication.notes);
                        setViewingApplication({ ...viewingApplication, status: st });
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                        viewingApplication.status === st
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setViewingApplication(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETION CONFIRMATION MODALS */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Delete Opportunity?</h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-slate-900">"{itemToDelete.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDeleteOpportunity}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {appToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Delete Candidate Application?</h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to delete the application submitted by <span className="font-semibold text-slate-900">"{appToDelete.fullName}"</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setAppToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDeleteApp}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
