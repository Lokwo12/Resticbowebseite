import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { Target, Calendar, MapPin, Briefcase, ArrowRight } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: string; // Job, Internship, Volunteer
  location: string;
  deadline: string;
  link?: string;
}

export function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        const oppsData = data.opportunities || [];
        
        // Map data if needed
        const mappedOpps = oppsData.map((item: any) => ({
          id: item.key || item.id || '',
          title: item.value?.title || item.title || '',
          description: item.value?.description || item.description || '',
          type: item.value?.type || item.type || 'Full-Time',
          location: item.value?.location || item.location || 'Kiryandongo',
          deadline: item.value?.deadline || item.deadline || '',
          link: item.value?.link || item.link || '#',
        }));
        
        setOpportunities(mappedOpps);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const fallbackOpportunities: Opportunity[] = [
    {
      id: '1',
      title: 'Youth Program Coordinator',
      description: 'We are looking for a passionate individual to lead our youth empowerment initiatives. You will design and implement training programs.',
      type: 'Full-Time',
      location: 'Kiryandongo Office',
      deadline: '2026-06-30',
      link: '#'
    },
    {
      id: '2',
      title: 'Social Media Intern',
      description: 'Help us share our stories with the world! We need a creative intern to manage our social media channels and create content.',
      type: 'Internship',
      location: 'Remote / Flexible',
      deadline: '2026-05-20',
      link: '#'
    },
    {
      id: '3',
      title: 'Community Health Volunteer',
      description: 'Join our team to support health sensitization campaigns in the community. Medical background is a plus but not required.',
      type: 'Volunteer',
      location: 'Field Based',
      deadline: 'Ongoing',
      link: '#'
    }
  ];

  const displayOpportunities = opportunities.length > 0 ? opportunities : fallbackOpportunities;

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.toLowerCase() === 'ongoing') return 'Ongoing';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-32 pb-24">
        <div className="max-width-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <Target className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Open Opportunities</h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
            Join our team and contribute your skills to make a lasting impact in Kiryandongo.
          </p>
        </div>
      </div>

      {/* Main Content (List Layout) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">
        <div className="space-y-6">
          {displayOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-shadow duration-300">
              
              {/* Opportunity Info */}
              <div className="flex-grow">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`text-xs font-semibold uppercase px-3 py-1 rounded-full ${
                    opportunity.type === 'Full-Time' ? 'bg-emerald-100 text-emerald-700' :
                    opportunity.type === 'Internship' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {opportunity.type}
                  </span>
                  <span className="text-xs font-semibold uppercase bg-gray-100 text-gray-700 px-3 py-1 rounded-full flex items-center gap-1">
                    <MapPin size={12} />
                    {opportunity.location}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm max-w-3xl">
                  {opportunity.description}
                </p>
                
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Deadline: {formatDate(opportunity.deadline)}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                <a
                  href={opportunity.link}
                  className="inline-flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-3 px-6 rounded-xl transition-colors gap-2 w-full md:w-auto"
                >
                  <span>Apply Now</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          ))}

          {displayOpportunities.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Briefcase className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Openings Right Now</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                We don't have any open opportunities at the moment. Please check back later or contact us if you want to get involved.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
