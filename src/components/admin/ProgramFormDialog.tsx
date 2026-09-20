import React, { useState, useEffect } from 'react';
import { DraggableDialog } from '../DraggableDialog';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
import { 
  Plus, Trash2, Upload, X, MapPin, Clock, Users, 
  Sparkles, FileText, Target, ListChecks, Activity,
  Image as ImageIcon, Calendar
} from 'lucide-react';
import { unmarkDeletedProgramId } from '../../utils/programDeletedRegistry';

export interface ProgramMetricItem {
  label: string;
  value: string;
  subtext?: string;
  reportingPeriod?: string;
}

export interface ProgramActivityItem {
  title: string;
  desc: string;
  icon?: string;
}

export interface ProgramGalleryItem {
  url: string;
  caption: string;
  date?: string;
  location?: string;
}

export interface ProgramFormData {
  title: string;
  category: string;
  status: 'Active' | 'Upcoming' | 'Completed' | 'Paused';
  active: boolean;
  description: string;
  content: string;
  image: string;
  location: string;
  timeline: string;
  beneficiaries: string;
  verifiedBeneficiaries?: string;
  whoWeSupport?: string;
  whereWeWork?: string;
  leadCoordinator?: string;
  objectives: string[];
  keyActivities: ProgramActivityItem[];
  impactMetrics: ProgramMetricItem[];
  impactStatement?: string;
  gallery: ProgramGalleryItem[];
}

interface ProgramFormDialogProps {
  show: boolean;
  onClose: () => void;
  editingItem: any | null;
  onSuccess: () => void;
  userRole: string;
  accessToken?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'Education', label: 'Education & Literacy' },
  { value: 'Healthcare', label: 'Community Health & Nutrition' },
  { value: 'Livelihoods', label: 'Sustainable Livelihoods & Agriculture' },
  { value: 'WASH', label: 'Water, Sanitation (WASH) & Infrastructure' },
  { value: 'Protection', label: 'Women Empowerment & Child Protection' },
  { value: 'Youth', label: 'Youth Leadership, Arts & Sports' },
  { value: 'Community Development', label: 'Community Development & Social Cohesion' },
  { value: 'General', label: 'General Community Initiative' },
];

const STATUS_OPTIONS: Array<'Active' | 'Upcoming' | 'Completed' | 'Paused'> = [
  'Active',
  'Upcoming',
  'Completed',
  'Paused'
];

