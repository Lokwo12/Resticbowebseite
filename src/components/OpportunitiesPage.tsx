import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  ExternalLink, 
  Upload, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  ChevronRight, 
  FileText,
  Send,
  Loader2,
  Check
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  OpportunityItem, 
  OpportunitiesSettings,
  DEFAULT_OPPORTUNITIES_SETTINGS,
  OPPORTUNITY_CATEGORIES, 
  WORK_ARRANGEMENTS, 
  computeOpportunityStatus,
  isOpportunityPubliclyActive,
  getCategoryBadgeClasses,
  getStatusBadgeClasses
} from '../utils/opportunitiesData';
import { toast } from 'sonner';

export function OpportunitiesPage() {
  const [rawOpportunities, setRawOpportunities] = useState<OpportunityItem[]>([]);
  const [oppSettings, setOppSettings] = useState<OpportunitiesSettings>(DEFAULT_OPPORTUNITIES_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArrangement, setSelectedArrangement] = useState<string>('All');
  
  // Modal states
  const [detailModalOpportunity, setDetailModalOpportunity] = useState<OpportunityItem | null>(null);
  const [applyModalOpportunity, setApplyModalOpportunity] = useState<OpportunityItem | null>(null);

  // Application form state
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantCoverLetter, setApplicantCoverLetter] = useState('');
  const [applicantResumeUrl, setApplicantResumeUrl] = useState('');
  const [applicantResumeFile, setApplicantResumeFile] = useState<File | null>(null);
  const [applicantConsent, setApplicantConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Fetch opportunities settings (empty state & inquiries notice)
  const fetchSettings = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities/settings`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setOppSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch custom opportunity settings, using defaults.', err);
    }
  };

  // Fetch opportunities from Supabase edge function
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const rawList = data.opportunities || [];
        const parsed: OpportunityItem[] = rawList.map((item: any) => {
          const val = item.value || item;
          return {
            id: item.key || item.id || val.id || `opp-${Math.random()}`,
            title: val.title || 'Untitled Opportunity',
            category: val.category || 'Jobs',
            type: val.type || 'Full-Time',
            workArrangement: val.workArrangement || 'Field-Based',
            location: val.location || 'Kiryandongo District',
            duration: val.duration || '',
            shortDescription: val.shortDescription || val.description || '',
            description: val.description || '',
            responsibilities: Array.isArray(val.responsibilities) ? val.responsibilities : [],
            requirements: Array.isArray(val.requirements) ? val.requirements : [],
            benefits: Array.isArray(val.benefits) ? val.benefits : [],
            isOngoing: !!val.isOngoing,
            deadline: val.deadline || '',
            status: val.status || 'Open',
            applicationMethod: val.applicationMethod || 'internal',
            applicationEmail: val.applicationEmail || 'careers@resticbo.org',
            applicationUrl: val.applicationUrl || '',
            applicationInstructions: val.applicationInstructions || '',
            createdAt: val.createdAt || new Date().toISOString(),
          };
        });

        // Set live parsed items (or empty list if no active opportunities in DB)
        setRawOpportunities(parsed);
      } else {
        setRawOpportunities([]);
      }
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
      setRawOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchSettings();
  }, []);

  // Compute live active opportunities (automatically exclude expired unless ongoing)
  const activeOpportunities = useMemo(() => {
    return rawOpportunities
      .filter((opp) => isOpportunityPubliclyActive(opp))
      .map((opp) => ({
        ...opp,
        computedStatus: computeOpportunityStatus(opp),
      }));
  }, [rawOpportunities]);

  // Dynamic categories list (default standard ones + any custom ones found in active data)
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    OPPORTUNITY_CATEGORIES.forEach((c) => set.add(c));
    activeOpportunities.forEach((o) => {
      if (o.category) set.add(o.category);
    });
    return Array.from(set);
  }, [activeOpportunities]);

  // Filtered opportunities based on user selections
  const filteredOpportunities = useMemo(() => {
    return activeOpportunities.filter((opp) => {
      // Category filter
      if (selectedCategory !== 'All' && opp.category !== selectedCategory) {
        return false;
      }
      // Work arrangement filter
      if (selectedArrangement !== 'All' && opp.workArrangement !== selectedArrangement) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = opp.title.toLowerCase().includes(q);
        const inDesc = opp.shortDescription.toLowerCase().includes(q) || opp.description.toLowerCase().includes(q);
        const inLoc = opp.location.toLowerCase().includes(q);
        const inCat = opp.category.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inLoc && !inCat) {
          return false;
        }
      }
      return true;
    });
  }, [activeOpportunities, selectedCategory, selectedArrangement, searchQuery]);

  // Format date helper
  const formatDeadline = (opp: OpportunityItem) => {
    if (opp.isOngoing || !opp.deadline || opp.deadline.toLowerCase() === 'ongoing') {
      return 'Ongoing';
    }
    const d = new Date(opp.deadline);
    if (isNaN(d.getTime())) return opp.deadline;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Open apply modal
  const handleOpenApply = (opp: OpportunityItem) => {
    setApplyModalOpportunity(opp);
    setApplicantName('');
    setApplicantEmail('');
    setApplicantPhone('');
    setApplicantCoverLetter('');
    setApplicantResumeUrl('');
    setApplicantResumeFile(null);
    setApplicantConsent(false);
    setSubmissionSuccess(false);
  };

  // Handle document upload if file provided
  const uploadResume = async (): Promise<string> => {
    if (!applicantResumeFile) return applicantResumeUrl;

    const formData = new FormData();
    formData.append('file', applicantResumeFile);

    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-application-doc`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data.url || '';
      }
      return '';
    } catch (err) {
      console.error('Error uploading file:', err);
      return '';
    }
  };

  // Submit internal application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalOpportunity) return;

    if (!applicantName.trim() || !applicantEmail.trim()) {
      toast.error('Please provide your name and email address.');
      return;
    }

    if (!applicantConsent) {
      toast.error('Please accept the data processing notice to submit your application.');
      return;
    }

    try {
      setIsSubmitting(true);

      let resumeUrl = applicantResumeUrl;
      if (applicantResumeFile) {
        toast.info('Uploading resume document...');
        resumeUrl = await uploadResume();
      }

      const payload = {
        opportunityId: applyModalOpportunity.id,
        opportunityTitle: applyModalOpportunity.title,
        opportunityCategory: applyModalOpportunity.category,
        fullName: applicantName.trim(),
        email: applicantEmail.trim(),
        phone: applicantPhone.trim(),
        resumeUrl: resumeUrl,
        coverLetter: applicantCoverLetter.trim(),
        submittedAt: new Date().toISOString(),
        consentAgreed: true,
      };

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmissionSuccess(true);
        toast.success('Your application has been received successfully!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to submit application. Please contact RESTI directly.');
      }
    } catch (err: any) {
      console.error('Application submit error:', err);
      toast.error('Network error. Please try again or email careers@resticbo.org directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white pt-32 sm:pt-40 pb-20 sm:pb-24">
        {/* Subtle patterned background */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold tracking-wide uppercase mb-6 backdrop-blur-sm">
            <Sparkles size={14} className="text-emerald-300" />
            Join Our Community Mission
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 font-heading">
            Opportunities
          </h1>

          <p className="text-lg sm:text-xl text-emerald-100/90 max-w-3xl mx-auto font-normal leading-relaxed">
            Explore opportunities to contribute your skills, experience, and time to RESTI's work with refugee and host communities.
          </p>

          {/* Quick Statistics Banner */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-white">{activeOpportunities.length}</p>
              <p className="text-xs text-emerald-200 uppercase tracking-wider font-medium mt-0.5">Active Openings</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-emerald-200 uppercase tracking-wider font-medium mt-0.5">Community-Led</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-white">Kiryandongo</p>
              <p className="text-xs text-emerald-200 uppercase tracking-wider font-medium mt-0.5">Settlement & Host</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-white">Inclusive</p>
              <p className="text-xs text-emerald-200 uppercase tracking-wider font-medium mt-0.5">Equal Opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Filter & Listing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24">
        {/* Search and Filter Control Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 md:p-8 mb-8 backdrop-blur-lg">
          {/* Top Row: Search input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by position title, keyword, or location..."
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm md:text-base transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Filter size={15} className="text-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Opportunity Type / Category:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({activeOpportunities.length})
                </button>
                {availableCategories.map((cat) => {
                  const count = activeOpportunities.filter((o) => o.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat} {count > 0 && <span className="opacity-75 text-xs">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Arrangement Filter */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">
                Work Arrangement:
              </span>
              <button
                onClick={() => setSelectedArrangement('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedArrangement === 'All'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Arrangements
              </button>
              {WORK_ARRANGEMENTS.map((arr) => (
                <button
                  key={arr}
                  onClick={() => setSelectedArrangement(arr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedArrangement === arr
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {arr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opportunities List / Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
            <p className="text-slate-500 font-medium">Loading opportunities...</p>
          </div>
        ) : filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => {
              const status = computeOpportunityStatus(opp);
              const isClosingSoon = status === 'Closing Soon';

              return (
                <div
                  key={opp.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

                  <div>
                    {/* Header Badges: Category & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getCategoryBadgeClasses(
                        opp.category
                      )}`}>
                        {opp.category}
                      </span>

                      {/* Status badge */}
                      {isClosingSoon ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          <Clock size={11} /> Closing Soon
                        </span>
                      ) : opp.isOngoing ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Ongoing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Open
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug mb-2 line-clamp-2">
                      {opp.title}
                    </h3>

                    {/* Meta information: Location & Arrangement */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 mb-3.5">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        {opp.location}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Building2 size={13} className="text-slate-400" />
                        {opp.workArrangement}
                      </span>
                      {opp.duration && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" />
                            {opp.duration}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Short Description */}
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                      {opp.shortDescription || opp.description}
                    </p>
                  </div>

                  {/* Footer info & CTA Button */}
                  <div className="pt-4 border-t border-slate-100 mt-2 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar size={13} className="text-slate-400" />
                        Deadline:
                      </span>
                      <span className={`font-semibold ${isClosingSoon ? 'text-amber-600' : 'text-slate-700'}`}>
                        {formatDeadline(opp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailModalOpportunity(opp)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          if (opp.applicationMethod === 'external' && opp.applicationUrl) {
                            window.open(opp.applicationUrl, '_blank', 'noopener,noreferrer');
                          } else if (opp.applicationMethod === 'email') {
                            const mailto = `mailto:${opp.applicationEmail || 'careers@resticbo.org'}?subject=${encodeURIComponent(`Application: ${opp.title}`)}`;
                            window.location.href = mailto;
                          } else {
                            handleOpenApply(opp);
                          }
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
                      >
                        Apply Now
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= EDITABLE EMPTY STATE ================= */
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200/80 p-12 md:p-16 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5 text-slate-400">
              <Briefcase size={30} />
            </div>

            {/* If filters produced no matches, show filter reset message */}
            {activeOpportunities.length > 0 && (selectedCategory !== 'All' || selectedArrangement !== 'All' || searchQuery) ? (
              <>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No matching opportunities</h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6">
                  No opportunities match your current search or filter criteria. Try resetting filters to see all available roles.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedArrangement('All');
                    setSearchQuery('');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                >
                  Reset Filters
                </button>
              </>
            ) : (
              /* If no active opportunities published in system, render admin-configured empty state */
              <>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 font-heading">
                  {oppSettings.emptyTitle || 'No current opportunities'}
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6 max-w-xl mx-auto whitespace-pre-line">
                  {oppSettings.emptyMessage || 'We do not currently have any open opportunities. Please check back later for new positions, internships, consultancy tenders, and other ways to get involved with RESTI.'}
                </p>
                <div>
                  {oppSettings.emptyButtonLink && (oppSettings.emptyButtonLink.startsWith('http') || oppSettings.emptyButtonLink.startsWith('mailto:')) ? (
                    <a
                      href={oppSettings.emptyButtonLink}
                      target={oppSettings.emptyButtonLink.startsWith('http') ? '_blank' : undefined}
                      rel={oppSettings.emptyButtonLink.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-all"
                    >
                      {oppSettings.emptyButtonText || 'Contact RESTI'}
                      <ArrowRight size={16} />
                    </a>
                  ) : (
                    <Link
                      to={oppSettings.emptyButtonLink || '/contact'}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-all"
                    >
                      {oppSettings.emptyButtonText || 'Contact RESTI'}
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= EDITABLE GENERAL INQUIRY CALLOUT ================= */}
        {oppSettings.showInquiriesBox && (
          <div className="mt-16 bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-3xl relative z-10">
              <h3 className="text-2xl sm:text-3xl font-bold font-heading mb-3">
                {oppSettings.inquiriesTitle || "Don't see a role that matches your skills?"}
              </h3>
              <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-line">
                {oppSettings.inquiriesDescription || "RESTI thrives on passionate changemakers, researchers, and community partners from all walks of life. Send us your profile or proposal, and let us explore how we can collaborate together to build self-reliant refugee and host communities."}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-bold shadow-md transition-all"
                >
                  Reach Out to Us
                  <ArrowRight size={16} />
                </Link>
                {oppSettings.inquiriesEmail && (
                  <a
                    href={`mailto:${oppSettings.inquiriesEmail}?subject=${encodeURIComponent(oppSettings.inquiriesSubject || 'General Inquiry / Partnership Proposal')}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700/50 hover:bg-emerald-700/70 border border-emerald-500/40 text-white text-sm font-semibold transition-all"
                  >
                    <Mail size={16} />
                    {oppSettings.inquiriesEmail}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* OPPORTUNITY DETAIL MODAL */}
      {/* ========================================================================= */}
      {detailModalOpportunity && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white relative">
              <button
                onClick={() => setDetailModalOpportunity(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white border border-white/30">
                  {detailModalOpportunity.category}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-100">
                  {detailModalOpportunity.workArrangement}
                </span>
                {computeOpportunityStatus(detailModalOpportunity) === 'Closing Soon' && (
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400 text-amber-950">
                    Closing Soon
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-2">
                {detailModalOpportunity.title}
              </h2>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-emerald-100/90 mt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {detailModalOpportunity.location}
                </span>
                {detailModalOpportunity.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {detailModalOpportunity.duration}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> Deadline: {formatDeadline(detailModalOpportunity)}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-700 flex-1">
              {/* Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Overview
                </h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {detailModalOpportunity.description || detailModalOpportunity.shortDescription}
                </p>
              </div>

              {/* Responsibilities */}
              {detailModalOpportunity.responsibilities && detailModalOpportunity.responsibilities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Key Responsibilities
                  </h4>
                  <ul className="space-y-2">
                    {detailModalOpportunity.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {detailModalOpportunity.requirements && detailModalOpportunity.requirements.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Qualifications & Requirements
                  </h4>
                  <ul className="space-y-2">
                    {detailModalOpportunity.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {detailModalOpportunity.benefits && detailModalOpportunity.benefits.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    What We Offer / Benefits
                  </h4>
                  <ul className="space-y-2">
                    {detailModalOpportunity.benefits.map((ben, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions */}
              {detailModalOpportunity.applicationInstructions && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block mb-1">Application Instructions:</span>
                  <p className="whitespace-pre-line">{detailModalOpportunity.applicationInstructions}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setDetailModalOpportunity(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                {detailModalOpportunity.applicationMethod === 'external' && detailModalOpportunity.applicationUrl ? (
                  <a
                    href={detailModalOpportunity.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    Apply on External Site
                    <ExternalLink size={14} />
                  </a>
                ) : detailModalOpportunity.applicationMethod === 'email' ? (
                  <a
                    href={`mailto:${detailModalOpportunity.applicationEmail || 'careers@resticbo.org'}?subject=${encodeURIComponent(`Application: ${detailModalOpportunity.title}`)}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    <Mail size={14} />
                    Apply via Email ({detailModalOpportunity.applicationEmail || 'careers@resticbo.org'})
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      const opp = detailModalOpportunity;
                      setDetailModalOpportunity(null);
                      handleOpenApply(opp);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    Apply for this Position
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERNAL APPLICATION MODAL */}
      {/* ========================================================================= */}
      {applyModalOpportunity && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-xl w-full flex flex-col overflow-hidden border border-slate-100 max-w-xl">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white relative">
              <button
                onClick={() => setApplyModalOpportunity(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 block mb-1">
                Candidate Application
              </span>
              <h3 className="text-xl font-bold font-heading text-white">
                {applyModalOpportunity.title}
              </h3>
              <p className="text-xs text-emerald-100/80 mt-1">
                {applyModalOpportunity.category} • {applyModalOpportunity.location}
              </p>
            </div>

            {/* Content / Form */}
            <div className="p-6 sm:p-8">
              {submissionSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Application Submitted!</h4>
                  <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                    Thank you for applying to RESTI. Our recruitment committee will review your information. If your profile matches our requirements, we will contact you via email or phone.
                  </p>
                  <button
                    onClick={() => setApplyModalOpportunity(null)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
                  {/* Full Name */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Sarah Akello"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs"
                    />
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+256 700 000 000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  {/* CV / Resume File Upload or Link */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Resume / CV Document (PDF, DOC, DOCX)
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 text-center hover:bg-slate-100 transition-colors">
                      <input
                        type="file"
                        id="resumeUpload"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setApplicantResumeFile(e.target.files[0]);
                          }
                        }}
                      />
                      <label
                        htmlFor="resumeUpload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-600"
                      >
                        <Upload size={18} className="text-emerald-600" />
                        <span className="font-semibold text-xs text-emerald-700">
                          {applicantResumeFile ? applicantResumeFile.name : 'Click to choose resume file'}
                        </span>
                        <span className="text-[10px] text-slate-400">PDF, DOC, or DOCX up to 10MB</span>
                      </label>
                    </div>

                    <div className="mt-2">
                      <span className="text-[11px] text-slate-400 block mb-1">Or provide a link to your LinkedIn / Online CV:</span>
                      <input
                        type="url"
                        value={applicantResumeUrl}
                        onChange={(e) => setApplicantResumeUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile or Google Drive link"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Cover Letter / Message */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Cover Letter / Brief Motivation
                    </label>
                    <textarea
                      rows={4}
                      value={applicantCoverLetter}
                      onChange={(e) => setApplicantCoverLetter(e.target.value)}
                      placeholder="Share a brief introduction, your relevant experience, and why you wish to contribute to RESTI..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs"
                    />
                  </div>

                  {/* Privacy / Data consent checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={applicantConsent}
                        onChange={(e) => setApplicantConsent(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] text-slate-600 leading-tight">
                        I confirm that the information provided is accurate and consent to RESTI CBO processing my personal details for recruitment and communication purposes in accordance with our data privacy guidelines.
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setApplyModalOpportunity(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Submit Application
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
