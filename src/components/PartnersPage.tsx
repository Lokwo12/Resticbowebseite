import React, { useState, useEffect, useMemo } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Handshake, Globe, Heart, ArrowRight, Building2, Loader2, Sparkles } from 'lucide-react';
import { useDonationModal } from './DonationModalContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Partner,
  PARTNER_PAGE_STRINGS,
  normalizePartner,
  isValidPublicPartner
} from '../utils/partnerData';

export function PartnersPage() {
  const { open: openDonationModal } = useDonationModal();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
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
          const rawItems = data.partners || [];
          const normalized = rawItems
            .map(normalizePartner)
            .filter(isValidPublicPartner);

          // Sort by display order, then created_at
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
      } catch (err) {
        console.error('Error fetching published partners:', err);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Compute available partner types for filtering
  const partnerTypes = useMemo(() => {
    const types = new Set<string>();
    partners.forEach((p) => {
      if (p.partner_type) types.add(p.partner_type);
    });
    return ['all', ...Array.from(types)];
  }, [partners]);

  // Filter partners based on selected type
  const filteredPartners = useMemo(() => {
    if (selectedType === 'all') return partners;
    return partners.filter((p) => p.partner_type === selectedType);
  }, [partners, selectedType]);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white pt-32 sm:pt-40 pb-16 sm:pb-24 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mb-6 border border-white/20 shadow-inner">
            <Handshake className="text-white" size={32} />
          </div>

          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold font-heading text-white tracking-tight leading-[1.15] mb-6">
            {PARTNER_PAGE_STRINGS.title}
          </h1>

          <div className="space-y-4 max-w-4xl mx-auto text-emerald-50 text-[16px] sm:text-[17px] leading-[1.7] font-normal">
            <p>{PARTNER_PAGE_STRINGS.introParagraph1}</p>
            <p>{PARTNER_PAGE_STRINGS.introParagraph2}</p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-20 pb-24">
        {/* Loading Spinner */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Loader2 size={36} className="animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-600">Loading verified partners...</p>
          </div>
        ) : partners.length === 0 ? (
          /* Empty State (No published partners) */
          <div className="bg-white rounded-3xl p-10 sm:p-16 shadow-xl border border-slate-100 text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
              <Building2 size={32} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mb-4 tracking-tight">
              {PARTNER_PAGE_STRINGS.emptyStateHeading}
            </h2>

            <p className="text-slate-600 text-base sm:text-[17px] leading-[1.7] max-w-2xl mx-auto mb-8">
              {PARTNER_PAGE_STRINGS.emptyStateDescription}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/15 transition-all"
              >
                Inquire About Partnerships
              </a>
              <Button
                onClick={openDonationModal}
                variant="outline"
                className="w-full sm:w-auto px-6 py-3.5 h-auto rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm"
              >
                Support Our Programs
              </Button>
            </div>
          </div>
        ) : (
          /* Published Partners Content */
          <div className="space-y-10">
            {/* Category Filter Pills (if multiple partner types exist) */}
            {partnerTypes.length > 2 && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 max-w-3xl mx-auto">
                {partnerTypes.map((type) => {
                  const isSelected = selectedType === type;
                  const label = type === 'all' ? 'All Partners' : type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Responsive Partners Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              {filteredPartners.map((partner) => {
                const logoSrc = partner.logo_url || partner.logo || '';
                const hasLogo = Boolean(logoSrc && !logoSrc.includes('unsplash.com'));
                const websiteUrl = partner.website_url || partner.website;
                const hasValidWebsite = Boolean(
                  websiteUrl &&
                  websiteUrl !== '#' &&
                  (websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://'))
                );

                return (
                  <div
                    key={partner.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-slate-100 hover:border-emerald-200 transition-all duration-300 flex flex-col group overflow-hidden"
                  >
                    {/* Partner Header & Logo */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/40 group-hover:bg-emerald-50/20 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Logo Container with object-contain */}
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200/80 p-2 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden group-hover:border-emerald-300 transition-colors">
                          {hasLogo ? (
                            <img
                              src={logoSrc}
                              alt={`${partner.name} logo`}
                              className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 font-extrabold text-lg flex items-center justify-center tracking-wider">
                              {partner.name.split(' ').map((w) => w[0]).join('').substring(0, 3).toUpperCase() || 'P'}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[11px] mb-1.5 px-2 py-0.5"
                          >
                            {partner.partner_type || 'Partner'}
                          </Badge>
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                            {partner.name}
                          </h3>
                          {partner.since && (
                            <span className="text-xs text-slate-400 mt-1 block">
                              Partner since {partner.since}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Partner Description & Action */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                      <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                        {partner.description || (
                          <span className="italic text-slate-400">
                            Dedicated collaborative partner supporting RESTI CBO initiatives.
                          </span>
                        )}
                      </p>

                      {/* Visit Website Button (Only if valid URL provided) */}
                      {hasValidWebsite && (
                        <div className="pt-4 border-t border-slate-100 mt-auto">
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-semibold text-sm border border-emerald-200/60 hover:border-emerald-600 transition-all duration-200 shadow-sm group/btn"
                          >
                            <Globe size={15} />
                            <span>Visit Website</span>
                            <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom CTA Block */}
        <div className="mt-16 sm:mt-20 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-3xl p-8 sm:p-12 text-center border border-emerald-200/70 shadow-sm max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mb-3 tracking-tight">
            Want to Partner With Us?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-base leading-relaxed mb-8">
            We are always seeking strategic alliances, consortia, and institutional collaborations that strengthen local ownership and sustainable community empowerment in Kiryandongo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/#contact"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-sm shadow-md transition-all active:scale-95"
            >
              Get in Touch
            </a>
            <Button
              onClick={openDonationModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 h-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/15 transition-all active:scale-95"
            >
              <Heart size={16} fill="currentColor" />
              Become a Sponsor
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
