import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { 
  FileText, Download, ShieldCheck, CheckCircle2, 
  Search, Filter, DollarSign, Activity, Users, Globe, 
  ArrowRight, ChevronRight, Compass, Sparkles, X, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  DEFAULT_IMPACT_REPORTS_DATA, 
  FullImpactReportsData, 
  PublicationItem, 
  AccountabilityPillar,
  normalizeImpactReportsData 
} from './admin/ImpactReportsManager';

export function ImpactReports() {
  const [data, setData] = useState<FullImpactReportsData>(DEFAULT_IMPACT_REPORTS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch site settings
      const settingsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      if (settingsRes.ok) {
        const json = await settingsRes.json();
        if (json.settings?.impactReports) {
          setData(normalizeImpactReportsData(json.settings.impactReports));
          return;
        }
      }

      // 2. Also try fetching custom uploaded reports from /reports endpoint if any
      const reportsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      if (reportsRes.ok) {
        const rJson = await reportsRes.json();
        if (Array.isArray(rJson.reports) && rJson.reports.length > 0) {
          const customPubs: PublicationItem[] = rJson.reports.map((r: any) => ({
            id: r.key || r.id,
            title: r.value?.title || r.title,
            category: r.value?.category || r.category || 'Annual Reports',
            subCategory: r.value?.subCategory || `${r.value?.year || r.year || '2025'} | RESTI CBO`,
            year: r.value?.year || r.year || '2025',
            description: r.value?.description || r.description || '',
            fileUrl: r.value?.fileUrl || r.fileUrl || '#',
            fileSize: r.value?.fileSize || r.fileSize || '3.5 MB',
            actionText: 'Download Report →'
          }));

          // Set custom reports directly without reviving mock defaults
          setData(prev => ({
            ...prev,
            publications: customPubs
          }));
        }
      }
    } catch (err) {
      console.warn('Reports fetch error fallback to defaults:', err);
    }
  };

  const handleDownload = (pub: PublicationItem) => {
    if (!pub.fileUrl || pub.fileUrl === '#') {
      toast.info(`Preparing ${pub.title}...`, {
        description: 'Official verified copy will open shortly.'
      });
      return;
    }
    window.open(pub.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    data.publications.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [data.publications]);

  const filteredPublications = useMemo(() => {
    return data.publications.filter(p => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        (p.subCategory && p.subCategory.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [data.publications, selectedCategory, searchQuery]);

  const renderPillarIcon = (iconName: string) => {
    const props = { size: 24, className: "text-emerald-700" };
    switch (iconName) {
      case 'DollarSign': return <DollarSign {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'Users': return <Users {...props} />;
      case 'Globe': return <Globe {...props} />;
      default: return <ShieldCheck {...props} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO 
        title="RESTI CBO | Impact Reports" 
        description={data.heroIntroP1} 
      />

      {/* ── 1. HERO SECTION ── */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
            <ShieldCheck size={14} className="text-emerald-400" />
            {data.heroBadge}
          </div>

          <h1 className="text-[32px] sm:text-[36px] lg:text-[48px] font-bold sm:font-extrabold font-heading tracking-tight text-white mb-6 leading-[1.1]">
            {data.heroTitle}
          </h1>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 text-left space-y-4 shadow-xl backdrop-blur-sm">
            <p className="text-[17px] text-slate-200 leading-[1.6] font-normal">
              {data.heroIntroP1}
            </p>
            <div className="h-px bg-white/10 w-full" />
            <p className="text-[17px] text-slate-300 leading-[1.6] font-normal">
              {data.heroIntroP2}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. ORGANIZATIONAL ACCOUNTABILITY ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest bg-emerald-100 px-3.5 py-1 rounded-full mb-3">
            <ShieldCheck size={13} />
            Governance & Standards
          </div>
          <h2 className="text-[28px] sm:text-[30px] lg:text-[36px] font-bold font-heading text-slate-900 tracking-tight leading-[1.2]">
            {data.accountabilityTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.accountabilityPillars.map((pillar: AccountabilityPillar, index: number) => (
            <div 
              key={pillar.id || index}
              className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
                  {renderPillarIcon(pillar.icon)}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {pillar.title}
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. PUBLICATIONS ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest bg-emerald-200/60 px-3 py-1 rounded-full mb-2">
                <FileText size={13} />
                Official Documentation
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {data.publicationsTitle}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {data.publicationsSubtitle}
              </p>
            </div>

            {/* Search */}
            {data.publications.length > 0 && (
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search publications..."
                  className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            )}
          </div>

          {/* Category Filter Pills */}
          {data.publications.length > 0 && categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Publications Content or Empty State */}
          {data.publications.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/90 shadow-sm max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                No Publications Published Yet
              </h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Official reports, policy briefs, and programmatic evaluations are currently being prepared and reviewed. They will be published here as soon as approved for public release.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-[#1a2540] hover:bg-[#233256] text-white font-semibold text-xs sm:text-sm py-2.5 px-5 rounded-xl transition-all shadow-sm"
                >
                  <Mail size={15} />
                  <span>Request Document / Inquire</span>
                </Link>
                <Link
                  to="/financials"
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm py-2.5 px-5 rounded-xl transition-all"
                >
                  <span>Financial Accountability</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Publications Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPublications.map((pub, idx) => (
                  <div
                    key={pub.id || idx}
                    className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                          {pub.category}
                        </span>
                        {pub.subCategory && (
                          <span className="text-xs font-semibold text-slate-500">
                            {pub.subCategory}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-2.5">
                        {pub.title}
                      </h3>

                      <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                        {pub.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        PDF Document • {pub.fileSize || 'Available'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDownload(pub)}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-sm transition-all"
                      >
                        <span>{pub.actionText || 'Download Report →'}</span>
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPublications.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                  <p className="text-slate-500 text-sm">No publications match your search query.</p>
                  <button
                    onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                    className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── 4. COMMUNITY NEEDS & FINANCIAL REPORTS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Community Needs & Assessments */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full">
                <Compass size={13} /> Evidence & Assessment
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {data.needsAssessmentTitle}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {data.needsAssessmentDescription}
              </p>
            </div>

            <div className="pt-8">
              <Link
                to={data.needsAssessmentActionLink || '/contact'}
                className="inline-flex items-center gap-2 font-bold text-emerald-700 hover:text-emerald-800 text-sm hover:underline"
              >
                <span>{data.needsAssessmentActionText || 'Community Needs Assessment →'}</span>
              </Link>
            </div>
          </div>

          {/* Financial Reports */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider bg-blue-100 px-3 py-1 rounded-full">
                <DollarSign size={13} /> Fiscal Stewardship
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {data.financialReportsTitle}
              </h3>
              <p className="text-slate-800 font-semibold text-sm sm:text-base leading-snug">
                {data.financialReportsLead}
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {data.financialReportsDescription}
              </p>
            </div>

            <div className="pt-8">
              <Link
                to={data.financialReportsActionLink || '/financials'}
                className="inline-flex items-center gap-2 font-bold text-emerald-700 hover:text-emerald-800 text-sm hover:underline"
              >
                <span>{data.financialReportsActionText || 'View Financial Transparency & Accountability →'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. OUR COMMITMENT TO TRANSPARENCY ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-emerald-50/70 border-2 border-emerald-200/80 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
          <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
            <ShieldCheck size={14} /> Core Institutional Values
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {data.transparencyTitle}
          </h3>

          <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
            {data.transparencyIntro}
          </p>

          <div className="pt-4 border-t border-emerald-200/70">
            <p className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
              We are committed to:
            </p>

            <ul className="space-y-3">
              {data.transparencyCommitments.map((commitment, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{commitment}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 6. INSTITUTIONAL & PARTNER INQUIRIES ── */}
      <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center mt-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15">
            <Mail size={13} /> Institutional Engagement
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {data.inquiriesTitle}
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {data.inquiriesDescription}
          </p>

          <div className="pt-4">
            <Link
              to={data.inquiriesActionLink || '/contact'}
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold px-8 py-3.5 rounded-2xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-base inline-flex items-center gap-2"
            >
              <span>{data.inquiriesActionText || 'Contact RESTI →'}</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
