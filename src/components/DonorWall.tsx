import React, { useEffect, useState } from 'react';
import { projectId } from '../utils/supabase/info';
import { Heart, Trophy, Sparkles } from 'lucide-react';
import { formatCurrency } from './StripeShared';

interface Donor {
  name: string;
  amount: number;
  currency: string;
  date: string;
}

interface Stats {
  totalAmount: number;
  recentDonors: Donor[];
}

export function DonorWall({ goalAmount = 50000 }: { goalAmount?: number }) {
  const [stats, setStats] = useState<Stats>({ totalAmount: 0, recentDonors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.totalAmount === 'number') {
          setStats(data);
        }
      })
      .catch(err => console.error('Failed to fetch donation stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const { totalAmount, recentDonors } = stats;
  const progressPercent = Math.min(100, Math.round((totalAmount / goalAmount) * 100));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 p-6 md:p-8 overflow-hidden relative mt-8">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Progress Bar Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Trophy size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">Fundraising Goal</h3>
                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Join the Movement</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-2xl text-emerald-700 tracking-tight">
                ${totalAmount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                raised of ${goalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-1000 ease-out flex items-center justify-end px-2"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
            </div>
          </div>
          
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>0%</span>
            <span>{progressPercent}% Funded</span>
            <span>100%</span>
          </div>
        </div>

        {/* Recent Donors Marquee */}
        {recentDonors.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <Sparkles size={16} className="text-amber-500" />
              Recent Heroes
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recentDonors.slice(0, 6).map((donor, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {donor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 truncate max-w-[100px]">{donor.name}</p>
                    <p className="text-xs text-emerald-600 font-bold">{formatCurrency(donor.amount, donor.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center pt-2">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Heart size={12} className="text-rose-400" fill="currentColor" /> Thank you to all our generous donors
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
