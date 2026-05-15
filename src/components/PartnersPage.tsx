import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { Handshake, ExternalLink, Globe } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  description: string;
  logo: string;
  website?: string;
  type?: string;
}

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/partners`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        const partnersData = data.partners || [];
        
        // Map data if needed
        const mappedPartners = partnersData.map((item: any) => ({
          id: item.key || item.id || '',
          name: item.value?.name || item.name || '',
          description: item.value?.description || item.description || '',
          logo: item.value?.logo || item.logo || '',
          website: item.value?.website || item.website,
          type: item.value?.type || item.type || 'Partner',
        }));
        
        setPartners(mappedPartners);
      } catch (err) {
        console.error('Error fetching partners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const fallbackPartners: Partner[] = [
    {
      id: '1',
      name: 'Global Giving Foundation',
      description: 'Supporting community-led initiatives worldwide with funding and resources.',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c9509c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80',
      website: 'https://globalgiving.org',
      type: 'International NGO'
    },
    {
      id: '2',
      name: 'Kiryandongo District Local Government',
      description: 'Working together to deliver social services and support to the local community.',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c9509c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80',
      website: '#',
      type: 'Government'
    },
    {
      id: '3',
      name: 'Youth Action Network',
      description: 'Partnering on youth leadership and skills development programs.',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c9509c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&h=200&q=80',
      website: '#',
      type: 'Local CBO'
    }
  ];

  const displayPartners = partners.length > 0 ? partners : fallbackPartners;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-40 pb-24">
        <div className="max-width-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <Handshake className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Our Valued Partners</h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
            We are proud to work with organizations that share our vision for a better, more empowered community.
          </p>
        </div>
      </div>

      {/* Main Content (Grid Layout) */}
      <div className="max-width-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPartners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col hover:shadow-2xl transition-shadow duration-300">
              {/* Partner Logo & Info Header */}
              <div className="p-6 flex items-center gap-4 border-b border-gray-50">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    {partner.type}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{partner.name}</h3>
                </div>
              </div>

              {/* Partner Description */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <p className="text-gray-600 leading-relaxed text-sm mb-6">
                  {partner.description}
                </p>

                {/* Action */}
                {partner.website && partner.website !== '#' && (
                  <div className="pt-4 border-t border-gray-50 mt-auto">
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
                    >
                      <Globe size={16} />
                      <span>Visit Website</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-emerald-50 rounded-2xl p-8 md:p-12 text-center border border-emerald-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Want to Partner With Us?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            We are always looking to collaborate with organizations that can help us expand our reach and impact.
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  );
}
