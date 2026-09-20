import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Download, FileText, TrendingUp, ShieldCheck, Eye, 
  CheckCircle2, FileCheck, Info, Calendar, DollarSign, 
  ArrowRight, ExternalLink, Building2, ChevronRight
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useScrollAnimation } from '../utils/animations';

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

const DEFAULT_DATA: FinancialTransparencyData = {
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

const CHART_FALLBACK_COLORS = ['#10b981', '#059669', '#0d9488', '#0284c7', '#6366f1', '#f59e0b', '#ec4899'];

export function FinancialReports() {
  const [data, setData] = useState<FinancialTransparencyData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);

  const { ref: animRef, isVisible } = useScrollAnimation();

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // 1. First try dedicated financial-transparency endpoint
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/financial-transparency`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData({
            ...DEFAULT_DATA,
            ...json.data,
            allocations: json.data.allocations || [],
            financialPeriods: json.data.financialPeriods || [],
            documents: json.data.documents || []
          });
          setLoading(false);
          return;
        }
      }

      // 2. Fallback to site-settings
      const settingsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (settingsRes.ok) {
        const sJson = await settingsRes.json();
        const fin = sJson.settings?.financialTransparency || sJson.settings?.financials;
        if (fin) {
          setData({
            ...DEFAULT_DATA,
            ...fin,
            allocations: fin.allocations || [],
            financialPeriods: fin.financialPeriods || [],
            documents: fin.documents || fin.reports || []
          });
        }
      }
    } catch (err) {
      console.warn('Could not load dynamic financial transparency data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter to published items on the frontend as extra safeguard
  const publishedAllocations = data.allocationsPublished ? data.allocations : [];
  const publishedPeriods = data.overviewPublished ? data.financialPeriods.filter(p => p.isPublished) : [];
  const publishedDocuments = data.documentsPublished ? data.documents.filter(d => d.isPublished) : [];

  const currentPeriod = publishedPeriods[selectedPeriodIndex] || publishedPeriods[0];

  const formatCurrency = (val: number | null | undefined, sym = '$') => {
    if (val === null || val === undefined) return '—';
    return `${sym}${Number(val).toLocaleString()}`;
  };

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* PAGE HEADER */}
        {/* ========================================================================= */}
        <div className="text-center mb-16 animate-[fadeInDown_0.8s_ease-out]">
          <span className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 uppercase tracking-wider border border-emerald-200/60">
            <ShieldCheck size={15} className="text-emerald-700" />
            {data.badge || 'Financial Accountability & Stewardship'}
          </span>
          <h1 className="text-[32px] sm:text-[40px] lg:text-[50px] font-extrabold font-heading text-slate-900 mb-4 leading-[1.15] tracking-tight">
            {data.title || 'Financial Transparency'}
          </h1>
          <p className="text-[16px] sm:text-[18px] font-normal leading-[1.65] text-slate-600 max-w-3xl mx-auto">
            {data.subtitle || 'We are committed to transparency and accountability. Learn how RESTI uses contributions to support communities, deliver programs, and strengthen sustainable development in Kiryandongo District.'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: HOW CONTRIBUTIONS ARE USED */}
        {/* ========================================================================= */}
        <div ref={animRef} className={`mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/80 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
                    {data.allocationsTitle || 'How Contributions Are Used'}
                  </h2>
                  {data.allocationsReportingPeriod && publishedAllocations.length > 0 && (
                    <span className="hidden sm:inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200">
                      {data.allocationsReportingPeriod}
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
                  {data.allocationsSubtitle || 'A transparent breakdown of how resources are deployed across programmatic, community, and administrative activities.'}
                </p>
              </div>

              {data.allocationsReportingPeriod && publishedAllocations.length > 0 && (
                <div className="sm:hidden">
                  <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200">
                    {data.allocationsReportingPeriod}
                  </span>
                </div>
              )}
            </div>

            {publishedAllocations.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Visual Donut Chart */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <div className="h-[280px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={publishedAllocations}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={105}
                          paddingAngle={4}
                          dataKey="percentage"
                          nameKey="name"
                        >
                          {publishedAllocations.map((entry, index) => (
                            <Cell 
                              key={`slice-${index}`} 
                              fill={entry.color || CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length]} 
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, 'Allocation']}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-2xl font-black text-slate-900">100%</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Allocated</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 text-center mt-2 font-medium">
                    Verified Operating Budget Breakdown ({data.allocationsCurrency || 'USD'})
                  </p>

                  {/* Accessible Screen-Reader Table */}
                  <table className="sr-only">
                    <caption>How Contributions Are Used Allocation Breakdown</caption>
                    <thead>
                      <tr>
                        <th scope="col">Category</th>
                        <th scope="col">Percentage</th>
                        <th scope="col">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publishedAllocations.map((cat, i) => (
                        <tr key={i}>
                          <td>{cat.name}</td>
                          <td>{cat.percentage}%</td>
                          <td>{cat.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Categories & Explanations */}
                <div className="lg:col-span-7 space-y-3.5">
                  {publishedAllocations.map((cat, index) => (
                    <div
                      key={cat.id || index}
                      className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color || CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length] }}
                            aria-hidden="true"
                          />
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                            {cat.name}
                          </h3>
                        </div>
                        <span className="text-sm sm:text-base font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 flex-shrink-0">
                          {cat.percentage}%
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">
                        {cat.description || 'Funding supporting RESTI programmatic and operational activities.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Honest Disclosure When Data Not Yet Entered / Published */
              <div className="p-8 sm:p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <Info size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Allocation Breakdown Under Review
                </h3>
                <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Fund allocation breakdown for this reporting period will be published following the conclusion of our annual financial review.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: FUNDING & FINANCIAL OVERVIEW */}
        {/* ========================================================================= */}
        <div className="mb-16">
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading mb-1.5">
                  {data.overviewTitle || 'Funding & Financial Overview'}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
                  {data.overviewSubtitle || 'Annual financial statements and funding summaries by reporting period.'}
                </p>
              </div>

              {/* Period Selector Tabs if multiple periods published */}
              {publishedPeriods.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
                  {publishedPeriods.map((period, idx) => (
                    <button
                      key={period.id || idx}
                      onClick={() => setSelectedPeriodIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedPeriodIndex === idx
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      aria-label={`View financial records for ${period.year}`}
                    >
                      {period.year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {publishedPeriods.length > 0 && currentPeriod ? (
              <div className="space-y-8">
                {/* Period Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white flex-shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                          Reporting Year: {currentPeriod.year}
                        </h3>
                        {currentPeriod.isAudited && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300/60">
                            <FileCheck size={12} /> Independently Audited
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {currentPeriod.reportingPeriodLabel || `Operating Year ${currentPeriod.year}`} • Currency: {currentPeriod.currency || 'USD'}
                        {currentPeriod.auditFirm && ` • Auditor: ${currentPeriod.auditFirm}`}
                      </p>
                    </div>
                  </div>

                  {currentPeriod.lastUpdated && (
                    <span className="text-xs text-slate-500 font-medium">
                      Last Updated: {new Date(currentPeriod.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Primary Figures: Income vs Expenditure */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Income</span>
                    <p className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1">
                      {formatCurrency(currentPeriod.totalIncome, currentPeriod.currencySymbol)}
                    </p>
                    <p className="text-[11px] text-emerald-700/80 mt-1">All revenue, donations & grants</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Expenditure</span>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      {formatCurrency(currentPeriod.totalExpenditure, currentPeriod.currencySymbol)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Programmatic & operational costs</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Grants & Funding</span>
                    <p className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-1">
                      {formatCurrency(currentPeriod.grantsFunding, currentPeriod.currencySymbol)}
                    </p>
                    <p className="text-[11px] text-blue-700/80 mt-1">Institutional & partner support</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Donation Income</span>
                    <p className="text-2xl sm:text-3xl font-extrabold text-teal-950 mt-1">
                      {formatCurrency(currentPeriod.donationIncome, currentPeriod.currencySymbol)}
                    </p>
                    <p className="text-[11px] text-teal-700/80 mt-1">Individual & community giving</p>
                  </div>
                </div>

                {/* Expenditure Breakdown Cards */}
                {(currentPeriod.programExpenditure !== null || currentPeriod.administrativeExpenditure !== null || currentPeriod.fundraisingExpenditure !== null) && (
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                      Expenditure Breakdown ({currentPeriod.currency || 'USD'})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs text-slate-500 font-semibold block">Program Services</span>
                        <span className="text-xl font-bold text-slate-900 block mt-1">
                          {formatCurrency(currentPeriod.programExpenditure, currentPeriod.currencySymbol)}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Direct community impact</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs text-slate-500 font-semibold block">Management & Operations</span>
                        <span className="text-xl font-bold text-slate-900 block mt-1">
                          {formatCurrency(currentPeriod.administrativeExpenditure, currentPeriod.currencySymbol)}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Governance & administration</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs text-slate-500 font-semibold block">Fundraising & Awareness</span>
                        <span className="text-xl font-bold text-slate-900 block mt-1">
                          {formatCurrency(currentPeriod.fundraisingExpenditure, currentPeriod.currencySymbol)}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Resource mobilization</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {currentPeriod.notes && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 flex items-start gap-2.5">
                    <Info size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{currentPeriod.notes}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Honest Message When Financial Data Has Not Yet Been Entered */
              <div className="p-8 sm:p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <DollarSign size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Financial Records In Preparation
                </h3>
                <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Financial information for this reporting period will be published following the completion of our financial reporting process.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: ANNUAL REPORTS & AUDITED FINANCIAL STATEMENTS */}
        {/* ========================================================================= */}
        <div className="mb-16">
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/80">
            <div className="mb-8 pb-6 border-b border-slate-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading mb-1.5">
                {data.documentsTitle || 'Annual Reports & Audited Financial Statements'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
                {data.documentsSubtitle || 'Access official annual reports, audited financial statements, and reporting disclosures.'}
              </p>
            </div>

            {publishedDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publishedDocuments.map((doc, idx) => (
                  <div 
                    key={doc.id || idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.documentType || 'Official Document'}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {doc.reportingPeriod}
                          </span>
                          {doc.isAudited && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                              <FileCheck size={11} /> Audited
                            </span>
                          )}
                        </div>
                        {doc.fileSize && (
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                            {doc.fileSize}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">
                        {doc.title}
                      </h3>

                      {doc.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400">
                        {doc.publicationDate ? `Published: ${doc.publicationDate}` : 'Official Record'}
                      </span>

                      <div className="flex items-center gap-2">
                        {doc.fileUrl && doc.fileUrl !== '#' ? (
                          <>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                              aria-label={`View ${doc.title} in new tab`}
                            >
                              <Eye size={13} /> View
                            </a>
                            <a
                              href={doc.fileUrl}
                              download
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                              aria-label={`Download ${doc.title}`}
                            >
                              <Download size={13} /> Download
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">File archived</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Honest Message When No Documents Published Yet */
              <div className="p-8 sm:p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <FileText size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Document Library
                </h3>
                <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Official annual reports and audited financial statements will be published here as they are reviewed and approved by the board of directors.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: COMMITMENT TO TRANSPARENCY CALLOUT */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white,transparent)] opacity-10 pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mb-6 border border-white/20">
              <ShieldCheck size={26} className="text-emerald-200" />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight">
              {data.transparencyTitle || 'Committed to Transparency'}
            </h3>
            <p className="mb-8 text-emerald-50 text-base sm:text-lg leading-relaxed font-normal">
              {data.transparencyStatement || 'RESTI is committed to responsible stewardship of the resources entrusted to us. We provide financial and program information to help donors, partners, community members, and other stakeholders understand how resources are managed and how they support our work.'}
            </p>
            <Link
              to={data.transparencyButtonLink || '/contact'}
              className="inline-flex items-center gap-2 bg-white text-emerald-800 font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-50 hover:shadow-xl transition-all text-sm sm:text-base group"
            >
              <span>{data.transparencyButtonText || 'Request More Information'}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
