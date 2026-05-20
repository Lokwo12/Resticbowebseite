import { useState, useEffect } from 'react';
import { Handshake, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useDonationModal } from './DonationModal';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface Partner {
  id: string;
  name: string;
  description: string;
  logo: string;
  website?: string;
  category: string;
  since: string;
}

const FALLBACK_PARTNERS = [
  { id: 'p1', name: 'Uganda Development Foundation', description: 'Strategic partner providing funding and technical support for our education programmes', logo: '', website: '#', category: 'funding', since: '2020' },
  { id: 'p2', name: 'Global Health Initiative', description: 'Supporting our healthcare outreach programmes with medical supplies and expertise', logo: '', website: '#', category: 'healthcare', since: '2021' },
  { id: 'p3', name: 'Community Water Alliance', description: 'Partnering on WASH programmes to bring clean water to rural communities', logo: '', website: '#', category: 'development', since: '2022' },
];

export function Partners() {
  const { open: openDonationModal } = useDonationModal();
  const [partners, setPartners] = useState<Partner[]>(FALLBACK_PARTNERS as any);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sectionSettings, setSectionSettings] = useState({ title: 'Our Partners & Sponsors', description: 'We work with amazing organizations and individuals who share our vision for community development.' });

  useEffect(() => {
    fetchPartners();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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
        if (data.settings?.sections?.partners) {
          setSectionSettings(data.settings.sections.partners);
        }
      }
    } catch (err) {
      console.error('Error fetching section settings:', err);
    }
  };

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
      
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(partners.map(p => p.category)))];
  const filteredPartners = selectedCategory === 'all' 
    ? partners 
    : partners.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <section id="partners" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="partners" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Handshake className="text-emerald-600" size={32} />
            <h2 className="text-emerald-600">{sectionSettings.title}</h2>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {sectionSettings.description}
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Partners Grid */}
        {filteredPartners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPartners.map((partner) => (
              <Card 
                key={partner.id} 
                className="p-6 hover:shadow-2xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-500 group bg-white border border-slate-100 rounded-2xl shadow-sm"
              >
                {/* Logo */}
                <div className="h-32 flex items-center justify-center mb-6 bg-slate-50 rounded-xl p-4 group-hover:bg-emerald-50 transition-all duration-500 border border-slate-100/50 group-hover:border-emerald-500/10">
                  {partner.logo ? (
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-500/10 flex items-center justify-center text-emerald-800 font-black text-xl shadow-inner tracking-wider">
                      {partner.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="text-center mb-4">
                  <h3 className="text-gray-900 font-bold mb-2 group-hover:text-emerald-600 transition-colors duration-300">{partner.name}</h3>
                  <Badge variant="secondary" className="mb-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-500/10">{partner.category}</Badge>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {partner.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-gray-400">
                    Partner since {partner.since}
                  </span>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <span>Visit</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No partners in this category.</p>
          </div>
        )}

        {/* Partnership CTA */}
        <div className="mt-16 bg-white border-2 border-emerald-600 rounded-2xl p-8 md:p-12">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-gray-900 mb-4">Become a Partner</h3>
            <p className="text-gray-600 mb-6">
              We're always looking for partnerships that align with our mission. Whether you're 
              an organization, business, or individual wanting to make a difference, we'd love 
              to explore collaboration opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Contact Us
              </button>
              <button
                onClick={openDonationModal}
                className="bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Become a Sponsor
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
