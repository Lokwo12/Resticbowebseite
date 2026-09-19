import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Droplets, TreePine, Users, HeartHandshake, 
  GraduationCap, Download, ArrowRight, ShieldCheck, 
  Heart, Sparkles, Compass, CheckCircle2, Quote
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { toast } from 'sonner';
import { 
  DEFAULT_IMPACT_DATA, 
  FullImpactData, 
  ImpactArea,
  normalizeImpactData 
} from './admin/ImpactDashboardManager';

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
    title: 'Annual Impact & Activity Report 2025',
    year: '2025',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    description: 'Overview of community-led initiatives, skills workshops, and local partnerships in Kiryandongo District.',
    fileSize: '3.8 MB',
    category: 'Annual Report'
  },
  {
    id: 'rep-2024',
    title: 'Kiryandongo Settlement Community Initiatives 2024',
    year: '2024',
    fileUrl: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/sample-report.pdf',
    description: 'Summary of community dialogue, clean-up activities, and beekeeping pilot project.',
    fileSize: '3.1 MB',
    category: 'Field Summary'
  }
];

// Helper to resolve dynamic icon
function renderAreaIcon(name: string) {
  const props = { size: 26, className: "text-emerald-700" };
  switch (name) {
    case 'Briefcase': return <Briefcase {...props} />;
    case 'Droplets': return <Droplets {...props} />;
    case 'TreePine': return <TreePine {...props} />;
    case 'Users': return <Users {...props} />;
    case 'HeartHandshake': return <HeartHandshake {...props} />;
    case 'GraduationCap': return <GraduationCap {...props} />;
    case 'Heart': return <Heart {...props} />;
    default: return <ShieldCheck {...props} />;
  }
}

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

      let merged: any = {};

      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        if (settingsJson.settings?.impactDashboard) {
          merged = { ...merged, ...settingsJson.settings.impactDashboard };
        }
      }

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.stats) {
          merged = { ...merged, ...statsJson.stats };
        }
      }

      if (Object.keys(merged).length > 0) {
        setData(normalizeImpactData(merged));
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
            fileSize: r.value?.fileSize || r.fileSize || '3.5 MB',
            category: r.value?.category || r.category || 'Annual Report'
          }));
          setReports(mapped);
        }
      }
    } catch (e) {
      console.warn('Impact data fetch fallback:', e);
    }
  };

  const handleDownload = (fileUrl: string, title: string) => {
    if (!fileUrl || fileUrl === '#') {
      toast.info(`Downloading ${title}...`, {
        description: 'Resource copy is being retrieved.'
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

      {/* ── 1. AUTHENTIC HERO & MISSION SECTION ── */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {data.heroBadge}
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            {data.heroTitle}
          </h1>

          {/* Subtitle / Core Tagline */}
          <p className="text-xl sm:text-2xl font-medium text-emerald-300/95 max-w-3xl mx-auto mb-10 leading-snug">
            {data.heroSubtitle}
          </p>

          {/* Two Grounded Mission Paragraphs */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 text-left space-y-4 shadow-xl backdrop-blur-sm">
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
              {data.heroIntroP1}
            </p>
            <div className="h-px bg-white/10 w-full" />
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              {data.heroIntroP2}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. OUR AREAS OF IMPACT ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest bg-emerald-100 px-3.5 py-1 rounded-full mb-3">
            <Compass size={13} />
            Holistic Community Pillars
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {data.areasTitle}
          </h2>
          <p className="text-slate-600 mt-3 text-base sm:text-lg">
            {data.areasSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.areas.map((area: ImpactArea, index: number) => (
            <div 
              key={area.id || index}
              className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    {renderAreaIcon(area.icon)}
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  {area.title}
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  {area.description}
                </p>
              </div>

              {area.activityHighlight && (
                <div className="bg-slate-50 border-l-2 border-emerald-500 rounded-r-xl p-3.5 text-xs text-slate-700 leading-relaxed mt-4">
                  <span className="font-semibold text-emerald-800 block mb-1">Key Activities:</span>
                  {area.activityHighlight}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. STORIES OF CHANGE (e.g. Okello John) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-100 to-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-widest bg-amber-100 px-3.5 py-1 rounded-full mb-3">
              <Quote size={13} />
              Personal Journeys
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {data.storiesTitle}
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              {data.storiesSubtitle}
            </p>
          </div>

          <div className="space-y-8">
            {data.stories.map((story, idx) => (
              <div 
                key={story.id || idx}
                className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-md flex flex-col md:flex-row gap-8 items-start hover:shadow-xl transition-all duration-300"
              >
                {/* Avatar / Initials */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg">
                    {story.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-center">
                    {story.role}
                  </span>
                </div>

                {/* Narrative */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">
                      {story.name}
                    </h3>
                    <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                      {story.role}
                    </p>
                  </div>

                  <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-3">
                    {story.story.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {story.quote && (
                    <div className="relative pl-5 border-l-4 border-amber-400 italic text-slate-800 font-serif text-sm sm:text-base py-1">
                      "{story.quote}"
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      to={story.linkUrl || '/stories'}
                      className="inline-flex items-center gap-2 font-bold text-emerald-700 hover:text-emerald-800 text-sm hover:underline transition-colors"
                    >
                      <span>{story.linkText || "Read story →"}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. OUR COMMUNITY APPROACH ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                <Sparkles size={13} />
                Guiding Philosophy
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {data.approachTitle}
              </h2>
              <p className="text-emerald-300 font-semibold text-lg leading-snug">
                "{data.approachLead}"
              </p>
            </div>

            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                {data.approachDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. LOOKING AHEAD & ACCOUNTABILITY (MEAL) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-emerald-50/70 border-2 border-emerald-200/80 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/70 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full mb-2">
                <ShieldCheck size={14} />
                Rigorous Transparency & MEAL
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {data.lookingAheadTitle}
              </h3>
            </div>
          </div>

          <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
            {data.lookingAheadDescription}
          </p>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <p className="text-sm sm:text-base font-semibold text-emerald-950">
              {data.lookingAheadNote}
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {data.lookingAheadPillars.map((pillar, pIdx) => (
                <span 
                  key={pIdx}
                  className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl border border-emerald-200"
                >
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  {pillar}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. PUBLISHED IMPACT REPORTS ── */}
      {reports.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Download Reports & Documentation</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access published documentation and field summaries.
                </p>
              </div>
              <Link 
                to="/reports" 
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                View all publications <ArrowRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {reports.slice(0, 3).map(rep => (
                <div key={rep.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {rep.year}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{rep.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{rep.description}</p>
                  </div>

                  <button
                    onClick={() => handleDownload(rep.fileUrl, rep.title)}
                    className="inline-flex items-center gap-2 text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors flex-shrink-0"
                  >
                    <Download size={13} />
                    Download PDF ({rep.fileSize || 'PDF'})
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. CALL TO ACTION ── */}
      <section className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center mt-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {data.ctaTitle}
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto">
            {data.ctaSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to={data.ctaPrimaryLink || '/donate'}
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold px-8 py-3.5 rounded-2xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-base inline-flex items-center gap-2"
            >
              <span>{data.ctaPrimaryText || 'Support Our Mission'}</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              to={data.ctaSecondaryLink || '/contact'}
              className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 hover:text-white font-bold px-7 py-3.5 rounded-2xl border border-sky-400/30 hover:border-sky-400/60 transition-all text-base inline-flex items-center gap-2"
            >
              {data.ctaSecondaryText || 'Contact Us'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
