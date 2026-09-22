import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, Download, Plus, Trash2, Save, 
  Eye, Compass, CheckCircle2, DollarSign, Activity, Users, 
  Globe, ExternalLink, Sparkles, HelpCircle, ArrowRight, ChevronRight,
  Upload, ArrowUp, ArrowDown, Loader2, FolderOpen
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export interface AccountabilityPillar {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface PublicationItem {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  year: string;
  description: string;
  fileUrl: string;
  fileSize: string;
  actionText: string;
}

export interface FullImpactReportsData {
  // Hero & Header
  heroBadge: string;
  heroTitle: string;
  heroIntroP1: string;
  heroIntroP2: string;

  // Organizational Accountability
  accountabilityTitle: string;
  accountabilityPillars: AccountabilityPillar[];

  // Publications
  publicationsTitle: string;
  publicationsSubtitle: string;
  publications: PublicationItem[];

  // Community Needs & Assessments
  needsAssessmentTitle: string;
  needsAssessmentDescription: string;
  needsAssessmentActionText: string;
  needsAssessmentActionLink: string;

  // Financial Reports Section
  financialReportsTitle: string;
  financialReportsLead: string;
  financialReportsDescription: string;
  financialReportsActionText: string;
  financialReportsActionLink: string;

  // Commitment to Transparency
  transparencyTitle: string;
  transparencyIntro: string;
  transparencyCommitments: string[];

  // Institutional Inquiries
  inquiriesTitle: string;
  inquiriesDescription: string;
  inquiriesActionText: string;
  inquiriesActionLink: string;
}

export const DEFAULT_IMPACT_REPORTS_DATA: FullImpactReportsData = {
  heroBadge: 'Accountability & Learning',
  heroTitle: 'Impact Reports & Resources',
  heroIntroP1: "Explore RESTI's organizational reports, program documents, community assessments, and other publications that provide information about our work with refugees and host communities in Uganda.",
  heroIntroP2: "RESTI is committed to transparency, accountability, and continuous learning. As our programs develop, we will make relevant reports and resources available to communities, partners, donors, and other stakeholders, subject to appropriate privacy and confidentiality considerations.",

  accountabilityTitle: 'Organizational Accountability',
  accountabilityPillars: [
    {
      id: 'acc-1',
      title: 'Financial Transparency',
      description: 'We are committed to responsible and transparent management of the resources entrusted to RESTI. Financial information and reports will be published as they become available and are approved for public disclosure.',
      icon: 'DollarSign'
    },
    {
      id: 'acc-2',
      title: 'Monitoring & Evaluation',
      description: 'We monitor our activities and use community feedback, program data, and lessons learned to improve the quality, relevance, and effectiveness of our work.',
      icon: 'Activity'
    },
    {
      id: 'acc-3',
      title: 'Community Accountability',
      description: 'We involve communities in identifying needs, implementing activities, assessing results, and providing feedback on our work.',
      icon: 'Users'
    },
    {
      id: 'acc-4',
      title: 'Public Access',
      description: 'Relevant organizational and program documents are made available to stakeholders where appropriate, while protecting personal, confidential, and sensitive information.',
      icon: 'Globe'
    }
  ],

  publicationsTitle: 'Publications',
  publicationsSubtitle: 'Official organizational and programmatic documentation.',
  publications: [],

  needsAssessmentTitle: 'Community Needs & Assessments',
  needsAssessmentDescription: 'RESTI uses community consultation and available evidence to understand local priorities and inform program design. Where formal needs assessments are conducted, relevant findings will be published here.',
  needsAssessmentActionText: 'Community Needs Assessment →',
  needsAssessmentActionLink: '/contact',

  financialReportsTitle: 'Financial Reports',
  financialReportsLead: 'RESTI is committed to responsible stewardship of financial resources.',
  financialReportsDescription: 'As the organization develops its financial reporting history, approved annual financial reports and, where applicable, independently audited financial statements will be made available here.',
  financialReportsActionText: 'View Financial Transparency & Accountability →',
  financialReportsActionLink: '/financials',

  transparencyTitle: 'Our Commitment to Transparency',
  transparencyIntro: 'RESTI recognizes that transparency and accountability are essential to maintaining the trust of communities, donors, partners, and other stakeholders.',
  transparencyCommitments: [
    'Maintaining accurate organizational and financial records.',
    'Using resources responsibly and for their intended purposes.',
    'Monitoring and evaluating our activities.',
    'Listening to community feedback and responding to concerns.',
    'Strengthening our governance and internal controls.',
    'Reporting honestly on our progress, challenges, and lessons learned.',
    'Making appropriate organizational and program information publicly accessible.'
  ],

  inquiriesTitle: 'Institutional & Partner Inquiries',
  inquiriesDescription: 'For donors, partners, researchers, government authorities, or other institutions seeking additional organizational, financial, or program information, please contact RESTI through our official contact channels.',
  inquiriesActionText: 'Contact RESTI →',
  inquiriesActionLink: '/contact'
};

export function normalizeImpactReportsData(raw: any): FullImpactReportsData {
  if (!raw) return DEFAULT_IMPACT_REPORTS_DATA;
  return {
    heroBadge: raw.heroBadge || DEFAULT_IMPACT_REPORTS_DATA.heroBadge,
    heroTitle: raw.heroTitle || DEFAULT_IMPACT_REPORTS_DATA.heroTitle,
    heroIntroP1: raw.heroIntroP1 || DEFAULT_IMPACT_REPORTS_DATA.heroIntroP1,
    heroIntroP2: raw.heroIntroP2 || DEFAULT_IMPACT_REPORTS_DATA.heroIntroP2,

    accountabilityTitle: raw.accountabilityTitle || DEFAULT_IMPACT_REPORTS_DATA.accountabilityTitle,
    accountabilityPillars: Array.isArray(raw.accountabilityPillars) && raw.accountabilityPillars.length > 0
      ? raw.accountabilityPillars
      : DEFAULT_IMPACT_REPORTS_DATA.accountabilityPillars,

    publicationsTitle: raw.publicationsTitle || DEFAULT_IMPACT_REPORTS_DATA.publicationsTitle,
    publicationsSubtitle: raw.publicationsSubtitle || DEFAULT_IMPACT_REPORTS_DATA.publicationsSubtitle,
    publications: Array.isArray(raw.publications) ? raw.publications : [],

    needsAssessmentTitle: raw.needsAssessmentTitle || DEFAULT_IMPACT_REPORTS_DATA.needsAssessmentTitle,
    needsAssessmentDescription: raw.needsAssessmentDescription || DEFAULT_IMPACT_REPORTS_DATA.needsAssessmentDescription,
    needsAssessmentActionText: raw.needsAssessmentActionText || DEFAULT_IMPACT_REPORTS_DATA.needsAssessmentActionText,
    needsAssessmentActionLink: raw.needsAssessmentActionLink || DEFAULT_IMPACT_REPORTS_DATA.needsAssessmentActionLink,

    financialReportsTitle: raw.financialReportsTitle || DEFAULT_IMPACT_REPORTS_DATA.financialReportsTitle,
    financialReportsLead: raw.financialReportsLead || DEFAULT_IMPACT_REPORTS_DATA.financialReportsLead,
    financialReportsDescription: raw.financialReportsDescription || DEFAULT_IMPACT_REPORTS_DATA.financialReportsDescription,
    financialReportsActionText: raw.financialReportsActionText || DEFAULT_IMPACT_REPORTS_DATA.financialReportsActionText,
    financialReportsActionLink: raw.financialReportsActionLink || DEFAULT_IMPACT_REPORTS_DATA.financialReportsActionLink,

    transparencyTitle: raw.transparencyTitle || DEFAULT_IMPACT_REPORTS_DATA.transparencyTitle,
    transparencyIntro: raw.transparencyIntro || DEFAULT_IMPACT_REPORTS_DATA.transparencyIntro,
    transparencyCommitments: Array.isArray(raw.transparencyCommitments) && raw.transparencyCommitments.length > 0
      ? raw.transparencyCommitments
      : DEFAULT_IMPACT_REPORTS_DATA.transparencyCommitments,

    inquiriesTitle: raw.inquiriesTitle || DEFAULT_IMPACT_REPORTS_DATA.inquiriesTitle,
    inquiriesDescription: raw.inquiriesDescription || DEFAULT_IMPACT_REPORTS_DATA.inquiriesDescription,
    inquiriesActionText: raw.inquiriesActionText || DEFAULT_IMPACT_REPORTS_DATA.inquiriesActionText,
    inquiriesActionLink: raw.inquiriesActionLink || DEFAULT_IMPACT_REPORTS_DATA.inquiriesActionLink,
  };
}

interface ImpactReportsManagerProps {
  initialData?: any;
  onUpdate?: () => void;
  accessToken?: string;
  userRole?: string;
}

export function ImpactReportsManager({ initialData, onUpdate, accessToken, userRole }: ImpactReportsManagerProps) {
  const isAdmin = userRole === 'admin' || userRole === 'super-admin';
  const [formData, setFormData] = useState<FullImpactReportsData>(() => normalizeImpactReportsData(initialData));
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'accountability' | 'publications' | 'sections' | 'transparency'>('hero');

  useEffect(() => {
    if (initialData) {
      setFormData(normalizeImpactReportsData(initialData));
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can modify impact report configurations.');
      return;
    }

    setSaving(true);
    const token = accessToken || publicAnonKey;

    try {
      // 1. Fetch current settings to avoid overwriting other keys
      const settingsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      let currentSettings: any = {};
      if (settingsRes.ok) {
        const sJson = await settingsRes.json();
        currentSettings = sJson.settings || {};
      }

      // 2. Put to site-settings.impactReports
      const saveRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            settings: {
              ...currentSettings,
              impactReports: formData
            }
          })
        }
      );

      if (saveRes.ok) {
        toast.success('Impact Reports page updated successfully!', {
          description: 'All changes are now live on /reports.'
        });
        if (onUpdate) onUpdate();
      } else {
        const errJson = await saveRes.json().catch(() => ({}));
        throw new Error(errJson.message || 'Server error while saving');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Pillar handlers
  const handleUpdatePillar = (index: number, field: keyof AccountabilityPillar, val: string) => {
    setFormData(prev => {
      const copy = [...prev.accountabilityPillars];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, accountabilityPillars: copy };
    });
  };

  // Publication handlers
  const handleUpdatePub = (index: number, field: keyof PublicationItem, val: string) => {
    setFormData(prev => {
      const copy = [...prev.publications];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, publications: copy };
    });
  };

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleAddPub = () => {
    const currentYear = new Date().getFullYear();
    setFormData(prev => ({
      ...prev,
      publications: [
        ...prev.publications,
        {
          id: 'pub-' + Date.now(),
          title: '',
          category: 'Annual Reports',
          subCategory: `${currentYear} | RESTI CBO`,
          year: String(currentYear),
          description: '',
          fileUrl: '',
          fileSize: '',
          actionText: 'Download Report →'
        }
      ]
    }));
  };

  const handleRemovePub = (index: number) => {
    setFormData(prev => ({
      ...prev,
      publications: prev.publications.filter((_, i) => i !== index)
    }));
  };

  const handleMovePub = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const copy = [...prev.publications];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return { ...prev, publications: copy };
    });
  };

  const handleUploadPubFile = async (index: number, file: File) => {
    try {
      setUploadingIndex(index);
      toast.info('Uploading document to storage...');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-application-doc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        body: formDataUpload
      });

      if (res.ok) {
        const data = await res.json();
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        setFormData(prev => {
          const copy = [...prev.publications];
          copy[index] = {
            ...copy[index],
            fileUrl: data.url || copy[index].fileUrl,
            fileSize: sizeMb
          };
          return { ...prev, publications: copy };
        });
        toast.success('Document uploaded successfully!');
      } else {
        toast.error('Upload failed. You can paste a direct download URL.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('Network error during document upload');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Commitment handlers
  const handleUpdateCommitment = (index: number, val: string) => {
    setFormData(prev => {
      const copy = [...prev.transparencyCommitments];
      copy[index] = val;
      return { ...prev, transparencyCommitments: copy };
    });
  };

  const handleAddCommitment = () => {
    setFormData(prev => ({
      ...prev,
      transparencyCommitments: [
        ...prev.transparencyCommitments,
        'New transparency and accountability commitment.'
      ]
    }));
  };

  const handleRemoveCommitment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      transparencyCommitments: prev.transparencyCommitments.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800/40">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <Sparkles size={13} />
            Institutional Accountability & Publications
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Impact Reports & Resources Editor</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Edit page headers, 4 Organizational Accountability pillars, verified publications, community assessments, financial transparency, and commitments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/reports"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/20 transition-all"
          >
            <Eye size={16} />
            View Live Page
            <ExternalLink size={14} className="opacity-70" />
          </a>

          <Button
            onClick={handleSave}
            disabled={saving || !isAdmin}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'hero', label: 'Hero & Overview', icon: Compass },
          { id: 'accountability', label: 'Accountability Pillars (4)', icon: ShieldCheck },
          { id: 'publications', label: `Publications (${formData.publications.length})`, icon: FileText },
          { id: 'sections', label: 'Assessments & Financials', icon: DollarSign },
          { id: 'transparency', label: 'Commitments & Inquiries', icon: CheckCircle2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── SUB-TAB 1: HERO & OVERVIEW ── */}
      {activeSubTab === 'hero' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Hero Header & Introduction</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Opening statements for the public /reports page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Header Badge
              </label>
              <input
                type="text"
                value={formData.heroBadge}
                onChange={e => setFormData({ ...formData, heroBadge: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Page Title
              </label>
              <input
                type="text"
                value={formData.heroTitle}
                onChange={e => setFormData({ ...formData, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Introductory Paragraph 1
            </label>
            <textarea
              rows={3}
              value={formData.heroIntroP1}
              onChange={e => setFormData({ ...formData, heroIntroP1: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Introductory Paragraph 2 (Transparency & Learning Commitment)
            </label>
            <textarea
              rows={3}
              value={formData.heroIntroP2}
              onChange={e => setFormData({ ...formData, heroIntroP2: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: ACCOUNTABILITY PILLARS ── */}
      {activeSubTab === 'accountability' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Organizational Accountability Section</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage the 4 core accountability frameworks (Financial Transparency, Monitoring & Evaluation, Community Accountability, Public Access).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Section Headline
              </label>
              <input
                type="text"
                value={formData.accountabilityTitle}
                onChange={e => setFormData({ ...formData, accountabilityTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {formData.accountabilityPillars.map((pillar, idx) => (
              <div key={pillar.id || idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} /> Pillar {idx + 1}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Pillar Title
                  </label>
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={e => handleUpdatePillar(idx, 'title', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={pillar.description}
                    onChange={e => handleUpdatePillar(idx, 'description', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: PUBLICATIONS ── */}
      {activeSubTab === 'publications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-slate-900">Publications ({formData.publications.length})</h3>
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {formData.publications.length} Published
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage official organizational reports, program evaluations, assessments, and policy documentation.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleAddPub}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={15} />
                Add Publication
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={formData.publicationsTitle}
                  onChange={e => setFormData({ ...formData, publicationsTitle: e.target.value })}
                  placeholder="Publications"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={formData.publicationsSubtitle}
                  onChange={e => setFormData({ ...formData, publicationsSubtitle: e.target.value })}
                  placeholder="Official organizational and programmatic documentation."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Empty State when 0 publications exist */}
          {formData.publications.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 md:p-14 border-2 border-dashed border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <FileText size={30} />
              </div>
              <h4 className="text-lg font-bold text-slate-900">No Publications Added Yet</h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Publications are currently empty and waiting to be added from this admin dashboard. Click below to add your first official publication or upload a document.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleAddPub}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add First Publication
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.publications.map((pub, idx) => (
                <div key={pub.id || idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">{pub.title || 'Untitled Publication'}</h4>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                        {pub.category || 'Annual Reports'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Reordering */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePub(idx, 'up')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Up"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === formData.publications.length - 1}
                        onClick={() => handleMovePub(idx, 'down')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Down"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePub(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all ml-1"
                        title="Remove Publication"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Publication Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pub.title}
                        onChange={e => handleUpdatePub(idx, 'title', e.target.value)}
                        placeholder="e.g. Annual Activity Report 2026"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Category
                      </label>
                      <select
                        value={pub.category}
                        onChange={e => handleUpdatePub(idx, 'category', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white"
                      >
                        <option value="Annual Reports">Annual Reports</option>
                        <option value="Program Reports & Evaluations">Program Reports & Evaluations</option>
                        <option value="Needs Assessments & Research">Needs Assessments & Research</option>
                        <option value="Governance & Policies">Governance & Policies</option>
                        <option value="Financial Reports & Audits">Financial Reports & Audits</option>
                        <option value="Strategic Plans">Strategic Plans</option>
                        <option value="Community Assessments">Community Assessments</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Sub-label / Meta Tag (e.g. 2026 | RESTI CBO)
                      </label>
                      <input
                        type="text"
                        value={pub.subCategory}
                        onChange={e => handleUpdatePub(idx, 'subCategory', e.target.value)}
                        placeholder="2026 | RESTI CBO"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Description / Scope
                    </label>
                    <textarea
                      rows={2}
                      value={pub.description}
                      onChange={e => handleUpdatePub(idx, 'description', e.target.value)}
                      placeholder="Summary of what is documented in this publication..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-600">
                          File / Download URL
                        </label>
                        <label
                          htmlFor={`file-upload-${idx}`}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Upload size={12} />
                          {uploadingIndex === idx ? 'Uploading...' : 'Upload PDF'}
                        </label>
                        <input
                          type="file"
                          id={`file-upload-${idx}`}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadPubFile(idx, e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        value={pub.fileUrl}
                        onChange={e => handleUpdatePub(idx, 'fileUrl', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                        placeholder="https://... or click Upload PDF above"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        File Size Display
                      </label>
                      <input
                        type="text"
                        value={pub.fileSize || ''}
                        onChange={e => handleUpdatePub(idx, 'fileSize', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                        placeholder="e.g. 2.5 MB"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Button / Action Text
                      </label>
                      <input
                        type="text"
                        value={pub.actionText || 'Download Report →'}
                        onChange={e => handleUpdatePub(idx, 'actionText', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                onClick={handleAddPub}
                variant="outline"
                className="w-full py-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={18} />
                Add Another Publication
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 4: ASSESSMENTS & FINANCIALS ── */}
      {activeSubTab === 'sections' && (
        <div className="space-y-6">
          {/* Community Needs & Assessments Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Community Needs & Assessments</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evidence-based consultation and needs assessment disclosures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={formData.needsAssessmentTitle}
                  onChange={e => setFormData({ ...formData, needsAssessmentTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Action Link Text
                </label>
                <input
                  type="text"
                  value={formData.needsAssessmentActionText}
                  onChange={e => setFormData({ ...formData, needsAssessmentActionText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.needsAssessmentDescription}
                onChange={e => setFormData({ ...formData, needsAssessmentDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Financial Reports Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Financial Reports Section</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stewardship, future audited statements, and financial transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={formData.financialReportsTitle}
                  onChange={e => setFormData({ ...formData, financialReportsTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lead Statement
                </label>
                <input
                  type="text"
                  value={formData.financialReportsLead}
                  onChange={e => setFormData({ ...formData, financialReportsLead: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.financialReportsDescription}
                onChange={e => setFormData({ ...formData, financialReportsDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Action Link Text
                </label>
                <input
                  type="text"
                  value={formData.financialReportsActionText}
                  onChange={e => setFormData({ ...formData, financialReportsActionText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={formData.financialReportsActionLink}
                  onChange={e => setFormData({ ...formData, financialReportsActionLink: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 5: COMMITMENTS & INQUIRIES ── */}
      {activeSubTab === 'transparency' && (
        <div className="space-y-6">
          {/* Commitments Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Our Commitment to Transparency</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The 7 institutional commitments to integrity, governance, and honesty.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={formData.transparencyTitle}
                onChange={e => setFormData({ ...formData, transparencyTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Introductory Statement
              </label>
              <textarea
                rows={2}
                value={formData.transparencyIntro}
                onChange={e => setFormData({ ...formData, transparencyIntro: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                List of Commitments ({formData.transparencyCommitments.length})
              </label>
              <div className="space-y-2.5">
                {formData.transparencyCommitments.map((cmt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={cmt}
                      onChange={e => handleUpdateCommitment(idx, e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCommitment(idx)}
                      className="text-slate-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddCommitment}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3.5 py-2 rounded-xl transition-all"
              >
                <Plus size={14} /> Add Commitment Item
              </button>
            </div>
          </div>

          {/* Institutional Inquiries Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Institutional & Partner Inquiries</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Channel for donors, researchers, and government authorities to request documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={formData.inquiriesTitle}
                  onChange={e => setFormData({ ...formData, inquiriesTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={formData.inquiriesActionText}
                  onChange={e => setFormData({ ...formData, inquiriesActionText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Inquiries Description
              </label>
              <textarea
                rows={3}
                value={formData.inquiriesDescription}
                onChange={e => setFormData({ ...formData, inquiriesDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Button Destination URL
              </label>
              <input
                type="text"
                value={formData.inquiriesActionLink}
                onChange={e => setFormData({ ...formData, inquiriesActionLink: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                placeholder="/contact"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sticky Save Bar */}
      <div className="sticky bottom-6 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-2xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-slate-300 hidden sm:block">
            Editing Impact Reports & Resources content. Click save to publish.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-7 py-2 rounded-xl shadow-lg flex items-center gap-2 transition-all"
        >
          <Save size={16} />
          {saving ? 'Publishing...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
