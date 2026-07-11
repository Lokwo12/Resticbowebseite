import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Heart, CreditCard, Calendar, ArrowRight, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface Donation {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  paymentMethod: string;
}

export function DonorDashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);

      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      let verifiedDonation: any = null;
      if (sessionId) {
        try {
          const vRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/verify-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({ sessionId })
          });
          const vData = await vRes.json();
          if (vData.status === 'success' && vData.donation) {
            verifiedDonation = vData.donation;
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('Failed to verify session', err);
        }
      }

      await fetchDonations(session.user?.email || "");
      
      if (verifiedDonation && verifiedDonation?.donorEmail?.toLowerCase().trim() === session.user?.email || "".toLowerCase().trim()) {
        setDonations(prev => {
          // ensure it's not already in the list
          const exists = prev.find(d => d.date === verifiedDonation?.timestamp);
          if (exists) return prev;
          
          return [{
            id: `donation-${Date.now()}`,
            amount: verifiedDonation?.amount,
            currency: verifiedDonation?.currency,
            date: verifiedDonation?.timestamp,
            status: verifiedDonation?.status,
            paymentMethod: verifiedDonation?.paymentMethod,
            donorName: verifiedDonation?.donorName
          }, ...prev];
        });

        if (verifiedDonation?.donorName && verifiedDonation?.donorName !== session.user.user_metadata?.name) {
          await supabase.auth.updateUser({ data: { name: verifiedDonation?.donorName } });
          setUser((prev: any) => ({ ...prev, user_metadata: { ...prev?.user_metadata, name: verifiedDonation?.donorName } }));
        }
      }
    };
    checkUser();
  }, [navigate]);

  const fetchDonations = async (email: string | undefined) => {
    if (!email) return;
    try {
      // In a real app, you would query the database directly or use an API endpoint.
      // Here we just use a hypothetical fetch or placeholder data for demonstration.
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      if (data.donations) {
        // Filter donations for this specific user
        const userDonations = data.donations
          .filter((d: any) => d.value?.donorEmail?.toLowerCase().trim() === email.toLowerCase().trim())
          .map((d: any) => ({
            id: d.key,
            amount: d.value?.amount || 0,
            currency: d.value?.currency || 'USD',
            date: d.value?.timestamp || new Date().toISOString(),
            status: d.value?.status || 'completed',
            paymentMethod: d.value?.paymentMethod || 'card'
          }));
        setDonations(userDonations);
      }
    } catch (err) {
      console.error('Error fetching donations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleManageBilling = async () => {
    if (!user?.email) return;
    
    try {
      setBillingLoading(true);
      setError(null);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: user.email,
          returnUrl: window.location.href
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create billing session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Billing portal error:', err);
      alert(err.message || 'Unable to open billing portal. You may not have any active subscriptions yet.');
    } finally {
      setBillingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 sm:pt-36 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900">Welcome back, {user?.user_metadata?.name || 'Supporter'}!</h1>
            <p className="text-gray-600 mt-1">Manage your donations and subscriptions.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-gray-600">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Recent Donations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Heart className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" />
                  Your Impact History
                </h3>
              </div>
              
              <div className="p-0">
                {donations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>You haven't made any donations yet.</p>
                    <Button onClick={() => navigate('/donate')} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                      Make a Donation
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {donations.map((donation) => (
                      <li key={donation.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              ${donation.amount.toFixed(2)} {donation.currency.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(donation.date).toLocaleDateString()} • {donation.paymentMethod}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${donation.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {donation.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-2">Want to increase your impact?</h3>
              <p className="text-emerald-100 text-sm mb-6">Set up a monthly recurring donation to provide sustainable support.</p>
              <Button onClick={() => navigate('/donate')} className="w-full bg-white text-emerald-700 hover:bg-gray-50 border-none font-bold">
                Donate Monthly <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 text-gray-400 mr-2" />
                Account Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                  <p className="text-sm text-gray-900 mt-1">{user?.user_metadata?.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                  <p className="text-sm text-gray-900 mt-1">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Donor Since</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(user?.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm"
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                  >
                    {billingLoading ? 'Loading...' : 'Manage Billing (Stripe)'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
