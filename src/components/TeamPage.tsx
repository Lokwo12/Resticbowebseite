import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { 
  Users, Mail, Linkedin, Twitter, ArrowRight, 
  Sparkles, RefreshCw 
} from 'lucide-react';
import { 
  TeamMember, 
  FALLBACK_TEAM, 
  cleanMemberId, 
  getTeamMemberSummary, 
  isTeamMemberActive, 
  getInitials 
} from '../utils/teamUtils';

export function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(() => FALLBACK_TEAM);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/team`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawList = Array.isArray(data.team) ? data.team : [];

        const mappedList: TeamMember[] = rawList.map((item: any) => {
          const rawId = item.id || item.key || '';
          const cleanId = cleanMemberId(rawId);
          return {
            id: cleanId,
            key: item.key || `team:${cleanId}`,
            name: item.value?.name || item.name || '',
            role: item.value?.role || item.role || '',
            department: item.value?.department || item.department || 'Leadership',
            bio: item.value?.bio || item.bio || '',
            shortBio: item.value?.shortBio || item.shortBio || '',
            image: item.value?.image || item.image || '',
            email: item.value?.email || item.email || '',
            linkedin: item.value?.linkedin || item.linkedin || '',
            twitter: item.value?.twitter || item.twitter || '',
            order: typeof item.value?.order === 'number' ? item.value.order : (typeof item.order === 'number' ? item.order : 999),
            published: item.value?.published !== undefined ? item.value.published : (item.published !== undefined ? item.published : true),
            status: item.value?.status || item.status || 'active',
          };
        });

        // Filter for active/published members only
        const activeMembers = mappedList
          .filter(m => m.name && isTeamMemberActive(m))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        if (activeMembers.length > 0) {
          setTeam(activeMembers);
        }
      }
    } catch (err) {
      console.warn('Error fetching team from Supabase, using verified fallback list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Department tabs
  const departments = useMemo(() => {
    const set = new Set<string>();
    team.forEach(m => {
      if (m.department && m.department.trim()) {
        set.add(m.department.trim());
      }
    });
    return ['all', ...Array.from(set)];
  }, [team]);

  const filteredTeam = useMemo(() => {
    if (selectedDepartment === 'all') return team;
    return team.filter(m => (m.department || '').toLowerCase() === selectedDepartment.toLowerCase());
  }, [team, selectedDepartment]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO 
        title="RESTI CBO | Our Team"
        description="Meet the passionate leadership and team members driving community empowerment, research, livelihoods, and innovation at RESTI CBO in Uganda."
      />

      {/* Hero Header Section */}
      <section className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white pt-32 sm:pt-40 pb-16 sm:pb-24 relative overflow-hidden">
        {/* Background Subtle Patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-emerald-100 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <Users size={16} className="text-emerald-200" aria-hidden="true" />
            <span>RESTI Leadership & Organization</span>
          </div>

          {/* Main Page Title */}
          <h1 className="text-[28px] sm:text-[32px] lg:text-[40px] font-extrabold font-heading text-white tracking-tight leading-[1.15] mb-4">
            Our Dedicated Team
          </h1>

          {/* Subtitle / Intro Text */}
          <p className="text-[16px] sm:text-[17px] lg:text-[18px] text-emerald-50 leading-[1.65] font-normal max-w-3xl mx-auto">
            Explore opportunities to contribute your skills, experience, and time to RESTI's work with refugee and host communities. Meet the passionate individuals working behind the scenes to make a difference in our community.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-20 pb-24">
        {/* Department Filter Pills (if multiple departments exist) */}
        {departments.length > 2 && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-md border border-slate-200/80 mb-10 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {departments.map((dept) => {
              const label = dept === 'all' 
                ? 'All Team Members' 
                : dept.charAt(0).toUpperCase() + dept.slice(1);
              const isActive = selectedDepartment === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-5 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && team.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <RefreshCw size={36} className="text-emerald-600 animate-spin mb-4" />
            <p className="text-[16px] font-medium text-slate-600">Loading team profiles...</p>
          </div>
        ) : filteredTeam.length === 0 ? (
          /* Clean Empty State */
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h2 className="text-[24px] font-bold text-slate-900 mb-2 font-heading">
              No Team Members Listed
            </h2>
            <p className="text-[16px] text-slate-600 leading-relaxed mb-6">
              Our team directory is currently being updated. Please check back shortly or get in touch with our office for inquiries.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[15px] sm:text-[16px] py-3 px-6 rounded-xl transition-all shadow-sm"
            >
              <span>Contact RESTI</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          /* Team Grid: 3-column desktop, 2-column tablet, 1-column mobile */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {filteredTeam.map((member, index) => {
              const memberId = cleanMemberId(member.id);
              const summaryText = getTeamMemberSummary(member);
              const profileUrl = `/team/${memberId}`;
              const initials = getInitials(member.name);

              return (
                <article
                  key={member.id || index}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden h-full group"
                >
                  {/* Card Top Section: Photo + Details */}
                  <div className="flex flex-col flex-grow">
                    {/* Member Image Container (Fixed height, consistent aspect ratio) */}
                    <Link
                      to={profileUrl}
                      className="block relative h-72 sm:h-80 w-full overflow-hidden bg-slate-900 group/img focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      aria-label={`View full profile of ${member.name}`}
                    >
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-top group-hover/img:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}

                      {/* Graceful image fallback with initials */}
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 text-center ${
                          member.image ? 'hidden' : ''
                        }`}
                      >
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-3 text-emerald-300 font-heading font-bold text-2xl shadow-inner">
                          {initials}
                        </div>
                        <span className="text-[17px] font-bold font-heading text-white">{member.name}</span>
                      </div>

                      {/* Department Badge Overlay */}
                      {member.department && (
                        <div className="absolute bottom-3.5 left-4 z-10">
                          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[13px] font-bold tracking-wide uppercase bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-white/15 shadow-sm">
                            {member.department.charAt(0).toUpperCase() + member.department.slice(1)}
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Member Text Content */}
                    <div className="p-7 sm:p-8 flex flex-col flex-grow">
                      {/* Name (Heading) */}
                      <h2 className="mb-1.5">
                        <Link
                          to={profileUrl}
                          className="text-[21px] sm:text-[24px] lg:text-[26px] font-bold font-heading text-slate-900 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors block focus-visible:outline-none focus-visible:underline"
                        >
                          {member.name}
                        </Link>
                      </h2>

                      {/* Position / Title (Single occurrence directly below name) */}
                      <p className="text-[15px] sm:text-[16px] lg:text-[17px] font-semibold text-emerald-700 leading-normal mb-4">
                        {member.role}
                      </p>

                      {/* Biography Summary (2-4 concise sentences, generous line height) */}
                      <p className="text-[15px] sm:text-[16px] lg:text-[16.5px] leading-[1.65] text-slate-600 font-normal mb-6 flex-grow">
                        {summaryText}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom: Action button & contact links */}
                  <div className="px-7 sm:px-8 pb-7 pt-5 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">
                    {/* View Profile Action */}
                    <Link
                      to={profileUrl}
                      className="inline-flex items-center gap-2 text-[15px] sm:text-[16px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors group/btn py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                    >
                      <span>View Profile</span>
                      <ArrowRight 
                        size={17} 
                        aria-hidden="true" 
                        className="group-hover/btn:translate-x-1 transition-transform" 
                      />
                    </Link>

                    {/* Social & Email Contact Icons */}
                    <div className="flex items-center gap-2">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors border border-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          title={`Send email to ${member.name}`}
                          aria-label={`Send email to ${member.name}`}
                        >
                          <Mail size={18} aria-hidden="true" />
                        </a>
                      )}
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors border border-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          title={`${member.name} on LinkedIn`}
                          aria-label={`Visit ${member.name}'s LinkedIn profile`}
                        >
                          <Linkedin size={18} aria-hidden="true" />
                        </a>
                      )}
                      {member.twitter && (
                        <a
                          href={member.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors border border-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          title={`${member.name} on Twitter/X`}
                          aria-label={`Visit ${member.name}'s Twitter/X profile`}
                        >
                          <Twitter size={18} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
