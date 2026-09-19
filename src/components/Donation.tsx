import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Lock, Phone, CreditCard, ChevronRight, Building2, Shield, Star, ExternalLink, ArrowLeft, ShieldCheck, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { StripePaymentProvider, StripeCardForm, stripePromise, FreqOption, prefetchPaymentIntent } from './StripeShared';
import { formatCurrency } from '../utils/formatCurrency';
import { DonorWall } from './DonorWall';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { PAYPAL_CLIENT_ID } from '../utils/env';

type PayMethod = 'card' | 'paypal' | 'mtn' | 'airtel' | 'bank';

interface DonorData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

const COMMON_COUNTRIES = [
  'Uganda',
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'Australia',
  'Kenya',
  'South Sudan',
  'Rwanda',
  'Tanzania',
  'Netherlands',
  'France',
  'Sweden',
  'Norway',
  'Denmark',
  'Switzerland',
  'South Africa',
  'Other'
];

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];

const CURRENCIES = [
  { code: 'USD', symbol: '$',   label: 'USD' },
  { code: 'EUR', symbol: '€',   label: 'EUR' },
  { code: 'GBP', symbol: '£',   label: 'GBP' },
  { code: 'UGX', symbol: 'USh', label: 'UGX' },
];

const DEFAULT_DONATION_CONFIG = {
  badge: 'DONATE NOW',
  title: 'Support the Community Foundation',
  subtitle: 'Your donation helps refugees and host communities access skills, strengthen livelihoods, and build a more resilient future.',
  secondarySubtitle: 'Every contribution makes a difference.',
  orgName: 'Refugee Empowerment For Sustainable Transformation Initiative CBO (RESTI)',
  orgSub: 'Registered CBO - Uganda NGO Bureau',
  leftQuote1: 'Your donation helps refugees and host communities access skills, strengthen livelihoods, and build a more resilient future. Every contribution makes a difference.',
  leftQuote2: 'When you donate to RESTI, you help refugees and host communities build sustainable livelihoods, access new opportunities, and create a better future. We can’t do this without your support. Please support RESTI today.',
  whySupportTitle: 'Why Your Support Matters',
  whySupportText: 'Every contribution helps us provide essential services to vulnerable families. Based on our latest financial disclosures, 90% of all public donations go directly to community programs, with only 10% used for essential administrative overhead.',
  programPercentage: '90%',
  programLabel: 'Goes to Programs',
  familiesSupported: '0',
  familiesLabel: 'Families Supported',
  privacyTitle: 'Security & Privacy is Important to Us',
  privacyText: 'Your details will be kept securely and will not be shared with third parties. Please see our Privacy Notice and Cookies Policy for more information.',
  merchantMTN: '0772 000 000',
  merchantAirtel: '0701 000 000',
  bankName: 'Stanbic Bank Uganda',
  accountName: 'RESTI',
  accountNumber: '9030012345678',
  branch: 'Kiryandongo Branch',
  swiftCode: 'SBICUGKX',
};

