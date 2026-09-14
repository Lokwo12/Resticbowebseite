import { useState, useEffect } from 'react';
import { Users, Mail, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string;
  email: string;
  linkedin?: string;
  twitter?: string;
  order: number;
}



export const FALLBACK_TEAM: TeamMember[] = [
  {
    id: 'kwaya-daniel-loborach',
    name: 'Mr. Kwaya Daniel Loborach',
    role: 'Co-Founder',
    department: 'Executive & Finance',
    bio: "Kwaya Daniel Loborach is Co-Founder of RESTI Uganda, bringing a strong background in Business Administration and Management.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/c4735251-21ab-43c3-aeef-61aa5429b5c1-Screenshot_2026-09-11_011312.png',
    email: 'info@resticbo.org',
    order: 1,
  },
  {
    id: 'anek-immaculate',
    name: 'Anek Immaculate',
    role: 'Co-Founder | Research, Livelihoods & Community Engagement',
    department: 'Programs & Operations',
    bio: "Anek Immaculate is Co-Founder of RESTI Uganda, bringing a strong background in development studies and community programming.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/f8d23b1b-e4ae-44dc-9ad1-b2ec7fd7d667-WhatsApp_Image_2026-09-13_at_1.57.38_AM.jpeg',
    email: 'info@resticbo.org',
    order: 2,
  },
  {
    id: 'otim-jackson',
    name: 'Otim Jackson',
    role: 'Co-Founder | Agriculture, Livelihoods & Community Extension',
    department: 'Community Extension',
    bio: "Otim Jackson is Co-Founder of RESTI Uganda, bringing a strong background in agriculture and livestock development.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/cce2a529-08ff-4a8f-91a0-fbdc38e14ced-WhatsApp_Image_2026-09-08_at_5.34.23_PM.jpeg',
    email: 'otimjackson82@gmail.com',
    order: 3,
  },
  {
    id: 'mr-lokwo-denis',
    name: 'Mr. Lokwo Denis',
    role: 'Co-Founder | Technology, Digital Systems & Innovation',
    department: 'Technology & Innovation',
    bio: "Lokwo Denis is Co-Founder of RESTI Uganda, specializing in technology, digital systems, and innovation.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/e40b6cae-de18-4580-a1c7-758e6f16a541-IMG-20250908-WA0042_1_.jpg',
    email: 'lokwodenis@gmail.com',
    order: 4,
  }
];

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
      // Use default settings if fetch fails
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
        const validMembers = members.filter((member: TeamMember) => member.name);
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
  const uniqueDepartments = Array.from(new Set(allDepartments));
  const departments = ['all', ...uniqueDepartments];

  const filteredMembers = selectedDepartment === 'all'
    ? teamMembers
    : teamMembers.filter(member => member.department === selectedDepartment);

  if (loading) {
    return (
      <section id="team" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="team" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <Users className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-emerald-600 mb-4 tracking-tight">{sectionSettings.title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg font-normal leading-relaxed tracking-normal">
            {sectionSettings.description}
          </p>
        </div>

        {teamMembers.length === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <Users size={48} className="text-gray-400" />
            </div>
            <h3 className="text-2xl text-gray-900 mb-3">No Team Members Yet</h3>
            <p className="text-lg text-gray-500 max-w-md mx-auto">
              Our team information will be available here soon. Check back later to meet the amazing people behind our organization!
            </p>
          </div>
        ) : (
          <>
            {/* Department Filter */}
            {departments.length > 1 && (
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-6 py-3 rounded-full transition-all duration-300 ${
                      selectedDepartment === dept
                        ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {dept === 'all' ? 'All Team' : dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Team Members Grid */}
            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMembers.map((member) => {
                  const memberId = (member.id || '').replace(/^team:/, '');
                  const cleanBio = (member.bio || '')
                    .replace(/\?\?/g, "'")
                    .replace(/\uFFFD/g, "'")
                    .replace(/â€™/g, "'")
                    .replace(/â€"/g, "—")
                    .trim();

                  return (
                    <Card
                      key={member.id}
                      className="overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white border border-slate-100 rounded-3xl flex flex-col justify-between"
                    >
                      <div>
                        {/* Member Image */}
                        <Link to={`/team/${memberId}`} className="block relative h-72 bg-slate-900 overflow-hidden">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center bg-slate-900 text-white ${member.image ? 'hidden' : ''}`}>
                            <Users className="text-white/60 group-hover:scale-110 transition-transform duration-500" size={80} />
                          </div>
                          
                          {/* Department Badge */}
                          {member.department && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-5">
                              <Badge className="bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors duration-300 font-semibold text-xs">
                                {member.department.charAt(0).toUpperCase() + member.department.slice(1)}
                              </Badge>
                            </div>
                          )}
                        </Link>

                        {/* Member Info */}
                        <div className="p-6 pb-2">
                          <Link to={`/team/${memberId}`}>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors font-heading">
                              {member.name}
                            </h3>
                          </Link>
                          <p className="text-emerald-600 font-medium text-sm mb-4">{member.role}</p>

                          {cleanBio && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                              {cleanBio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                        <Link 
                          to={`/team/${memberId}`} 
                          className="text-emerald-600 font-bold hover:text-emerald-700 text-sm inline-flex items-center gap-1.5 transition-colors group/link"
                        >
                          View More <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No team members found in this department.
              </div>
            )}

            {/* Link to Full Team Page */}
            <div className="mt-16 text-center">
              <Link 
                to="/team" 
                className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-full text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Meet the Full Team <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </>
        )}


      </div>
    </section>
  );
}