import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { Users, Mail, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import { FALLBACK_TEAM } from './Team';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
}

export function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/team`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        const teamData = Array.isArray(data.team) ? data.team : [];

        const mappedTeam = teamData.map((item: any) => ({
          id: item.key || item.id || '',
          name: item.value?.name || item.name || '',
          role: item.value?.role || item.role || '',
          bio: item.value?.bio || item.bio || '',
          image: item.value?.image || item.image || '',
          email: item.value?.email || item.email,
          linkedin: item.value?.linkedin || item.linkedin,
          twitter: item.value?.twitter || item.twitter,
        }));

        const valid = mappedTeam.filter((member: TeamMember) => member.name);
        setTeam(valid.length > 0 ? valid : (FALLBACK_TEAM as TeamMember[]));
      } catch (err) {
        console.error('Error fetching team:', err);
        setTeam(FALLBACK_TEAM as TeamMember[]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const displayTeam = team.length > 0 ? team : (FALLBACK_TEAM as TeamMember[]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-32 sm:pt-40 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6 animate-float">
            <Users className="text-white" size={32} />
          </div>
          <h1 className="text-[32px] sm:text-[36px] lg:text-[48px] font-bold sm:font-extrabold font-heading mb-4 text-white leading-[1.1]">Our Dedicated Team</h1>
          <p className="text-[17px] font-normal leading-[1.6] text-emerald-50 max-w-2xl mx-auto">
            Meet the passionate individuals working behind the scenes to make a difference in our community.
          </p>
        </div>
      </div>

      {/* Main Content (Grid Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayTeam.map((member, index) => {
            const memberId = (member.id || '').replace(/^team:/, '');
            const cleanBioText = (member.bio || '')
              .replace(/\?\?/g, "'")
              .replace(/\uFFFD/g, "'")
              .replace(/â€™/g, "'")
              .replace(/â€"/g, "—")
              .trim();

            return (
              <div 
                key={member.id} 
                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl overflow-hidden border border-slate-100 flex flex-col transition-all duration-500 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Member Image */}
                <Link to={`/team/${memberId}`} className="block h-72 overflow-hidden relative bg-slate-900 group">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors font-heading">{member.name}</h3>
                    <p className="text-emerald-400 text-sm font-medium">{member.role}</p>
                  </div>
                </Link>

                {/* Member Info */}
                <div className="p-6 sm:p-7 flex-grow flex flex-col justify-between">
                  <p className="text-slate-600 leading-relaxed text-sm mb-6 line-clamp-3">
                    {cleanBioText}
                  </p>

                  {/* Actions & Social */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/team/${memberId}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors group/link"
                    >
                      View More
                      <ArrowRight size={15} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Email">
                          <Mail size={16} />
                        </a>
                      )}
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="LinkedIn">
                          <Linkedin size={16} />
                        </a>
                      )}
                      {member.twitter && (
                        <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Twitter">
                          <Twitter size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
