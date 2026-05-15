import { useState, useRef, useEffect } from 'react';
import { Heart, Shield, Lock, Copy, CheckCircle, ChevronRight, Star, Phone, CreditCard, Info, Building2, ArrowLeft, BookOpen, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type PayMethod = 'card' | 'paypal' | 'mtn' | 'airtel' | 'bank';
type FreqOption = 'once' | 'monthly' | 'yearly';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded hover:bg-white/20 transition-colors" title="Copy">
      {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/70" />}
    </button>
  );
}

type CardBrand = { brand: string; color: string; bg: string };
function detectCardBrand(num: string): CardBrand | null {
  const n = num.replace(/\s/g, '');
  if (!n) return null;
  if (/^4/.test(n))                            return { brand: 'Visa',       color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' };
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return { brand: 'Mastercard', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
  if (/^3[47]/.test(n))                        return { brand: 'Amex',       color: 'text-sky-700',    bg: 'bg-sky-50 border-sky-200' };
  if (/^6(?:011|5)/.test(n))                   return { brand: 'Discover',   color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' };
  return null;
}

function formatCardNumber(raw: string, isAmex: boolean): string {
  const d = raw.replace(/\D/g, '');
  if (isAmex) {
    return [d.substring(0, 4), d.substring(4, 10), d.substring(10, 15)].filter(Boolean).join(' ');
  }
  return d.replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
}

function fmtExpiry(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length <= 2) return d;
  return d.substring(0, 2) + ' / ' + d.substring(2, 4);
}

const COUNTRIES = [
  'Uganda','Kenya','Tanzania','Rwanda','Burundi','South Sudan',
  'United States','United Kingdom','Germany','Netherlands','Canada','Australia','Other',
];

const CARD_BRANDS_DISPLAY = [
  { name: 'VISA',     style: { backgroundColor: '#1434CB', color: '#fff' } as React.CSSProperties, italic: true },
  { name: 'MC',       style: { backgroundColor: '#EB001B', color: '#fff' } as React.CSSProperties },
  { name: 'AMEX',     style: { backgroundColor: '#007CC3', color: '#fff' } as React.CSSProperties },
  { name: 'Discover', style: { backgroundColor: '#E65300', color: '#fff' } as React.CSSProperties },
  { name: 'PayPal',   style: { backgroundColor: '#003087', color: '#FFC439' } as React.CSSProperties },
];

const USSD_STEPS: Record<'mtn' | 'airtel', { title: string; steps: string[] }> = {
  mtn: {
    title: 'MTN Mobile Money',
    steps: [
      'Dial *165# on your MTN line',
      'Select option 1 - Send Money',
      'Enter merchant number: 0772 000 000',
      'Enter the UGX equivalent of your donation amount',
      'Enter your MTN MoMo PIN',
      'Confirm - you will receive an SMS receipt',
      'Email your confirmation screenshot to us',
    ],
  },
  airtel: {
    title: 'Airtel Money',
    steps: [
      'Dial *185# on your Airtel line',
      'Select option 5 - Pay Bill',
      'Enter merchant code: 123456',
      'Enter the UGX equivalent of your donation amount',
      'Enter your Airtel Money PIN',
      'Confirm - you will receive an SMS receipt',
      'Email your confirmation screenshot to us',
    ],
  },
};

const DEFAULT_DONATION_CONFIG = {
  merchantMTN: '0772 000 000',
  merchantAirtel: '0701 000 000',
  bankName: 'Stanbic Bank Uganda',
  accountName: 'Resti Kiryandongo CBO',
  accountNumber: '9030012345678',
  branch: 'Kiryandongo Branch',
  swiftCode: 'SBICUGKX',
};

export function Donation() {
  const [amount, setAmount]             = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom]         = useState(false);
  const [freq, setFreq]                 = useState<FreqOption>('once');
  const [method, setMethod]             = useState<PayMethod>('card');
  const [step, setStep]                 = useState<1 | 2>(1);
  const [submitting, setSubmitting]     = useState(false);
  const [donationConfig, setDonationConfig] = useState(DEFAULT_DONATION_CONFIG);
  const [donorData, setDonorData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [cardData, setCardData]   = useState({ number: '', expiry: '', cvv: '', address: '', city: '', country: 'Uganda' });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
      signal: AbortSignal.timeout(6000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.settings?.donation) setDonationConfig(prev => ({ ...prev, ...data.settings.donation })); })
      .catch(() => {});
  }, []);

  const finalAmount = isCustom ? (parseInt(customAmount.replace(/\D/g, '')) || 0) : amount;
  const cardBrand   = detectCardBrand(cardData.number);
  const isAmex      = cardBrand?.brand === 'Amex';

  const handlePreset = (v: number) => { setAmount(v); setIsCustom(false); setCustomAmount(''); };
  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => { setCustomAmount(e.target.value.replace(/\D/g, '')); setIsCustom(true); };

  const validateCard = (): boolean => {
    const expParts = cardData.expiry.replace(/\s/g, '').split('/');
    const month = parseInt(expParts[0]);
    const year  = parseInt('20' + (expParts[1] || ''));
    const now   = new Date();
    if (isNaN(month) || month < 1 || month > 12) { toast.error('Invalid expiry month'); return false; }
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) { toast.error('Your card has expired'); return false; }
    const rawNum = cardData.number.replace(/\s/g, '');
    const minLen = isAmex ? 15 : 16;
    if (rawNum.length < minLen) { toast.error(`Card number must be ${minLen} digits`); return false; }
    if (cardData.cvv.length < (isAmex ? 4 : 3)) { toast.error(`CVV must be ${isAmex ? 4 : 3} digits`); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 1) { toast.error('Minimum donation is $1'); return; }
    if (method === 'card' && !validateCard()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    toast.success(`Thank you, ${donorData.firstName || 'friend'}! Your donation of ${formatUSD(finalAmount)} is being processed. A receipt will be sent to ${donorData.email || 'your email'}.`, { duration: 7000 });
    setDonorData({ firstName: '', lastName: '', email: '', phone: '' });
    setCardData({ number: '', expiry: '', cvv: '', address: '', city: '', country: 'Uganda' });
    setIsCustom(false); setCustomAmount(''); setAmount(50000); setStep(1);
  };

  const handlePayPal = () => {
    if (finalAmount < 1) { toast.error('Minimum donation is $1'); return; }
    toast.info('Redirecting to PayPal...', { duration: 2500 });
    setTimeout(() => window.open('https://www.paypal.com/donate', '_blank'), 1500);
  };

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-gray-400 bg-white';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  const IMPACT_HINTS: Record<number, string> = {
    5:   'Provides a hot meal for a child every day for a week',
    10:  'Provides school supplies for one child for a term',
    25:  'Covers basic healthcare for a family of four',
    50:  'Feeds a family nutritious meals for a full month',
    100: 'Seeds a small-holder farm for one growing season',
    250: 'Builds a clean water point serving a village',
  };
  const impactHint = !isCustom ? IMPACT_HINTS[amount] : null;

  const tabCls = (m: PayMethod) =>
    `flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all ${
      method === m
        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-emerald-300 hover:bg-white'
    }`;

  return (
    <section id="donate" className="py-24 bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden relative">
      {/* Abstract background shapes for premium feel */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Page header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-5 py-2.5 rounded-full mb-5">
            <Heart size={14} fill="currentColor" /> Make a Difference Today
          </div>
          <h2 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Support the <span className="gradient-text">Community Foundation</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your donation directly funds education, healthcare, and sustainable livelihoods for families in Kiryandongo District, Uganda.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT COLUMN: Impact & Info (5/12 approx) */}
          <div className="w-full lg:w-5/12 space-y-6">
            
            {/* Impact Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent)]"></div>
              
              <div>
                <div className="font-bold text-lg mb-2">Resticbo Community Foundation</div>
                <div className="text-emerald-100 text-sm mb-6">Registered CBO - Uganda NGO Bureau</div>
                
                <h3 className="text-3xl font-bold mb-4 leading-snug">Why Your Support Matters</h3>
                <p className="text-emerald-50 text-sm leading-relaxed mb-6">
                  Every contribution helps us provide essential services to vulnerable families. 90% of all donations go directly to our community programs.
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-white">2,500+</div>
                    <div className="text-emerald-200 text-xs mt-1">Families Supported</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-white">90%</div>
                    <div className="text-emerald-200 text-xs mt-1">Goes to Programs</div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="border-t border-white/20 pt-6 mt-auto">
                <div className="flex items-center justify-between text-xs text-emerald-100">
                  <span className="flex items-center gap-1"><Lock size={12} /> 256-bit SSL</span>
                  <span className="flex items-center gap-1"><Shield size={12} /> Verified NGO</span>
                </div>
              </div>
            </div>

            {/* Additional Info / Social Proof */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <Star size={24} fill="currentColor" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">Highly Rated Charity</div>
                <div className="text-gray-500 text-xs mt-0.5">Transparent and accountable use of funds.</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Donation Form (7/12 approx) */}
          <div className="w-full lg:w-7/12">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              
              {/* STEP 1 */}
              {step === 1 && (
                <div className="p-8 space-y-6">
                  {/* Frequency toggle */}
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    {(['once', 'monthly', 'yearly'] as FreqOption[]).map(f => (
                      <button key={f} type="button" onClick={() => setFreq(f)}
                        className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${freq === f ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {f === 'once' ? 'One Time' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Amount grid */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Choose an amount to give</label>
                    <div className="grid grid-cols-3 gap-3">
                      {PRESET_AMOUNTS.map(v => (
                        <button key={v} type="button" onClick={() => handlePreset(v)}
                          className={`py-4 rounded-xl border-2 text-base font-bold transition-all leading-tight ${!isCustom && amount === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-gray-100 bg-white text-gray-700 hover:border-emerald-300 hover:shadow-sm'}`}>
                          {formatUSD(v)}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Amount */}
                    <div className={`mt-3 flex items-center rounded-xl border-2 transition-all ${isCustom ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white'}`}>
                      <span className={`shrink-0 pl-4 pr-2 py-3 text-base font-bold select-none ${isCustom ? 'text-emerald-600' : 'text-gray-400'}`}>$</span>
                      <input type="text" placeholder="Enter custom amount" value={customAmount} onChange={handleCustom}
                        className={`flex-1 px-3 py-3 text-base font-semibold outline-none bg-transparent ${isCustom ? 'text-emerald-800 placeholder:text-emerald-300' : 'text-gray-700 placeholder:text-gray-400'}`} />
                    </div>

                    {impactHint && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        <Heart size={14} className="shrink-0 mt-0.5" fill="currentColor" />
                        <span>{formatUSD(amount)} — {impactHint}</span>
                      </div>
                    )}
                  </div>

                  {/* Continue CTA */}
                  <button type="button"
                    onClick={() => { if (finalAmount >= 1) setStep(2); else toast.error('Minimum donation is $1'); }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition-all">
                    <Heart size={18} fill="currentColor" />
                    Continue{finalAmount > 0 ? ` — ${formatUSD(finalAmount)}` : ''}
                    <ChevronRight size={18} />
                  </button>

                  {/* Accepted Payments */}
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-3">Accepted Payments</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold">VISA</span>
                      <span className="text-xs px-2.5 py-1 rounded bg-orange-50 text-orange-700 font-bold">MC</span>
                      <span className="text-xs px-2.5 py-1 rounded bg-sky-50 text-sky-700 font-bold">AMEX</span>
                      <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold">PayPal</span>
                      <span className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-700 font-bold">MTN MoMo</span>
                      <span className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-700 font-bold">Airtel</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="p-8 space-y-6">
                  {/* Back + summary bar */}
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
                      <div className="text-emerald-700 font-extrabold text-base">{formatUSD(finalAmount)}</div>
                    </div>
                  </div>

                  {/* Payment method tabs - Premium Cards */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Donate with</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setMethod('card')} 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${method === 'card' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'}`}>
                        <CreditCard size={24} className={method === 'card' ? 'text-emerald-600' : 'text-gray-400'} />
                        <div className="text-left">
                          <div className="text-sm font-bold">Credit Card</div>
                          <div className="text-xs text-gray-500">Visa, Mastercard, Amex</div>
                        </div>
                      </button>
                      <button type="button" onClick={() => setMethod('paypal')} 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${method === 'paypal' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'}`}>
                        <div className="text-left">
                          <div className="text-sm font-bold">PayPal</div>
                          <div className="text-xs text-gray-500">Fast and secure</div>
                        </div>
                      </button>
                      <button type="button" onClick={() => setMethod('mtn')} 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${method === 'mtn' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'}`}>
                        <Phone size={24} className={method === 'mtn' ? 'text-amber-600' : 'text-gray-400'} />
                        <div className="text-left">
                          <div className="text-sm font-bold">MTN Mobile Money</div>
                          <div className="text-xs text-gray-500">Uganda region</div>
                        </div>
                      </button>
                      <button type="button" onClick={() => setMethod('airtel')} 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${method === 'airtel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'}`}>
                        <Phone size={24} className={method === 'airtel' ? 'text-red-600' : 'text-gray-400'} />
                        <div className="text-left">
                          <div className="text-sm font-bold">Airtel Money</div>
                          <div className="text-xs text-gray-500">Uganda region</div>
                        </div>
                      </button>
                      <button type="button" onClick={() => setMethod('bank')} 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all col-span-2 ${method === 'bank' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'}`}>
                        <Building2 size={24} className={method === 'bank' ? 'text-emerald-600' : 'text-gray-400'} />
                        <div className="text-left">
                          <div className="text-sm font-bold">Bank Transfer</div>
                          <div className="text-xs text-gray-500">Direct deposit to our account</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Forms for each method */}
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                    {/* CARD */}
                    {method === 'card' && (
                      <div className="space-y-4">
                        <div className="bg-gray-50/50 rounded-xl p-5 space-y-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Information</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={lbl}>First Name *</label><input required className={inp} placeholder="John" value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} /></div>
                            <div><label className={lbl}>Last Name *</label><input required className={inp} placeholder="Smith" value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} /></div>
                          </div>
                          <div><label className={lbl}>Email *</label><input required type="email" className={inp} placeholder="you@example.com" value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} /></div>
                          <div><label className={lbl}>Phone (optional)</label><input type="tel" className={inp} placeholder="+256 700 000 000" value={donorData.phone} onChange={e => setDonorData(p => ({ ...p, phone: e.target.value }))} /></div>
                        </div>
                        <div className="bg-gray-50/50 rounded-xl p-5 space-y-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Card information</p>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className={lbl + ' mb-0'}>Card Number *</label>
                              {cardBrand && <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cardBrand.bg} ${cardBrand.color}`}>{cardBrand.brand}</span>}
                            </div>
                            <div className="relative">
                              <input required className={inp + ' pr-12 font-mono tracking-widest'} placeholder="1234  5678  9012  3456"
                                maxLength={isAmex ? 17 : 19} value={cardData.number}
                                onChange={e => setCardData(p => ({ ...p, number: formatCardNumber(e.target.value, isAmex) }))} />
                              <CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={lbl}>Expiry *</label>
                              <input required className={inp + ' font-mono'} placeholder="MM / YY" maxLength={7}
                                value={cardData.expiry} onChange={e => setCardData(p => ({ ...p, expiry: fmtExpiry(e.target.value) }))} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <label className={lbl + ' mb-0'}>CVV *</label>
                                <span title={isAmex ? '4-digit on front' : '3-digit on back'} className="text-gray-400 cursor-help"><Info size={12} /></span>
                              </div>
                              <input required className={inp + ' font-mono tracking-[0.3em]'} placeholder={isAmex ? '4 digits' : '3 digits'}
                                maxLength={isAmex ? 4 : 3} value={cardData.cvv}
                                onChange={e => setCardData(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))} />
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50/50 rounded-xl p-5 space-y-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Billing Address</p>
                          <div><label className={lbl}>Street Address</label><input className={inp} placeholder="123 Main Street" value={cardData.address} onChange={e => setCardData(p => ({ ...p, address: e.target.value }))} /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={lbl}>City</label><input className={inp} placeholder="Kampala" value={cardData.city} onChange={e => setCardData(p => ({ ...p, city: e.target.value }))} /></div>
                            <div><label className={lbl}>Country</label>
                              <select className={inp} value={cardData.country} onChange={e => setCardData(p => ({ ...p, country: e.target.value }))}>
                                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                          <Lock size={14} className="text-emerald-600 shrink-0" />
                          <p className="text-xs text-emerald-700">256-bit SSL encryption - your card details are never stored.</p>
                        </div>
                        <button type="submit" disabled={submitting || finalAmount < 1000}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl text-base hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                          {submitting
                            ? <><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Processing...</>
                            : <><Lock size={16} /> Donate {formatUSD(finalAmount)} <ChevronRight size={16} /></>
                          }
                        </button>
                      </div>
                    )}

                    {/* PAYPAL */}
                    {method === 'paypal' && (
                      <div className="space-y-4">
                        <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                          <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#003087' }}>
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-2xl font-black italic" style={{ color: '#ffffff' }}>Pay</span>
                              <span className="text-2xl font-black italic" style={{ color: '#009CDE' }}>Pal</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#8BB8D8' }}>
                              <Lock size={11} /> Secure Checkout
                            </div>
                          </div>
                          <div className="px-5 py-4 bg-blue-50/50">
                            <p className="text-sm text-blue-800 leading-relaxed">
                              You will be securely redirected to PayPal to complete your donation of{' '}
                              <strong className="font-extrabold">{formatUSD(finalAmount)}</strong>.
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={handlePayPal}
                          disabled={finalAmount < 1000}
                          className="w-full py-4 rounded-xl font-extrabold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                          style={{ backgroundColor: '#FFC439' }}>
                          <span className="font-black italic text-xl leading-none" style={{ color: '#003087' }}>Pay</span>
                          <span className="font-black italic text-xl leading-none" style={{ color: '#009CDE' }}>Pal</span>
                          <span className="mx-1 font-medium" style={{ color: '#003087' }}>—</span>
                          <span className="font-extrabold" style={{ color: '#003087' }}>{formatUSD(finalAmount)}</span>
                          <ChevronRight size={18} color="#003087" />
                        </button>
                      </div>
                    )}

                    {/* MTN / AIRTEL */}
                    {(method === 'mtn' || method === 'airtel') && (
                      <div className="space-y-4">
                        <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${method === 'mtn' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="flex items-center gap-2">
                            <Phone size={15} className={method === 'mtn' ? 'text-amber-600' : 'text-red-600'} />
                            <span className={`text-sm font-bold ${method === 'mtn' ? 'text-amber-800' : 'text-red-800'}`}>{USSD_STEPS[method].title}</span>
                          </div>
                          <span className="font-mono font-bold text-sm">{formatUSD(finalAmount)}</span>
                        </div>
                        <div className="bg-gray-900 rounded-xl px-5 py-3.5 flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Merchant Number</div>
                            <div className="text-white font-mono font-bold text-lg">{method === 'mtn' ? donationConfig.merchantMTN : donationConfig.merchantAirtel}</div>
                          </div>
                          <CopyBtn text={method === 'mtn' ? donationConfig.merchantMTN.replace(/\s/g,'') : donationConfig.merchantAirtel.replace(/\s/g,'')} />
                        </div>
                        <div className="bg-gray-50/50 rounded-xl p-5">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Follow these steps</p>
                          <ol className="space-y-2.5">
                            {USSD_STEPS[method].steps.map((s, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white mt-0.5 ${method === 'mtn' ? 'bg-amber-500' : 'bg-red-500'}`}>{i + 1}</span>
                                <span className="text-gray-700 text-sm">{s}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Send confirmation to <a href="mailto:donate@resticbo.org" className="text-emerald-600 font-semibold underline">donate@resticbo.org</a></p>
                      </div>
                    )}

                    {/* BANK TRANSFER */}
                    {method === 'bank' && (
                      <div className="bg-gray-50/50 rounded-xl p-5 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Information</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={lbl}>First Name *</label><input required className={inp} placeholder="John" value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} /></div>
                          <div><label className={lbl}>Last Name *</label><input required className={inp} placeholder="Smith" value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} /></div>
                        </div>
                        <div><label className={lbl}>Email *</label><input required type="email" className={inp} placeholder="you@example.com" value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} /></div>
                        <div><label className={lbl}>Phone (optional)</label><input type="tel" className={inp} placeholder="+256 700 000 000" value={donorData.phone} onChange={e => setDonorData(p => ({ ...p, phone: e.target.value }))} /></div>
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bank Transfer Details</p>
                          {[
                            { label: 'Bank Name',    value: donationConfig.bankName },
                            { label: 'Account Name', value: donationConfig.accountName },
                            { label: 'Account No.',  value: donationConfig.accountNumber },
                            { label: 'Branch',       value: donationConfig.branch },
                            { label: 'Swift Code',   value: donationConfig.swiftCode },
                          ].map(r => (
                            <div key={r.label} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 mb-2">
                              <div>
                                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{r.label}</div>
                                <div className="font-mono font-semibold text-gray-800 text-sm mt-0.5">{r.value}</div>
                              </div>
                              <button type="button" aria-label={`Copy ${r.label}`}
                                onClick={() => { navigator.clipboard.writeText(r.value); toast.success(`Copied: ${r.value}`); }}
                                className="text-emerald-500 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                                <Copy size={14} />
                              </button>
                            </div>
                          ))}
                          <p className="text-xs text-gray-500 text-center pt-2">Use your full name as reference. Email receipt to <a href="mailto:donate@resticbo.org" className="text-blue-600 font-semibold underline">donate@resticbo.org</a></p>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Impact Cards Grid (Kept below for social proof) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-4 items-start card-lift">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-emerald-700 text-sm">$10 USD</div>
              <div className="text-gray-500 text-xs mt-1 leading-relaxed">School supplies for one child for a term</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-4 items-start card-lift">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <Heart size={24} className="text-rose-600" />
            </div>
            <div>
              <div className="font-bold text-emerald-700 text-sm">$25 USD</div>
              <div className="text-gray-500 text-xs mt-1 leading-relaxed">Basic healthcare for a family of four</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-4 items-start card-lift">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Leaf size={24} className="text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-emerald-700 text-sm">$100 USD</div>
              <div className="text-gray-500 text-xs mt-1 leading-relaxed">Seeds a small-holder farm for one season</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}