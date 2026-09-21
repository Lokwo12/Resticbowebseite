import { useState, useEffect } from 'react';
import { Users, Mail, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  TeamMember, 
  FALLBACK_TEAM, 
  cleanBio, 
  getTeamMemberSummary, 
  cleanMemberId, 
  isTeamMemberActive, 
  getInitials 
} from '../utils/teamUtils';

// Re-export FALLBACK_TEAM for backwards compatibility
export { FALLBACK_TEAM };

export function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(FALLBACK_TEAM);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [sectionSettings, setSectionSettings] = useState({
    title: 'Meet Our Team',
    description: 'Get to know the dedicated individuals working tirelessly to make a difference in our community.'
  });

  useEffect(() => {
    loadTeamData();
    loadSectionSettings();
  }, []);

  const loadSectionSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.settings?.sections?.team) {
          setSectionSettings(data.settings.sections.team);
        }
      }
    } catch (error) {
      console.error('Error loading section settings:', error);
      setSectionSettings({
        title: 'Meet Our Team',
        description: 'Get to know the dedicated individuals working tirelessly to make a difference in our community.'
      });
    }
  };

  const loadTeamData = async () => {
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
        const members = Array.isArray(data.team) ? data.team : [];
        const mappedMembers: TeamMember[] = members.map((m: any) => ({
          id: cleanMemberId(m.id || m.key || ''),
          key: m.key || `team:${cleanMemberId(m.id || m.key || '')}`,
          name: m.value?.name || m.name || '',
          role: m.value?.role || m.role || '',
          department: m.value?.department || m.department || 'Leadership',
          bio: m.value?.bio || m.bio || '',
          shortBio: m.value?.shortBio || m.shortBio || '',
          image: m.value?.image || m.image || '',
          email: m.value?.email || m.email || '',
          linkedin: m.value?.linkedin || m.linkedin || '',
          twitter: m.value?.twitter || m.twitter || '',
          order: typeof m.value?.order === 'number' ? m.value.order : (typeof m.order === 'number' ? m.order : 999),
          published: m.value?.published !== undefined ? m.value.published : (m.published !== undefined ? m.published : true),
          status: m.value?.status || m.status || 'active',
        }));

        const validMembers = mappedMembers.filter(m => m.name && isTeamMemberActive(m));
        if (validMembers.length > 0) {
          validMembers.sort((a: TeamMember, b: TeamMember) => (a.order || 999) - (b.order || 999));
          setTeamMembers(validMembers);
        }
      }
    } catch (error) {
      console.warn("Team API unavailable, keeping fallback team.", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique departments from team members
  const allDepartments = teamMembers.map(member => member.department).filter(Boolean);
  const uniqueDepartments = Array.from(new Set(allDepartments as string[]));
  const departments = ['all', ...uniqueDepartments];

  const filteredMembers = selectedDepartment === 'all'
    ? teamMembers
    : teamMembers.filter(member => (member.department || '').toLowerCase() === selectedDepartment.toLowerCase());

  if (loading) {
    return (
      <section id="team" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="team" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <Users className="text-emerald-700" size={32} />
          </div>
          <h2 className="text-[28px] sm:text-[32px] lg:text-[36px] font-bold font-heading text-emerald-800 mb-4 leading-[1.2]">
            {sectionSettings.title}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-[16px] sm:text-[17px] lg:text-[18px] font-normal leading-[1.65]">
            {sectionSettings.description}
          </p>
        </div>

        {teamMembers.length === 0 ? (
          // Empty State
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto p-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-2xl mb-6">
              <Users size={36} className="text-slate-400" />
            </div>
            <h3 className="text-[24px] font-bold text-slate-900 mb-3 font-heading">No Team Members Yet</h3>
            <p className="text-[16px] text-slate-600 max-w-md mx-auto leading-relaxed">
              Our team information will be available here soon. Check back later to meet the dedicated people behind our organization!
            </p>
          </div>
        ) : (
          <>
            {/* Department Filter */}
            {departments.length > 2 && (
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-6 py-2.5 rounded-full text-[14px] sm:text-[15px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      selectedDepartment === dept
                        ? 'bg-emerald-700 text-white shadow-md transform scale-105'
                        : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {dept === 'all' ? 'All Team Members' : dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Team Members Grid */}
            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMembers.map((member) => {
                  const memberId = cleanMemberId(member.id);
                  const summary = getTeamMemberSummary(member);
                  const initials = getInitials(member.name);
                  const profileUrl = `/team/${memberId}`;

                  return (
                    <Card
                      key={member.id}
                      className="overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white border border-slate-200/90 rounded-3xl flex flex-col justify-between"
                    >
                      <div>
                        {/* Member Image */}
                        <Link 
                          to={profileUrl} 
                          className="block relative h-72 sm:h-80 bg-slate-900 overflow-hidden group/img focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          aria-label={`View profile of ${member.name}`}
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

                          {/* Graceful image fallback */}
                          <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 text-center ${member.image ? 'hidden' : ''}`}>
                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-3 text-emerald-300 font-heading font-bold text-2xl shadow-inner">
                              {initials}
                            </div>
                            <span className="text-[17px] font-bold font-heading text-white">{member.name}</span>
                          </div>
                          
                          {/* Department Badge */}
                          {member.department && (
                            <div className="absolute bottom-3.5 left-4 z-10">
                              <Badge className="bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-white/15 font-semibold text-[12px] sm:text-[13px] px-3 py-1">
                                {member.department.charAt(0).toUpperCase() + member.department.slice(1)}
                              </Badge>
                            </div>
                          )}
                        </Link>

                        {/* Member Info */}
                        <div className="p-7 pb-3">
                          <Link to={profileUrl} className="focus-visible:outline-none focus-visible:underline">
                            <h3 className="text-[21px] sm:text-[23px] lg:text-[25px] font-bold text-slate-900 mb-1.5 group-hover:text-emerald-700 transition-colors font-heading leading-snug">
                              {member.name}
                            </h3>
                          </Link>
                          <p className="text-emerald-700 font-semibold text-[15px] sm:text-[16px] mb-4 leading-normal">
                            {member.role}
                          </p>

                          {summary && (
                            <p className="text-slate-600 text-[15px] sm:text-[16px] leading-[1.65] font-normal mb-4">
                              {summary}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="px-7 pb-7 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <Link 
                          to={profileUrl} 
                          className="text-emerald-700 font-bold hover:text-emerald-800 text-[15px] sm:text-[16px] inline-flex items-center gap-2 transition-colors group/link py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                        >
                          <span>View Profile</span>
                          <ArrowRight size={17} aria-hidden="true" className="group-hover/link:translate-x-1 transition-transform" />
                        </Link>

                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors border border-slate-200/60"
                            title={`Email ${member.name}`}
                            aria-label={`Email ${member.name}`}
                          >
                            <Mail size={18} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-[16px]">
                No team members found in this department.
              </div>
            )}

            {/* Link to Full Team Page */}
            <div className="mt-16 text-center">
              <Link 
                to="/team" 
                className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-[16px] font-bold rounded-xl text-white bg-emerald-700 hover:bg-emerald-800 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span>Meet the Full Team</span>
                <ArrowRight size={18} className="ml-2" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
