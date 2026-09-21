import { useState, useEffect, useMemo } from 'react';
import { Handshake, ArrowRight, Building2, Globe, Heart, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useDonationModal } from './DonationModalContext';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Partner,
  PARTNER_PAGE_STRINGS,
  normalizePartner,
  isValidPublicPartner
} from '../utils/partnerData';

export function Partners() {
  const { open: openDonationModal } = useDonationModal();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
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
        const rawPartners = data.partners || [];
        const normalized = rawPartners
          .map(normalizePartner)
          .filter(isValidPublicPartner);

        normalized.sort((a: Partner, b: Partner) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA;
        });

        setPartners(normalized);
      } else {
        setPartners([]);
      }
    } catch (error) {
      console.error('Error fetching homepage partners:', error);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    partners.forEach(p => {
      if (p.partner_type) set.add(p.partner_type);
    });
    return ['all', ...Array.from(set)];
  }, [partners]);

  const filteredPartners = useMemo(() => {
    if (selectedCategory === 'all') return partners;
    return partners.filter(p => p.partner_type === selectedCategory);
  }, [partners, selectedCategory]);

  return (
    <section id="partners" className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
              <Handshake size={22} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Collaboration & Impact</span>
          </div>

          <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold font-heading text-slate-900 mb-5 leading-tight tracking-tight">
            {PARTNER_PAGE_STRINGS.title}
          </h2>

          <div className="space-y-3 text-[16px] sm:text-[17px] font-normal leading-[1.7] text-slate-600">
            <p>{PARTNER_PAGE_STRINGS.introParagraph1}</p>
            <p className="text-slate-500 text-sm sm:text-base">{PARTNER_PAGE_STRINGS.introParagraph2}</p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
            <p className="text-xs font-medium text-slate-500">Loading partners...</p>
          </div>
        ) : partners.length === 0 ? (
          /* Empty State (No published partners) */
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-5 shadow-inner">
              <Building2 size={28} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mb-3 tracking-tight">
              {PARTNER_PAGE_STRINGS.emptyStateHeading}
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              {PARTNER_PAGE_STRINGS.emptyStateDescription}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
              >
                Inquire About Partnerships
              </a>
              <Button
                onClick={openDonationModal}
                variant="outline"
                className="w-full sm:w-auto px-6 py-2.5 h-auto rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm"
              >
                Support Our Programs
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            {categories.length > 2 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {category === 'all' ? 'All Partners' : category}
                  </button>
                ))}
              </div>
            )}

            {/* Partners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredPartners.map((partner) => {
                const logoSrc = partner.logo_url || partner.logo || '';
                const hasLogo = Boolean(logoSrc && !logoSrc.includes('unsplash.com'));
                const websiteUrl = partner.website_url || partner.website;
                const hasWebsite = Boolean(
                  websiteUrl &&
                  websiteUrl !== '#' &&
                  (websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://'))
                );

                return (
                  <Card
                    key={partner.id}
                    className="p-6 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Logo Container with object-contain */}
                      <div className="h-32 flex items-center justify-center mb-6 bg-slate-50/80 rounded-xl p-4 group-hover:bg-emerald-50/30 transition-all duration-300 border border-slate-100 group-hover:border-emerald-200/60 overflow-hidden">
                        {hasLogo ? (
                          <img
                            src={logoSrc}
                            alt={partner.name}
                            className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-xl flex items-center justify-center tracking-wider">
                            {partner.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() || 'P'}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="text-center mb-4">
                        <Badge
                          variant="secondary"
                          className="mb-2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold"
                        >
                          {partner.partner_type || 'Partner'}
                        </Badge>
                        <h3 className="text-xl text-slate-900 font-bold mb-2 group-hover:text-emerald-700 transition-colors">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {partner.description || 'Collaborative partner supporting RESTI CBO programs.'}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <span className="text-xs text-slate-400">
                        {partner.since ? `Partner since ${partner.since}` : 'Verified Partner'}
                      </span>

                      {hasWebsite ? (
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200/60 group/btn"
                        >
                          <Globe size={13} />
                          <span>Visit Website</span>
                          <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-0.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300 italic">No website</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Partnership CTA */}
        <div className="mt-16 bg-white border border-emerald-200/80 rounded-3xl p-8 sm:p-12 shadow-sm max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Become a Partner or Sponsor
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              We are eager to partner with organizations, foundations, academic researchers, and social enterprises that share our vision for locally driven community empowerment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
              <a
                href="#contact"
                className="inline-flex items-center justify-center bg-emerald-600 text-white font-semibold text-sm px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/15"
              >
                Contact Us
              </a>
              <Button
                onClick={openDonationModal}
                variant="outline"
                className="inline-flex items-center justify-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm px-8 py-3 h-auto rounded-xl"
              >
                <Heart size={16} className="text-emerald-600" />
                Become a Sponsor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
