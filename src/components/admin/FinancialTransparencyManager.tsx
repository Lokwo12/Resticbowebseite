import React, { useState, useEffect } from 'react';
import { 
  PieChart, DollarSign, FileText, Upload, Plus, Trash2, 
  Save, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, 
  HelpCircle, Eye, EyeOff, Calendar, FileCheck, ArrowRight,
  TrendingUp, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export interface FinancialAllocationCategory {
  id: string;
  name: string;
  percentage: number;
  color: string;
  description: string;
}

export interface FinancialReportingPeriod {
  id: string;
  year: string;
  reportingPeriodLabel: string;
  currency: string;
  currencySymbol: string;
  isPublished: boolean;
  isAudited: boolean;
  auditFirm?: string;
  lastUpdated?: string;
  totalIncome?: number | null;
  totalExpenditure?: number | null;
  programExpenditure?: number | null;
  administrativeExpenditure?: number | null;
  fundraisingExpenditure?: number | null;
  grantsFunding?: number | null;
  donationIncome?: number | null;
  otherIncome?: number | null;
  notes?: string;
}

export interface FinancialDocument {
  id: string;
  title: string;
  reportingPeriod: string;
  documentType: 'Annual Report' | 'Audited Financial Statements' | 'Financial Summary' | 'Program/Impact Report' | 'Other';
  publicationDate: string;
  fileSize: string;
  fileUrl: string;
  isAudited: boolean;
  isPublished: boolean;
  description?: string;
}

export interface FinancialTransparencyData {
  badge: string;
  title: string;
  subtitle: string;
  allocationsTitle: string;
  allocationsSubtitle: string;
  allocationsReportingPeriod: string;
  allocationsCurrency: string;
  allocationsPublished: boolean;
  allocationsLastUpdated?: string;
  allocations: FinancialAllocationCategory[];
  overviewTitle: string;
  overviewSubtitle: string;
  overviewPublished: boolean;
  financialPeriods: FinancialReportingPeriod[];
  documentsTitle: string;
  documentsSubtitle: string;
  documentsPublished: boolean;
  documents: FinancialDocument[];
  transparencyTitle: string;
  transparencyStatement: string;
  transparencyButtonText: string;
  transparencyButtonLink: string;
}

export const DEFAULT_FINANCIAL_TRANSPARENCY_DATA: FinancialTransparencyData = {
  badge: 'Financial Accountability & Stewardship',
  title: 'Financial Transparency',
  subtitle: 'We are committed to transparency and accountability. Learn how RESTI uses contributions to support communities, deliver programs, and strengthen sustainable development in Kiryandongo District.',
  allocationsTitle: 'How Contributions Are Used',
  allocationsSubtitle: 'A transparent breakdown of how resources are deployed across programmatic, community, and administrative activities.',
  allocationsReportingPeriod: 'Operating Budget Breakdown',
  allocationsCurrency: 'USD',
  allocationsPublished: false,
  allocations: [],
  overviewTitle: 'Funding & Financial Overview',
  overviewSubtitle: 'Annual financial statements and funding summaries by reporting period.',
  overviewPublished: false,
  financialPeriods: [],
  documentsTitle: 'Annual Reports & Audited Financial Statements',
  documentsSubtitle: 'Access official annual reports, audited financial statements, and reporting disclosures.',
  documentsPublished: false,
  documents: [],
  transparencyTitle: 'Committed to Transparency',
  transparencyStatement: 'RESTI is committed to responsible stewardship of the resources entrusted to us. We provide financial and program information to help donors, partners, community members, and other stakeholders understand how resources are managed and how they support our work.',
  transparencyButtonText: 'Request More Information',
  transparencyButtonLink: '/contact'
};

const DEFAULT_CATEGORY_COLORS = ['#10b981', '#059669', '#0d9488', '#0284c7', '#6366f1', '#f59e0b', '#ec4899'];

interface Props {
  initialData?: any;
  onUpdate?: () => void;
  accessToken?: string | null;
  userRole?: string;
}

export function FinancialTransparencyManager({ initialData, onUpdate, accessToken, userRole }: Props) {
  const [data, setData] = useState<FinancialTransparencyData>(() => {
    if (initialData) {
      return {
        ...DEFAULT_FINANCIAL_TRANSPARENCY_DATA,
        ...initialData,
        allocations: initialData.allocations || [],
        financialPeriods: initialData.financialPeriods || [],
        documents: initialData.documents || initialData.reports || []
      };
    }
    return DEFAULT_FINANCIAL_TRANSPARENCY_DATA;
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'allocations' | 'overview' | 'documents' | 'statement'>('allocations');
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestData();
  }, []);

  const fetchLatestData = async () => {
    try {
      const token = accessToken || publicAnonKey;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/financial-transparency`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(prev => ({
            ...prev,
            ...json.data,
            allocations: json.data.allocations || [],
            financialPeriods: json.data.financialPeriods || [],
            documents: json.data.documents || []
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch financial transparency data:', err);
    }
  };

  // Calculate allocation sum
  const allocationSum = (data.allocations || []).reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
  const isAllocation100 = Math.round(allocationSum) === 100;

  const handleSave = async () => {
    if (userRole === 'viewer') {
      toast.error('Viewers do not have permission to modify financial settings.');
      return;
    }

    if (data.allocationsPublished && !isAllocation100 && data.allocations.length > 0) {
      toast.error(`Allocation percentages must sum to exactly 100% when published. Current total is ${allocationSum}%.`);
      return;
    }

    // Check for negative percentages
    for (const cat of data.allocations) {
      if (cat.percentage < 0) {
        toast.error(`Category "${cat.name}" cannot have a negative percentage.`);
        return;
      }
    }

    setSaving(true);
    const token = accessToken || publicAnonKey;

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/financial-transparency`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ data })
        }
      );

      if (res.ok) {
        toast.success('Financial Transparency settings saved successfully!', {
          description: 'All published figures and disclosures are now live on /financials.'
        });
        if (onUpdate) onUpdate();
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save financial transparency settings');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Upload document
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 26214400) {
      toast.error('File too large. Maximum supported size is 25 MB.');
      return;
    }

    setUploadingDocId(docId);
    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = accessToken || publicAnonKey;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-document`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Document upload failed');

      setData(prev => ({
        ...prev,
        documents: prev.documents.map(d => {
          if (d.id === docId) {
            return {
              ...d,
              fileUrl: json.url,
              fileSize: json.fileSize || `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            };
          }
          return d;
        })
      }));

      toast.success('Document uploaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Document upload error:', err);
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      setUploadingDocId(null);
      e.target.value = '';
    }
  };

  // Add allocation category
  const addAllocationCategory = () => {
    const newColor = DEFAULT_CATEGORY_COLORS[data.allocations.length % DEFAULT_CATEGORY_COLORS.length];
    const newCat: FinancialAllocationCategory = {
      id: 'cat_' + Date.now(),
      name: 'New Activity Category',
      percentage: 0,
      color: newColor,
      description: 'Describe what activities or programs this allocation category funds.'
    };
    setData(prev => ({ ...prev, allocations: [...prev.allocations, newCat] }));
  };

  // Delete allocation category
  const removeAllocationCategory = (id: string) => {
    setData(prev => ({ ...prev, allocations: prev.allocations.filter(c => c.id !== id) }));
  };

  // Add financial reporting period
  const addReportingPeriod = () => {
    const currentYear = new Date().getFullYear();
    const existingYears = data.financialPeriods.map(p => parseInt(p.year)).filter(Boolean);
    const nextYear = existingYears.length > 0 ? (Math.max(...existingYears) + 1).toString() : currentYear.toString();

    const newPeriod: FinancialReportingPeriod = {
      id: 'period_' + Date.now(),
      year: nextYear,
      reportingPeriodLabel: `January 1 – December 31, ${nextYear}`,
      currency: 'USD',
      currencySymbol: '$',
      isPublished: true,
      isAudited: false,
      auditFirm: '',
      totalIncome: null,
      totalExpenditure: null,
      programExpenditure: null,
      administrativeExpenditure: null,
      fundraisingExpenditure: null,
      grantsFunding: null,
      donationIncome: null,
      otherIncome: null,
      notes: ''
    };
    setData(prev => ({ ...prev, financialPeriods: [newPeriod, ...prev.financialPeriods] }));
  };

  // Remove reporting period
  const removeReportingPeriod = (id: string) => {
    setData(prev => ({ ...prev, financialPeriods: prev.financialPeriods.filter(p => p.id !== id) }));
  };

  // Add document
  const addDocument = () => {
    const currentYear = new Date().getFullYear().toString();
    const newDoc: FinancialDocument = {
      id: 'doc_' + Date.now(),
      title: `RESTI Annual Financial Statement ${currentYear}`,
      reportingPeriod: currentYear,
      documentType: 'Annual Report',
      publicationDate: new Date().toISOString().split('T')[0],
      fileSize: '—',
      fileUrl: '',
      isAudited: true,
      isPublished: true,
      description: 'Official audited annual report approved by the board.'
    };
    setData(prev => ({ ...prev, documents: [newDoc, ...prev.documents] }));
  };

  // Remove document
  const removeDocument = (id: string) => {
    setData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
            <PieChart size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Financial Transparency Management</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Live on /financials
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Control contribution breakdowns, annual financial overviews, and official audited reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button
            onClick={fetchLatestData}
            variant="outline"
            size="sm"
            className="text-slate-600 border-slate-200 hover:bg-slate-50 gap-1.5"
            disabled={saving}
          >
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || userRole === 'viewer'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-sm"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-3 pt-2 shadow-sm overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('allocations')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'allocations'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart size={16} /> How Contributions Are Used ({data.allocations.length})
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={16} /> Financial Overview ({data.financialPeriods.length} Periods)
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} /> Annual Reports & Audits ({data.documents.length})
        </button>

        <button
          onClick={() => setActiveTab('statement')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'statement'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} /> Header & Transparency Statement
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALLOCATIONS ("How Contributions Are Used") */}
      {/* ========================================================================= */}
      {activeTab === 'allocations' && (
        <div className="space-y-6">
          {/* Section Visibility & Metadata */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Fund Allocation Breakdown</h3>
                <p className="text-xs text-slate-500">
                  Visual breakdown showing how funds are allocated across RESTI's core activities.
                </p>
              </div>

              {/* Publish toggle */}
              <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 select-none">
                <span className="text-xs font-semibold text-slate-700">
                  {data.allocationsPublished ? 'Section Published' : 'Section Unpublished (Hidden)'}
                </span>
                <input
                  type="checkbox"
                  checked={data.allocationsPublished}
                  onChange={(e) => setData({ ...data, allocationsPublished: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
              </label>
            </div>

            {/* Validation Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              isAllocation100 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-3">
                {isAllocation100 ? (
                  <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
                ) : (
                  <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                )}
                <div>
                  <p className="text-sm font-bold">
                    {isAllocation100 
                      ? 'Allocation percentages balanced: Total = 100%' 
                      : `Allocation total is currently ${allocationSum}% (Must equal 100% to publish)`}
                  </p>
                  <p className="text-xs opacity-80">
                    {isAllocation100 
                      ? 'All categories sum to 100% and will display cleanly on the public donut chart.'
                      : 'Ensure the sum of all allocation categories equals 100% before publishing.'}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                isAllocation100 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {allocationSum}% / 100%
              </span>
            </div>

            {/* Config Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={data.allocationsTitle}
                  onChange={(e) => setData({ ...data, allocationsTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="How Contributions Are Used"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Period Label</label>
                <input
                  type="text"
                  value={data.allocationsReportingPeriod}
                  onChange={(e) => setData({ ...data, allocationsReportingPeriod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. FY 2024 Operating Budget"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Currency</label>
                <select
                  value={data.allocationsCurrency || 'USD'}
                  onChange={(e) => setData({ ...data, allocationsCurrency: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="UGX">UGX (USh)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Subtitle / Description</label>
              <textarea
                value={data.allocationsSubtitle}
                onChange={(e) => setData({ ...data, allocationsSubtitle: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Brief explanation of the allocation methodology..."
              />
            </div>
          </div>

          {/* Categories Manager */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Allocation Categories</h3>
                <p className="text-xs text-slate-500">
                  Each category must include a percentage and a short explanation of what it represents.
                </p>
              </div>
              <Button
                onClick={addAllocationCategory}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Plus size={14} /> Add Category
              </Button>
            </div>

            {data.allocations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <PieChart size={36} className="mx-auto text-slate-400 mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">No Allocation Categories Configured</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Add categories confirmed by RESTI's financial records (e.g. Program Services, Community Grants, Management & General, Fundraising).
                </p>
                <Button onClick={addAllocationCategory} size="sm" variant="outline" className="gap-1.5">
                  <Plus size={14} /> Add First Category
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.allocations.map((cat, idx) => (
                  <div key={cat.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Color indicator */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={cat.color || '#10b981'}
                          onChange={(e) => {
                            const next = [...data.allocations];
                            next[idx] = { ...next[idx], color: e.target.value };
                            setData({ ...data, allocations: next });
                          }}
                          className="w-8 h-8 rounded-lg border p-0.5 cursor-pointer flex-shrink-0"
                          title="Choose slice color"
                        />
                      </div>

                      {/* Category Name */}
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Category Name</label>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => {
                            const next = [...data.allocations];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setData({ ...data, allocations: next });
                          }}
                          placeholder="e.g. Program Services"
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white font-medium"
                        />
                      </div>

                      {/* Percentage */}
                      <div className="w-28">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Percentage (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={cat.percentage}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                              const next = [...data.allocations];
                              next[idx] = { ...next[idx], percentage: val };
                              setData({ ...data, allocations: next });
                            }}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white font-bold text-slate-900 pr-7"
                          />
                          <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeAllocationCategory(cat.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-4 sm:mt-0"
                        title="Delete category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Explanation / Description */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Category Explanation (What this category represents)
                      </label>
                      <input
                        type="text"
                        value={cat.description}
                        onChange={(e) => {
                          const next = [...data.allocations];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setData({ ...data, allocations: next });
                        }}
                        placeholder="e.g. Direct delivery of education, health, and livelihood programs in Kiryandongo."
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OVERVIEW ("Funding & Financial Overview") */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Funding & Financial Overview Section</h3>
                <p className="text-xs text-slate-500">
                  Publish verified annual financial records by year or reporting period.
                </p>
              </div>

              <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 select-none">
                <span className="text-xs font-semibold text-slate-700">
                  {data.overviewPublished ? 'Overview Published' : 'Overview Unpublished'}
                </span>
                <input
                  type="checkbox"
                  checked={data.overviewPublished}
                  onChange={(e) => setData({ ...data, overviewPublished: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={data.overviewTitle}
                  onChange={(e) => setData({ ...data, overviewTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Funding & Financial Overview"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Note</label>
                <input
                  type="text"
                  value={data.overviewSubtitle}
                  onChange={(e) => setData({ ...data, overviewSubtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Annual financial summaries and audited balance statements."
                />
              </div>
            </div>
          </div>

          {/* Periods List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Financial Reporting Periods</h3>
                <p className="text-xs text-slate-500">
                  Add official annual financial records. Do not invent unconfirmed historical figures.
                </p>
              </div>
              <Button
                onClick={addReportingPeriod}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Plus size={14} /> Add Reporting Period
              </Button>
            </div>

            {data.financialPeriods.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <DollarSign size={36} className="mx-auto text-slate-400 mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">No Financial Periods Entered Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  When periods have not yet been entered, the public site displays: "Financial information for this reporting period will be published following the completion of our financial reporting process."
                </p>
                <Button onClick={addReportingPeriod} size="sm" variant="outline" className="gap-1.5">
                  <Plus size={14} /> Add First Reporting Period
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {data.financialPeriods.map((period, idx) => (
                  <div key={period.id || idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    {/* Period header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-sm rounded-lg">
                          {period.year || 'Period'}
                        </span>
                        <input
                          type="text"
                          value={period.reportingPeriodLabel}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], reportingPeriodLabel: e.target.value };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="e.g. January 1 – December 31, 2024"
                          className="px-2.5 py-1 border rounded-md text-xs bg-white min-w-[200px]"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Period published toggle */}
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={period.isPublished}
                            onChange={(e) => {
                              const next = [...data.financialPeriods];
                              next[idx] = { ...next[idx], isPublished: e.target.checked };
                              setData({ ...data, financialPeriods: next });
                            }}
                            className="rounded text-emerald-600"
                          />
                          <span>Publish this period</span>
                        </label>

                        {/* Audited toggle */}
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={period.isAudited}
                            onChange={(e) => {
                              const next = [...data.financialPeriods];
                              next[idx] = { ...next[idx], isAudited: e.target.checked };
                              setData({ ...data, financialPeriods: next });
                            }}
                            className="rounded text-emerald-600"
                          />
                          <span>Independently Audited</span>
                        </label>

                        <button
                          onClick={() => removeReportingPeriod(period.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Period"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Metadata row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Year</label>
                        <input
                          type="text"
                          value={period.year}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], year: e.target.value };
                            setData({ ...data, financialPeriods: next });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                          placeholder="2024"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Currency</label>
                        <select
                          value={period.currency || 'USD'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const sym = val === 'UGX' ? 'USh' : val === 'EUR' ? '€' : val === 'GBP' ? '£' : '$';
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], currency: val, currencySymbol: sym };
                            setData({ ...data, financialPeriods: next });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="UGX">UGX (USh)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Auditing Firm (Optional)</label>
                        <input
                          type="text"
                          value={period.auditFirm || ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], auditFirm: e.target.value };
                            setData({ ...data, financialPeriods: next });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                          placeholder="e.g. KPMG Uganda / CPA"
                        />
                      </div>
                    </div>

                    {/* Financial Figures Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-700 mb-0.5">Total Income</label>
                        <input
                          type="number"
                          min="0"
                          value={period.totalIncome ?? ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], totalIncome: e.target.value === '' ? null : parseFloat(e.target.value) };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="Not entered"
                          className="w-full px-2.5 py-1.5 border rounded-md text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-rose-700 mb-0.5">Total Expenditure</label>
                        <input
                          type="number"
                          min="0"
                          value={period.totalExpenditure ?? ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], totalExpenditure: e.target.value === '' ? null : parseFloat(e.target.value) };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="Not entered"
                          className="w-full px-2.5 py-1.5 border rounded-md text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Program Expenditure</label>
                        <input
                          type="number"
                          min="0"
                          value={period.programExpenditure ?? ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], programExpenditure: e.target.value === '' ? null : parseFloat(e.target.value) };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="Not entered"
                          className="w-full px-2.5 py-1.5 border rounded-md text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Administrative Expenditure</label>
                        <input
                          type="number"
                          min="0"
                          value={period.administrativeExpenditure ?? ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], administrativeExpenditure: e.target.value === '' ? null : parseFloat(e.target.value) };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="Not entered"
                          className="w-full px-2.5 py-1.5 border rounded-md text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Fundraising Expenditure</label>
                        <input
                          type="number"
                          min="0"
                          value={period.fundraisingExpenditure ?? ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], fundraisingExpenditure: e.target.value === '' ? null : parseFloat(e.target.value) };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="Not entered"
                          className="w-full px-2.5 py-1.5 border rounded-md text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Grants & Institutional</label>
                        <input
                          type="number"
                          min="0"
                          value={period.grantsFunding ?? ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], grantsFunding: e.target.value === '' ? null : parseFloat(e.target.value) };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="Not entered"
                          className="w-full px-2.5 py-1.5 border rounded-md text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Donations Income</label>
                        <input
                          type="number"
                          min="0"
                          value={period.donationIncome ?? ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], donationIncome: e.target.value === '' ? null : parseFloat(e.target.value) };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="Not entered"
                          className="w-full px-2.5 py-1.5 border rounded-md text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Other Income</label>
                        <input
                          type="number"
                          min="0"
                          value={period.otherIncome ?? ''}
                          onChange={(e) => {
                            const next = [...data.financialPeriods];
                            next[idx] = { ...next[idx], otherIncome: e.target.value === '' ? null : parseFloat(e.target.value) };
                            setData({ ...data, financialPeriods: next });
                          }}
                          placeholder="Not entered"
                          className="w-full px-2.5 py-1.5 border rounded-md text-xs"
                        />
                      </div>
                    </div>

                    {/* Period Notes */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Reporting Notes / Explanations</label>
                      <input
                        type="text"
                        value={period.notes || ''}
                        onChange={(e) => {
                          const next = [...data.financialPeriods];
                          next[idx] = { ...next[idx], notes: e.target.value };
                          setData({ ...data, financialPeriods: next });
                        }}
                        placeholder="e.g. Accounts independently audited and signed off by the Board of Directors on March 2025."
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DOCUMENTS ("Annual Reports & Audited Financial Statements") */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Document Library</h3>
                <p className="text-xs text-slate-500">
                  Upload and publish official annual reports and independently audited financial statements.
                </p>
              </div>

              <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 select-none">
                <span className="text-xs font-semibold text-slate-700">
                  {data.documentsPublished ? 'Documents Published' : 'Documents Unpublished'}
                </span>
                <input
                  type="checkbox"
                  checked={data.documentsPublished}
                  onChange={(e) => setData({ ...data, documentsPublished: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={data.documentsTitle}
                  onChange={(e) => setData({ ...data, documentsTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Annual Reports & Audited Financial Statements"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Subtitle</label>
                <input
                  type="text"
                  value={data.documentsSubtitle}
                  onChange={(e) => setData({ ...data, documentsSubtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Access official annual reports, audited financial statements, and reporting disclosures."
                />
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Published Documents</h3>
                <p className="text-xs text-slate-500">
                  Only documents with valid file links will be presented for download. Fake documents are prohibited.
                </p>
              </div>
              <Button
                onClick={addDocument}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Plus size={14} /> Add Document
              </Button>
            </div>

            {data.documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <FileText size={36} className="mx-auto text-slate-400 mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">No Documents Uploaded Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  When no official documents have been uploaded, the public site displays: "Official annual reports and audited financial statements will be published here as they are reviewed and approved by the board of directors."
                </p>
                <Button onClick={addDocument} size="sm" variant="outline" className="gap-1.5">
                  <Plus size={14} /> Add First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.documents.map((doc, idx) => (
                  <div key={doc.id || idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Document Title */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Document Title</label>
                        <input
                          type="text"
                          value={doc.title}
                          onChange={(e) => {
                            const next = [...data.documents];
                            next[idx] = { ...next[idx], title: e.target.value };
                            setData({ ...data, documents: next });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white font-medium"
                          placeholder="e.g. Annual Audited Financial Report 2024"
                        />
                      </div>

                      {/* Document Type */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Document Type</label>
                        <select
                          value={doc.documentType}
                          onChange={(e) => {
                            const next = [...data.documents];
                            next[idx] = { ...next[idx], documentType: e.target.value as any };
                            setData({ ...data, documents: next });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                        >
                          <option value="Annual Report">Annual Report</option>
                          <option value="Audited Financial Statements">Audited Financial Statements</option>
                          <option value="Financial Summary">Financial Summary</option>
                          <option value="Program/Impact Report">Program/Impact Report</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Reporting Period / Year */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Period / Year</label>
                        <input
                          type="text"
                          value={doc.reportingPeriod}
                          onChange={(e) => {
                            const next = [...data.documents];
                            next[idx] = { ...next[idx], reportingPeriod: e.target.value };
                            setData({ ...data, documents: next });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                          placeholder="2024"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Publication Date</label>
                        <input
                          type="date"
                          value={doc.publicationDate || ''}
                          onChange={(e) => {
                            const next = [...data.documents];
                            next[idx] = { ...next[idx], publicationDate: e.target.value };
                            setData({ ...data, documents: next });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">File Size</label>
                        <input
                          type="text"
                          value={doc.fileSize}
                          onChange={(e) => {
                            const next = [...data.documents];
                            next[idx] = { ...next[idx], fileSize: e.target.value };
                            setData({ ...data, documents: next });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                          placeholder="e.g. 2.4 MB"
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={doc.isAudited}
                            onChange={(e) => {
                              const next = [...data.documents];
                              next[idx] = { ...next[idx], isAudited: e.target.checked };
                              setData({ ...data, documents: next });
                            }}
                            className="rounded text-emerald-600"
                          />
                          <span className="font-medium">Audited</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={doc.isPublished}
                            onChange={(e) => {
                              const next = [...data.documents];
                              next[idx] = { ...next[idx], isPublished: e.target.checked };
                              setData({ ...data, documents: next });
                            }}
                            className="rounded text-emerald-600"
                          />
                          <span className="font-medium">Published</span>
                        </label>
                      </div>
                    </div>

                    {/* File Upload / URL Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <div className="flex-1 min-w-[220px]">
                        <input
                          type="text"
                          value={doc.fileUrl}
                          onChange={(e) => {
                            const next = [...data.documents];
                            next[idx] = { ...next[idx], fileUrl: e.target.value };
                            setData({ ...data, documents: next });
                          }}
                          placeholder="PDF document URL (e.g. https://...)"
                          className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white text-slate-800"
                        />
                      </div>

                      <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                        <Upload size={14} />
                        <span>{uploadingDocId === doc.id ? 'Uploading...' : 'Upload PDF / Doc'}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          disabled={uploadingDocId === doc.id}
                          onChange={(e) => handleDocumentUpload(e, doc.id)}
                        />
                      </label>

                      {doc.fileUrl && doc.fileUrl !== '#' && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Open document in new tab"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}

                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STATEMENT ("Header & Transparency Statement") */}
      {/* ========================================================================= */}
      {activeTab === 'statement' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Page Header & Brand Presentation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={data.badge}
                  onChange={(e) => setData({ ...data, badge: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Financial Accountability & Stewardship"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Financial Transparency"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Page Subtitle</label>
              <textarea
                value={data.subtitle}
                onChange={(e) => setData({ ...data, subtitle: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="We are committed to transparency and accountability..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Official statement explaining RESTI's commitment to accountability in Kiryandongo District.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Transparency Callout Banner (Bottom of Page)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Callout Title</label>
                <input
                  type="text"
                  value={data.transparencyTitle}
                  onChange={(e) => setData({ ...data, transparencyTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Committed to Transparency"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Call to Action Button Text</label>
                <input
                  type="text"
                  value={data.transparencyButtonText}
                  onChange={(e) => setData({ ...data, transparencyButtonText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Request More Information"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Callout Statement</label>
              <textarea
                value={data.transparencyStatement}
                onChange={(e) => setData({ ...data, transparencyStatement: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="RESTI is committed to responsible stewardship of the resources entrusted to us..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Button Link Destination</label>
              <input
                type="text"
                value={data.transparencyButtonLink}
                onChange={(e) => setData({ ...data, transparencyButtonLink: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="/contact"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must point to the contact page (e.g. <code className="text-emerald-600">/contact</code> or <code className="text-emerald-600">https://resticbo.org/contact</code>). No localhost URLs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
