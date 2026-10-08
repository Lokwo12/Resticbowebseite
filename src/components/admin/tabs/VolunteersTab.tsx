import React from 'react';
import { Users, Heart, Briefcase, Mail, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '../../ui/button';

export interface VolunteersTabProps {
  accessToken?: string;
  userRole?: string;
  onNavigateTab?: (tab: string) => void;
}

export function VolunteersTab({ onNavigateTab }: VolunteersTabProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-xs font-semibold uppercase tracking-wider mb-3 text-emerald-100">
            <Heart className="w-3.5 h-3.5 text-rose-300" />
            <span>Community Service & Engagement</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Volunteer Network & Outreach</h2>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            RESTI CBO mobilizes grassroots community champions across Kiryandongo Refugee Settlement and host communities. Volunteer recruitment is currently channeled through our Opportunities and Inquiries portals.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Users className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Metrics / Pillars Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-stone-900 text-base">Grassroots Mobilization</h3>
          <p className="text-xs text-stone-600 mt-1">
            Over 50+ local focal persons and peer educators deployed across Ranch 1, Bweyale, and host communities.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-stone-900 text-base">Open Opportunities</h3>
          <p className="text-xs text-stone-600 mt-1">
            Publish calls for community volunteers, youth mentors, and event support staff directly via Opportunities.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-stone-900 text-base">Safeguarding & Ethics</h3>
          <p className="text-xs text-stone-600 mt-1">
            All volunteers adhere to RESTI CBO child protection, PSEA, and humanitarian conduct guidelines.
          </p>
        </div>
      </div>

      {/* Workflow Guidance & Actions */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900">How Volunteer Management Works</h3>
          <p className="text-sm text-stone-500 mt-1">
            To maintain a streamlined operations pipeline without redundant databases, volunteer workflows connect directly with core modules:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-stone-200/80 rounded-xl p-5 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-2">
                <Briefcase className="w-4 h-4" />
                <span>Post Volunteer Openings</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Create structured postings with deadlines, required qualifications, and duty stations in the Opportunities Manager tab.
              </p>
            </div>
            {onNavigateTab && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('opportunities')}
                  className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  Go to Opportunities
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="border border-stone-200/80 rounded-xl p-5 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-800 font-semibold mb-2">
                <Mail className="w-4 h-4" />
                <span>Review Volunteer Inquiries</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                General volunteer applications and collaboration letters sent through the website contact form are organized in the Contact Messages tab.
              </p>
            </div>
            {onNavigateTab && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('contacts')}
                  className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  Go to Contact Messages
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

