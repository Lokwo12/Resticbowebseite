import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Heart, CreditCard, Calendar, ArrowRight, Settings, LogOut, 
  Download, Printer, Shield, CheckCircle2, Clock, User, 
  FileText, ChevronRight, Sparkles, Building2, Phone, Mail, 
  ExternalLink, X, Search, Filter, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { DEFAULT_DONOR_PORTAL_SETTINGS } from './SiteSettingsTab';

interface Donation {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  paymentMethod: string;
  donorName?: string;
  donorEmail?: string;
  reference?: string;
}

export function DonorDashboard() {
  const [portalConfig, setPortalConfig] = useState<any>(DEFAULT_DONOR_PORTAL_SETTINGS);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'recurring' | 'impact' | 'profile'>('history');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  
  // Guest Lookup & Inline Login state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSubmitted, setLookupSubmitted] = useState(false);
  const [guestBillingEmail, setGuestBillingEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Profile edit state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Uganda');
  const [postalCode, setPostalCode] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setDisplayName(session.user.user_metadata?.name || '');
          setPhone(session.user.user_metadata?.phone || '');
          setAddress(session.user.user_metadata?.address || '');
          setCity(session.user.user_metadata?.city || '');
          setCountry(session.user.user_metadata?.country || 'Uganda');
          setPostalCode(session.user.user_metadata?.postal_code || session.user.user_metadata?.postalCode || '');
        } else {
          setUser(null);
        }

        // Verify any Stripe checkout session returning from card payment
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const emailParam = urlParams.get('email');
        const refParam = urlParams.get('ref');

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
              toast.success('Thank you! Your donation was successfully confirmed and recorded.');
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (err) {
            console.error('Failed to verify session', err);
          }
        }

        const queryToFetch = session?.user?.email || emailParam || refParam || '';
        if (queryToFetch) {
          setLookupQuery(queryToFetch);
          await fetchDonations(queryToFetch);
        }

        if (verifiedDonation) {
          setDonations(prev => {
            const exists = prev.find(d => d.date === verifiedDonation?.timestamp || d.id === verifiedDonation?.id);
            if (exists) return prev;
            return [{
              id: verifiedDonation.id || `donation-${Date.now()}`,
              amount: verifiedDonation.amount,
              currency: verifiedDonation.currency || 'USD',
              date: verifiedDonation.timestamp || new Date().toISOString(),
              status: verifiedDonation.status || 'completed',
              paymentMethod: verifiedDonation.paymentMethod || 'card',
              donorName: verifiedDonation.donorName || session?.user?.user_metadata?.name || 'Supporter',
              donorEmail: verifiedDonation.donorEmail || session?.user?.email || '',
              reference: verifiedDonation.reference || (sessionId ? sessionId.slice(-8).toUpperCase() : 'ONLINE')
            }, ...prev];
          });
        }

        // Fetch dynamic donor portal settings from admin dashboard
        try {
          const setRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
            signal: AbortSignal.timeout(6000),
          });
          if (setRes.ok) {
            const setData = await setRes.json();
            if (setData?.settings?.donorPortal) {
              setPortalConfig((prev: any) => ({ ...prev, ...setData.settings.donorPortal }));
            }
          }
        } catch (err) {
          console.warn('Could not load site-settings for donor portal, using defaults', err);
        }
      } catch (err) {
        console.error('Error in checkUser:', err);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const fetchDonations = async (query: string): Promise<Donation[]> => {
    if (!query) {
      setLoading(false);
      return [];
    }
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      if (data.donations && Array.isArray(data.donations)) {
        const q = query.toLowerCase().trim();
        const userDonations: Donation[] = data.donations
          .filter((d: any) => {
            const dEmail = (d.value?.donorEmail || d.value?.email || '').toLowerCase().trim();
            const dRef = (d.value?.reference || d.key || '').toLowerCase().trim();
            return dEmail === q || dRef.includes(q) || (q.length > 3 && dRef.endsWith(q));
          })
          .map((d: any) => ({
            id: d.key || d.id,
            amount: Number(d.value?.amount) || 0,
            currency: d.value?.currency || 'USD',
            date: d.value?.timestamp || d.value?.date || new Date().toISOString(),
            status: d.value?.status || 'completed',
            paymentMethod: d.value?.paymentMethod || 'card',
            donorName: d.value?.donorName || d.value?.name,
            donorEmail: d.value?.donorEmail || d.value?.email,
            reference: d.value?.reference || d.key?.replace(/^donation:/, '')
          }));
        
        userDonations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDonations(userDonations);
        return userDonations;
      }
      return [];
    } catch (err) {
      console.error('Error fetching donations', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleLookupDonations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      toast.error('Please enter your donation email or receipt reference.');
      return;
    }
    setLookupLoading(true);
    try {
      const results = await fetchDonations(lookupQuery.trim());
      setLookupSubmitted(true);
      if (results && results.length > 0) {
        toast.success(`Found ${results.length} donation ${results.length === 1 ? 'record' : 'records'}!`);
      } else {
        toast.info('No donations found for this email or reference. If you recently donated, please allow a moment to sync.');
      }
    } catch (err) {
      toast.error('Unable to search donations right now.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please enter both email and password.');
      return;
    }
    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        setDisplayName(data.user.user_metadata?.name || '');
        setPhone(data.user.user_metadata?.phone || '');
        setAddress(data.user.user_metadata?.address || '');
        setCity(data.user.user_metadata?.city || '');
        setCountry(data.user.user_metadata?.country || 'Uganda');
        setPostalCode(data.user.user_metadata?.postal_code || data.user.user_metadata?.postalCode || '');
        toast.success('Signed in successfully!');
        if (data.user.email) {
          await fetchDonations(data.user.email);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDonations([]);
    setLookupQuery('');
    setLookupSubmitted(false);
    toast.success('Logged out successfully');
  };

  const handleManageBilling = async () => {
    const targetEmail = user?.email || guestBillingEmail.trim();
    if (!targetEmail) {
      toast.error('Please enter the email address linked to your recurring donation.');
      return;
    }
    try {
      setBillingLoading(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: targetEmail,
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
      console.error('Donation portal error:', err);
      toast.info(err.message || 'Unable to open donation portal. If you made a one-time gift, no recurring subscription is active.');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          name: displayName,
          phone,
          address,
          city,
          country,
          postal_code: postalCode
        }
      });
      if (error) throw error;
      setUser((prev: any) => ({
        ...prev,
        user_metadata: { 
          ...prev?.user_metadata, 
          name: displayName,
          phone,
          address,
          city,
          country,
          postal_code: postalCode
        }
      }));
      toast.success('Donor profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Metrics
  const totalGivenUSD = donations
    .filter(d => d.status.toLowerCase() === 'completed')
    .reduce((sum, d) => sum + (d.currency.toUpperCase() === 'USD' ? d.amount : d.amount / 3800), 0);

  const completedCount = donations.filter(d => d.status.toLowerCase() === 'completed').length;

  const getTier = (count: number, total: number) => {
    if (total >= 500 || count >= 5) return { name: 'Transformational Partner', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (total >= 100 || count >= 2) return { name: 'Community Pillar', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    return { name: 'Empowerment Supporter', badge: 'bg-teal-100 text-teal-800 border-teal-300' };
  };

  const tier = getTier(completedCount, totalGivenUSD);

  // Filtered donations
  const filteredDonations = donations.filter(d => {
    const matchesStatus = statusFilter === 'all' || d.status.toLowerCase() === statusFilter;
    const matchesSearch = searchQuery === '' ||
      (d.reference && d.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.paymentMethod && d.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.amount.toString().includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const getMethodBadge = (m: string) => {
    const method = (m || '').toLowerCase();
    if (method.includes('mtn')) return { label: 'MTN MoMo', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    if (method.includes('airtel')) return { label: 'Airtel Money', color: 'bg-red-50 text-red-800 border-red-200' };
    if (method.includes('paypal')) return { label: 'PayPal', color: 'bg-blue-50 text-blue-800 border-blue-200' };
    if (method.includes('bank')) return { label: 'Bank Transfer', color: 'bg-purple-50 text-purple-800 border-purple-200' };
    return { label: 'Credit Card (Stripe)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500 font-medium">Accessing your Donor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 pt-28 sm:pt-36 pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Banner & Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300" fill="currentColor" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold tracking-widest uppercase bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-3 py-0.5 rounded-full">
                    {portalConfig?.badge || 'RESTI Donor Portal'}
                  </span>
                  {user && (
                    <span className={`text-xs font-semibold px-3 py-0.5 rounded-full border ${tier.badge}`}>
                      {tier.name}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
                  {user 
                    ? `${portalConfig?.welcomePrefix || 'Welcome,'} ${user?.user_metadata?.name || portalConfig?.defaultName || 'Valued Supporter'}!`
                    : (portalConfig?.welcomePrefix ? `${portalConfig.welcomePrefix} ${portalConfig?.defaultName || 'Supporter'}!` : 'RESTI Donor Portal & Receipts')
                  }
                </h1>
                <p className="text-emerald-100 text-sm sm:text-base mt-1 flex items-center gap-2">
                  {user ? (
                    <>
                      <span>{user?.email}</span>
                      <span>•</span>
                      <span>Supporter since {new Date(user?.created_at).getFullYear()}</span>
                    </>
                  ) : (
                    <span>Instant access to verified giving history, downloadable tax receipts, and contribution settings.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Link to="/donate" className="flex-1 sm:flex-initial">
                <Button className="w-full bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-md hover:shadow-lg transition-all">
                  <Heart className="w-4 h-4 mr-2 text-rose-500" fill="currentColor" />
                  {portalConfig?.makeGiftBtnText || 'Make a Gift'}
                </Button>
              </Link>
              {user ? (
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="bg-emerald-900/40 border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" /> {portalConfig?.signOutBtnText || 'Sign Out'}
                </Button>
              ) : (
                <Link to="/login?redirect=/donor-portal" className="flex-1 sm:flex-initial">
                  <Button 
                    variant="outline" 
                    className="w-full bg-emerald-900/40 border-white/20 text-white hover:bg-white/10 hover:text-white"
                  >
                    <User className="w-4 h-4 mr-2" /> Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {portalConfig?.metric1Label || 'Total Contributed'}
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                ${totalGivenUSD.toFixed(2)} <span className="text-xs font-normal text-slate-500">USD</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {portalConfig?.metric2Label || 'Gifts Recorded'}
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {donations.length} <span className="text-xs font-normal text-slate-500">{donations.length === 1 ? 'Gift' : 'Gifts'}</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {portalConfig?.metric3Label || 'Official Receipts'}
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {completedCount} <span className="text-xs font-normal text-slate-500">Available</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {portalConfig?.metric4Label || 'Field Focus'}
              </p>
              <p className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                {portalConfig?.metric4Value || 'Kiryandongo Settlements'}
              </p>
            </div>
          </div>
        </div>

        {/* Portal Tabs Bar */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2 sm:gap-4 no-scrollbar">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-3 sm:px-4 font-bold text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={18} />
            {portalConfig?.tabHistoryLabel || 'Giving History & Receipts'}
          </button>

          <button
            onClick={() => setActiveTab('recurring')}
            className={`pb-4 px-3 sm:px-4 font-bold text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'recurring'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw size={18} />
            {portalConfig?.tabManageLabel || 'Manage Your Donation'}
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`pb-4 px-3 sm:px-4 font-bold text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'impact'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={18} />
            {portalConfig?.tabImpactLabel || 'Field Impact Bulletins'}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-3 sm:px-4 font-bold text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings size={18} />
            {portalConfig?.tabProfileLabel || 'Profile & Tax Preferences'}
          </button>
        </div>

        {/* TAB 1: GIVING HISTORY & RECEIPTS */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {!user && donations.length === 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Option A: Quick Lookup without password */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">
                        Instant Receipt & Gift Lookup
                      </h3>
                      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        Contributed via Card, Bank, MTN MoMo, or Airtel Money? Enter your donation email or transaction reference to view records and download official PDF tax receipts immediately.
                      </p>
                      <form onSubmit={handleLookupDonations} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Donor Email Address or Reference ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. supporter@example.com or REF-12345"
                            value={lookupQuery}
                            onChange={(e) => setLookupQuery(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={lookupLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs"
                        >
                          {lookupLoading ? 'Searching...' : 'Find My Receipts & History'}
                        </Button>
                      </form>
                    </div>
                    {lookupSubmitted && donations.length === 0 && (
                      <p className="text-xs text-amber-600 mt-4 text-center">
                        No records matched "{lookupQuery}". Check the email you used or make a gift to get started.
                      </p>
                    )}
                  </div>

                  {/* Option B: Account Sign In */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                        <User className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">
                        Donor Account Sign In
                      </h3>
                      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        Log in with your donor account to access recurring donation controls, save personal tax preferences, and manage your supporter profile.
                      </p>
                      <form onSubmit={handleInlineLogin} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Password
                            </label>
                            <Link to="/reset-password" className="text-xs text-emerald-600 hover:underline">
                              Forgot?
                            </Link>
                          </div>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={loginLoading}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-xs"
                        >
                          {loginLoading ? 'Signing In...' : 'Sign In to Portal'}
                        </Button>
                      </form>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Don't have an account?</span>
                      <Link to="/register" className="text-emerald-700 font-bold hover:underline">
                        Create Free Account
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden">
                {!user && (
                  <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800">
                    <span className="font-medium">
                      Showing records found for: <strong className="font-bold">{lookupQuery || 'Searched Donor'}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setDonations([]);
                        setLookupQuery('');
                        setLookupSubmitted(false);
                      }}
                      className="font-bold underline hover:text-emerald-950"
                    >
                      Look Up Another Donor / Reference
                    </button>
                  </div>
                )}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-900">Your Contributions</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Instant verifiable donation records and downloadable official receipts</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ref or amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e: any) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                {filteredDonations.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Heart size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No donations found</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
                      {searchQuery ? 'No gifts matched your search criteria.' : 'You have not recorded any donations with this account email yet.'}
                    </p>
                    <Link to="/donate">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                        Make Your First Gift
                      </Button>
                    </Link>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                        <th className="py-3.5 px-6">Date</th>
                        <th className="py-3.5 px-6">Amount</th>
                        <th className="py-3.5 px-6">Payment Method</th>
                        <th className="py-3.5 px-6">Reference ID</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Official Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredDonations.map((d) => {
                        const mInfo = getMethodBadge(d.paymentMethod);
                        return (
                          <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-medium text-slate-800 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                {new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-extrabold text-slate-900 whitespace-nowrap">
                              {d.currency.toUpperCase() === 'USD' ? `$${d.amount.toFixed(2)}` : `${d.amount.toLocaleString()} ${d.currency.toUpperCase()}`}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${mInfo.color}`}>
                                {mInfo.label}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs text-slate-500 whitespace-nowrap">
                              {d.reference || d.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                d.status.toLowerCase() === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${d.status.toLowerCase() === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedDonation(d)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <Printer size={13} />
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

            {/* Donor Assurance Note */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
              <Shield className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                <p className="font-bold mb-0.5">RESTI Financial Transparency & Donor Privacy Guarantee</p>
                <p className="text-emerald-800">
                  {portalConfig?.securityNote || 'Every contribution is strictly deployed to on-the-ground programs in Kiryandongo District, Uganda. We never sell or exchange donor details with outside third parties. For institutional auditing or grant matching letters, contact info@resticbo.org.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE YOUR DONATION */}
        {activeTab === 'recurring' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-900">
                      {portalConfig?.manageTitle || 'Manage Your Donation'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                      {portalConfig?.manageSubtitle || 'Manage payment cards, pause, or adjust your monthly gifts securely'}
                    </p>
                  </div>
                </div>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  {portalConfig?.manageDescription || "Recurring donors are the backbone of RESTI's sustainability in fragile settlement environments. They ensure vulnerable children have tuition for the full academic year and allow vocational workshops to stock ongoing training tools."}
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">
                      {portalConfig?.billingProviderLabel || 'Billing Provider:'}
                    </span>
                    <span className="font-bold text-slate-800">
                      {portalConfig?.billingProviderValue || 'Secure PCI-DSS Level 1 Encrypted'}
                    </span>
                  </div>
                  {user?.email ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">Linked Donor Email:</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{user.email}</span>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Linked Recurring Donor Email:
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. supporter@example.com"
                        value={guestBillingEmail}
                        onChange={(e) => setGuestBillingEmail(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Enter the email address you used when setting up your recurring gift to launch the management portal.
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md"
                >
                  {billingLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {portalConfig?.buttonLoadingText || 'Connecting to Donation Portal...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {portalConfig?.buttonText || 'Manage Your Donation'} <ExternalLink size={16} />
                    </span>
                  )}
                </Button>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
                <h3 className="text-lg font-bold font-heading text-slate-900 mb-3">Frequently Asked Questions</h3>
                <div className="space-y-4 text-sm text-slate-600">
                  {(portalConfig?.faqs || DEFAULT_DONOR_PORTAL_SETTINGS.faqs).map((faq: any, idx: number) => (
                    <div key={idx}>
                      <h4 className="font-bold text-slate-800 mb-1">{faq.question}</h4>
                      <p>{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar CTA */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
                <Sparkles className="w-8 h-8 text-emerald-200 mb-4" />
                <h3 className="text-xl font-bold font-heading mb-2">
                  {portalConfig?.sidebarPledgeTitle || 'Pledge $25 / Month'}
                </h3>
                <p className="text-emerald-100 text-sm leading-relaxed mb-6">
                  {portalConfig?.sidebarPledgeText || 'A monthly pledge of $25 provides 2 refugee women with vocational tailoring materials and Village Savings (VSLA) seed capital every single month.'}
                </p>
                <Link to="/donate">
                  <Button className="w-full bg-white text-emerald-800 hover:bg-emerald-50 font-bold border-none shadow-md">
                    {portalConfig?.sidebarPledgeButtonText || 'Set Up Monthly Gift'} <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIELD IMPACT BULLETINS */}
        {activeTab === 'impact' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs">
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {portalConfig?.impactBadge || 'Kiryandongo Field Dispatch'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-3 mb-4">
                {portalConfig?.impactTitle || 'How Your Contributions Are Changing Lives'}
              </h2>
              <p className="text-slate-600 leading-relaxed text-base mb-8">
                {portalConfig?.impactSubtitle || 'Because of dedicated supporters like you, RESTI continues to bridge emergency survival and sustainable dignity across settlements in Kiryandongo District, Uganda.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(portalConfig?.impactStories || DEFAULT_DONOR_PORTAL_SETTINGS.impactStories).map((story: any, sIdx: number) => (
                  <div key={sIdx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col">
                    <div className="h-40 rounded-xl overflow-hidden mb-4 bg-slate-200 shrink-0">
                      <img 
                        src={story.image} 
                        alt={story.title} 
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{story.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mt-auto">
                      {story.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Leadership Thank-You Box */}
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h4 className="font-bold text-slate-900">
                    {portalConfig?.leadershipHeading || 'A Message From RESTI Leadership'}
                  </h4>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5 italic">
                    {portalConfig?.leadershipQuote || '"On behalf of the refugee families and local host communities in Kiryandongo, thank you for walking this transformative journey with us."'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-slate-800">
                    {portalConfig?.leadershipAuthor || 'Mr. Kwaya Daniel Loborach'}
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold">
                    {portalConfig?.leadershipRole || 'Co-Founder, RESTI Uganda'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE & PREFERENCES */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-900">Donor Profile & Preferences</h2>
              <p className="text-slate-500 text-sm mt-0.5">Ensure your donation receipts and impact communications are accurate</p>
            </div>

            {!user ? (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/70 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <User size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sign In to Save Tax & Receipt Details</h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                  Log in or create a donor account to configure your official legal name, contact phone number, and physical mailing address for year-end tax letters and official acknowledgments.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link to="/login?redirect=/donor-portal">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                      Sign In to Account
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline" className="border-slate-300 text-slate-700 font-semibold">
                      Create Free Account
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Legal Name (For Official Tax Receipts)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Dr. Jane Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Contact support if you need to transfer your donation history to another email.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+256 700 000000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Street Address / P.O. Box
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street or Plot address"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      City / Town
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Postal / ZIP Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Postal Code"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Details'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLogout}
                    className="text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    <LogOut size={14} className="mr-1.5" /> Sign Out
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* OFFICIAL PRINTABLE DONATION RECEIPT MODAL */}
      {/* ========================================================= */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            
            {/* Modal Top Bar (Actions) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" />
                <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">Official Verification Document</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Printer size={14} /> Print / Save PDF
                </Button>
                <button
                  onClick={() => setSelectedDonation(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div id="printable-receipt" className="p-8 sm:p-12 text-slate-800 bg-white print:p-0">
              
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-emerald-600 pb-6 mb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      R
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-slate-900">RESTI</h2>
                  </div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Refugee Empowerment For Sustainable Transformation Initiative
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kiryandongo District, Uganda • Email: info@resticbo.org • Web: resticbo.org
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-1">
                    Official Donation Receipt
                  </span>
                  <p className="font-mono text-xs font-bold text-slate-900">
                    REC-{selectedDonation.reference || selectedDonation.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Date: {new Date(selectedDonation.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Receipt Summary Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Donor Name</span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {selectedDonation.donorName || user?.user_metadata?.name || 'Valued Supporter'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Donor Email</span>
                  <span className="font-medium text-slate-700 block font-mono text-[11px]">
                    {selectedDonation.donorEmail || user?.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Payment Channel</span>
                  <span className="font-bold text-slate-900 block">
                    {getMethodBadge(selectedDonation.paymentMethod).label}
                  </span>
                </div>
              </div>

              {/* Contribution Line Item */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Description / Allocation</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">Charitable Contribution to RESTI Community Programs</p>
                        <p className="text-xs text-slate-500 mt-0.5">Direct funding for refugee education, livelihoods & healthcare initiatives in Kiryandongo District</p>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {selectedDonation.currency.toUpperCase() === 'USD' ? `$${selectedDonation.amount.toFixed(2)} USD` : `${selectedDonation.amount.toLocaleString()} ${selectedDonation.currency.toUpperCase()}`}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-emerald-50/50 border-t-2 border-emerald-600 text-slate-900 font-bold">
                    <tr>
                      <td className="py-3 px-4 text-emerald-950">Total Received & Acknowledged</td>
                      <td className="py-3 px-4 text-right text-base text-emerald-800">
                        {selectedDonation.currency.toUpperCase() === 'USD' ? `$${selectedDonation.amount.toFixed(2)} USD` : `${selectedDonation.amount.toLocaleString()} ${selectedDonation.currency.toUpperCase()}`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Legal & Acknowledgment Statement */}
              <div className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-100 mb-6">
                <p className="font-bold text-slate-800 mb-1">Official Non-Profit Tax Certification:</p>
                <p>
                  RESTI certifies that no goods, services, or commercial benefits were provided in whole or part in consideration for this financial contribution. This gift is recognized in accordance with Ugandan community-based non-profit standards and international charitable reporting guidelines.
                </p>
              </div>

              {/* Signature & Seal */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                <div className="text-[11px] text-slate-400">
                  <p>Refugee Empowerment For Sustainable Transformation Initiative</p>
                  <p>Registered Community-Based Organization • Kiryandongo, Uganda</p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-b border-slate-400 pb-1 px-4 mb-1">
                    <span className="font-serif italic text-sm font-bold text-slate-700">Kwaya Daniel Loborach</span>
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Authorized Signature & Seal</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

