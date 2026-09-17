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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Plus, Trash2, Upload, X, MapPin, Clock, Users, 
  Sparkles, FileText, Target, ListChecks, Activity
} from 'lucide-react';

export interface ProgramMetricItem {
  label: string;
  value: string;
  subtext?: string;
}

export interface ProgramActivityItem {
  title: string;
  desc: string;
}

export interface ProgramFormData {
  title: string;
  category: string;
  description: string;
  content: string;
  image: string;
  active: boolean;
  location: string;
  timeline: string;
  beneficiaries: string;
  leadCoordinator?: string;
  objectives: string[];
  keyActivities: ProgramActivityItem[];
  impactMetrics: ProgramMetricItem[];
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
  { value: 'Community', label: 'Water, Sanitation (WASH) & Infrastructure' },
  { value: 'Protection', label: 'Women Empowerment & Child Protection' },
  { value: 'Youth', label: 'Youth Leadership, Arts & Sports' },
  { value: 'General', label: 'General Community Initiative' },
];

export function ProgramFormDialog({
  show,
  onClose,
  editingItem,
  onSuccess,
  userRole,
  accessToken
}: ProgramFormDialogProps) {
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'metadata' | 'content' | 'objectives' | 'activities' | 'metrics'>('basic');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProgramFormData>({
    title: '',
    category: 'Education',
    description: '',
    content: '',
    image: '',
    active: true,
    location: 'Kiryandongo District, Uganda',
    timeline: 'Active Initiative (2024 – 2027)',
    beneficiaries: 'Refugee and host community members',
    leadCoordinator: '',
    objectives: [],
    keyActivities: [],
    impactMetrics: []
  });

  // Dynamic list inputs
  const [newObjective, setNewObjective] = useState('');
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [newMetricLabel, setNewMetricLabel] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [newMetricSubtext, setNewMetricSubtext] = useState('');

  // Hydrate form on edit or reset
  useEffect(() => {
    if (editingItem) {
      const val = editingItem.value || editingItem;
      setFormData({
        title: val.title || '',
        category: val.category || 'Education',
        description: val.description || '',
        content: val.content || '',
        image: val.image || '',
        active: val.active !== false,
        location: val.location || 'Kiryandongo District, Uganda',
        timeline: val.timeline || 'Active Initiative (2024 – 2027)',
        beneficiaries: val.beneficiaries || 'Refugee and host community members',
        leadCoordinator: val.leadCoordinator || '',
        objectives: Array.isArray(val.objectives) ? [...val.objectives] : (typeof val.objectives === 'string' ? val.objectives.split('\n').filter(Boolean) : []),
        keyActivities: Array.isArray(val.keyActivities) ? val.keyActivities.map((a: any) => ({ title: a.title || '', desc: a.desc || '' })) : [],
        impactMetrics: Array.isArray(val.impactMetrics) ? val.impactMetrics.map((m: any) => ({ label: m.label || '', value: m.value || '', subtext: m.subtext || '' })) : []
      });
    } else {
      setFormData({
        title: '',
        category: 'Education',
        description: '',
        content: '',
        image: '',
        active: true,
        location: 'Kiryandongo Refugee Settlement & Host Community, Uganda',
        timeline: 'Active Multi-Year Initiative',
        beneficiaries: 'Refugee families and host community residents',
        leadCoordinator: '',
        objectives: [
          'Improve grassroots access to essential community services and tools.',
          'Build sustainable local capacities through participatory workshops and mentorship.'
        ],
        keyActivities: [
          { title: 'Community Outreach & Enrolment', desc: 'Mobilizing households and identifying priority community beneficiaries.' }
        ],
        impactMetrics: [
          { label: 'Direct Beneficiaries', value: '1,000+', subtext: 'Annual participants' }
        ]
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
      toast.error('Please enter both Metric Value (e.g. 3,450+) and Label');
      return;
    }
    setFormData(prev => ({
      ...prev,
      impactMetrics: [...prev.impactMetrics, { 
        value: newMetricValue.trim(), 
        label: newMetricLabel.trim(), 
        subtext: newMetricSubtext.trim() || undefined 
      }]
    }));
    setNewMetricValue('');
    setNewMetricLabel('');
    setNewMetricSubtext('');
  };

  const handleRemoveMetric = (index: number) => {
    setFormData(prev => ({ ...prev, impactMetrics: prev.impactMetrics.filter((_, i) => i !== index) }));
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
          active: formData.active,
          updated_at: nowIso
        });
      } catch (sqlErr) {
        // Table schema differences are safely absorbed
      }

      if (!apiSaved && !kvSaved) {
        throw new Error('Could not persist program changes. Please check your connection.');
      }

      toast.success(editingItem ? 'Program updated with full details!' : 'New program created successfully!');
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
      headerColor="#2563eb"
    >
      <div className="flex flex-col max-h-[82vh]">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-4 mb-4 border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('basic')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'basic'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText size={13} />
            <span>1. Basic & Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('metadata')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'metadata'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin size={13} />
            <span>2. Project Metadata</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('content')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'content'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles size={13} />
            <span>3. Overview Story</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('objectives')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'objectives'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Target size={13} />
            <span>4. Objectives ({formData.objectives.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('activities')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'activities'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ListChecks size={13} />
            <span>5. Activities ({formData.keyActivities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('metrics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'metrics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Activity size={13} />
            <span>6. Impact KPIs ({formData.impactMetrics.length})</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* TAB 1: BASIC INFO & MEDIA */}
          {activeSubTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <strong>Basic Identification:</strong> Define the core program title, primary classification, card summary, and banner image displayed across all public listings.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Program Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-semibold text-slate-900"
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800"
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
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-between transition-all ${
                      formData.active
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>Status: {formData.active ? 'Active & Published' : 'Draft / Archived'}</span>
                    <span className={`w-3 h-3 rounded-full ${formData.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Short Summary / Card Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 leading-relaxed"
                  placeholder="Provide a concise 2-3 sentence overview for program index cards and teasers..."
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
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                      placeholder="Image URL or upload a file below..."
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs">
                      <Upload size={14} className="text-blue-600" />
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

          {/* TAB 2: METADATA */}
          {activeSubTab === 'metadata' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <strong>Project Specifics:</strong> These attributes populate the Quick Meta ribbon, sidebar facts, and verified geographic details on the program page.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-emerald-600" />
                  Field Location & Catchment
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800"
                  placeholder="e.g. Kiryandongo Refugee Settlement & Host Community Schools, Uganda"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock size={13} className="text-emerald-600" />
                    Timeline & Phase
                  </label>
                  <input
                    type="text"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800"
                    placeholder="e.g. Active Multi-Year Initiative (2024 – 2027)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Users size={13} className="text-emerald-600" />
                    Target Beneficiaries
                  </label>
                  <input
                    type="text"
                    value={formData.beneficiaries}
                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800"
                    placeholder="e.g. 3,450+ refugee and host community children (ages 5–18)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Lead Coordinator / Field Officer (Optional)
                </label>
                <input
                  type="text"
                  value={formData.leadCoordinator || ''}
                  onChange={(e) => setFormData({ ...formData, leadCoordinator: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800"
                  placeholder="e.g. Anek Immaculate, Programs & Community Lead"
                />
              </div>
            </div>
          )}

          {/* TAB 3: OVERVIEW STORY */}
          {activeSubTab === 'content' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <strong>Context, Challenges & Grassroots Approach:</strong> Write the full comprehensive narrative for the main content section. Rich text formatting with paragraphs, lists, and bold text is supported.
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <ReactQuill
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Detail the community background, localized challenges, RESTI's grassroots interventions, and community-led solutions..."
                  className="min-h-[220px]"
                />
              </div>
            </div>
          )}

          {/* TAB 4: OBJECTIVES */}
          {activeSubTab === 'objectives' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <strong>Strategic Goals & Objectives:</strong> Add clear, measurable milestones that guide this initiative's execution and donor reporting.
              </div>

              {/* Add Objective Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddObjective(); } }}
                  placeholder="Type an objective (e.g. Increase primary completion rates by 45%)..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="button" onClick={handleAddObjective} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-4">
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>

              {/* Objectives List */}
              <div className="space-y-2">
                {formData.objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl group hover:bg-slate-100 transition-colors">
                    <div className="flex items-start gap-2.5 text-sm text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{obj}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove objective"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {formData.objectives.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">No specific objectives added yet. Type above and click Add.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: KEY ACTIVITIES */}
          {activeSubTab === 'activities' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <strong>Core Project Activities:</strong> Detail the structured workstreams, distributions, training camps, or clinical outreaches that comprise this program.
              </div>

              {/* Add Activity Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <input
                  type="text"
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  placeholder="Activity Title (e.g. Scholastic Kit & Uniform Distribution)..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <textarea
                  value={newActivityDesc}
                  onChange={(e) => setNewActivityDesc(e.target.value)}
                  rows={2}
                  placeholder="Detailed description of what happens in this activity..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <Button type="button" onClick={handleAddActivity} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-4">
                    <Plus size={14} className="mr-1" /> Add Activity
                  </Button>
                </div>
              </div>

              {/* Activities List */}
              <div className="space-y-3">
                {formData.keyActivities.map((act, idx) => (
                  <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl relative group shadow-2xs hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between pr-6 mb-1">
                      <h5 className="font-bold text-sm text-slate-900 leading-snug flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
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
                  <p className="text-xs text-slate-400 italic text-center py-4">No key activities added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: IMPACT METRICS */}
          {activeSubTab === 'metrics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <strong>Measured Impact Numbers:</strong> These KPI cards are highlighted in large bold numbers on the program page and live dashboards.
              </div>

              {/* Add Metric Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Value (Big Stat)</label>
                  <input
                    type="text"
                    value={newMetricValue}
                    onChange={(e) => setNewMetricValue(e.target.value)}
                    placeholder="e.g. 3,450+ or 94%"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Metric Label</label>
                  <input
                    type="text"
                    value={newMetricLabel}
                    onChange={(e) => setNewMetricLabel(e.target.value)}
                    placeholder="e.g. Students Enrolled"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Subtext (Optional)</label>
                  <input
                    type="text"
                    value={newMetricSubtext}
                    onChange={(e) => setNewMetricSubtext(e.target.value)}
                    placeholder="e.g. Refugee & host students"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end pt-1">
                  <Button type="button" onClick={handleAddMetric} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-4">
                    <Plus size={14} className="mr-1" /> Add Impact Metric
                  </Button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.impactMetrics.map((met, idx) => (
                  <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl relative group shadow-2xs hover:border-emerald-200 transition-colors">
                    <p className="text-xl font-black text-emerald-700 font-heading leading-tight">{met.value}</p>
                    <p className="text-xs font-bold text-slate-900 mt-1">{met.label}</p>
                    {met.subtext && <p className="text-[11px] text-slate-400 mt-0.5">{met.subtext}</p>}
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
                {formData.impactMetrics.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center col-span-2 py-4">No impact metrics added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
            <div className="text-xs text-slate-500">
              Editing: <span className="font-semibold text-slate-800">{formData.title || 'New Program'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all"
              >
                {loading ? 'Saving...' : editingItem ? 'Update Program Details' : 'Publish Program'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DraggableDialog>
  );
}
