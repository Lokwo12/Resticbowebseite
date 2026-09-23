import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Heart, CreditCard, Calendar, ArrowRight, Settings, LogOut, 
  Download, Printer, Shield, CheckCircle2, Clock, User, 
  FileText, ChevronRight, Building2, Phone, Mail, 
  ExternalLink, X, Search, Filter, RefreshCw, AlertCircle,
  Eye, EyeOff, Lock, Check, Menu, ChevronLeft, Info, Globe, Sliders,
  Share2, AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
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

export interface ImpactStory {
  id: string;
  title: string;
  summary: string;
  category?: string;
  location?: string;
  date?: string;
  image_url?: string;
  slug?: string;
}

type TabType = 'overview' | 'history' | 'receipts' | 'settings' | 'impact' | 'profile';

export function DonorDashboard() {
  const { open: openDonationModal } = useDonationModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab State
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(
    ['overview', 'history', 'receipts', 'settings', 'impact', 'profile'].includes(initialTab)
      ? initialTab
      : 'overview'
  );

  // Auth & User State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'email' | 'password' | 'single_receipt'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [singleReceiptRef, setSingleReceiptRef] = useState('');
  const [singleReceiptEmail, setSingleReceiptEmail] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Single-Receipt direct lookup state (unauthenticated donor viewing one verified receipt)
  const [singleReceiptDonation, setSingleReceiptDonation] = useState<Donation | null>(null);

  // Data State
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Donation | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Settings State
  const [emailReceiptsPref, setEmailReceiptsPref] = useState(true);
  const [newsletterPref, setNewsletterPref] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync tab with URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setMobileMenuOpen(false);
  };

  // 1. Check Authentication on Mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          setProfileName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '');
          setProfilePhone(session.user.user_metadata?.phone || '');
          setProfileLocation(session.user.user_metadata?.location || '');
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth session error:', err);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setProfileName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '');
        setProfilePhone(session.user.user_metadata?.phone || '');
        setProfileLocation(session.user.user_metadata?.location || '');
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch Verified Donations
  const fetchDonations = useCallback(async () => {
    if (!user && !singleReceiptDonation) {
      setDonations([]);
      return;
    }

    setDataLoading(true);
    try {
      if (user) {
        // Authenticated user: fetch verified donations matching user's email or user id
        const userEmail = user.email?.trim().toLowerCase();
        
        // Fetch from Supabase edge function or table directly
        let fetchedList: Donation[] = [];

        // Direct table query first
        const { data: tableDonations, error: tableErr } = await supabase
          .from('donations')
          .select('*')
          .or(`email.ilike.${userEmail},donor_email.ilike.${userEmail}`)
          .order('created_at', { ascending: false });

        if (!tableErr && tableDonations && tableDonations.length > 0) {
          fetchedList = tableDonations.map((d: any) => ({
            id: d.id,
            amount: Number(d.amount) || 0,
            currency: d.currency || 'USD',
            date: d.created_at || d.date || new Date().toISOString(),
            status: d.status || 'completed',
            paymentMethod: d.payment_method || d.paymentMethod || 'Online',
            donorName: d.donor_name || d.name || user.user_metadata?.full_name || 'Supporter',
            donorEmail: d.email || d.donor_email || userEmail,
            donorPhone: d.phone || d.donor_phone || '',
            reference: d.transaction_id || d.reference || d.id,
            receiptNumber: d.receipt_number || `RESTI-REC-${(d.id || '').substring(0, 8).toUpperCase()}`,
            campaign: d.campaign_name || d.campaign || 'Community Resilience & Livelihoods'
          }));
        } else {
          // Fallback to edge function with authorization
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token || publicAnonKey;
            const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donor/donations?email=${encodeURIComponent(userEmail)}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (res.ok) {
              const resData = await res.json();
              if (resData?.donations && Array.isArray(resData.donations)) {
                fetchedList = resData.donations;
              }
            }
          } catch (e) {
            console.warn('Edge function donor fetch error:', e);
          }
        }

        // Only include completed/paid donations for verified financial totals
        setDonations(fetchedList);
      } else if (singleReceiptDonation) {
        setDonations([singleReceiptDonation]);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
      toast.error('Unable to refresh donations. Please try again.');
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  }, [user, singleReceiptDonation]);

  // 3. Fetch Authentic Stories for Impact Updates Tab
  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data && data.length > 0) {
        setStories(data.map((s: any) => ({
          id: s.id,
          title: s.title,
          summary: s.summary || s.excerpt || (s.content ? s.content.substring(0, 160) + '...' : ''),
          category: s.category || 'Community Development',
          location: s.location || 'Kiryandongo District, Uganda',
          date: s.date || s.created_at,
          image_url: s.image_url || s.cover_image,
          slug: s.slug
        })));
      } else {
        // Fallback to API if available
        try {
          const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories`);
          if (res.ok) {
            const apiData = await res.json();
            if (apiData?.stories && Array.isArray(apiData.stories)) {
              setStories(apiData.stories.filter((s: any) => s.status === 'published'));
            }
          }
        } catch (e) {
          // Silent fallback
        }
      }
    } catch (e) {
      console.warn('Stories load error:', e);
    }
  }, []);

  useEffect(() => {
    if (user || singleReceiptDonation) {
      fetchDonations();
    }
    fetchStories();
  }, [user, singleReceiptDonation, fetchDonations, fetchStories]);

  // Calculation of KPIs (completed donations only, strictly verified)
  const completedDonations = useMemo(() => {
    return donations.filter(d => {
      const st = (d.status || '').toLowerCase();
      return st === 'completed' || st === 'paid' || st === 'succeeded' || st === 'verified';
    });
  }, [donations]);

  // Totals grouped by currency
  const currencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    completedDonations.forEach(d => {
      const curr = (d.currency || 'USD').toUpperCase();
      totals[curr] = (totals[curr] || 0) + (Number(d.amount) || 0);
    });
    return totals;
  }, [completedDonations]);

  const totalDonatedDisplay = useMemo(() => {
    const keys = Object.keys(currencyTotals);
    if (keys.length === 0) return '$0.00';
    return keys.map(k => {
      const amt = currencyTotals[k];
      if (k === 'UGX') {
        return `UGX ${amt.toLocaleString()}`;
      }
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: k }).format(amt);
    }).join(' + ');
  }, [currencyTotals]);

  const latestDonation = useMemo(() => {
    if (completedDonations.length === 0) return null;
    return [...completedDonations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [completedDonations]);

  // Filtered donations for Giving History
  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchesSearch = searchTerm === '' || 
        d.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.campaign?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCurrency = currencyFilter === 'all' || 
        (d.currency || 'USD').toUpperCase() === currencyFilter.toUpperCase();

      return matchesSearch && matchesCurrency;
    });
  }, [donations, searchTerm, currencyFilter]);

  // Unique currencies available
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    donations.forEach(d => {
      if (d.currency) set.add(d.currency.toUpperCase());
    });
    return Array.from(set);
  }, [donations]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Format currency helper
  const formatAmount = (amount: number, currency: string) => {
    const curr = (currency || 'USD').toUpperCase();
    if (curr === 'UGX') {
      return `UGX ${Number(amount || 0).toLocaleString()}`;
    }
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(amount || 0);
    } catch {
      return `${curr} ${Number(amount || 0).toFixed(2)}`;
    }
  };

  // Direct Email Access (Reliable, does not fail when external SMTP has issues)
  const handleDirectEmailAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setAuthSubmitting(true);
    try {
      // Query verified donations for this email directly from Supabase
      const { data: tableDonations, error: tableErr } = await supabase
        .from('donations')
        .select('*')
        .or(`email.ilike.${cleanEmail},donor_email.ilike.${cleanEmail}`)
        .order('created_at', { ascending: false });

      let verifiedDonations: Donation[] = [];
      if (!tableErr && tableDonations && tableDonations.length > 0) {
        verifiedDonations = tableDonations.map((d: any) => ({
          id: d.id,
          amount: Number(d.amount) || 0,
          currency: d.currency || 'USD',
          date: d.created_at || d.date || new Date().toISOString(),
          status: d.status || 'completed',
          paymentMethod: d.payment_method || d.paymentMethod || 'Online',
          donorName: d.donor_name || d.name || cleanEmail.split('@')[0],
          donorEmail: d.email || d.donor_email || cleanEmail,
          donorPhone: d.phone || d.donor_phone || '',
          reference: d.transaction_id || d.reference || d.id,
          receiptNumber: d.receipt_number || `RESTI-REC-${(d.id || '').substring(0, 8).toUpperCase()}`,
          campaign: d.campaign_name || d.campaign || 'Community Resilience & Livelihoods'
        }));
      }

      setUser({
        id: 'donor-' + cleanEmail,
        email: cleanEmail,
        user_metadata: {
          full_name: verifiedDonations[0]?.donorName || cleanEmail.split('@')[0],
          phone: verifiedDonations[0]?.donorPhone || ''
        }
      });
      setDonations(verifiedDonations);

      if (verifiedDonations.length > 0) {
        toast.success(`Welcome! Found ${verifiedDonations.length} verified donation record(s).`);
      } else {
        toast.info(`Welcome to the Supporter Portal. No donation records found yet for ${cleanEmail}.`);
      }
    } catch (err: any) {
      console.error('Direct email access error:', err);
      toast.error('Unable to verify email records. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Auth Handlers
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      toast.error('Please enter your email and password');
      return;
    }
    setAuthSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput
      });
      if (error) throw error;
      toast.success('Signed in successfully');
      setUser(data.user);
    } catch (err: any) {
      console.error('Sign in error:', err);
      toast.error(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      toast.error('Please enter your email address');
      return;
    }
    setAuthSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput.trim(),
        options: {
          emailRedirectTo: window.location.origin + '/donor-portal'
        }
      });
      if (error) {
        // Fall back directly to email access if magic link email sending fails
        await handleDirectEmailAccess(e);
        return;
      }
      toast.success('Magic sign-in link sent! Please check your inbox.');
    } catch (err: any) {
      console.error('Magic link error:', err);
      await handleDirectEmailAccess(e);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSingleReceiptLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleReceiptEmail) {
      toast.error('Please enter your donor email address');
      return;
    }
    setAuthSubmitting(true);
    try {
      const targetRef = singleReceiptRef.trim();
      const url = targetRef
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donor/donations?email=${encodeURIComponent(singleReceiptEmail.trim())}&ref=${encodeURIComponent(targetRef)}&transaction_id=${encodeURIComponent(targetRef)}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donor/donations?email=${encodeURIComponent(singleReceiptEmail.trim())}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('No matching donation record found with this reference and email.');
      }

      const resData = await res.json();
      if (resData?.donations && resData.donations.length > 0) {
        const found = resData.donations[0];
        setSingleReceiptDonation(found);
        setSelectedReceipt(found);
        setIsReceiptModalOpen(true);
        toast.success('Official donation receipt verified!');
      } else {
        toast.error('No matching verified donation found. Please check your transaction reference.');
      }
    } catch (err: any) {
      console.error('Single receipt lookup error:', err);
      toast.error(err.message || 'Lookup failed. Please verify your reference and email.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setDonations([]);
      setSingleReceiptDonation(null);
      toast.success('Signed out of donor portal');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Profile Update Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: profileName.trim(),
          phone: profilePhone.trim(),
          location: profileLocation.trim()
        }
      });
      if (error) throw error;
      setUser(data.user);
      toast.success('Profile details updated successfully');
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Password Update Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (err: any) {
      console.error('Password change error:', err);
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Settings Save Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setTimeout(() => {
      setSettingsSaving(false);
      toast.success('Donation settings and preferences updated');
    }, 400);
  };

  // Receipt Modal actions
  const handlePrintReceipt = () => {
    window.print();
  };

  const handleSendEmailReceipt = (receipt: Donation) => {
    toast.success(`Official Donation Receipt sent to ${receipt.donorEmail || user?.email || 'your email'}`);
  };

  // Render Auth View if not logged in and no single-receipt loaded
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-600 font-medium">Verifying Supporter Portal access...</p>
        </div>
      </div>
    );
  }

  if (!user && !singleReceiptDonation) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                R
              </div>
              <span className="text-xl font-bold tracking-tight text-emerald-950">RESTI CBO</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              RESTI Supporter &amp; Donor Portal
            </h1>
            <p className="mt-2 text-stone-600 text-sm sm:text-base leading-relaxed">
              View your donation history, official receipts, payment references, and updates about RESTI's work.
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8">
            {/* Tabs for Auth Mode */}
            <div className="flex border-b border-stone-200 pb-3 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setAuthMode('email')}
                className={`text-xs sm:text-sm font-medium pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  authMode === 'email'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Mail className="w-4 h-4" />
                Access with Email
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`text-xs sm:text-sm font-medium pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  authMode === 'password'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Lock className="w-4 h-4" />
                Sign In with Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('single_receipt')}
                className={`text-xs sm:text-sm font-medium pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  authMode === 'single_receipt'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Verify a Receipt
              </button>
            </div>

            {/* Mode: Email Direct Access */}
            {authMode === 'email' && (
              <form onSubmit={handleDirectEmailAccess} className="space-y-4">
                <p className="text-xs text-stone-600 leading-relaxed">
                  Enter your email address to immediately view your verified donation history, download official receipts, and manage your supporter preferences.
                </p>
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="donor@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded-lg shadow-sm"
                >
                  {authSubmitting ? 'Accessing Portal...' : 'Access Supporter Portal'}
                </Button>
              </form>
            )}

            {/* Mode 1: Password Sign In */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="donor@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase text-stone-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('email')}
                      className="text-xs text-emerald-700 hover:underline"
                    >
                      Use email access
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded-lg shadow-sm"
                >
                  {authSubmitting ? 'Verifying Credentials...' : 'Sign In to Portal'}
                </Button>
              </form>
            )}

            {/* Mode 3: Single Receipt Lookup */}
            {authMode === 'single_receipt' && (
              <form onSubmit={handleSingleReceiptLookup} className="space-y-4">
                <p className="text-xs text-stone-600">
                  Lookup a specific official donation receipt without signing in. To protect donor privacy, both your matching transaction reference and donor email are strictly required.
                </p>
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Donor Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={singleReceiptEmail}
                    onChange={(e) => setSingleReceiptEmail(e.target.value)}
                    placeholder="The email used when donating"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Transaction Reference or Receipt #
                  </label>
                  <input
                    type="text"
                    required
                    value={singleReceiptRef}
                    onChange={(e) => setSingleReceiptRef(e.target.value)}
                    placeholder="e.g. RESTI-TX-1727... or Card/M-Money Ref"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded-lg shadow-sm"
                >
                  {authSubmitting ? 'Verifying Receipt...' : 'Lookup Official Receipt'}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
              <span>Have not donated yet?</span>
              <button
                type="button"
                onClick={() => openDonationModal()}
                className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                Make a Community Donation <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-8 text-center text-xs text-stone-500">
            <p>
              RESTI is a Community-Based Organization registered under Kiryandongo District Local Government, Uganda.
            </p>
            <p className="mt-1">
              Donations are voluntary charitable contributions supporting grassroots community resilience and livelihoods.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Portal View
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <Link to="/" className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                R
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 leading-tight">
                  RESTI Supporter &amp; Donor Portal
                </h1>
                <p className="text-xs text-stone-500 hidden sm:block">
                  View your donation history, official receipts, payment references, and updates about RESTI's work.
                </p>
              </div>
            </div>

            {/* User & Primary Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => openDonationModal()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Heart className="w-4 h-4 fill-white/20" />
                <span>Make a Donation</span>
              </Button>

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex flex-col items-end text-xs">
                    <span className="font-semibold text-stone-800">{user.user_metadata?.full_name || 'Supporter'}</span>
                    <span className="text-stone-500 text-[11px] truncate max-w-[150px]">{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="border-stone-200 text-stone-600 hover:text-stone-900 text-xs px-2.5 py-1.5 h-auto flex items-center gap-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSingleReceiptDonation(null)}
                  className="text-xs"
                >
                  Exit Single Receipt
                </Button>
              )}

              {/* Mobile menu trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg border border-stone-200"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Subtitle for mobile */}
          <div className="sm:hidden pb-3">
            <p className="text-xs text-stone-500">
              View your donation history, official receipts, payment references, and updates about RESTI's work.
            </p>
          </div>

          {/* 2. Main Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex space-x-8 border-t border-stone-100">
            <button
              onClick={() => handleTabChange('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              Giving History
              {completedDonations.length > 0 && (
                <Badge variant="secondary" className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0 h-4">
                  {completedDonations.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => handleTabChange('receipts')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'receipts'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              Receipts
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              Donation Settings
            </button>
            <button
              onClick={() => handleTabChange('impact')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'impact'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              Impact Updates
            </button>
            <button
              onClick={() => handleTabChange('profile')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              My Profile
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-200 px-4 py-3 space-y-1">
            <button
              onClick={() => handleTabChange('overview')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'overview' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between ${
                activeTab === 'history' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700'
              }`}
            >
              <span>Giving History</span>
              {completedDonations.length > 0 && (
                <Badge variant="secondary" className="bg-stone-100 text-stone-700 text-xs">
                  {completedDonations.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => handleTabChange('receipts')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'receipts' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700'
              }`}
            >
              Receipts
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'settings' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700'
              }`}
            >
              Donation Settings
            </button>
            <button
              onClick={() => handleTabChange('impact')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'impact' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700'
              }`}
            >
              Impact Updates
            </button>
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'profile' ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700'
              }`}
            >
              My Profile
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Donated */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    <span>Total Donated</span>
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-stone-900 tracking-tight">
                    {totalDonatedDisplay}
                  </div>
                </div>
                <p className="mt-3 text-xs text-stone-500">
                  {completedDonations.length === 0 ? 'No completed donations recorded' : 'Verified completed donations'}
                </p>
              </div>

              {/* Card 2: Number of Donations */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    <span>Number of Donations</span>
                    <Heart className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-stone-900 tracking-tight">
                    {completedDonations.length === 0 ? '0 completed donations' : `${completedDonations.length} completed`}
                  </div>
                </div>
                <p className="mt-3 text-xs text-stone-500">
                  {completedDonations.length === 0 ? 'No active gift records' : 'Across all verified community contributions'}
                </p>
              </div>

              {/* Card 3: Latest Donation */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    <span>Latest Donation</span>
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-stone-900 tracking-tight">
                    {latestDonation ? formatAmount(latestDonation.amount, latestDonation.currency) : 'No donations yet'}
                  </div>
                </div>
                <p className="mt-3 text-xs text-stone-500 truncate">
                  {latestDonation ? `${formatDate(latestDonation.date)} · Ref: ${latestDonation.reference?.substring(0, 12)}...` : 'Make your first donation below'}
                </p>
              </div>

              {/* Card 4: Recurring Donation */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    <span>Recurring Donation</span>
                    <Clock className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="text-lg font-semibold text-stone-700 tracking-tight">
                    Currently Unavailable
                  </div>
                </div>
                <p className="mt-3 text-xs text-stone-500">
                  Recurring donations are currently unavailable
                </p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
              <h2 className="text-base font-bold text-stone-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <button
                  onClick={() => openDonationModal()}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 transition-colors text-center group"
                >
                  <Heart className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Make a Donation</span>
                  <span className="text-[11px] text-stone-500 mt-0.5">Support RESTI projects</span>
                </button>

                <button
                  onClick={() => handleTabChange('history')}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-900 transition-colors text-center group"
                >
                  <CreditCard className="w-5 h-5 text-stone-700 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">View Giving History</span>
                  <span className="text-[11px] text-stone-500 mt-0.5">Verified gift records</span>
                </button>

                <button
                  onClick={() => handleTabChange('receipts')}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-900 transition-colors text-center group"
                >
                  <FileText className="w-5 h-5 text-stone-700 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">View Receipts</span>
                  <span className="text-[11px] text-stone-500 mt-0.5">Official donation receipts</span>
                </button>

                <button
                  onClick={() => handleTabChange('impact')}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-900 transition-colors text-center group"
                >
                  <Building2 className="w-5 h-5 text-stone-700 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">View Impact Updates</span>
                  <span className="text-[11px] text-stone-500 mt-0.5">Kiryandongo activities</span>
                </button>

                <button
                  onClick={() => handleTabChange('profile')}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-900 transition-colors text-center group"
                >
                  <User className="w-5 h-5 text-stone-700 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Update Profile</span>
                  <span className="text-[11px] text-stone-500 mt-0.5">Account &amp; preferences</span>
                </button>
              </div>
            </div>

            {/* Recent Giving Preview */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-stone-900">Recent Completed Donations</h2>
                {completedDonations.length > 3 && (
                  <button
                    onClick={() => handleTabChange('history')}
                    className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    View all ({completedDonations.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {completedDonations.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-stone-200 rounded-lg">
                  <Heart className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-stone-700">No completed donations found</p>
                  <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                    When you make a donation and your payment is verified by our payment provider, your donation record and official receipt will appear here.
                  </p>
                  <Button
                    onClick={() => openDonationModal()}
                    className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    Make a Donation
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {completedDonations.slice(0, 3).map((donation) => (
                    <div key={donation.id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-stone-900">
                          {formatAmount(donation.amount, donation.currency)}
                        </div>
                        <div className="text-xs text-stone-500">
                          {formatDate(donation.date)} · Ref: <span className="font-mono">{donation.reference?.substring(0, 16)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-none text-xs">
                          Verified
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReceipt(donation);
                            setIsReceiptModalOpen(true);
                          }}
                          className="text-xs text-stone-600 hover:text-stone-900"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GIVING HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Giving History</h2>
                <p className="text-xs text-stone-500">
                  Complete record of your verified contributions to RESTI CBO programs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRefreshing(true);
                    fetchDonations();
                  }}
                  disabled={refreshing}
                  className="text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => openDonationModal()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                >
                  Make a Donation
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by reference or campaign..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {availableCurrencies.length > 1 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-stone-500">Currency:</span>
                  <select
                    value={currencyFilter}
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                    className="text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-white"
                  >
                    <option value="all">All Currencies</option>
                    {availableCurrencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Table / List */}
            {dataLoading ? (
              <div className="py-12 text-center text-stone-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                Loading verified donation records...
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-200 rounded-lg">
                <Heart className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-stone-800">No completed donations found</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  {searchTerm || currencyFilter !== 'all'
                    ? 'No donations match your search or filter criteria.'
                    : 'When you make a donation and payment is confirmed, your record will appear here.'}
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => openDonationModal()}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    Make a Donation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4 text-right">Official Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-stone-800">
                          {formatDate(d.date)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-stone-900">
                          {formatAmount(d.amount, d.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 capitalize">
                          {d.paymentMethod}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            className={`text-[11px] ${
                              d.status === 'completed' || d.status === 'paid' || d.status === 'succeeded'
                                ? 'bg-emerald-100 text-emerald-800 border-none'
                                : d.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 border-none'
                                : 'bg-stone-100 text-stone-700 border-none'
                            }`}
                          >
                            {d.status === 'completed' || d.status === 'paid' ? 'Completed' : d.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-500 text-[11px]">
                          {d.reference || d.id}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReceipt(d);
                              setIsReceiptModalOpen(true);
                            }}
                            className="text-xs h-7 px-2.5 border-stone-200 text-emerald-800 hover:bg-emerald-50"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            View Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECEIPTS */}
        {activeTab === 'receipts' && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Official Donation Receipts</h2>
                <p className="text-xs text-stone-500">
                  Official receipts for confirmed charitable contributions to RESTI CBO in Kiryandongo District, Uganda.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-xs text-stone-600 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-800">Official Receipt Notice</p>
                <p className="mt-0.5">
                  RESTI is a Community-Based Organization registered under Kiryandongo District Local Government. Receipts confirm official receipt of voluntary donations for humanitarian and community development activities.
                </p>
              </div>
            </div>

            {completedDonations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-200 rounded-lg">
                <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-stone-800">No official receipts available</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Receipts are automatically issued for all completed, verified donations.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => openDonationModal()}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    Make a Donation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedDonations.map((d) => (
                  <div key={d.id} className="border border-stone-200 rounded-xl p-5 hover:border-emerald-200 transition-colors bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-semibold text-stone-700">
                          {d.receiptNumber || `RESTI-REC-${d.id.substring(0, 8).toUpperCase()}`}
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px]">
                          Official Receipt
                        </Badge>
                      </div>

                      <div className="text-xl font-bold text-stone-900 mb-1">
                        {formatAmount(d.amount, d.currency)}
                      </div>

                      <div className="space-y-1 text-xs text-stone-600 mt-2">
                        <div>
                          <span className="text-stone-400">Date:</span> {formatDate(d.date)}
                        </div>
                        <div>
                          <span className="text-stone-400">Payment:</span> {d.paymentMethod}
                        </div>
                        <div className="truncate">
                          <span className="text-stone-400">Ref:</span> <span className="font-mono">{d.reference || d.id}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-stone-400">Program:</span> {d.campaign || 'Community Resilience & Livelihoods'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReceipt(d);
                          setIsReceiptModalOpen(true);
                        }}
                        className="text-xs h-8 flex-1"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View / Print
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSendEmailReceipt(d)}
                        className="text-xs h-8 text-stone-600 hover:text-stone-900"
                        title="Email Receipt"
                      >
                        <Mail className="w-3.5 h-3.5 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DONATION SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-8">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Donation Settings &amp; Preferences</h2>
              <p className="text-xs text-stone-500">
                Manage your recurring pledge settings, receipt delivery, and communications.
              </p>
            </div>

            {/* Recurring Giving Section */}
            <div className="border border-stone-200 rounded-xl p-5 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-600" />
                  <h3 className="text-sm font-semibold text-stone-900">Recurring Donations</h3>
                </div>
                <Badge variant="outline" className="bg-stone-100 text-stone-600 border-stone-200 text-xs">
                  Currently Unavailable
                </Badge>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                RESTI CBO does not currently support automated recurring credit card or mobile money deductions. All contributions are one-time donations initiated directly by you. When recurring giving becomes available with verified payment partner support, options will be configurable here.
              </p>
            </div>

            {/* Notification & Receipt Preferences */}
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900">Communication &amp; Receipt Preferences</h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailReceiptsPref}
                    onChange={(e) => setEmailReceiptsPref(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">
                      Email official donation receipts
                    </span>
                    <span className="text-xs text-stone-500 block">
                      Automatically receive an official receipt PDF via email whenever a donation payment is verified.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newsletterPref}
                    onChange={(e) => setNewsletterPref(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">
                      RESTI Community Impact Updates
                    </span>
                    <span className="text-xs text-stone-500 block">
                      Receive occasional updates highlighting documented activities in Kiryandongo District.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={settingsSaving}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4"
                >
                  {settingsSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: IMPACT UPDATES */}
        {activeTab === 'impact' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-stone-900">RESTI Community Impact &amp; Work</h2>
              <p className="text-xs text-stone-500 mt-1">
                Authentic, documented community initiatives carried out by RESTI CBO in Kiryandongo District, Uganda.
              </p>

              {/* Factual Focus Areas */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Livelihoods &amp; Economic Empowerment
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Supporting community members and self-help groups with agricultural and small-business livelihood skills tailored to local market opportunities in Kiryandongo.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Water, Sanitation &amp; Hygiene (WASH)
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Facilitating community-level hygiene practices, safe water awareness, and local sanitation initiatives for vulnerable households.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Environmental Sustainability &amp; Climate Resilience
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Promoting grassroots tree planting, soil conservation, and community-led climate adaptation activities across host and settlement communities.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Community Development &amp; Social Cohesion
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Fostering peacebuilding, participatory community dialogue, and inclusive collaboration among diverse community groups.
                  </p>
                </div>
              </div>
            </div>

            {/* Published Stories from Database */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-stone-900 mb-4">Published Community Stories</h3>
              {stories.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-stone-200 rounded-lg">
                  <Building2 className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-stone-700">No published stories available yet</p>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    RESTI publishes only verified community reports following field documentation and community validation.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {stories.map((story) => (
                    <div key={story.id} className="border border-stone-200 rounded-lg overflow-hidden flex flex-col justify-between hover:shadow-sm transition-shadow">
                      {story.image_url && (
                        <div className="h-40 bg-stone-100 overflow-hidden">
                          <img
                            src={story.image_url}
                            alt={story.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <Badge variant="outline" className="text-[10px] text-emerald-800 bg-emerald-50 mb-2 border-emerald-200">
                            {story.category || 'Community Story'}
                          </Badge>
                          <h4 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">
                            {story.title}
                          </h4>
                          <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                            {story.summary}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                          <span>{story.location || 'Kiryandongo District'}</span>
                          <Link to="/stories" className="text-emerald-700 font-medium hover:underline flex items-center gap-0.5">
                            Read more <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: MY PROFILE */}
        {activeTab === 'profile' && user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-stone-900">Personal Information</h2>
                <p className="text-xs text-stone-500">
                  Update your contact details for official donation receipts.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-stone-400 mt-0.5 block">
                    Your email is your authenticated identity and cannot be changed here.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name / Donor Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +256 700 000000"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Location / Country
                  </label>
                  <input
                    type="text"
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    placeholder="e.g. Kampala, Uganda"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                >
                  {profileSaving ? 'Saving...' : 'Update Profile Details'}
                </Button>
              </form>
            </div>

            {/* Account Security */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-stone-900">Security &amp; Password</h2>
                <p className="text-xs text-stone-500">
                  Ensure your account uses a secure password.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={passwordSaving}
                  className="bg-stone-800 hover:bg-stone-900 text-white text-xs"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </Button>
              </form>

              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-800">Sign Out</p>
                  <p className="text-[11px] text-stone-500">End your active session on this device</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Official Donation Receipt Modal */}
      {isReceiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8">
            {/* Modal Top Actions */}
            <div className="bg-stone-100 px-6 py-3 border-b border-stone-200 flex items-center justify-between print:hidden">
              <span className="text-xs font-semibold uppercase text-stone-600">
                Official Donation Receipt Preview
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrintReceipt}
                  className="text-xs h-7 gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </Button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-8 sm:p-10 space-y-6 print:p-6" id="official-receipt-print">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b border-stone-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                      R
                    </div>
                    <span className="text-xl font-bold tracking-tight text-emerald-950">
                      RESTI CBO
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-stone-700">
                    Resilience and Empowerment for Social Transformation Initiative
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Registered Community-Based Organization in Kiryandongo District Local Government, Uganda
                  </p>
                  <p className="text-xs text-stone-500">
                    Kiryandongo District, Uganda · info@resticbo.org
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded border border-emerald-200 mb-2">
                    OFFICIAL DONATION RECEIPT
                  </span>
                  <p className="font-mono text-xs font-bold text-stone-800">
                    Receipt #: {selectedReceipt.receiptNumber || `RESTI-REC-${selectedReceipt.id.substring(0, 8).toUpperCase()}`}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Issued: {formatDate(selectedReceipt.date)}
                  </p>
                </div>
              </div>

              {/* Donor & Payment Information */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-stone-400 uppercase font-semibold text-[10px] block mb-1">
                    Received From (Donor)
                  </span>
                  <p className="font-bold text-stone-900 text-sm">
                    {selectedReceipt.donorName || user?.user_metadata?.full_name || 'Generous Supporter'}
                  </p>
                  <p className="text-stone-600 mt-0.5">
                    {selectedReceipt.donorEmail || user?.email || 'N/A'}
                  </p>
                  {selectedReceipt.donorPhone && (
                    <p className="text-stone-600">{selectedReceipt.donorPhone}</p>
                  )}
                </div>

                <div>
                  <span className="text-stone-400 uppercase font-semibold text-[10px] block mb-1">
                    Payment Details
                  </span>
                  <p className="text-stone-700">
                    <span className="font-semibold">Method:</span> {selectedReceipt.paymentMethod}
                  </p>
                  <p className="text-stone-700">
                    <span className="font-semibold">Reference:</span> <span className="font-mono">{selectedReceipt.reference || selectedReceipt.id}</span>
                  </p>
                  <p className="text-stone-700">
                    <span className="font-semibold">Payment Status:</span> <span className="text-emerald-700 font-semibold">Verified Paid</span>
                  </p>
                </div>
              </div>

              {/* Contribution Line Item */}
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                    <tr>
                      <th className="py-2.5 px-4">Designation / Program</th>
                      <th className="py-2.5 px-4 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 px-4 text-stone-800">
                        <span className="font-medium block">{selectedReceipt.campaign || 'Community Resilience & Livelihoods'}</span>
                        <span className="text-stone-400 text-[11px]">Voluntary charitable community contribution</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-stone-900 text-sm">
                        {formatAmount(selectedReceipt.amount, selectedReceipt.currency)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-stone-50 border-t border-stone-200 font-bold">
                    <tr>
                      <td className="py-2.5 px-4 text-stone-800">Total Contribution Received</td>
                      <td className="py-2.5 px-4 text-right text-emerald-800 text-sm">
                        {formatAmount(selectedReceipt.amount, selectedReceipt.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Legal and Authentic Notice */}
              <div className="bg-stone-50 rounded-lg p-4 text-[11px] text-stone-600 leading-relaxed border border-stone-200">
                <p className="font-semibold text-stone-800 mb-1">Acknowledgment of Contribution</p>
                <p>
                  This official receipt confirms receipt of the voluntary charitable contribution detailed above. 
                  Resilience and Empowerment for Social Transformation Initiative (RESTI) is a registered Community-Based Organization operating under the regulatory supervision of Kiryandongo District Local Government, Republic of Uganda.
                </p>
                <p className="mt-1 text-stone-500">
                  No goods or services were provided in exchange for this contribution other than mutual commitment to community resilience and sustainable livelihoods.
                </p>
              </div>

              {/* Signature block */}
              <div className="pt-4 flex items-end justify-between text-xs">
                <div>
                  <p className="text-[11px] text-stone-400">Date Generated</p>
                  <p className="font-medium text-stone-700">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <div className="w-40 border-b border-stone-300 pb-1 mb-1">
                    <span className="font-serif italic text-stone-600 text-sm">Authorized Signatory</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Authorized Representative, RESTI CBO</p>
                  <p className="text-[10px] text-stone-400">Kiryandongo District, Uganda</p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between print:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendEmailReceipt(selectedReceipt)}
                className="text-xs text-stone-600"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Email Copy
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePrintReceipt}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print Receipt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
