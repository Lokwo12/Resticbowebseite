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



export function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
        members.sort((a: TeamMember, b: TeamMember) => (a.order || 999) - (b.order || 999));
        setTeamMembers(members.filter((member: TeamMember) => member.name));
      } else {
        console.error('Failed to fetch team members');
        console.warn("Team API error, keeping fallback data.");
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      console.warn("Team API unavailable, using fallback.");
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
                {filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white"
                  >
                    {/* Member Image */}
                    <div className="relative h-72 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${member.image ? 'hidden' : ''}`}>
                        <Users className="text-white group-hover:scale-110 transition-transform duration-500" size={80} />
                      </div>
                      
                      {/* Department Badge */}
                      {member.department && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                          <Badge className="bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors duration-300">
                            {member.department.charAt(0).toUpperCase() + member.department.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="p-6">
                      <h3 className="text-2xl text-gray-900 mb-2">{member.name}</h3>
                      <p className="text-lg text-emerald-600 mb-4">{member.role}</p>

                      {member.bio && (
                        <p className="text-gray-600 text-base leading-relaxed mb-6 line-clamp-2">
                          {member.bio}
                        </p>
                      )}

                      <Link to="/team" className="text-emerald-600 font-medium hover:text-emerald-700 inline-flex items-center transition-colors">
                        View full profile <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </div>
                  </Card>
                ))}
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