export function ProgramFormDialog({
  show,
  onClose,
  editingItem,
  onSuccess,
  userRole,
  accessToken
}: ProgramFormDialogProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'basic' | 'content' | 'metadata' | 'activities' | 'goals' | 'metrics' | 'gallery'
  >('basic');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProgramFormData>({
    title: '',
    category: 'Education',
    status: 'Active',
    active: true,
    description: '',
    content: '',
    image: '',
    location: 'Kiryandongo District, Uganda',
    timeline: 'Ongoing (2024–2026)',
    beneficiaries: 'Refugee and host community members',
    verifiedBeneficiaries: '',
    whoWeSupport: '',
    whereWeWork: '',
    leadCoordinator: '',
    objectives: [],
    keyActivities: [],
    impactMetrics: [],
    impactStatement: '',
    gallery: []
  });

  // Dynamic inputs
  const [newObjective, setNewObjective] = useState('');
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  
  const [newMetricLabel, setNewMetricLabel] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [newMetricPeriod, setNewMetricPeriod] = useState('');
  const [newMetricSubtext, setNewMetricSubtext] = useState('');

  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newGalleryDate, setNewGalleryDate] = useState('');
  const [newGalleryLocation, setNewGalleryLocation] = useState('');

  // Hydrate form on edit or reset
  useEffect(() => {
    if (editingItem) {
      const val = editingItem.value || editingItem;
      
      let statusVal: 'Active' | 'Upcoming' | 'Completed' | 'Paused' = 'Active';
      if (val.status && STATUS_OPTIONS.includes(val.status)) {
        statusVal = val.status;
      } else if (val.active === false) {
        statusVal = 'Paused';
      }

      setFormData({
        title: val.title || '',
        category: val.category || 'Education',
        status: statusVal,
        active: val.active !== false,
        description: val.description || '',
        content: val.content || val.about || '',
        image: val.image || '',
        location: val.location || 'Kiryandongo District, Uganda',
        timeline: val.timeline || 'Ongoing (2024–2026)',
        beneficiaries: val.beneficiaries || 'Refugee and host community members',
        verifiedBeneficiaries: val.verifiedBeneficiaries || '',
        whoWeSupport: val.whoWeSupport || '',
        whereWeWork: val.whereWeWork || '',
        leadCoordinator: val.leadCoordinator || '',
        objectives: Array.isArray(val.objectives) 
          ? [...val.objectives] 
          : (typeof val.objectives === 'string' ? val.objectives.split('\n').map((s: string) => s.trim()).filter(Boolean) : []),
        keyActivities: Array.isArray(val.keyActivities) 
          ? val.keyActivities.map((a: any) => ({
              title: typeof a === 'object' ? (a.title || '') : String(a),
              desc: typeof a === 'object' ? (a.desc || a.description || '') : ''
            })) 
          : [],
        impactMetrics: Array.isArray(val.impactMetrics) 
          ? val.impactMetrics.map((m: any) => ({
              label: m.label || '',
              value: m.value || '',
              subtext: m.subtext || '',
              reportingPeriod: m.reportingPeriod || m.period || ''
            })) 
          : [],
        impactStatement: val.impactStatement || '',
        gallery: Array.isArray(val.gallery) 
          ? val.gallery.map((g: any) => ({
              url: g.url || g.image || '',
              caption: g.caption || '',
              date: g.date || '',
              location: g.location || ''
            })) 
          : []
      });
    } else {
      setFormData({
        title: '',
        category: 'Education',
        status: 'Active',
        active: true,
        description: '',
        content: '',
        image: '',
        location: 'Kiryandongo Refugee Settlement & Host Communities, Uganda',
        timeline: 'Ongoing (2024–2026)',
        beneficiaries: 'Refugee and host community members',
        verifiedBeneficiaries: '',
        whoWeSupport: 'Refugee youth, women-led households, and host community residents across Kiryandongo.',
        whereWeWork: 'Kiryandongo Refugee Settlement clusters and neighboring host communities.',
        leadCoordinator: '',
        objectives: [
          'Improve grassroots access to essential community services and opportunities.',
          'Strengthen community resilience through participatory skills and local leadership.'
        ],
        keyActivities: [
          { title: 'Community Outreach & Enrollment', desc: 'Engaging households and identifying priority community participants.' }
        ],
        impactMetrics: [],
        impactStatement: 'This program is actively serving communities in Kiryandongo. Verified impact reports will be published following the next project evaluation.',
        gallery: []
      });
    }
    setActiveSubTab('basic');
  }, [editingItem, show]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
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
      if (!response.ok) throw new Error(data.error || 'Failed to upload image');
      setFormData(prev => ({ ...prev, image: data.url }));
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    try {
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
      if (!response.ok) throw new Error(data.error || 'Failed to upload image');
      setNewGalleryUrl(data.url);
      toast.success('Gallery photo uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingGallery(false);
    }
  };

  // Objectives handlers
  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    setFormData(prev => ({ ...prev, objectives: [...prev.objectives, newObjective.trim()] }));
    setNewObjective('');
  };

  const handleRemoveObjective = (index: number) => {
    setFormData(prev => ({ ...prev, objectives: prev.objectives.filter((_, i) => i !== index) }));
  };

  // Key Activities handlers
  const handleAddActivity = () => {
    if (!newActivityTitle.trim()) {
      toast.error('Please enter an activity title');
      return;
    }
    setFormData(prev => ({
      ...prev,
      keyActivities: [...prev.keyActivities, { title: newActivityTitle.trim(), desc: newActivityDesc.trim() }]
    }));
    setNewActivityTitle('');
    setNewActivityDesc('');
  };

  const handleRemoveActivity = (index: number) => {
    setFormData(prev => ({ ...prev, keyActivities: prev.keyActivities.filter((_, i) => i !== index) }));
  };

  // Impact Metrics handlers
  const handleAddMetric = () => {
    if (!newMetricValue.trim() || !newMetricLabel.trim()) {
      toast.error('Please enter both Metric Value (e.g. 1,200+) and Label');
      return;
    }
    setFormData(prev => ({
      ...prev,
      impactMetrics: [...prev.impactMetrics, { 
        value: newMetricValue.trim(), 
        label: newMetricLabel.trim(), 
        reportingPeriod: newMetricPeriod.trim() || undefined,
        subtext: newMetricSubtext.trim() || undefined 
      }]
    }));
    setNewMetricValue('');
    setNewMetricLabel('');
    setNewMetricPeriod('');
    setNewMetricSubtext('');
  };

  const handleRemoveMetric = (index: number) => {
    setFormData(prev => ({ ...prev, impactMetrics: prev.impactMetrics.filter((_, i) => i !== index) }));
  };

  // Gallery handlers
  const handleAddGalleryItem = () => {
    if (!newGalleryUrl.trim()) {
      toast.error('Please provide an image URL or upload a photo');
      return;
    }
    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, {
        url: newGalleryUrl.trim(),
        caption: newGalleryCaption.trim() || 'Program activity in Kiryandongo',
        date: newGalleryDate.trim() || undefined,
        location: newGalleryLocation.trim() || undefined
      }]
    }));
    setNewGalleryUrl('');
    setNewGalleryCaption('');
    setNewGalleryDate('');
    setNewGalleryLocation('');
  };

  const handleRemoveGalleryItem = (index: number) => {
    setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission to modify programs');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Program title is required');
      return;
    }

    setLoading(true);
    try {
      const rawProgramId = editingItem ? (editingItem.key || editingItem.id || editingItem.value?.id || '') : '';
      const cleanId = rawProgramId ? rawProgramId.replace(/^program:/, '') : crypto.randomUUID();
      const fullKey = `program:${cleanId}`;
      const nowIso = new Date().toISOString();

      let apiSaved = false;
      const url = rawProgramId
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${encodeURIComponent(rawProgramId)}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`;

      try {
        const response = await fetch(url, {
          method: rawProgramId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({
            ...formData,
            updatedAt: nowIso
          }),
        });

        if (response.ok) {
          apiSaved = true;
        }
      } catch (fetchErr) {
        console.warn('API program save notice, proceeding with Supabase direct sync:', fetchErr);
      }

      // 1. Direct Supabase write to kv_store_2a4be611 (stores all extended rich fields without SQL column limitations)
      let kvSaved = false;
      try {
        const { error: kvError } = await supabase.from('kv_store_2a4be611').upsert({
          key: fullKey,
          value: {
            id: cleanId,
            ...formData,
            updatedAt: nowIso,
            createdAt: editingItem?.value?.createdAt || editingItem?.createdAt || nowIso
          }
        });
        if (!kvError) kvSaved = true;
      } catch (sbKvErr) {
        console.warn('kv_store direct write notice:', sbKvErr);
      }

      // 2. Also sync base fields to SQL programs table if available
      try {
        await supabase.from('programs').upsert({
          id: cleanId,
          title: formData.title,
          description: formData.description,
          content: formData.content || null,
          image: formData.image || null,
          category: formData.category || 'general',
          active: formData.active && formData.status !== 'Paused',
          updated_at: nowIso
        });
      } catch (sqlErr) {
        // Table schema differences are safely absorbed
      }

      if (!apiSaved && !kvSaved) {
        throw new Error('Could not persist program changes. Please check your connection.');
      }

      // Ensure program is unflagged in deletion registry
      try {
        await unmarkDeletedProgramId(cleanId);
      } catch {}

      toast.success(editingItem ? 'Program updated successfully!' : 'New program created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Program save error:', err);
      toast.error(err.message || 'Error saving program');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <DraggableDialog
      open={show}
      onClose={onClose}
      title={editingItem ? `Edit Program: ${formData.title || 'Untitled'}` : 'Create New Program with Full Details'}
      headerColor="#059669"
    >
      <div className="flex flex-col max-h-[82vh]">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 pb-3 mb-3 border-b border-slate-100 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('basic')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'basic'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText size={13} />
            <span>1. Header & Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('content')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'content'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles size={13} />
            <span>2. About Program</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('metadata')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'metadata'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin size={13} />
            <span>3. At a Glance & Area</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('activities')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'activities'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ListChecks size={13} />
            <span>4. What We Do ({formData.keyActivities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('goals')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'goals'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Target size={13} />
            <span>5. Our Goals ({formData.objectives.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('metrics')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'metrics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Activity size={13} />
            <span>6. Impact ({formData.impactMetrics.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('gallery')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'gallery'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ImageIcon size={13} />
            <span>7. Gallery ({formData.gallery.length})</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* TAB 1: BASIC INFO & MEDIA */}
          {activeSubTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                <strong>Program Header:</strong> Configure the title, sector category, current lifecycle status, 2–3 sentence overview, and cover photo.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Program Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-900"
                  placeholder="e.g. Education & Literacy Initiative"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category Sector
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-slate-800"
                  >
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Program Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-800"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Short Description (2–3 Sentences) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800 leading-relaxed"
                  placeholder="A clear, plain-language 2-3 sentence overview displayed prominently in the program header and listing cards..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Featured Cover Image
                </label>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                      placeholder="Image URL or upload a file below..."
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs">
                      <Upload size={14} className="text-emerald-600" />
                      <span>{uploadingImage ? 'Uploading Image...' : 'Upload Image File'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                    </label>
                  </div>
                  {formData.image && (
                    <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT THIS PROGRAM */}
          {activeSubTab === 'content' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                <strong>About This Program:</strong> Write 1–3 short paragraphs in plain, accessible language explaining: what the program does, why it is needed, who it supports, and what RESTI is trying to achieve. Avoid jargon or long blocks of text.
              </div>

              <div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  placeholder="Explain clearly in 1-3 short paragraphs what this initiative achieves in Kiryandongo District..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800 leading-relaxed font-normal"
                />
              </div>
            </div>
          )}

          {/* TAB 3: AT A GLANCE & LOCATION CONTEXT */}
          {activeSubTab === 'metadata' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                <strong>At a Glance Facts:</strong> Essential information displayed in the quick facts card and location sections.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-emerald-600" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800"
                    placeholder="e.g. Kiryandongo Refugee Settlement & Host Community Schools"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock size={13} className="text-emerald-600" />
                    Program Period
                  </label>
                  <input
                    type="text"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800"
                    placeholder="e.g. Ongoing / 2024–2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Users size={13} className="text-emerald-600" />
                    Target Group (At a Glance)
                  </label>
                  <input
                    type="text"
                    value={formData.beneficiaries}
                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800"
                    placeholder="e.g. Refugee youth, women, host communities"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Beneficiaries Reached (Verified Only)
                  </label>
                  <input
                    type="text"
                    value={formData.verifiedBeneficiaries || ''}
                    onChange={(e) => setFormData({ ...formData, verifiedBeneficiaries: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800"
                    placeholder="e.g. 3,450+ (leave blank if unverified)"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Leave empty if verified numbers are not yet available.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Who We Support (Section Details)
                </label>
                <textarea
                  value={formData.whoWeSupport || ''}
                  onChange={(e) => setFormData({ ...formData, whoWeSupport: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800"
                  placeholder="Explain clearly who benefits from the program and the community context in Kiryandongo..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Where We Work (Section Details)
                </label>
                <textarea
                  value={formData.whereWeWork || ''}
                  onChange={(e) => setFormData({ ...formData, whereWeWork: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800"
                  placeholder="Specify district, settlement clusters or host community areas, and why the program operates there..."
                />
              </div>
            </div>
          )}

          {/* TAB 4: WHAT WE DO */}
          {activeSubTab === 'activities' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                <strong>What We Do (3–6 Key Activities):</strong> Break the program down into 3–6 practical activities. Each activity should have a simple title and 1–2 sentence description.
              </div>

              {/* Add Activity Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <input
                  type="text"
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  placeholder="Activity Title (e.g. Scholastic Kit Distribution)..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <textarea
                  value={newActivityDesc}
                  onChange={(e) => setNewActivityDesc(e.target.value)}
                  rows={2}
                  placeholder="1-2 sentence description explaining this activity..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex justify-end">
                  <Button type="button" onClick={handleAddActivity} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-4">
                    <Plus size={14} className="mr-1" /> Add Activity
                  </Button>
                </div>
              </div>

              {/* Activities List */}
              <div className="space-y-3">
                {formData.keyActivities.map((act, idx) => (
                  <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl relative group shadow-2xs hover:border-emerald-200 transition-colors">
                    <div className="flex items-start justify-between pr-6 mb-1">
                      <h5 className="font-bold text-sm text-slate-900 leading-snug flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        {act.title}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600 pl-4 leading-relaxed">{act.desc}</p>
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove activity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {formData.keyActivities.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">No activities added yet. Aim for 3–6 key activities.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: OUR GOALS */}
          {activeSubTab === 'goals' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                <strong>Our Goals (3–5 Clear Goals):</strong> Major goals for the program that replace long strategic jargon with straightforward objectives.
              </div>

              {/* Add Goal Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddObjective(); } }}
                  placeholder="Type a goal (e.g. Improve school completion and retention rates among vulnerable children)..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button type="button" onClick={handleAddObjective} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-4">
                  <Plus size={14} className="mr-1" /> Add Goal
                </Button>
              </div>

              {/* Goals List */}
              <div className="space-y-2">
                {formData.objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl group hover:bg-slate-100 transition-colors">
                    <div className="flex items-start gap-2.5 text-sm text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{obj}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {formData.objectives.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">No goals added yet. Add 3–5 clear goals.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: OUR IMPACT */}
          {activeSubTab === 'metrics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                <strong>Our Impact (Verified Data Only):</strong> Display only verified statistics with a reporting period. If verified figures are pending, provide a qualitative impact statement.
              </div>

              {/* Add Metric Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Metric Value</label>
                  <input
                    type="text"
                    value={newMetricValue}
                    onChange={(e) => setNewMetricValue(e.target.value)}
                    placeholder="e.g. 1,200+ or 4"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Short Label</label>
                  <input
                    type="text"
                    value={newMetricLabel}
                    onChange={(e) => setNewMetricLabel(e.target.value)}
                    placeholder="e.g. Individuals reached"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Reporting Period</label>
                  <input
                    type="text"
                    value={newMetricPeriod}
                    onChange={(e) => setNewMetricPeriod(e.target.value)}
                    placeholder="e.g. 2024–2025"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end pt-1">
                  <Button type="button" onClick={handleAddMetric} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-4">
                    <Plus size={14} className="mr-1" /> Add Verified Metric
                  </Button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.impactMetrics.map((met, idx) => (
                  <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl relative group shadow-2xs hover:border-emerald-200 transition-colors">
                    <p className="text-xl font-black text-emerald-700 font-heading leading-tight">{met.value}</p>
                    <p className="text-xs font-bold text-slate-900 mt-1">{met.label}</p>
                    {met.reportingPeriod && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar size={10} className="text-emerald-600" />
                        {met.reportingPeriod}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMetric(idx)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove metric"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Qualitative Impact Statement */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Qualitative Impact Statement (Fallback when verified numbers are not available)
                </label>
                <textarea
                  value={formData.impactStatement || ''}
                  onChange={(e) => setFormData({ ...formData, impactStatement: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-slate-800"
                  placeholder="This program is actively serving communities in Kiryandongo. Verified impact reports will be published following the next project evaluation."
                />
              </div>
            </div>
          )}

          {/* TAB 7: GALLERY */}
          {activeSubTab === 'gallery' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                <strong>Program Gallery:</strong> Add real photos of activities conducted under this program in Kiryandongo with captions and dates.
              </div>

              {/* Add Gallery Item Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Image URL or upload below..."
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer">
                    <Upload size={13} className="text-emerald-600" />
                    <span>{uploadingGallery ? 'Uploading...' : 'Upload Photo'}</span>
                    <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" disabled={uploadingGallery} />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newGalleryCaption}
                    onChange={(e) => setNewGalleryCaption(e.target.value)}
                    placeholder="Photo Caption (e.g. Reading clinic)..."
                    className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={newGalleryDate}
                    onChange={(e) => setNewGalleryDate(e.target.value)}
                    placeholder="Date / Year (e.g. 2025)..."
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={handleAddGalleryItem} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-4">
                    <Plus size={14} className="mr-1" /> Add to Gallery
                  </Button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.gallery.map((photo, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 relative group">
                    <img src={photo.url} alt={photo.caption} className="w-16 h-12 object-cover rounded-lg shrink-0 bg-slate-100" />
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="text-xs font-semibold text-slate-800 truncate">{photo.caption}</p>
                      {photo.date && <p className="text-[11px] text-slate-400 mt-0.5">{photo.date}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryItem(idx)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {formData.gallery.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center col-span-2 py-4">No gallery photos added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
            <div className="text-xs text-slate-500 truncate max-w-[200px]">
              Editing: <span className="font-semibold text-slate-800">{formData.title || 'New Program'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all"
              >
                {loading ? 'Saving...' : editingItem ? 'Update Program' : 'Publish Program'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DraggableDialog>
  );
}
