import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Heart, BookOpen, Download, FileText, 
  DollarSign, MapPin, Award, ArrowUpRight, 
  RefreshCw, CheckCircle2, ShieldCheck, Sparkles, Building
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
  const [currency, setCurrency] = useState<'UGX' | 'USD'>('UGX');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/impact-stats`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        ),
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        )
      ]);

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.stats) {
          const s = statsJson.stats;
          setData(prev => ({
            ...prev,
            ...s,
            // Fallbacks for zero or missing values
            peopleServed: s.peopleServed && s.peopleServed > 0 ? s.peopleServed : prev.peopleServed,
            programsActive: s.programsActive && s.programsActive > 0 ? s.programsActive : prev.programsActive,
            volunteersActive: s.volunteersActive && s.volunteersActive > 0 ? s.volunteersActive : prev.volunteersActive,
            fundsRaised: s.fundsRaised && s.fundsRaised > 0 ? s.fundsRaised : prev.fundsRaised,
            communitiesReached: s.communitiesReached && s.communitiesReached > 0 ? s.communitiesReached : prev.communitiesReached,
            successRate: s.successRate && s.successRate > 0 ? s.successRate : prev.successRate,
            highlights: Array.isArray(s.highlights) && s.highlights.length > 0 ? s.highlights : prev.highlights,
            zones: Array.isArray(s.zones) && s.zones.length > 0 ? s.zones : prev.zones
          }));
        }
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
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatFunds = (amountUgx: number) => {
    if (currency === 'USD') {
      const usd = Math.round(amountUgx / 3750);
      return `$${usd.toLocaleString()} USD`;
    }
    return `UGX ${amountUgx.toLocaleString()}`;
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
        title="${data.heroTitle} | RESTI CBO" 
        description={data.heroSubtitle} 
      />

      {/* ── HERO BANNER ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white pt-32 pb-20 overflow-hidden border-b border-emerald-900/30">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Live Status Badge */}
          <div className="inline-flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6 backdrop-blur-md shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span>{data.heroBadge || 'Verified Community Impact'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight mb-5 text-white leading-tight">
            {data.heroTitle}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal mb-8">
            {data.heroSubtitle}
          </p>

          {/* Controls: Currency switch & Sync */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="inline-flex items-center bg-white/10 p-1 rounded-xl border border-white/15 backdrop-blur-md">
              <span className="text-xs font-semibold text-slate-300 px-3">Currency:</span>
              <button
                type="button"
                onClick={() => setCurrency('UGX')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currency === 'UGX' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                UGX
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currency === 'USD' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-white/15 transition-all text-slate-200 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-300'} />
              <span>{isRefreshing ? 'Refreshing...' : 'Live Sync'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 6 CORE IMPACT COUNTERS ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: People Served */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users size={22} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                Direct Reach
              </span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.peopleServed.toLocaleString()}+
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{data.peopleServedLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.peopleServedBadge}</p>
            </div>
          </div>

          {/* Card 2: Active Programs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen size={22} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                Active Pillars
              </span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.programsActive}
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{data.programsActiveLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.programsActiveBadge}</p>
            </div>
          </div>

          {/* Card 3: Community Volunteers */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Heart size={22} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                Community-Led
              </span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.volunteersActive}+
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{data.volunteersActiveLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.volunteersActiveBadge}</p>
            </div>
          </div>

          {/* Card 4: Funds Mobilized */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <DollarSign size={22} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                Transparent
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {formatFunds(data.fundsRaised)}
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{data.fundsRaisedLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.fundsRaisedBadge}</p>
            </div>
          </div>

          {/* Card 5: Settlement Zones */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MapPin size={22} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                Kiryandongo
              </span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.communitiesReached}
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{data.communitiesReachedLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.communitiesReachedBadge}</p>
            </div>
          </div>

          {/* Card 6: Success Rate */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <Award size={22} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                Verified
              </span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-heading text-slate-900 tracking-tight mb-1">
                {data.successRate}%
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{data.successRateLabel}</h3>
              <p className="text-xs text-slate-500 font-medium">{data.successRateBadge}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── KEY IMPACT HIGHLIGHTS ── */}
      {data.highlights && data.highlights.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <span className="text-emerald-700 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
              Grassroots Achievements
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-3">
              {data.highlightsTitle}
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto mt-2 font-normal">
              {data.highlightsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.highlights.map((hl) => (
              <div 
                key={hl.id} 
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      {hl.metric}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{hl.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {hl.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SETTLEMENT ZONES / FIELD WORK ── */}
      {data.zones && data.zones.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-800">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Where We Work
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white mt-3">
                {data.zonesTitle}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 font-normal">
                {data.zonesSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.zones.map((zone) => (
                <div 
                  key={zone.id} 
                  className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">{zone.name}</h3>
                    <div className="text-xs font-bold text-emerald-400 mb-2">{zone.beneficiaries}</div>
                    <p className="text-xs text-slate-300 font-normal leading-relaxed">
                      {zone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PUBLISHED ANNUAL REPORTS ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold font-heading text-slate-900">
                Published Annual Reports & Audits
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download verified statutory filings, audits, and program evaluations.
              </p>
            </div>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 w-fit"
            >
              <span>View All Publications</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.slice(0, 2).map((rep) => (
              <div 
                key={rep.id}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{rep.title}</h4>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-semibold">{rep.year}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2.5 line-clamp-2 font-normal">
                    {rep.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownload(rep.fileUrl, rep.title)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download PDF ({rep.fileSize || '4.5 MB'})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 sm:p-10 text-white shadow-lg text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
          <div className="max-w-xl mb-6 sm:mb-0">
            <span className="inline-flex items-center gap-1 text-emerald-300 text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full mb-3 border border-white/15">
              <ShieldCheck size={13} /> Get Involved
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white mb-2">
              {data.ctaTitle}
            </h3>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
              {data.ctaSubtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to={data.ctaButtonLink || '/donate'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all"
            >
              <span>{data.ctaButtonText || 'Donate Now'}</span>
              <ArrowUpRight size={15} />
            </Link>
            <Link
              to="/reports"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl border border-white/20 transition-all"
            >
              <span>View Audit Reports</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
