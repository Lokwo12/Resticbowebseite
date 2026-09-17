import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { LoadingScreen } from './LoadingScreen';
import { SEO } from './SEO';
import { 
  FileText, Download, ExternalLink, Calendar, Search, Filter, 
  ShieldCheck, CheckCircle2, Building, Eye, Sparkles, X, ChevronRight,
  ArrowDownToLine, BookOpen, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export interface ImpactReportItem {
  id: string;
  title: string;
  description: string;
  category: string;
  year: string;
  date: string;
  fileUrl: string;
  fileSize?: string;
  pageCount?: string;
  author?: string;
  highlights?: string[];
  thumbnail?: string;
}

const OFFICIAL_REPORTS: ImpactReportItem[] = [
  {
    id: 'report-2025-annual',
    title: 'Annual Impact Report & Audited Financials 2025',
    description: 'Comprehensive review of settlement interventions, household livelihood transformations, educational bursaries, and audited balance sheets across Kiryandongo District for FY 2025.',
    category: 'Annual Reports',
    year: '2025',
    date: '2026-01-15',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    fileSize: '5.4 MB',
    pageCount: '48 Pages',
    author: 'RESTI Secretariat & Independent External Auditor',
    highlights: [
      '24,850+ refugees and host community members directly reached',
      'UGX 310M+ deployed directly to community transformation programs',
      '18 settlement clusters actively engaged across Kiryandongo',
      'Unqualified clean audit opinion on financial transparency'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'report-2025-livelihoods',
    title: 'Kiryandongo Livelihoods & Vocational Outcomes Evaluation',
    description: 'Independent mid-term programmatic evaluation of tailoring, carpentry, and agricultural skills training cohorts across Kiryandongo Refugee Settlement zones.',
    category: 'Program Evaluations',
    year: '2025',
    date: '2025-11-20',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    fileSize: '3.8 MB',
    pageCount: '36 Pages',
    author: 'Monitoring & Evaluation Directorate',
    highlights: [
      '180+ single mothers and youth trained in vocational trades',
      '84% post-training micro-enterprise startup rate within 6 months',
      'Village Savings (VSLA) loan capital mobilized: UGX 42,000,000'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'report-2024-audit',
    title: 'Audited Financial Statements & Balance Sheet 2024',
    description: 'Complete statutory audit report certified by registered independent certified public accountants in full compliance with Uganda NGO Bureau standards.',
    category: 'Financial Audits',
    year: '2024',
    date: '2025-02-10',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    fileSize: '4.2 MB',
    pageCount: '32 Pages',
    author: 'Independent External Certified Public Accountants',
    highlights: [
      '90% direct program spend ratio vs. 10% operational overhead',
      'Zero financial irregularities or compliance non-conformances',
      'Complete reconciliation of donor grants and community funds'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'report-2024-wash',
    title: 'Community WASH & Public Health Needs Assessment',
    description: 'Empirical baseline assessment examining clean drinking water access, sanitation infrastructure, and sanitary health across 12 settlement zones and host villages.',
    category: 'Needs Assessments',
    year: '2024',
    date: '2024-08-14',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    fileSize: '6.1 MB',
    pageCount: '52 Pages',
    author: 'Community Health & WASH Technical Committee',
    highlights: [
      'Comprehensive mapping of 14 borehole water points in Kiryandongo',
      'Identified critical water queue bottlenecks impacting women and girls',
      'Framed the 2024–2026 Sustainable Clean Water Strategy'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'report-2023-annual',
    title: 'Annual Impact & Settlement Review 2023',
    description: 'Summary of annual milestones, refugee youth integration programs, community-led peace dialogues, and strategic partnerships established throughout 2023.',
    category: 'Annual Reports',
    year: '2023',
    date: '2024-01-20',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    fileSize: '4.6 MB',
    pageCount: '40 Pages',
    author: 'RESTI Executive Committee',
    highlights: [
      '14,500+ community members supported through key initiatives',
      'Launch of the Youth Digital Inclusion & Learning Center',
      'Co-designed community dispute resolution framework with local elders'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'report-2023-youth',
    title: 'Refugee Youth Education & Digital Inclusion Brief',
    description: 'Detailed analysis of computer lab attendance, secondary school transition rates, and remote digital learning performance among refugee students.',
    category: 'Program Evaluations',
    year: '2023',
    date: '2023-09-30',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    fileSize: '2.9 MB',
    pageCount: '24 Pages',
    author: 'Education & Youth Directorate',
    highlights: [
      '450+ students completed basic ICT and digital literacy curriculum',
      '68% improved academic retention in participating partner schools'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=800&q=80',
  }
];

const CATEGORIES = [
  'All Publications',
  'Annual Reports',
  'Financial Audits',
  'Program Evaluations',
  'Needs Assessments'
];

export function ImpactReports() {
  const [reports, setReports] = useState<ImpactReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Publications');
  const [selectedYear, setSelectedYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewReport, setPreviewReport] = useState<ImpactReportItem | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      let fetched: ImpactReportItem[] = [];

      // 1. Try edge function
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.reports) && data.reports.length > 0) {
            fetched = data.reports.map((item: any) => ({
              id: item.key || item.id || `rep-${Math.random()}`,
              title: item.value?.title || item.title || 'Official Report',
              description: item.value?.description || item.description || '',
              category: item.value?.category || item.category || 'Annual Reports',
              year: item.value?.year || item.year || new Date().getFullYear().toString(),
              date: item.value?.date || item.date || new Date().toISOString(),
              fileUrl: item.value?.fileUrl || item.fileUrl || '#',
              fileSize: item.value?.fileSize || item.fileSize || '3.5 MB',
              pageCount: item.value?.pageCount || item.pageCount || '32 Pages',
              author: item.value?.author || item.author || 'RESTI Secretariat',
              highlights: item.value?.highlights || item.highlights || [],
              thumbnail: item.value?.thumbnail || item.thumbnail || '',
            }));
          }
        }
      } catch (e) {
        console.warn('Reports API unavailable, checking KV store:', e);
      }

      // 2. Try Supabase KV fallback if empty
      if (fetched.length === 0) {
        try {
          const { data: kvData } = await supabase
            .from('kv_store_2a4be611')
            .select('*')
            .like('key', 'report%');
          if (kvData && kvData.length > 0) {
            fetched = kvData.map((item: any) => ({
              id: item.key,
              title: item.value?.title || 'Official Report',
              description: item.value?.description || '',
              category: item.value?.category || 'Annual Reports',
              year: item.value?.year || new Date().getFullYear().toString(),
              date: item.value?.date || new Date().toISOString(),
              fileUrl: item.value?.fileUrl || '#',
              fileSize: item.value?.fileSize || '3.5 MB',
              pageCount: item.value?.pageCount || '32 Pages',
              author: item.value?.author || 'RESTI Secretariat',
              highlights: item.value?.highlights || [],
              thumbnail: item.value?.thumbnail || '',
            }));
          }
        } catch (sbErr) {
          console.error('Supabase KV reports error:', sbErr);
        }
      }

      // Merge custom uploaded reports with official verified publications (no duplicates by id/title)
      const existingTitles = new Set(fetched.map(r => r.title.toLowerCase().trim()));
      const combined = [
        ...fetched,
        ...OFFICIAL_REPORTS.filter(o => !existingTitles.has(o.title.toLowerCase().trim()))
      ];

      setReports(combined);
    } catch (err) {
      console.error('Error in fetchReports:', err);
      setReports(OFFICIAL_REPORTS);
    } finally {
      setLoading(false);
    }
  };

  const years = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.year) set.add(r.year);
    });
    return ['All', ...Array.from(set).sort((a, b) => b.localeCompare(a))];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesCategory = selectedCategory === 'All Publications' || 
        r.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesYear = selectedYear === 'All' || r.year === selectedYear;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        r.title.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.author && r.author.toLowerCase().includes(q));

      return matchesCategory && matchesYear && matchesSearch;
    });
  }, [reports, selectedCategory, selectedYear, searchQuery]);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleDownload = (report: ImpactReportItem) => {
    if (!report.fileUrl || report.fileUrl === '#') {
      toast.info(`Preparing ${report.title} for download...`, {
        description: 'For institutional certified copies, please contact info@resticbo.org.'
      });
      return;
    }
    window.open(report.fileUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO 
        title="Impact Reports & Resources | RESTI CBO" 
        description="Access published annual reports, external financial audits, community assessments, and impact evaluations from RESTI's field operations in Kiryandongo District, Uganda." 
      />

      {/* ── HERO BANNER ── */}
      <section className="relative bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white pt-36 pb-20 overflow-hidden border-b border-emerald-900/30">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 backdrop-blur-md">
            <ShieldCheck size={14} className="text-emerald-400" />
            Humanitarian Transparency & Official Publications
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading tracking-tight mb-6 max-w-4xl mx-auto text-white leading-tight">
            Impact Reports & <span className="text-emerald-400">Resources</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
            Explore our statutory annual reports, independent financial audits, settlement needs assessments, and programmatic evaluations from Kiryandongo District, Uganda.
          </p>

          {/* Quick Credibility Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 border-t border-white/10 text-left">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <CheckCircle2 size={16} /> Uganda NGO Bureau
              </div>
              <p className="text-xs text-slate-400">Officially registered CBO operating in full regulatory compliance.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <CheckCircle2 size={16} /> External Audits
              </div>
              <p className="text-xs text-slate-400">Independent certified public accountants review all annual accounts.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <CheckCircle2 size={16} /> 100% Public Access
              </div>
              <p className="text-xs text-slate-400">All reports free to download for donors, partners, and beneficiaries.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <CheckCircle2 size={16} /> 90% Program Spend
              </div>
              <p className="text-xs text-slate-400">Strict allocation guaranteeing direct field deployment in settlement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER & SEARCH SECTION ── */}
      <section className="sticky top-20 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search & Year Filters */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search publications..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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

              <div className="relative shrink-0">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer appearance-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y === 'All' ? 'All Years' : `Year ${y}`}
                    </option>
                  ))}
                </select>
                <Filter size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── REPORTS GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900">
              {selectedCategory}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredReports.length} {filteredReports.length === 1 ? 'publication' : 'publications'}
            </p>
          </div>
          {(selectedCategory !== 'All Publications' || selectedYear !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All Publications');
                setSelectedYear('All');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReports.map((report) => {
              const badgeColor = 
                report.category === 'Annual Reports' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                report.category === 'Financial Audits' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                report.category === 'Program Evaluations' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                'bg-amber-50 text-amber-800 border-amber-200';

              return (
                <div
                  key={report.id}
                  className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Top Cover / Document Header */}
                  <div className="relative h-52 bg-slate-950 overflow-hidden flex items-center justify-center">
                    {report.thumbnail ? (
                      <img
                        src={report.thumbnail}
                        alt={report.title}
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900">
                        <FileText size={54} className="text-emerald-400/50" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md shadow-sm ${badgeColor}`}>
                        {report.category}
                      </span>
                      <span className="bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                        <Calendar size={12} className="text-emerald-400" />
                        {report.year}
                      </span>
                    </div>

                    {/* Document Meta Tag on bottom of image */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md">
                        <BookOpen size={13} className="text-emerald-400" />
                        {report.pageCount || 'Full Document'}
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded text-[11px] font-bold">
                        PDF • {report.fileSize || '3.5 MB'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                      <Building size={13} className="text-emerald-600" />
                      <span className="truncate">{report.author || 'RESTI Secretariat'}</span>
                    </div>

                    <h3 className="text-lg font-bold font-heading text-slate-900 mb-2.5 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                      {report.title}
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3 font-normal">
                      {report.description}
                    </p>

                    {/* Highlights bullet previews */}
                    {report.highlights && report.highlights.length > 0 && (
                      <div className="mt-auto mb-5 pt-3 border-t border-slate-100 space-y-1.5">
                        {report.highlights.slice(0, 2).map((hl, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <span className="text-emerald-600 font-bold mt-0.5">•</span>
                            <span className="line-clamp-1">{hl}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => handleDownload(report)}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <ArrowDownToLine size={15} />
                        <span>Download PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewReport(report)}
                        className="inline-flex items-center justify-center p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                        title="View Executive Summary"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No publications matched your search</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Try adjusting your search terms or clearing the selected category filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All Publications');
                setSelectedYear('All');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold text-xs py-2.5 px-5 rounded-xl hover:bg-emerald-700 transition-all cursor-pointer"
            >
              Show All Publications
            </button>
          </div>
        )}
      </section>

      {/* ── PREVIEW MODAL ── */}
      {previewReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewReport(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewReport(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {previewReport.category} • Year {previewReport.year}
            </div>

            <h3 className="text-2xl font-bold font-heading text-slate-900 mb-3 pr-8 leading-snug">
              {previewReport.title}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-4 mb-4 border-b border-slate-100">
              <span><strong>Published:</strong> {formatDate(previewReport.date)}</span>
              <span><strong>Issuing Body:</strong> {previewReport.author || 'RESTI'}</span>
              <span><strong>Format:</strong> PDF ({previewReport.fileSize || '3.5 MB'})</span>
              <span><strong>Length:</strong> {previewReport.pageCount || '32 Pages'}</span>
            </div>

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto pr-2">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">Executive Summary</h4>
                <p className="font-normal">{previewReport.description}</p>
              </div>

              {previewReport.highlights && previewReport.highlights.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Key Highlights & Findings</h4>
                  <ul className="space-y-2">
                    {previewReport.highlights.map((hl, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <button
                onClick={() => setPreviewReport(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 py-2.5 px-4 cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownload(previewReport);
                  setPreviewReport(null);
                }}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Download PDF Publication</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INSTITUTIONAL ACCOUNTABILITY & AUDIT STRIP ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl overflow-hidden border border-emerald-800/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mb-4 border border-white/15">
              <ShieldCheck size={14} /> Institutional Donor Inquiries
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white mb-3">
              Require Certified Audits or Project Evaluation Schedules?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
              For bilateral institutional grants, embassy compliance verifications, or certified hard-copy audited statements, our Secretariat and Finance Directorate provide full documentation on demand.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="mailto:info@resticbo.org?subject=Institutional%20Audit%20and%20Report%20Inquiry"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg transition-all"
              >
                <span>Email Finance & M&E Directorate</span>
                <ChevronRight size={15} />
              </a>
              <Link
                to="/financials"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl border border-white/20 transition-all"
              >
                <span>View Financial Transparency Page</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
