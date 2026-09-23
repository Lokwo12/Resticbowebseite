import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Heart, CreditCard, Calendar, ArrowRight, Settings, LogOut, 
  Download, Printer, Shield, CheckCircle2, Clock, User, 
  FileText, ChevronRight, Sparkles, Building2, Phone, Mail, 
  ExternalLink, X, Search, Filter, RefreshCw, Zap, AlertCircle,
  Eye, EyeOff, Lock, Check, Menu, ChevronLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { DEFAULT_DONOR_PORTAL_SETTINGS } from './SiteSettingsTab';
import { useDonationModal } from './DonationModalContext';

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | string;
  paymentMethod: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  reference?: string;
  receiptNumber?: string;
  campaign?: string;
}

export interface Subscription {
  id: string;
  donor_id: string;
  provider_subscription_id?: string;
  status: string;
  plan?: string;
  amount: number;
  currency: string;
  frequency?: string;
  next_payment_date?: string;
  payment_method?: string;
  created_at?: string;
}

type TabType = 'overview' | 'history' | 'recurring' | 'impact' | 'profile';

export function DonorDashboard() {
  const { open: openDonationModal } = useDonationModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Portal State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [portalConfig, setPortalConfig] = useState<any>(DEFAULT_DONOR_PORTAL_SETTINGS);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [emailSending, setEmailSending] = useState(false);

  // Search & Filters in Giving History
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Impact Updates State
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Uganda');
  const [postalCode, setPostalCode] = useState('');
  const [commImmediateReceipt, setCommImmediateReceipt] = useState(true);
  const [commQuarterlyDigest, setCommQuarterlyDigest] = useState(true);
  const [commAnnualStatement, setCommAnnualStatement] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Update State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Auth / Guest State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync tab from URL if provided
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['overview', 'history', 'recurring', 'impact', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    }, { replace: true });
  };

  // Helper to format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    const curr = (currency || 'USD').toUpperCase();
    if (curr === 'USD') {
      return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${amount.toLocaleString()} ${curr}`;
  };

  // Fetch authenticated donor data
  const fetchDonorData = useCallback(async (authToken?: string, queryEmail?: string, queryRef?: string) => {
    try {
      setRefreshing(true);
      const headers: Record<string, string> = {
        Authorization: authToken ? `Bearer ${authToken}` : `Bearer ${publicAnonKey}`
      };

      const params = new URLSearchParams();
      if (queryEmail) params.set('email', queryEmail);
      if (queryRef) params.set('ref', queryRef);

      const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donor/donations${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.donations)) {
          setDonations(data.donations);
          return data.donations;
        }
      }

      // Fallback: direct query via Supabase Client (strictly authenticated donor & completed gifts)
      if (queryEmail) {
        const { data: directData, error: directErr } = await supabase
          .from('donations')
          .select('*')
          .ilike('email', queryEmail)
          .in('status', ['completed', 'succeeded'])
          .order('created_at', { ascending: false });

        if (!directErr && directData) {
          const normalized: Donation[] = directData.map((r: any) => {
            const rawRef = (r.transaction_id || r.id || '').replace(/^donation:/, '');
            return {
              id: r.id || `don-${rawRef}`,
              amount: Number(r.amount) || 0,
              currency: (r.currency || 'USD').toUpperCase(),
              date: r.created_at || r.updated_at || new Date().toISOString(),
              status: 'completed',
              paymentMethod: (r.method || r.provider || 'card').toLowerCase(),
              donorName: `${r.first_name || ''} ${r.last_name || ''}`.trim() || undefined,
              donorEmail: r.email || undefined,
              donorPhone: r.phone || undefined,
              reference: rawRef,
              receiptNumber: `REC-${rawRef.slice(-8).toUpperCase()}`,
              campaign: r.campaign || 'Community Empowerment & Education',
            };
          });
          setDonations(normalized);
          return normalized;
        }
      }

      setDonations([]);
      return [];
    } catch (err) {
      console.error('Error in fetchDonorData:', err);
      return [];
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Fetch recurring subscriptions
  const fetchSubscriptions = useCallback(async (authToken?: string, queryEmail?: string) => {
    try {
      const headers: Record<string, string> = {
        Authorization: authToken ? `Bearer ${authToken}` : `Bearer ${publicAnonKey}`
      };
      const params = queryEmail ? `?email=${encodeURIComponent(queryEmail)}` : '';
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donor/subscriptions${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.subscriptions) {
          setSubscriptions(data.subscriptions);
        }
      }
    } catch (err) {
      console.warn('Subscriptions fetch notice:', err);
    }
  }, []);

  // Fetch dynamic impact stories
  const fetchImpactUpdates = useCallback(async () => {
    try {
      setLoadingStories(true);
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.stories && Array.isArray(data.stories) && data.stories.length > 0) {
          setStories(data.stories);
          return;
        }
      }
      // Fallback to configured portal stories
      setStories(portalConfig?.impactStories || DEFAULT_DONOR_PORTAL_SETTINGS.impactStories);
    } catch (err) {
      setStories(portalConfig?.impactStories || DEFAULT_DONOR_PORTAL_SETTINGS.impactStories);
    } finally {
      setLoadingStories(false);
    }
  }, [portalConfig?.impactStories]);

  // Initial user check and setup
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        const urlEmail = searchParams.get('email');
        const urlRef = searchParams.get('ref');

        if (session?.user && mounted) {
          setUser(session.user);
          const meta = session.user.user_metadata || {};
          setDisplayName(meta.name || '');
          setPhone(meta.phone || '');
          setAddress(meta.address || '');
          setCity(meta.city || '');
          setCountry(meta.country || 'Uganda');
          setPostalCode(meta.postal_code || meta.postalCode || '');
          setCommImmediateReceipt(meta.commImmediateReceipt ?? true);
          setCommQuarterlyDigest(meta.commQuarterlyDigest ?? true);
          setCommAnnualStatement(meta.commAnnualStatement ?? true);

          await Promise.all([
            fetchDonorData(session.access_token, session.user.email),
            fetchSubscriptions(session.access_token, session.user.email),
            fetchImpactUpdates()
          ]);
        } else {
          setUser(null);
          // If guest provided email or ref in URL
          if (urlEmail || urlRef) {
            setLookupQuery(urlEmail || urlRef || '');
            setLookupDone(true);
            await fetchDonorData(undefined, urlEmail || undefined, urlRef || undefined);
          }
          await fetchImpactUpdates();
        }

        // Fetch custom site-settings if configured
        try {
          const setRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
            signal: AbortSignal.timeout(5000),
          });
          if (setRes.ok && mounted) {
            const setData = await setRes.json();
            if (setData?.settings?.donorPortal) {
              setPortalConfig((prev: any) => ({ ...prev, ...setData.settings.donorPortal }));
            }
          }
        } catch {
          // Defaults preserved
        }
      } catch (err) {
        console.error('Error during donor auth check:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    // Listen to Supabase auth state changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        setUser(session.user);
        await fetchDonorData(session.access_token, session.user.email);
        await fetchSubscriptions(session.access_token, session.user.email);
      } else if (!session && mounted) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      authSub?.unsubscribe();
    };
  }, [fetchDonorData, fetchSubscriptions, fetchImpactUpdates, searchParams]);

  // Handle Guest Lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      toast.error('Please enter your donation email or transaction reference.');
      return;
    }
    setLookupLoading(true);
    try {
      const q = lookupQuery.trim();
      const results = await fetchDonorData(undefined, q.includes('@') ? q : undefined, !q.includes('@') ? q : undefined);
      setLookupDone(true);
      if (results && results.length > 0) {
        toast.success(`Found ${results.length} donation ${results.length === 1 ? 'record' : 'records'}!`);
      } else {
        toast.info('No donations found for this lookup. If you recently gave, please allow 1-2 minutes to sync.');
      }
    } catch {
      toast.error('Unable to search donations right now.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Email Password Login
  const handleLogin = async (e: React.FormEvent) => {
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
        toast.success('Welcome back to the RESTI Donor Portal!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Magic Link Login
  const handleSendMagicLink = async () => {
    if (!loginEmail) {
      toast.error('Please enter your donor email address first.');
      return;
    }
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: { emailRedirectTo: `${window.location.origin}/donor-portal` }
      });
      if (error) throw error;
      setMagicLinkSent(true);
      toast.success('Secure magic link sent! Please check your email inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send magic link.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Sign Out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDonations([]);
    setSubscriptions([]);
    setLookupQuery('');
    setLookupDone(false);
    toast.success('Signed out of Donor Portal');
  };

  // Launch Stripe Customer Billing Portal
  const handleLaunchBillingPortal = async () => {
    const targetEmail = user?.email || lookupQuery;
    if (!targetEmail) {
      toast.error('Please sign in or provide the email linked to your monthly pledge.');
      return;
    }
    setBillingLoading(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: targetEmail,
          returnUrl: window.location.href
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to launch portal session');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Portal session error:', err);
      toast.info(err.message || 'Could not open billing portal. If your gift was one-time, no recurring pledge is on file.');
    } finally {
      setBillingLoading(false);
    }
  };

  // Resend Receipt Email
  const handleSendReceiptEmail = async (donation: Donation) => {
    setEmailSending(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donor/send-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          donationId: donation.id,
          reference: donation.reference,
          targetEmail: donation.donorEmail || user?.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send receipt email');
      toast.success(data.message || `Official receipt sent to ${donation.donorEmail || user?.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send receipt email. You can print/save PDF directly.');
    } finally {
      setEmailSending(false);
    }
  };

  // Save Donor Profile Details
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
          postal_code: postalCode,
          commImmediateReceipt,
          commQuarterlyDigest,
          commAnnualStatement,
        }
      });
      if (error) throw error;
      toast.success('Donor profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  // Summary Metrics
  const completedGifts = useMemo(() => 
    donations.filter(d => d.status.toLowerCase() === 'completed'),
    [donations]
  );

  const totalDonatedUSD = useMemo(() => 
    completedGifts.reduce((sum, d) => {
      const amt = Number(d.amount) || 0;
      return sum + (d.currency.toUpperCase() === 'USD' ? amt : amt / 3800);
    }, 0),
    [completedGifts]
  );

  const latestDonation = useMemo(() => 
    donations.length > 0 ? donations[0] : null,
    [donations]
  );

  const activeSubscription = useMemo(() => 
    subscriptions.find(s => s.status === 'active') || null,
    [subscriptions]
  );

  // Filtered & Paginated Donations
  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchesStatus = statusFilter === 'all' || d.status.toLowerCase() === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (d.reference && d.reference.toLowerCase().includes(q)) ||
        (d.receiptNumber && d.receiptNumber.toLowerCase().includes(q)) ||
        (d.paymentMethod && d.paymentMethod.toLowerCase().includes(q)) ||
        (d.campaign && d.campaign.toLowerCase().includes(q)) ||
        d.amount.toString().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [donations, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / itemsPerPage));
  const paginatedDonations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDonations.slice(start, start + itemsPerPage);
  }, [filteredDonations, currentPage, itemsPerPage]);

  const getMethodBadge = (m: string) => {
    const method = (m || '').toLowerCase();
    if (method.includes('mtn')) return { label: 'MTN MoMo', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    if (method.includes('airtel')) return { label: 'Airtel Money', color: 'bg-red-50 text-red-800 border-red-200' };
    if (method.includes('paypal')) return { label: 'PayPal', color: 'bg-blue-50 text-blue-800 border-blue-200' };
    if (method.includes('bank')) return { label: 'Bank Wire', color: 'bg-purple-50 text-purple-800 border-purple-200' };
    return { label: 'Credit Card', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  };

  const getStatusBadge = (s: string) => {
    const status = (s || '').toLowerCase();
    if (status === 'completed') {
      return { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
    }
    if (status === 'pending') {
      return { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
    }
    return { label: 'Failed', color: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-600 font-medium">Opening your RESTI Donor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 pt-24 sm:pt-32 pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Top Header Card ────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-300" fill="currentColor" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold tracking-widest uppercase bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 px-3 py-0.5 rounded-full">
                    {portalConfig?.badge || 'RESTI Donor Portal'}
                  </span>
                  {user && (
                    <span className="text-[11px] font-semibold bg-white/15 text-white px-2.5 py-0.5 rounded-full">
                      Verified Supporter
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
                  {user 
                    ? `Welcome, ${user?.user_metadata?.name || 'Valued Supporter'}!`
                    : 'RESTI Supporter & Donor Portal'
                  }
                </h1>
                <p className="text-emerald-100/90 text-xs sm:text-sm mt-0.5">
                  {user ? user.email : 'View verified giving history, tax receipts, and community impact.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Button
                onClick={() => openDonationModal()}
                className="flex-1 sm:flex-initial bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-md cursor-pointer"
              >
                <Heart className="w-4 h-4 mr-2 text-rose-500" fill="currentColor" />
                Make a Gift
              </Button>
              {user ? (
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="bg-emerald-950/40 border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => switchTab('profile')}
                  className="bg-emerald-950/40 border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer text-xs"
                >
                  <User className="w-3.5 h-3.5 mr-1.5" /> Donor Sign In
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Navigation Trigger ──────────────────────────────── */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between text-slate-800 font-bold text-sm shadow-xs"
          >
            <span className="flex items-center gap-2">
              <Menu size={18} className="text-emerald-600" />
              <span>Menu: <strong>
                {activeTab === 'overview' && '1. Overview'}
                {activeTab === 'history' && '2. Giving History & Receipts'}
                {activeTab === 'recurring' && '3. Manage Donations'}
                {activeTab === 'impact' && '4. Impact Updates'}
                {activeTab === 'profile' && '5. My Profile'}
              </strong></span>
            </span>
            <span className="text-xs text-emerald-600">Change tab</span>
          </button>
        </div>

        {/* ── Primary Navigation (Desktop Pills / Mobile Drawer) ─────── */}
        <div className={`mb-8 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex flex-col md:flex-row gap-1">
            <button
              onClick={() => switchTab('overview')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Zap size={16} />
              <span>1. Overview</span>
            </button>

            <button
              onClick={() => switchTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText size={16} />
              <span>2. Giving History & Receipts</span>
              {donations.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'history' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {donations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => switchTab('recurring')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'recurring'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <RefreshCw size={16} />
              <span>3. Manage Donations</span>
            </button>

            <button
              onClick={() => switchTab('impact')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'impact'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={16} />
              <span>4. Impact Updates</span>
            </button>

            <button
              onClick={() => switchTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User size={16} />
              <span>5. My Profile</span>
            </button>
          </div>
        </div>

        {/* ── Guest Authentication Banner (when not logged in) ──────── */}
        {!user && activeTab !== 'profile' && donations.length === 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 mb-8 text-emerald-950">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Donor Lookup & Sign In
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                  Access Your Official Receipts and Giving History
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Sign in with your donor account or enter your donation email address below to look up previous contributions and download verified tax receipts.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <Button
                  onClick={() => switchTab('profile')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  <User size={16} className="mr-2" /> Sign In to Portal
                </Button>
                <form onSubmit={handleLookup} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter email or reference..."
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
                  />
                  <Button
                    type="submit"
                    disabled={lookupLoading}
                    variant="outline"
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-100 cursor-pointer text-xs"
                  >
                    {lookupLoading ? 'Searching...' : 'Lookup'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: OVERVIEW                                          */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* 4 Live KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Donated */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Contributed
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    ${totalDonatedUSD.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    {completedGifts.length} verified gifts
                  </p>
                </div>
              </div>

              {/* Card 2: Number of Donations */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Number of Gifts
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {donations.length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lifetime recorded contributions
                  </p>
                </div>
              </div>

              {/* Card 3: Latest Donation */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Latest Donation
                  </p>
                  <p className="text-xl font-black text-slate-900 mt-0.5 truncate">
                    {latestDonation ? formatCurrency(latestDonation.amount, latestDonation.currency) : '$0.00'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {latestDonation 
                      ? new Date(latestDonation.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'No contributions yet'}
                  </p>
                </div>
              </div>

              {/* Card 4: Recurring Status */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Recurring Donation
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    {activeSubscription ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {formatCurrency(activeSubscription.amount, activeSubscription.currency)} / mo
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">None Active</span>
                    )}
                  </p>
                  <button
                    onClick={() => switchTab('recurring')}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline block mt-0.5"
                  >
                    {activeSubscription ? 'Manage pledge →' : 'Set up monthly gift →'}
                  </button>
                </div>
              </div>

            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => openDonationModal()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
                >
                  <Heart size={20} className="fill-current text-rose-300" />
                  <span className="text-xs sm:text-sm font-bold">Make a Donation</span>
                </button>

                <button
                  onClick={() => switchTab('history')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  <FileText size={20} className="text-slate-600" />
                  <span className="text-xs sm:text-sm font-bold">View Giving History</span>
                </button>

                <button
                  onClick={() => {
                    if (latestDonation) setSelectedDonation(latestDonation);
                    else switchTab('history');
                  }}
                  disabled={donations.length === 0}
                  className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  <Printer size={20} className="text-slate-600" />
                  <span className="text-xs sm:text-sm font-bold">Download Latest Receipt</span>
                </button>

                <button
                  onClick={() => switchTab('recurring')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  <Settings size={20} className="text-slate-600" />
                  <span className="text-xs sm:text-sm font-bold">Manage Donations</span>
                </button>
              </div>
            </div>

            {/* Two-Column: Recent Donation Activity & RESTI Field Impact Spotlight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left 2 Cols: Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold font-heading text-slate-900">Recent Donation Activity</h3>
                      <p className="text-xs text-slate-500">Your latest contributions and receipts</p>
                    </div>
                    <button
                      onClick={() => switchTab('history')}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      View all ({donations.length}) <ChevronRight size={14} />
                    </button>
                  </div>

                  {donations.length === 0 ? (
                    <div className="py-12 text-center">
                      <Heart size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No donations recorded yet</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        When you contribute to RESTI programs, your records, tax receipts, and payment references will appear here.
                      </p>
                      <Button
                        onClick={() => openDonationModal()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Make Your First Gift
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {donations.slice(0, 4).map((d) => {
                        const status = getStatusBadge(d.status);
                        const method = getMethodBadge(d.paymentMethod);
                        return (
                          <div
                            key={d.id}
                            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-emerald-700 shrink-0">
                                {d.currency}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">
                                  {formatCurrency(d.amount, d.currency)}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <span>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  <span>•</span>
                                  <span className="font-mono text-[11px]">{d.reference || d.id.slice(-8).toUpperCase()}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${status.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                              <button
                                onClick={() => setSelectedDonation(d)}
                                className="text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Printer size={12} /> View Receipt
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Short RESTI Impact Spotlight */}
              <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 rounded-3xl p-6 text-white shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                      Field Impact Spotlight
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-heading text-white mb-2">
                    Kiryandongo Community Transformation
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                    Because of dedicated donors like you, RESTI provides vocational tailoring certifications, clean water access, and digital skills workshops to over 500+ refugee families every quarter.
                  </p>
                  
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Program Allocation:</span>
                      <span className="font-bold text-emerald-300">90% Direct Aid</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Target Region:</span>
                      <span className="font-bold text-white">Kiryandongo District</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Legal Status:</span>
                      <span className="font-bold text-white">Uganda NGO Bureau</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => switchTab('impact')}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Explore Impact Stories</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: GIVING HISTORY & RECEIPTS                         */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              
              {/* Header with Search & Status Filter */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-slate-900">Giving History & Receipts</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Verifiable transaction records and official tax-deductible receipts
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ref, receipt, or amount..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e: any) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const session = user ? user.access_token : undefined;
                      fetchDonorData(session, user?.email || lookupQuery);
                    }}
                    className="border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl cursor-pointer"
                    title="Refresh data"
                  >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin text-emerald-600 mr-1.5' : 'text-slate-500 mr-1.5'} />
                    <span>Sync</span>
                  </Button>
                </div>
              </div>

              {/* No Donations Message */}
              {filteredDonations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No donations found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                    {searchQuery 
                      ? `No donations matched "${searchQuery}". Try clearing filters.` 
                      : 'No contributions have been recorded for this account email yet.'}
                  </p>
                  <Button
                    onClick={() => openDonationModal()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    <Heart size={14} className="mr-1.5 fill-current" />
                    Make a Gift
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3.5 px-6">Date</th>
                          <th className="py-3.5 px-6">Amount</th>
                          <th className="py-3.5 px-6">Campaign / Program</th>
                          <th className="py-3.5 px-6">Method</th>
                          <th className="py-3.5 px-6">Reference ID</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedDonations.map((d) => {
                          const status = getStatusBadge(d.status);
                          const method = getMethodBadge(d.paymentMethod);
                          return (
                            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-medium text-slate-800 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Calendar size={13} className="text-slate-400" />
                                  {new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                              </td>
                              <td className="py-4 px-6 font-extrabold text-slate-900 whitespace-nowrap">
                                {formatCurrency(d.amount, d.currency)}
                              </td>
                              <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                                {d.campaign || 'Community Empowerment'}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${method.color}`}>
                                  {method.label}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {d.reference || d.id.slice(-8).toUpperCase()}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${status.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  onClick={() => setSelectedDonation(d)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                  title="View official printable receipt"
                                >
                                  <Printer size={12} /> View
                                </button>
                                <button
                                  onClick={() => handleSendReceiptEmail(d)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                  title="Email receipt to yourself"
                                >
                                  <Mail size={12} /> Email
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View (No horizontal scroll) */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {paginatedDonations.map((d) => {
                      const status = getStatusBadge(d.status);
                      const method = getMethodBadge(d.paymentMethod);
                      return (
                        <div key={d.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-base font-black text-slate-900">
                                {formatCurrency(d.amount, d.currency)}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Calendar size={12} />
                                {new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>

                          <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Channel:</span>
                              <span className="font-semibold">{method.label}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Reference:</span>
                              <span className="font-mono">{d.reference || d.id.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Allocation:</span>
                              <span className="truncate max-w-[180px]">{d.campaign || 'Community Programs'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => setSelectedDonation(d)}
                              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Printer size={13} /> View Receipt
                            </button>
                            <button
                              onClick={() => handleSendReceiptEmail(d)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Mail size={13} /> Email Receipt
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDonations.length)} of {filteredDonations.length} records
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="h-8 px-2.5 text-xs cursor-pointer"
                        >
                          <ChevronLeft size={14} className="mr-1" /> Prev
                        </Button>
                        <span className="px-2 font-bold text-slate-700">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className="h-8 px-2.5 text-xs cursor-pointer"
                        >
                          Next <ChevronRight size={14} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: MANAGE DONATIONS                                  */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'recurring' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Recurring Donation Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <RefreshCw size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-900">Recurring Donation Controls</h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Manage monthly giving amount, renewal dates, and payment cards securely
                    </p>
                  </div>
                </div>

                {activeSubscription ? (
                  <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Active Monthly Sustaining Pledge
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        {activeSubscription.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Pledge Amount</span>
                        <span className="text-xl font-black text-slate-900 block mt-0.5">
                          {formatCurrency(activeSubscription.amount, activeSubscription.currency)} / mo
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Billing Frequency</span>
                        <span className="font-bold text-slate-800 block mt-0.5">Monthly Automated</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Renewal Notice</span>
                        <span className="font-bold text-slate-800 block mt-0.5">Automated Receipt</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-emerald-200/60 flex flex-wrap items-center gap-3">
                      <Button
                        onClick={handleLaunchBillingPortal}
                        disabled={billingLoading}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        {billingLoading ? 'Connecting...' : 'Update Card or Change Amount'}
                        <ExternalLink size={13} className="ml-1.5" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleLaunchBillingPortal}
                        disabled={billingLoading}
                        className="border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs cursor-pointer"
                      >
                        Cancel Recurring Pledge
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Current Recurring Status
                      </span>
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        No Active Monthly Pledge
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      You currently do not have an automated monthly gift on file. Recurring contributions empower RESTI to plan sustainable vocational cohorts and secure ongoing school supplies for refugee children all year long.
                    </p>
                    
                    <div className="pt-2">
                      <Button
                        onClick={() => openDonationModal({ method: 'card', amount: 25 })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        <Heart size={14} className="mr-1.5 fill-current" />
                        Pledge $25 / Month to RESTI
                      </Button>
                    </div>
                  </div>
                )}

                {/* Direct Launch to Stripe Billing Portal */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Billing Provider:</span>
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <Shield size={13} className="text-emerald-600" /> PCI-DSS Level 1 Encrypted
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    RESTI never stores your payment card number or CVV in our database. Card and billing management is handled directly through Stripe's certified customer portal.
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={handleLaunchBillingPortal}
                      disabled={billingLoading}
                      className="border-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      {billingLoading ? 'Connecting...' : 'Launch Stripe Customer Portal'}
                      <ExternalLink size={13} className="ml-1.5" />
                    </Button>
                  </div>
                </div>

                {/* Frequently Asked Questions */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    Recurring Donation Questions
                  </h3>
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="font-bold text-slate-900 mb-1">How can I update my payment card or billing address?</p>
                      <p>Click "Launch Stripe Customer Portal" above. You will be redirected to our secure billing portal where you can update cards, change frequency, or download VAT invoices.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="font-bold text-slate-900 mb-1">Can I set up recurring donations with Mobile Money (MTN / Airtel)?</p>
                      <p>Mobile money networks in Uganda require mobile PIN authorization for each individual debit. For monthly automated giving, international debit or credit cards are recommended.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="font-bold text-slate-900 mb-1">How do I cancel my recurring donation?</p>
                      <p>You can pause or cancel your recurring contribution at any time through the customer portal with no cancellation fees or lock-ins.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Col: Become a Sustaining Partner CTA */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
                <Sparkles className="w-8 h-8 text-amber-300" />
                <h3 className="text-xl font-bold font-heading">
                  Become a Sustaining Monthly Pillar
                </h3>
                <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
                  Join our circle of monthly champions. Your predictable monthly support directly underwrites:
                </p>

                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>$15/mo provides educational supplies for 3 students</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>$25/mo trains a refugee mother in vocational tailoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>$50/mo funds clean water borehole maintenance</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <Button
                    onClick={() => openDonationModal({ method: 'card', amount: 25 })}
                    className="w-full bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs py-3 rounded-xl cursor-pointer shadow-md"
                  >
                    Start Monthly Gift ($25/mo)
                  </Button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: IMPACT UPDATES                                    */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'impact' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Kiryandongo District Field Updates
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 mt-3 mb-2">
                  Impact Updates: How Your Gifts Transform Communities
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                  Real stories and tangible progress from our programs in Kiryandongo District, Uganda. Every dollar you contribute creates real, documented change.
                </p>
              </div>

              {/* Dynamic Stories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {stories.map((story: any, idx: number) => (
                  <div
                    key={story.id || idx}
                    className="bg-slate-50 hover:bg-white transition-all duration-300 rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-xs hover:shadow-md"
                  >
                    <div className="h-44 bg-slate-200 overflow-hidden relative">
                      <img
                        src={story.image || story.imageUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80'}
                        alt={story.title || 'Impact Story'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e: any) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      {story.category && (
                        <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          {story.category}
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-2">
                        {story.title}
                      </h3>
                      <p className="text-slate-600 text-xs leading-relaxed flex-1 line-clamp-4">
                        {story.description || story.excerpt || story.content}
                      </p>
                      
                      {story.date && (
                        <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-200 flex items-center gap-1.5">
                          <Calendar size={12} />
                          {new Date(story.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Leadership Gratitude Message */}
              <div className="mt-8 pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    A Direct Word From RESTI Field Leadership
                  </h4>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 italic max-w-xl">
                    "On behalf of the refugee families and local host communities in Kiryandongo District, thank you for walking this transformative journey with us."
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="font-bold text-sm text-slate-900">
                    Mr. Kwaya Daniel Loborach
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold">
                    Co-Founder, RESTI Uganda
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* SECTION 5: MY PROFILE                                        */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* If Not Logged In: Dual Sign-In / Register Card */}
            {!user ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
                <div className="text-center max-w-md mx-auto space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <User size={28} />
                  </div>
                  <h2 className="text-2xl font-bold font-heading text-slate-900">
                    Donor Account Sign In
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    Sign in to customize your legal receipt name, view giving history across all devices, and manage donation preferences.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Password Login */}
                  <form onSubmit={handleLogin} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Sign In with Password
                    </span>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="supporter@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-slate-700">Password</label>
                        <Link to="/admin/reset-password" className="text-[11px] text-emerald-600 hover:underline">
                          Forgot?
                        </Link>
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer shadow-sm"
                    >
                      {loginLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>

                  {/* Passwordless Magic Link Login */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Passwordless Magic Link
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        No password needed. We'll send an instant, secure sign-in link directly to your inbox.
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Your Email</label>
                        <input
                          type="email"
                          placeholder="supporter@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleSendMagicLink}
                      disabled={loginLoading || !loginEmail}
                      variant="outline"
                      className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-100 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
                    >
                      {magicLinkSent ? 'Link Sent! Check Inbox' : 'Send Secure Magic Link'}
                    </Button>
                  </div>

                </div>

                <div className="text-center pt-3 text-xs text-slate-500">
                  <span>Want to create an account? </span>
                  <Link to="/register" className="text-emerald-700 font-bold hover:underline">
                    Create Donor Account
                  </Link>
                </div>
              </div>
            ) : (
              /* Authenticated Profile Management Form */
              <div className="space-y-6">
                
                {/* Profile Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-900">Donor Profile & Receipt Information</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Ensure your legal name and contact details are accurate on official tax receipts
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Full Legal Name (For Receipts)
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Dr. Jane Doe"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Authenticated Email
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+256 700 000000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Street / P.O. Box Address
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street address"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">City / District</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Postal Code</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Postal Code"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Country</label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="Country"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Communication Preferences */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                        Communication Preferences
                      </span>
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commImmediateReceipt}
                          onChange={(e) => setCommImmediateReceipt(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span>Send immediate email receipt upon every donation</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commQuarterlyDigest}
                          onChange={(e) => setCommQuarterlyDigest(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span>Send quarterly RESTI community impact digest and field stories</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commAnnualStatement}
                          onChange={(e) => setCommAnnualStatement(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span>Send annual year-end cumulative tax statement in January</span>
                      </label>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <Button
                        type="submit"
                        disabled={savingProfile}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-6 rounded-xl cursor-pointer"
                      >
                        {savingProfile ? 'Saving...' : 'Save Profile Details'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLogout}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs cursor-pointer"
                      >
                        <LogOut size={13} className="mr-1.5" /> Sign Out
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Password / Security Settings Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Lock size={18} className="text-emerald-700" />
                    <h3 className="text-base font-bold font-heading text-slate-900">
                      Security & Password Settings
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Update your account password securely.
                  </p>

                  <form onSubmit={handleUpdatePassword} className="space-y-3.5 max-w-md">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">New Password (min 8 characters)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={savingPassword || !newPassword}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-5 rounded-xl cursor-pointer"
                    >
                      {savingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* OFFICIAL PRINTABLE DONATION RECEIPT MODAL                     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            
            {/* Modal Top Bar (Action Buttons) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" />
                <span className="text-xs font-bold tracking-wide uppercase">Official Verification Receipt</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={13} /> Print / Save PDF
                </Button>
                <Button
                  onClick={() => handleSendReceiptEmail(selectedDonation)}
                  disabled={emailSending}
                  variant="outline"
                  className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail size={13} /> {emailSending ? 'Sending...' : 'Email Me'}
                </Button>
                <button
                  onClick={() => setSelectedDonation(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close receipt modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Canvas */}
            <div id="printable-receipt" className="p-8 sm:p-10 text-slate-800 bg-white print:p-0">
              
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-emerald-600 pb-5 mb-5 gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <img
                      src="/logo.png"
                      alt="RESTI CBO"
                      className="h-10 w-auto object-contain"
                      onError={(e: any) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-black font-heading tracking-tight text-slate-900 leading-none">
                        RESTI CBO
                      </h2>
                      <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">
                        Refugee Empowerment For Sustainable Transformation Initiative
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Kiryandongo District, Uganda • Email: info@resticbo.org • Web: resticbo.org
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-1">
                    Official Tax Receipt
                  </span>
                  <p className="font-mono text-xs font-bold text-slate-900">
                    {selectedDonation.receiptNumber || `REC-${selectedDonation.reference || selectedDonation.id.slice(-8).toUpperCase()}`}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Issued: {new Date(selectedDonation.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-5 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">Donor Name</span>
                  <span className="font-bold text-slate-900 block truncate">
                    {selectedDonation.donorName || user?.user_metadata?.name || 'Valued Supporter'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">Donor Email</span>
                  <span className="font-medium text-slate-700 block font-mono text-[11px] truncate">
                    {selectedDonation.donorEmail || user?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">Payment Channel</span>
                  <span className="font-bold text-slate-900 block">
                    {getMethodBadge(selectedDonation.paymentMethod).label}
                  </span>
                </div>
              </div>

              {/* Line Item Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden mb-5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Description / Allocation</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">
                          {selectedDonation.campaign || 'Charitable Contribution to RESTI Community Programs'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Direct support for refugee education, vocational livelihoods, and healthcare initiatives in Kiryandongo District.
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(selectedDonation.amount, selectedDonation.currency)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-emerald-50/50 border-t-2 border-emerald-600 text-slate-900 font-bold">
                    <tr>
                      <td className="py-2.5 px-4 text-emerald-950 font-bold">Total Received & Acknowledged</td>
                      <td className="py-2.5 px-4 text-right text-sm text-emerald-800 font-black">
                        {formatCurrency(selectedDonation.amount, selectedDonation.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Legal Non-Profit Tax Certification */}
              <div className="bg-slate-50 p-3.5 rounded-xl text-[10px] text-slate-600 leading-relaxed border border-slate-100 mb-5">
                <p className="font-bold text-slate-800 mb-0.5">Official Non-Profit Certification:</p>
                <p>
                  RESTI certifies that no goods, services, or commercial benefits were provided in consideration for this financial contribution. Recognized in accordance with Ugandan community-based non-profit standards and international charitable reporting guidelines.
                </p>
              </div>

              {/* Signature & Seal */}
              <div className="flex justify-between items-end pt-3 border-t border-slate-200">
                <div className="text-[10px] text-slate-400">
                  <p>Refugee Empowerment For Sustainable Transformation Initiative</p>
                  <p>Registered Community-Based Organization • Kiryandongo District, Uganda</p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-b border-slate-400 pb-0.5 px-3 mb-1">
                    <span className="font-serif italic text-xs font-bold text-slate-700">Kwaya Daniel Loborach</span>
                  </div>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Authorized Signature & Seal</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