export function Donation() {
  const [amount, setAmount] = useState(50);
  const [currency, setCurrency] = useState('USD');
  const formatAmt = (n: number) => formatCurrency(n, currency);
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol ?? '$';
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [freq, setFreq] = useState<FreqOption>('once');
  const [method, setMethod] = useState<PayMethod>('card');
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [mobileRef, setMobileRef] = useState('');
  const [mobileWaiting, setMobileWaiting] = useState(false);
  const [done, setDone] = useState(false);
  const [donationConfig, setDonationConfig] = useState(DEFAULT_DONATION_CONFIG);
  const [donationBreakdown, setDonationBreakdown] = useState<any>(null);
  const [donorData, setDonorData] = useState<DonorData>({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '',
    address: '',
    city: '',
    country: 'Uganda',
    postalCode: ''
  });
  const [familiesSupported, setFamiliesSupported] = useState('0');
  const [logoUrl, setLogoUrl] = useState('/logo.png');

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
      signal: AbortSignal.timeout(6000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { 
        if (data?.settings?.donation) setDonationConfig(prev => ({ ...prev, ...data.settings.donation }));
        if (data?.settings?.donation_breakdown) setDonationBreakdown(data.settings.donation_breakdown);
        if (data?.settings?.hero?.stats) {
          const famStat = data.settings.hero.stats.find((s: any) => /families/i.test(s.label));
          if (famStat && famStat.value !== undefined) setFamiliesSupported(famStat.value);
        }
        if (data?.settings?.general?.logoUrl) {
          const fetchedLogo = data.settings.general.logoUrl;
          setLogoUrl(fetchedLogo && !fetchedLogo.includes('figma:asset') ? fetchedLogo : '/logo.png');
        }
      })
      .catch(() => { });
    prefetchPaymentIntent(50, 'USD');
  }, []);

  const finalAmount = isCustom ? (parseInt(customAmount.replace(/\D/g, '')) || 0) : amount;

  const handlePreset = (v: number) => { setAmount(v); setIsCustom(false); setCustomAmount(''); };
  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => { setCustomAmount(e.target.value.replace(/\D/g, '')); setIsCustom(true); };

  const resetState = () => {
    setAmount(50); setCustomAmount(''); setIsCustom(false); setFreq('once');
    setMethod('card'); setStep(1); setSubmitting(false); setDone(false);
    setMobileRef(''); setMobileWaiting(false);
    setDonorData({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', country: 'Uganda', postalCode: '' });
  };

  const handleMobileMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 1) { toast.error('Minimum donation is $1'); return; }
    if (!donorData.firstName || !donorData.lastName || !donorData.email || !donorData.phone || !donorData.address || !donorData.city || !donorData.postalCode) {
      toast.error('Please complete all required donor information fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/mobile-payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          provider: method, 
          phone: donorData.phone, 
          amount: finalAmount, 
          currency: 'USD',
          donorName: `${donorData.firstName} ${donorData.lastName}`.trim(), 
          donorEmail: donorData.email,
          donorAddress: donorData.address,
          donorCity: donorData.city,
          donorCountry: donorData.country,
          donorPostalCode: donorData.postalCode
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Initiation failed'); setSubmitting(false); return; }
      setMobileRef(data.referenceId);
      setSubmitting(false);
      setMobileWaiting(true);
      toast.success('PIN prompt sent to your phone!', { duration: 8000 });

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const sr = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/mobile-payment/status/${data.referenceId}?provider=${method}`, {
            headers: { Authorization: `Bearer ${publicAnonKey}` }
          });
          const sd = await sr.json();
          if (sd.status === 'SUCCESSFUL') { clearInterval(poll); setDone(true); toast.success('Payment confirmed!'); }
          else if (sd.status === 'FAILED') { clearInterval(poll); setMobileWaiting(false); toast.error('Payment was declined or failed.'); }
          else if (attempts >= 30) { clearInterval(poll); setMobileWaiting(false); toast.error('Timed out waiting for confirmation.'); }
        } catch { }
      }, 4000);
    } catch { toast.error('Could not reach server'); setSubmitting(false); }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorData.firstName || !donorData.lastName || !donorData.email || !donorData.phone || !donorData.address || !donorData.city || !donorData.postalCode) {
      toast.error('Please complete all required donor information fields');
      return;
    }
    setSubmitting(true);
    const ref = `BT-${Date.now().toString(36).toUpperCase()}`;
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          amount: finalAmount, 
          currency: 'USD', 
          paymentMethod: 'bank_transfer',
          donorName: `${donorData.firstName} ${donorData.lastName}`.trim(), 
          donorEmail: donorData.email,
          donorPhone: donorData.phone,
          donorAddress: donorData.address,
          donorCity: donorData.city,
          donorCountry: donorData.country,
          donorPostalCode: donorData.postalCode,
          transactionId: ref, 
          status: 'pending',
        }),
      });
    } catch { }
    setSubmitting(false);
    setMobileRef(ref); // Reuse ref state for bank
    setDone(true);
  };

  const inp = 'w-full border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-gray-400 bg-white text-gray-800';
  const inpStyle: React.CSSProperties = { height: 52 };
  const btnStyle: React.CSSProperties = { height: 52 };
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide uppercase';

  const IMPACT_HINTS: Record<number, string> = {
    [Number(donationBreakdown?.tier1?.amount) || 10]: donationBreakdown?.tier1?.description || 'Provides school supplies for one child for a term',
    [Number(donationBreakdown?.tier2?.amount) || 50]: donationBreakdown?.tier2?.description || 'Supplies a family with a sustainable agriculture starter kit (seeds and tools)',
    [Number(donationBreakdown?.tier3?.amount) || 100]: donationBreakdown?.tier3?.description || 'Funds clean water access or a micro-loan for a women\'s business cooperative',
  };
  const impactHint = !isCustom ? IMPACT_HINTS[amount] : null;

  return (
    <section id="donate" className="py-24 bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden relative">
      {/* Abstract background shapes */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Page header */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Official Organization Brand Badge with crisp logo */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-200 transition-all">
              <img 
                src={logoUrl} 
                alt="RESTI-CBO Official Logo" 
                className="h-11 w-11 object-contain rounded-xl p-0.5 bg-emerald-50/60 border border-emerald-200/60" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} 
              />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold font-heading text-slate-900 text-sm tracking-tight leading-none">RESTI-CBO</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200/80">Verified</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Kiryandongo Refugee Settlement, Uganda</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold px-5 py-2 rounded-full mb-4 uppercase tracking-widest shadow-2xs">
            <Heart size={14} fill="currentColor" className="text-emerald-600" /> {donationConfig.badge || 'DONATE NOW'}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            {donationConfig.title || 'Support the Community Foundation'}
          </h2>
          <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium">
            {donationConfig.subtitle || 'Your donation helps refugees and host communities access skills, strengthen livelihoods, and build a more resilient future.'}
          </p>
          {donationConfig.secondarySubtitle && (
            <p className="text-sm sm:text-base text-emerald-700 font-semibold mt-2 max-w-xl mx-auto">
              {donationConfig.secondarySubtitle}
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <Link
              to="/donor-portal"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 transition-all border border-emerald-300/60 shadow-xs hover:shadow group"
            >
              <User size={15} className="text-emerald-700" />
              <span>Already a donor? Access Donor Portal & Tax Receipts</span>
              <ArrowRight size={14} className="text-emerald-600 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT COLUMN: Impact & Info */}
          <div className="w-full lg:w-5/12 space-y-6">
            <div className="relative rounded-3xl p-8 shadow-xl overflow-hidden h-full flex flex-col justify-between text-white group bg-slate-900">
              {/* Authentic RESTI Community Image Background */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/3da296bb-e651-490b-acf8-64e974f2b55b-WhatsApp_Image_2026-09-11_at_2.56.48_AM.jpeg" 
                  alt="RESTI Community Impact" 
                  className="w-full h-full object-cover scale-105 transition-transform duration-700 ease-out group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80';
                  }}
                />
                {/* Refined gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/60"></div>
              </div>

              <div className="relative z-10">
                {/* Official Logo Badge */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-white/90">
                    <img 
                      src={logoUrl} 
                      alt="RESTI Logo" 
                      className="h-10 w-10 object-contain rounded-xl p-0.5 bg-white border border-emerald-500/20 shadow-xs" 
                      onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} 
                    />
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold font-heading text-slate-900 text-sm tracking-tight leading-none">RESTI-CBO</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">Registered</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Reg. No. CBO/KIR/2023/048</span>
                    </div>
                  </div>
                </div>

                <div className="font-bold text-lg mb-1 leading-snug drop-shadow-sm">{donationConfig.orgName || 'Refugee Empowerment For Sustainable Transformation Initiative (RESTI)'}</div>
                <div className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-5 flex items-center gap-1.5">
                  <Shield size={13} className="text-emerald-400" />
                  <span>{donationConfig.orgSub || 'Registered CBO - Uganda NGO Bureau'}</span>
                </div>

                <div className="bg-slate-900/60 rounded-2xl p-4.5 backdrop-blur-md border border-white/15 mb-6 space-y-2.5 shadow-lg">
                  <p className="text-white text-xs sm:text-sm font-semibold leading-relaxed">
                    {donationConfig.leftQuote1 || 'Your donation helps refugees and host communities access skills, strengthen livelihoods, and build a more resilient future. Every contribution makes a difference.'}
                  </p>
                  <p className="text-emerald-100/90 text-xs leading-relaxed pt-2 border-t border-white/10">
                    {donationConfig.leftQuote2 || 'When you donate to RESTI, you help refugees and host communities build sustainable livelihoods, access new opportunities, and create a better future. We can’t do this without your support. Please support RESTI today.'}
                  </p>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold mb-3 leading-snug drop-shadow-sm">{donationConfig.whySupportTitle || 'Why Your Support Matters'}</h3>
                <p className="text-slate-200 text-sm leading-relaxed mb-6">
                  {donationConfig.whySupportText || 'Every contribution helps us provide essential services to vulnerable families. Based on our latest financial disclosures, 90% of all public donations go directly to community programs, with only 10% used for essential administrative overhead.'}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/60 rounded-xl p-4 backdrop-blur-md border border-white/10">
                    <div className="text-2xl font-bold text-white">{familiesSupported || donationConfig.familiesSupported || '0'}</div>
                    <div className="text-emerald-300 text-xs mt-1 font-medium">{donationConfig.familiesLabel || 'Families Supported'}</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-4 backdrop-blur-md border border-white/10">
                    <div className="text-2xl font-bold text-emerald-400">{donationConfig.programPercentage || '90%'}</div>
                    <div className="text-emerald-300 text-xs mt-1 font-medium">{donationConfig.programLabel || 'Goes to Programs'}</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/15 pt-5 mt-auto relative z-10">
                <div className="flex items-center justify-between text-xs text-emerald-200/90 font-medium">
                  <span className="flex items-center gap-1.5"><Lock size={12} className="text-emerald-400" /> 256-bit SSL Encrypted</span>
                  <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-400" /> Verified NGO Bureau</span>
                </div>
              </div>
            </div>

            {/* Security & Privacy Callout */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                <ShieldCheck size={22} />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-gray-900 text-sm">{donationConfig.privacyTitle || 'Security & Privacy is Important to Us'}</div>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {donationConfig.privacyText || 'Your details will be kept securely and will not be shared with third parties. Please see our '}
                  <Link to="/privacy" className="text-emerald-700 font-semibold underline hover:text-emerald-800">Privacy Notice</Link> and <Link to="/cookies" className="text-emerald-700 font-semibold underline hover:text-emerald-800">Cookies Policy</Link> for more information.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <Star size={24} fill="currentColor" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">Highly Rated Charity</div>
                <div className="text-gray-500 text-xs mt-0.5">Transparent and accountable use of funds.</div>
              </div>
            </div>

            {/* Donor Portal Callout */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-emerald-800/60 flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                <User size={22} />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">Donor's Portal & Giving History</div>
                  <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Self-Service</span>
                </div>
                <p className="text-emerald-100/80 text-xs leading-relaxed">
                  Log in to download your tax receipts, review your lifetime donations, and manage recurring giving easily.
                </p>
                <div className="pt-2">
                  <Link
                    to="/donor-portal"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm group"
                  >
                    <span>Open Donor's Portal</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Donation Form */}
          <div className="w-full lg:w-7/12">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

              {/* STEP 1 */}
              {step === 1 && (
                <div className="p-4 sm:p-8 space-y-6">
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    {(['once', 'monthly', 'yearly'] as FreqOption[]).map(f => (
                      <button key={f} type="button" onClick={() => setFreq(f)}
                        className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${freq === f ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {f === 'once' ? 'One Time' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Currency selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">Currency</span>
                    <div className="flex gap-1.5">
                      {CURRENCIES.map(c => (
                        <button key={c.code} type="button" onClick={() => setCurrency(c.code)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                            currency === c.code
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Choose an amount to give</label>
                    <div className="grid grid-cols-3 gap-3">
                      {PRESET_AMOUNTS.map(v => (
                        <button key={v} type="button" onClick={() => handlePreset(v)}
                          className={`py-4 rounded-xl border-2 text-base font-bold transition-all leading-tight ${!isCustom && amount === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-gray-100 bg-white text-gray-700 hover:border-emerald-300 hover:shadow-sm'}`}>
                          {formatAmt(v)}
                        </button>
                      ))}
                    </div>
                    <div className={`mt-3 flex items-center rounded-xl border-2 transition-all ${isCustom ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white'}`}>
                      <span className={`shrink-0 pl-4 pr-2 py-3 text-base font-bold select-none ${isCustom ? 'text-emerald-600' : 'text-gray-400'}`}>{currencySymbol}</span>
                      <input type="text" placeholder="Enter custom amount" value={customAmount} onChange={handleCustom}
                        className={`flex-1 px-3 py-3 text-base font-semibold outline-none bg-transparent ${isCustom ? 'text-emerald-800 placeholder:text-emerald-300' : 'text-gray-700 placeholder:text-gray-400'}`} />
                    </div>
                    {impactHint && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        <Heart size={14} className="shrink-0 mt-0.5" fill="currentColor" />
                        <span>{formatAmt(amount)} — {impactHint}</span>
                      </div>
                    )}
                  </div>

                  <button type="button"
                    onClick={() => {
                      if (finalAmount >= 1) {
                        prefetchPaymentIntent(finalAmount, currency, donorData);
                        setStep(2);
                      } else {
                        toast.error('Minimum donation is $1');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                    style={btnStyle}>
                    <Heart size={18} fill="currentColor" />
                    Continue{finalAmount > 0 ? ` — ${formatAmt(finalAmount)}` : ''}
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="p-4 sm:p-8 space-y-6">
                  {/* Back Summary */}
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors shrink-0">
                      <ArrowLeft size={16} /> Back
                    </button>
                    <div className="flex-1 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Heart size={14} fill="currentColor" className="text-emerald-500" />
                        <span className="text-xs text-gray-500 font-medium">{freq === 'once' ? 'one-time' : freq}</span>
                      </div>
                      <div className="text-emerald-700 font-extrabold text-base">{formatAmt(finalAmount)}</div>
                    </div>
                  </div>

                  {/* Method tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'card', icon: CreditCard, label: 'Card' },
                      { id: 'paypal', icon: ExternalLink, label: 'PayPal' },
                      { id: 'mtn', icon: Phone, label: 'MTN' },
                      { id: 'airtel', icon: Phone, label: 'Airtel' },
                      { id: 'bank', icon: Building2, label: 'Bank' },
                    ].map(m => (
                      <button key={m.id} type="button" onClick={() => setMethod(m.id as PayMethod)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${method === m.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'}`}>
                        <m.icon size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Result Areas */}
                  {done ? (
                    <div className="py-12 px-6 text-center space-y-6 animate-fade-in-up">
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Heart size={40} fill="#059669" className="text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold">Thank You!</h3>
                      <p className="text-gray-600">Your donation of <span className="font-bold text-emerald-700">{formatAmt(finalAmount)}</span> is confirmed.</p>
                      <button onClick={resetState} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200" style={btnStyle}>Donate Again</button>
                    </div>
                  ) : mobileWaiting ? (
                    <div className="py-12 px-6 text-center space-y-8 animate-fade-in-up">
                      <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                        <Phone size={48} className="text-emerald-600 animate-float" />
                      </div>
                      <h3 className="text-2xl font-bold">Check Your Phone!</h3>
                      <p className="text-gray-600 text-sm">We've sent a PIN prompt to <strong>{donorData.phone}</strong>.</p>
                      <button onClick={() => setMobileWaiting(false)} className="text-sm font-semibold text-gray-500 underline">Cancel & Go Back</button>
                    </div>
                  ) : (
                    <>
                      {method === 'card' && (
                        <StripePaymentProvider finalAmount={finalAmount} currency={currency} freq={freq} donorData={donorData}>
                          <div className="bg-white border border-gray-100 rounded-2xl p-2 md:p-6 shadow-sm">
                            <StripeCardForm
                              donorData={donorData}
                              setDonorData={setDonorData}
                              finalAmount={finalAmount}
                              freq={freq}
                              setDone={setDone}
                              submitting={submitting}
                              setSubmitting={setSubmitting}
                              inp="w-full border border-gray-200 rounded-xl px-4 text-sm font-normal outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-gray-400 bg-white text-gray-800"
                              lbl="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide uppercase"
                              onBack={() => setStep(1)}
                              formatAmt={formatAmt}
                            />
                          </div>
                        </StripePaymentProvider>
                      )}

                      {method === 'paypal' && (
                        <div className="space-y-6">
                          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 text-blue-900 font-bold">Secure PayPal Checkout</div>
                          {PAYPAL_CLIENT_ID ? (
                            <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
                              <PayPalButtons
                                style={{ layout: 'vertical', shape: 'pill' }}
                                createOrder={(d, a) => a.order.create({ intent: "CAPTURE", purchase_units: [{ amount: { value: finalAmount.toString(), currency_code: 'USD' } }] })}
                                onApprove={async (d, a) => { await a.order?.capture(); setDone(true); }}
                              />
                            </PayPalScriptProvider>
                          ) : (
                            <button onClick={() => window.open('https://paypal.com/donate', '_blank')} className="w-full bg-[#FFC439] rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200" style={btnStyle}>
                              <ExternalLink size={18} /> Continue to PayPal
                            </button>
                          )}
                        </div>
                      )}

                      {(method === 'mtn' || method === 'airtel') && (
                        <form onSubmit={handleMobileMoneySubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={lbl}>First Name *</label>
                              <input required className={inp} style={inpStyle} placeholder="First name" value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} />
                            </div>
                            <div>
                              <label className={lbl}>Last Name *</label>
                              <input required className={inp} style={inpStyle} placeholder="Last name" value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={lbl}>Email Address *</label>
                              <input required type="email" className={inp} style={inpStyle} placeholder="you@example.com" value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div>
                              <label className={lbl}>Phone Number *</label>
                              <input required type="tel" className={inp} style={inpStyle} placeholder="256 700 000 000" value={donorData.phone} onChange={e => setDonorData(p => ({ ...p, phone: e.target.value }))} />
                            </div>
                          </div>

                          <div>
                            <label className={lbl}>Street Address *</label>
                            <input required className={inp} style={inpStyle} placeholder="Street address or P.O. Box" value={donorData.address} onChange={e => setDonorData(p => ({ ...p, address: e.target.value }))} />
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className={lbl}>City / Town *</label>
                              <input required className={inp} style={inpStyle} placeholder="City" value={donorData.city} onChange={e => setDonorData(p => ({ ...p, city: e.target.value }))} />
                            </div>
                            <div>
                              <label className={lbl}>Postal / ZIP *</label>
                              <input required className={inp} style={inpStyle} placeholder="Postal code" value={donorData.postalCode} onChange={e => setDonorData(p => ({ ...p, postalCode: e.target.value }))} />
                            </div>
                            <div>
                              <label className={lbl}>Country *</label>
                              <select required className={inp} style={inpStyle} value={donorData.country} onChange={e => setDonorData(p => ({ ...p, country: e.target.value }))}>
                                {COMMON_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Security & Privacy Notice */}
                          <div className="pt-2 border-t border-gray-100 text-left space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                              <span>Security & Privacy is Important to Us</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                              Your details will be kept securely and will not be shared with third parties. Please see our <Link to="/privacy" className="text-emerald-700 underline font-semibold hover:text-emerald-800">Privacy Notice</Link> and <Link to="/privacy" className="text-emerald-700 underline font-semibold hover:text-emerald-800">Cookies Policy</Link> for more information.
                            </p>
                          </div>

                          <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" style={btnStyle}>
                            {submitting ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Phone size={18} /> Pay {formatAmt(finalAmount)}</>}
                          </button>
                        </form>
                      )}

                      {method === 'bank' && (
                        <form onSubmit={handleBankSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={lbl}>First Name *</label>
                              <input required className={inp} style={inpStyle} placeholder="First name" value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} />
                            </div>
                            <div>
                              <label className={lbl}>Last Name *</label>
                              <input required className={inp} style={inpStyle} placeholder="Last name" value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={lbl}>Email Address *</label>
                              <input required type="email" className={inp} style={inpStyle} placeholder="you@example.com" value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div>
                              <label className={lbl}>Phone Number *</label>
                              <input required type="tel" className={inp} style={inpStyle} placeholder="+256 700 000 000" value={donorData.phone} onChange={e => setDonorData(p => ({ ...p, phone: e.target.value }))} />
                            </div>
                          </div>

                          <div>
                            <label className={lbl}>Street Address *</label>
                            <input required className={inp} style={inpStyle} placeholder="Street address or P.O. Box" value={donorData.address} onChange={e => setDonorData(p => ({ ...p, address: e.target.value }))} />
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className={lbl}>City / Town *</label>
                              <input required className={inp} style={inpStyle} placeholder="City" value={donorData.city} onChange={e => setDonorData(p => ({ ...p, city: e.target.value }))} />
                            </div>
                            <div>
                              <label className={lbl}>Postal / ZIP *</label>
                              <input required className={inp} style={inpStyle} placeholder="Postal code" value={donorData.postalCode} onChange={e => setDonorData(p => ({ ...p, postalCode: e.target.value }))} />
                            </div>
                            <div>
                              <label className={lbl}>Country *</label>
                              <select required className={inp} style={inpStyle} value={donorData.country} onChange={e => setDonorData(p => ({ ...p, country: e.target.value }))}>
                                {COMMON_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3.5 text-xs text-gray-700">
                            <div className="font-semibold text-gray-900 border-b border-gray-200/60 pb-2 mb-1.5 flex items-center gap-1.5">
                              <Building2 size={14} className="text-emerald-600" />
                              Bank Transfer Information
                            </div>
                            <div className="flex justify-between"><span className="text-gray-500">Bank Name:</span> <strong>{donationConfig.bankName}</strong></div>
                            <div className="flex justify-between"><span className="text-gray-500">Account Name:</span> <strong>{donationConfig.accountName}</strong></div>
                            <div className="flex justify-between"><span className="text-gray-500">Account No:</span> <strong>{donationConfig.accountNumber}</strong></div>
                            <div className="flex justify-between"><span className="text-gray-500">Branch:</span> <strong>{donationConfig.branch}</strong></div>
                            <div className="flex justify-between"><span className="text-gray-500">SWIFT Code:</span> <strong>{donationConfig.swiftCode}</strong></div>
                          </div>

                          {/* Security & Privacy Notice */}
                          <div className="pt-2 border-t border-gray-100 text-left space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                              <span>Security & Privacy is Important to Us</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                              Your details will be kept securely and will not be shared with third parties. Please see our <Link to="/privacy" className="text-emerald-700 underline font-semibold hover:text-emerald-800">Privacy Notice</Link> and <Link to="/privacy" className="text-emerald-700 underline font-semibold hover:text-emerald-800">Cookies Policy</Link> for more information.
                            </p>
                          </div>
                          
                          <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" style={btnStyle}>
                            {submitting ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Heart size={18} fill="currentColor" /> Register Transfer</>}
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* Helper link to Donor Portal */}
              <div className="mt-4 text-center">
                <Link 
                  to="/donor-portal" 
                  className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 hover:text-emerald-700 bg-white/90 hover:bg-white border border-slate-200/80 px-4 py-2 rounded-xl transition-all shadow-2xs font-semibold"
                >
                  <Heart size={14} className="text-emerald-600" fill="currentColor" />
                  <span>Already a supporter? <strong className="text-emerald-700">Access your Donor Portal & Receipts →</strong></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}