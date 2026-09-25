import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Lock, ArrowRight, User } from 'lucide-react';
import { DonationExperience } from './DonationExperience';

export function Donation() {
  return (
    <section id="donate" className="py-16 sm:py-24 bg-gradient-to-b from-stone-50 via-white to-stone-50 overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Top Trust Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              R
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-stone-900 text-sm tracking-tight">RESTI CBO</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  Registered CBO
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Kiryandongo District Local Government, Uganda
              </p>
            </div>
          </div>

          <Link
            to="/donor-portal"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs group text-center"
          >
            <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Already a supporter? RESTI CBO Supporter &amp; Donor Portal</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </Link>
        </div>

        {/* Standard Nonprofit Donation Experience Component */}
        <DonationExperience />

        {/* Bottom Transparency Notice */}
        <div className="mt-12 pt-8 border-t border-stone-200 text-center max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              Configured Payment Security
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              Verified Registered CBO · Uganda
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            Refugee Empowerment For Sustainable Transformation Initiative (RESTI CBO) is a registered Community-Based Organization in Uganda. Contributions directly support locally led community programs.
          </p>
        </div>

      </div>
    </section>
  );
}
