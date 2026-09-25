import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Shield, Lock } from 'lucide-react';
import { DonationExperience } from './DonationExperience';

export function CardPaymentPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50/70 pt-28 sm:pt-36 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-600 hover:text-emerald-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to site</span>
          </button>
        </div>

        {/* Standard Nonprofit Donation Experience */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-stone-200">
          <DonationExperience />
        </div>

        {/* Trust Footer */}
        <div className="mt-8 text-center text-xs text-stone-400 space-y-1">
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
