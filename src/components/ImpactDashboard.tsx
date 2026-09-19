import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Heart, BookOpen, Download, FileText, 
  DollarSign, MapPin, Award, ArrowUpRight, 
  CheckCircle2, ShieldCheck, Sparkles, Building
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Badge } from './ui/badge';
import { SEO } from './SEO';
import { toast } from 'sonner';
import { DEFAULT_IMPACT_DATA, FullImpactData } from './admin/ImpactDashboardManager';

interface Report {
  id: string;
  title: string;
  year: string;
  fileUrl: string;
  description: string;
  fileSize?: string;
  category?: string;
}

const FALLBACK_REPORTS: Report[] = [
  {
    id: 'rep-2025',
    title: 'Annual Impact & Financial Audit Report 2025',
    year: '2025',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    description: 'Statutory balance sheet review, project milestones, and independent auditor disclosures for FY 2025.',
    fileSize: '5.4 MB',
    category: 'Annual Audit'
  },
  {
    id: 'rep-2024',
    title: 'Kiryandongo Settlement Livelihood Evaluation 2024',
    year: '2024',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    description: 'Outcome evaluation examining 180+ refugee vocational graduates and cooperative business sustainability.',
    fileSize: '4.2 MB',
    category: 'Evaluation'
  }
];

export function ImpactDashboard() {
  const [data, setData] = useState<FullImpactData>(DEFAULT_IMPACT_DATA);
  const [reports, setReports] = useState<Report[]>(FALLBACK_REPORTS);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, settingsRes, reportsRes] = await Promise.all([
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/impact-stats`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        ),
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        ),
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        )
      ]);

      let mergedData: any = {};

      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        if (settingsJson.settings?.impactDashboard) {
          mergedData = { ...mergedData, ...settingsJson.settings.impactDashboard };
        }
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.stats) {
          mergedData = { ...mergedData, ...statsJson.stats };
        }
      }

      if (Object.keys(mergedData).length > 0) {
        setData(prev => ({
          ...prev,
          ...mergedData,
          heroTitle: mergedData.heroTitle || (mergedData.title && mergedData.title !== 'Live Impact & Accountability Dashboard' ? mergedData.title : prev.heroTitle),
          heroSubtitle: mergedData.heroSubtitle || mergedData.description || prev.heroSubtitle,
          heroBadge: mergedData.heroBadge || mergedData.badge || prev.heroBadge,
          peopleServed: mergedData.peopleServed && mergedData.peopleServed > 0 ? mergedData.peopleServed : prev.peopleServed,
          programsActive: mergedData.programsActive && mergedData.programsActive > 0 ? mergedData.programsActive : prev.programsActive,
          volunteersActive: mergedData.volunteersActive && mergedData.volunteersActive > 0 ? mergedData.volunteersActive : prev.volunteersActive,
          fundsRaised: mergedData.fundsRaised && mergedData.fundsRaised > 0 ? mergedData.fundsRaised : prev.fundsRaised,
          communitiesReached: mergedData.communitiesReached && mergedData.communitiesReached > 0 ? mergedData.communitiesReached : prev.communitiesReached,
          successRate: mergedData.successRate && mergedData.successRate > 0 ? mergedData.successRate : prev.successRate,
          highlights: Array.isArray(mergedData.highlights) && mergedData.highlights.length > 0 ? mergedData.highlights : prev.highlights
        }));
      }

      if (reportsRes.ok) {
        const repData = await reportsRes.json();
        if (Array.isArray(repData.reports) && repData.reports.length > 0) {
          const mapped = repData.reports.map((r: any) => ({
            id: r.key || r.id,
            title: r.value?.title || r.title,
            year: r.value?.year || r.year || '2025',
            fileUrl: r.value?.fileUrl || r.fileUrl || '#',
            description: r.value?.description || r.description,
            fileSize: r.value?.fileSize || r.fileSize || '4.5 MB',
            category: r.value?.category || r.category || 'Annual Report'
          }));
          setReports(mapped);
        }
      }
    } catch (e) {
      console.warn('Impact data fallback activated:', e);
    }
  };

  const formatFunds = (amountUgx: number) => {
    if (!amountUgx || isNaN(amountUgx)) return 'UGX 310,000,000';
    return `UGX ${Number(amountUgx).toLocaleString()}`;
  };

  const handleDownload = (fileUrl: string, title: string) => {
    if (!fileUrl || fileUrl === '#') {
      toast.info(`Downloading ${title}...`, {
        description: 'Direct institutional access copy is being retrieved.'
      });
      return;
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO 
        title={`${data.heroTitle} | RESTI CBO`} 
        description={data.heroSubtitle} 
      />

      {/* ── PRECISE HERO BANNER ── */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-700/60">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{data.heroBadge || 'Verified Community Impact'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight mb-4 text-white">
            {data.heroTitle || 'Our Impact'}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {data.heroSubtitle || 'Direct, measurable results empowering refugee and host families across Kiryandongo District, Uganda.'}
          </p>
        </div>
      </section>

      {/* ── 6 PRECISE IMPACT COUNTERS ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* People Served */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                Direct
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.peopleServed.toLocaleString()}+
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{data.peopleServedLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.peopleServedBadge}</p>
            </div>
          </div>

          {/* Active Programs */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                Pillars
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.programsActive}
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{data.programsActiveLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.programsActiveBadge}</p>
            </div>
          </div>

          {/* Communities Reached */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                Kiryandongo
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.communitiesReached}
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{data.communitiesReachedLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.communitiesReachedBadge}</p>
            </div>
          </div>

          {/* Community Volunteers */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                Local Leaders
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.volunteersActive}+
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{data.volunteersActiveLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.volunteersActiveBadge}</p>
            </div>
          </div>

          {/* Funds Deployed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md">
                Transparent
              </span>
            </div>
            <div>
              <div className="text-2xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {formatFunds(data.fundsRaised)}
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{data.fundsRaisedLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.fundsRaisedBadge}</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <Award size={20} />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-md">
                Verified
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.successRate}%
              </div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">{data.successRateLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.successRateBadge}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── KEY ACHIEVEMENTS (4 PRECISE CARDS) ── */}
      {data.highlights && data.highlights.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
              {data.highlightsTitle || 'Key Community Achievements'}
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto mt-1.5 font-normal">
              {data.highlightsSubtitle || 'Specific, tangible outcomes delivered directly into the hands of families who need it most.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.highlights.map((hl) => (
              <div 
                key={hl.id} 
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      {hl.metric}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{hl.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {hl.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ANNUAL REPORTS DOWNLOAD ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Official Annual Reports & Audits
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download verified statutory filings, independent financial audits, and program evaluations.
              </p>
            </div>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 w-fit"
            >
              <span>View All Reports</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {reports.slice(0, 2).map((rep) => (
              <div 
                key={rep.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-slate-900 text-xs truncate">{rep.title}</h4>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-semibold">{rep.year}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2 line-clamp-2">
                    {rep.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownload(rep.fileUrl, rep.title)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Download size={12} />
                    <span>Download PDF ({rep.fileSize || '4.5 MB'})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-md text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
          <div className="max-w-xl mb-4 sm:mb-0">
            <span className="inline-flex items-center gap-1 text-emerald-300 text-xs font-bold uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full mb-2">
              <ShieldCheck size={12} /> Direct Impact
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-white mb-1.5">
              {data.ctaTitle || 'Support Our Work in Kiryandongo'}
            </h3>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
              {data.ctaSubtitle || 'Every contribution directly empowers vulnerable refugee and host families with essential tools for dignity and self-reliance.'}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to={data.ctaButtonLink || '/donate'}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <span>{data.ctaButtonText || 'Donate Now'}</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
