import { useState, useEffect } from 'react';
import { Users, Mail, Linkedin, Twitter } from 'lucide-react';
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

const FALLBACK_TEAM = [
  { id: 'tm1', name: 'Dr. Patricia Nalubega', role: 'Executive Director', department: 'leadership', bio: 'With over 15 years in community development, Dr. Nalubega leads our organisation with passion and dedication.', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', email: 'director@restikirya.org', order: 1 },
  { id: 'tm2', name: 'Moses Katende', role: 'Programs Coordinator', department: 'programs', bio: 'Moses oversees all community programmes, ensuring quality delivery and measurable impact.', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', email: 'programs@restikirya.org', order: 2 },
  { id: 'tm3', name: 'Grace Auma', role: 'Finance Manager', department: 'finance', bio: 'Grace manages our financial systems ensuring transparency and accountability in all operations.', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80', email: 'finance@restikirya.org', order: 3 },
  { id: 'tm4', name: 'Samuel Okello', role: 'Field Officer', department: 'programs', bio: 'Samuel works directly with communities, coordinating field activities and monitoring programme outcomes.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', email: 'field@restikirya.org', order: 4 },
];
export function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(FALLBACK_TEAM as any);
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
        // Backend returns { team: [...] }
        const members = data.team || [];
        // Sort by order field
        members.sort((a: TeamMember, b: TeamMember) => (a.order || 999) - (b.order || 999));
        setTeamMembers(members);
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

  // Filter team members based on selected department
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
          <h2 className="text-emerald-600 mb-4">{sectionSettings.title}</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            {sectionSettings.description}
          </p>
        </div>

        {teamMembers.length === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <Users size={48} className="text-gray-400" />
            </div>
            <h3 className="text-gray-900 mb-3">No Team Members Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
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
                    <div className="relative h-72 bg-slate-50 overflow-hidden">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="absolute inset-0 w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
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
                      <h3 className="text-gray-900 mb-2">{member.name}</h3>
                      <p className="text-emerald-600 mb-4">{member.role}</p>

                      {member.bio && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                          {member.bio}
                        </p>
                      )}

                      {/* Social Links */}
                      {(member.email || member.linkedin || member.twitter) && (
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-gray-400 hover:text-emerald-600 transition-colors duration-300"
                              title="Send Email"
                            >
                              <Mail size={20} />
                            </a>
                          )}
                          {member.linkedin && (
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-emerald-600 transition-colors duration-300"
                              title="LinkedIn Profile"
                            >
                              <Linkedin size={20} />
                            </a>
                          )}
                          {member.twitter && (
                            <a
                              href={member.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-emerald-600 transition-colors duration-300"
                              title="Twitter Profile"
                            >
                              <Twitter size={20} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No team members found in this department.
                </p>
              </div>
            )}
          </>
        )}

        {/* Join Team CTA */}
        {teamMembers.length > 0 && (
          <div className="mt-20 bg-white border-2 border-emerald-600 rounded-2xl p-8 md:p-12 text-center shadow-lg">
            <h3 className="text-gray-900 mb-4">Join Our Team</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
              We're always looking for passionate individuals who want to make a difference.
              Whether you're interested in volunteering or joining our staff, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => document.getElementById('volunteer')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-md hover:shadow-xl"
              >
                Volunteer With Us
              </button>
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-3 rounded-lg hover:bg-emerald-50 transition-all duration-300"
              >
                Contact Us
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}