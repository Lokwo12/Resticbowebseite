import React, { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { Users, Mail, Linkedin, Twitter } from 'lucide-react';

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
        const teamData = data.team || [];
        
        // Map data if needed (handling key vs id)
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
        
        setTeam(mappedTeam);
      } catch (err) {
        console.error('Error fetching team:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const fallbackTeam: TeamMember[] = [
    {
      id: '1',
      name: 'Jane Doe',
      role: 'Executive Director',
      bio: 'Jane has over 10 years of experience in community development and is passionate about empowering youth.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      email: 'jane@resticbo.org',
      linkedin: 'https://linkedin.com',
    },
    {
      id: '2',
      name: 'John Smith',
      role: 'Program Manager',
      bio: 'John oversees all our community programs and ensures they deliver maximum impact.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      email: 'john@resticbo.org',
      twitter: 'https://twitter.com',
    },
    {
      id: '3',
      name: 'Alice Johnson',
      role: 'Finance Officer',
      bio: 'Alice manages our finances with transparency and integrity, ensuring every donation is used effectively.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    }
  ];

  const displayTeam = team.length > 0 ? team : fallbackTeam;

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-12 sm:pt-20 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6 animate-float">
            <Users className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Our Dedicated Team</h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
            Meet the passionate individuals working behind the scenes to make a difference in our community.
          </p>
        </div>
      </div>

      {/* Main Content (Grid Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayTeam.map((member, index) => (
            <div 
              key={member.id} 
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col hover:shadow-2xl transition-all duration-500 hover-shine animate-fade-in-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Member Image */}
              <div className="h-72 overflow-hidden relative bg-slate-50">
                <img
                  src={member.image}
                  alt={member.name}
                  className="absolute inset-0 w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-6">
                  <h3 className="text-xl font-bold text-white">{member.name}</h3>
                  <p className="text-emerald-300 font-medium">{member.role}</p>
                </div>
              </div>

              {/* Member Info */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <p className="text-gray-600 leading-relaxed text-sm mb-6">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-emerald-600 transition-colors" title="Email">
                      <Mail size={18} />
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-600 transition-colors" title="LinkedIn">
                      <Linkedin size={18} />
                    </a>
                  )}
                  {member.twitter && (
                    <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-600 transition-colors" title="Twitter">
                      <Twitter size={18} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
