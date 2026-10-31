import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Shield, Lock } from 'lucide-react';
import { DonationExperience } from './DonationExperience';
import { useBackgroundMedia } from '../utils/useBackgroundMedia';

export function CardPaymentPage() {
  const navigate = useNavigate();
  const { hasBgMedia } = useBackgroundMedia('page', 'donate');

  return (
    <div className={`${hasBgMedia ? 'bg-transparent' : 'bg-stone-50/70'} min-h-screen pt-28 sm:pt-36 pb-20`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className={`flex items-center justify-between mb-8 pb-4 border-b ${hasBgMedia ? 'border-white/30' : 'border-stone-200'}`}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors ${
              hasBgMedia
                ? 'bg-white/80 hover:bg-white text-slate-800 px-3 py-1.5 rounded-xl border border-white/60 shadow-xs backdrop-blur-xs'
                : 'text-stone-600 hover:text-emerald-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to site</span>
          </button>
        </div>

        {/* Standard Nonprofit Donation Experience */}
        <div className={`${hasBgMedia ? 'surface-translucent-card border-white/60 shadow-xl' : 'bg-white shadow-sm border border-stone-200'} rounded-3xl p-6 sm:p-10`}>
          <DonationExperience />
        </div>

        {/* Trust Footer */}
        <div className={`mt-8 text-center text-xs space-y-1 ${hasBgMedia ? 'text-slate-800 font-medium' : 'text-stone-400'}`}>
          <p>
            RESTI is a Community-Based Organization registered under Kiryandongo District Local Government, Uganda.
          </p>
          <p>
            Donations are voluntary charitable contributions supporting grassroots community resilience and livelihoods.
          </p>
        </div>

      </div>
    </div>
  );
}
