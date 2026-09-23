import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, Heart, ArrowLeft, CreditCard, Phone, Building2, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { STRIPE_PK, PAYPAL_CLIENT_ID, PAYPAL_MERCHANT_EMAIL } from '../utils/env';
import { supabase } from '../utils/supabase/client';
import { stripePromise, StripePaymentProvider, StripeCardForm } from './StripeShared';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

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

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-gray-400 bg-white text-gray-800';
const lbl = 'block text-xs font-semibold text-gray-700 mb-1';

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

export function CardPaymentPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [method, setMethod] = useState<'card' | 'paypal' | 'mtn' | 'airtel' | 'bank'>('card');
  const [isRecurring, setIsRecurring] = useState(false);
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
  const [submitting, setSubmitting] = useState(false);
  const [mobileRef, setMobileRef] = useState('');
  const [mobileWaiting, setMobileWaiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const fullName = session.user.user_metadata?.name || '';
        const parts = fullName.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        setDonorData(prev => ({
          ...prev,
          email: session.user.email || '',
          firstName: prev.firstName || firstName,
          lastName: prev.lastName || lastName
        }));
      }
    });
  }, []);

  const finalAmount = isCustom ? (parseInt(customAmount.replace(/\D/g, '')) || 0) : amount;

  const handleMobileMoneySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const providerLabel = method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money';
    toast.error(`${providerLabel} payments are currently under configuration. This payment option is not yet available for live donations.`);
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorData.firstName || !donorData.lastName || !donorData.email || !donorData.phone || !donorData.address || !donorData.city || !donorData.postalCode) {
      toast.error('Please complete all required fields.');
      return;
    }
    setSubmitting(true);
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
          transactionId: `BT-${Date.now().toString(36).toUpperCase()}`,
          status: 'pending'
        })
      });
    } catch {}
    setSubmitting(false);
    setDone(true);
  };

  useEffect(() => {
    if (done) {
      if (donorData.email) {
        try {
          localStorage.setItem('lasti_donor_email', donorData.email);
        } catch {}
      }
      const timer = setTimeout(() => {
        navigate(`/donor-portal?email=${encodeURIComponent(donorData.email || '')}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [done, navigate, donorData.email]);

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Heart size={36} fill="#059669" className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Thank You for Supporting RESTI!</h2>
          <p className="text-gray-600">Your {formatUSD(finalAmount)} contribution has been registered. You are helping refugees and host communities build sustainable futures.</p>
          <button 
            onClick={() => navigate(`/donor-portal?email=${encodeURIComponent(donorData.email || '')}`)} 
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Go to Donor Portal & View Receipt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pt-28 sm:pt-34 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Navigation Bar Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-700 font-medium transition-colors">
            <ArrowLeft size={15} /> Back
          </button>
          <button 
            onClick={() => navigate('/donor-portal')}
            className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Heart size={13} fill="currentColor" className="text-emerald-600" /> Donor Portal & Receipts
          </button>
        </div>


        {/* Mission Statement Banner */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-bold border border-white/20 tracking-wider">
              <Heart size={13} fill="currentColor" className="text-emerald-400" /> DONATE NOW
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight leading-snug">
              Every Donation Builds Sustainable Transformation
            </h1>
            <p className="text-emerald-100 text-sm font-medium leading-relaxed">
              Your donation helps refugees and host communities access skills, strengthen livelihoods, and build a more resilient future. <span className="text-emerald-300 font-semibold">Every contribution makes a difference.</span>
            </p>
            <p className="text-emerald-50/90 text-xs sm:text-sm leading-relaxed pt-2 border-t border-white/10">
              When you donate to RESTI, you help refugees and host communities build sustainable livelihoods, access new opportunities, and create a better future. We can’t do this without your support. Please support RESTI today.
            </p>
          </div>
        </div>

        {/* Main Donation Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          
          {/* Amount selector */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-100 space-y-4">
            
            {/* Recurring Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 w-full max-w-xs mx-auto">
              <button 
                onClick={() => setIsRecurring(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isRecurring ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                One-time
              </button>
              <button 
                onClick={() => setIsRecurring(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isRecurring ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly Gift
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {PRESET_AMOUNTS.map(v => (
                <button 
                  key={v} 
                  onClick={() => { setAmount(v); setIsCustom(false); }}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                    !isCustom && amount === v 
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 shadow-2xs' 
                      : 'border-gray-100 bg-gray-50/60 text-gray-700 hover:border-emerald-200'
                  }`}
                >
                  {formatUSD(v)}
                </button>
              ))}
            </div>

            <input 
              type="number" 
              placeholder="Enter custom amount (USD)" 
              value={customAmount} 
              onChange={e => { setCustomAmount(e.target.value); setIsCustom(true); }}
              className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all ${
                isCustom ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-gray-100 bg-gray-50 text-gray-800 placeholder:text-gray-400'
              }`} 
            />
          </div>

          {/* Payment Method Selector */}
          <div className="px-6 py-3.5 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50/40">
            {[
              { id: 'card', icon: CreditCard, label: 'Card', isConfiguring: false },
              { id: 'paypal', icon: ExternalLink, label: 'PayPal', isConfiguring: false },
              { id: 'mtn', icon: Phone, label: 'MTN MoMo', isConfiguring: true },
              { id: 'airtel', icon: Phone, label: 'Airtel Money', isConfiguring: true },
              { id: 'bank', icon: Building2, label: 'Bank Wire', isConfiguring: false },
            ].map(m => (
              <button 
                key={m.id} 
                onClick={() => setMethod(m.id as any)}
                title={m.isConfiguring ? "This payment method is currently being configured and is not available for live donations." : undefined}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  method === m.id 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <m.icon size={13} /> {m.label}
                {m.isConfiguring && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border leading-tight ${
                    method === m.id ? 'bg-white/20 text-white border-white/30' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    Under config
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="px-6 py-6">
            {!mobileWaiting ? (
              <>
                {method === 'card' && (
                  isRecurring ? (
                    <StripeCheckoutButton 
                      amount={finalAmount} 
                      isRecurring={true} 
                      donorData={donorData} 
                      setDonorData={setDonorData} 
                    />
                  ) : stripePromise ? (
                    <StripePaymentProvider finalAmount={finalAmount} currency="USD" freq={isRecurring ? 'monthly' : 'once'} donorData={donorData}>
                      <StripeCardForm 
                        finalAmount={finalAmount} 
                        donorData={donorData} 
                        setDonorData={setDonorData} 
                        freq={isRecurring ? 'monthly' : 'once'}
                        setDone={setDone}
                        submitting={submitting}
                        setSubmitting={setSubmitting}
                        inp={inp}
                        lbl={lbl}
                        formatAmt={formatUSD}
                        onBack={() => {}}
                      />
                    </StripePaymentProvider>
                  ) : <p className="text-center text-amber-600 text-xs">Stripe not configured</p>
                )}

                {method === 'paypal' && (
                  <div className="space-y-4">
                     <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-blue-800 text-xs font-medium">
                       Complete your <strong>{formatUSD(finalAmount)}</strong> donation securely using your PayPal account or card.
                     </div>
                     {PAYPAL_CLIENT_ID ? (
                       <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
                         <PayPalButtons
                           style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'donate', height: 48 }}
                           forceReRender={[finalAmount]}
                           createOrder={(_d, a) => {
                             const purchaseUnit: any = {
                               amount: { value: finalAmount.toFixed(2), currency_code: 'USD' },
                               description: 'RESTI – Donation',
                             };
                             if (PAYPAL_MERCHANT_EMAIL) purchaseUnit.payee = { email_address: PAYPAL_MERCHANT_EMAIL };
                             return a.order.create({ intent: 'CAPTURE', purchase_units: [purchaseUnit] });
                           }}
                           onApprove={async (_d, a) => {
                             if (a.order) {
                               const captureResult = await a.order.capture();
                               try {
                                 const payerName = captureResult.payer?.name
                                   ? `${captureResult.payer.name.given_name ?? ''} ${captureResult.payer.name.surname ?? ''}`.trim()
                                   : '';
                                 const payerEmail = (captureResult.payer as any)?.email_address ?? '';
                                  await fetch(
                                    `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations/paypal-complete`,
                                    {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
                                      body: JSON.stringify({
                                        orderId: captureResult.id,
                                        amount: finalAmount,
                                        currency: 'USD',
                                        donorName: payerName,
                                        donorEmail: payerEmail,
                                        message: `PayPal donation via CardPaymentPage – order: ${captureResult.id}`,
                                      }),
                                    },
                                  );
                                } catch { /* non-blocking */ }
                                toast.success('Thank you! Your donation has been confirmed.');
                                setDone(true);
                              }
                            }}
                            onError={async (err: any) => {
                              try {
                                await fetch(
                                  `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations/failed`,
                                  {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
                                    body: JSON.stringify({
                                      provider: 'paypal',
                                      amount: finalAmount,
                                      currency: 'USD',
                                      errorReason: String(err?.message || 'PayPal transaction failed on CardPaymentPage'),
                                    }),
                                  }
                                );
                              } catch {}
                              toast.error('PayPal payment failed. Please try again.');
                            }}
                           onCancel={() => toast.info('Payment cancelled.')}
                         />
                       </PayPalScriptProvider>
                     ) : (
                       <button onClick={() => window.open('https://paypal.com/donate', '_blank')} className="w-full bg-[#FFC439] py-3 rounded-xl font-bold cursor-pointer">
                         Continue to PayPal
                       </button>
                     )}
                  </div>
                )}

                {(method === 'mtn' || method === 'airtel') && (
                  <div className="space-y-5 animate-fade-in-up">
                    {/* Carrier Header */}
                    <div 
                      className="rounded-xl px-5 py-3.5 flex items-center justify-between mb-2 shadow-xs"
                      style={{ 
                        background: method === 'mtn' 
                          ? 'linear-gradient(135deg, #FFCC00 0%, #F5A500 100%)' 
                          : 'linear-gradient(135deg, #e40000 0%, #a00000 100%)',
                        color: method === 'mtn' ? '#1a1a1a' : 'white'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${method === 'mtn' ? 'bg-black/10' : 'bg-white/20'}`}>
                          {method === 'mtn' ? 'MTN' : 'A'}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight">{method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}</p>
                          <p className="text-[10px] opacity-80">Payment Service Under Configuration</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/30 backdrop-blur-sm text-gray-900 border border-white/20">
                        Unavailable
                      </span>
                    </div>

                    {/* RESTI-branded configuration notice */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-left shadow-xs">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                        <AlertCircle size={18} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-amber-900">
                          {method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'} Under Configuration
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed font-normal">
                          {method === 'mtn'
                            ? 'MTN Mobile Money payments are currently under configuration. This payment option is not yet available for live donations. Please try another available payment method.'
                            : 'Airtel Money payments are currently under configuration. This payment option is not yet available for live donations. Please try another available payment method.'}
                        </p>
                      </div>
                    </div>

                    {/* Alternative options */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-left space-y-2">
                      <p className="text-[11px] font-semibold text-gray-700">Available Live Payment Methods:</p>
                      <ul className="text-[11px] text-gray-600 space-y-1.5">
                        <li className="flex items-center gap-2">
                          <CreditCard size={13} className="text-emerald-600" />
                          <span><strong>Debit / Credit Card:</strong> Powered securely by Stripe</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <ExternalLink size={13} className="text-emerald-600" />
                          <span><strong>PayPal:</strong> Instant digital checkout</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Building2 size={13} className="text-emerald-600" />
                          <span><strong>Bank Wire Transfer:</strong> Direct deposit to RESTI CBO bank account</span>
                        </li>
                      </ul>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setMethod('card')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
                      >
                        Choose Another Payment Method
                      </button>
                      <button 
                        type="button" 
                        disabled
                        className="w-full bg-gray-100 border border-gray-200 text-gray-400 font-semibold py-3.5 rounded-xl flex items-center justify-center cursor-not-allowed opacity-60"
                        title="This payment option is not yet available for live donations."
                      >
                        Currently Unavailable
                      </button>
                    </div>
                  </div>
                )}

                {method === 'bank' && (
                  <form onSubmit={handleBankSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>First Name *</label><input required className={inp} placeholder="First name" value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} /></div>
                      <div><label className={lbl}>Last Name *</label><input required className={inp} placeholder="Last name" value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} /></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className={lbl}>Email Address (for receipt) *</label><input required type="email" className={inp} placeholder="you@example.com" value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} /></div>
                      <div><label className={lbl}>Phone Number *</label><input required type="tel" className={inp} placeholder="+256 700 000 000" value={donorData.phone} onChange={e => setDonorData(p => ({ ...p, phone: e.target.value }))} /></div>
                    </div>

                    <div>
                      <label className={lbl}>Street Address *</label>
                      <input required className={inp} placeholder="Street address or P.O. Box" value={donorData.address} onChange={e => setDonorData(p => ({ ...p, address: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div><label className={lbl}>City / Town *</label><input required className={inp} placeholder="City" value={donorData.city} onChange={e => setDonorData(p => ({ ...p, city: e.target.value }))} /></div>
                      <div><label className={lbl}>Postal / ZIP *</label><input required className={inp} placeholder="Postal code" value={donorData.postalCode} onChange={e => setDonorData(p => ({ ...p, postalCode: e.target.value }))} /></div>
                      <div>
                        <label className={lbl}>Country *</label>
                        <select required className={inp} value={donorData.country} onChange={e => setDonorData(p => ({ ...p, country: e.target.value }))}>
                          {COMMON_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/70 text-xs space-y-1.5 text-gray-700">
                      <div className="font-bold text-gray-900 border-b border-gray-200 pb-1.5 mb-1 flex items-center gap-1.5">
                        <Building2 size={13} className="text-emerald-700" />
                        Stanbic Bank Uganda Wire Instructions
                      </div>
                      <p><strong>Account Name:</strong> RESTI CBO</p>
                      <p><strong>Account Number:</strong> 9030012345678</p>
                      <p><strong>Branch:</strong> Kiryandongo Branch</p>
                      <p><strong>SWIFT Code:</strong> SBICUGKX</p>
                    </div>

                    <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer shadow-sm">
                      {submitting ? 'Registering...' : `Register ${formatUSD(finalAmount)} Bank Transfer`}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="text-center py-10 space-y-6">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                <h2 className="text-xl font-bold">Check Your Phone</h2>
                <p className="text-sm text-gray-600">Please enter your Mobile Money PIN on your handset to complete the donation.</p>
                <button onClick={() => setMobileWaiting(false)} className="text-sm text-gray-400 underline cursor-pointer">Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* Security & Privacy Callout */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-900">Security & Privacy is Important to Us</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your details will be kept securely and will not be shared with third parties. Please see our <Link to="/privacy" className="text-emerald-700 font-semibold underline hover:text-emerald-800">Privacy Notice</Link> and <Link to="/privacy" className="text-emerald-700 font-semibold underline hover:text-emerald-800">Cookies Policy</Link> for more information.
            </p>
          </div>
        </div>

        {/* Helper link to donor portal */}
        <div className="text-center text-xs text-slate-500 pt-1">
          Already a supporter? <button type="button" onClick={() => navigate('/donor/dashboard')} className="text-emerald-700 hover:text-emerald-800 underline font-bold cursor-pointer">Access your Donor Portal</button> to view past gifts and download official tax receipts.
        </div>
      </div>
    </div>
  );
}

function StripeCheckoutButton({ 
  amount, 
  isRecurring, 
  donorData, 
  setDonorData 
}: { 
  amount: number, 
  isRecurring: boolean, 
  donorData: DonorData, 
  setDonorData: React.Dispatch<React.SetStateAction<DonorData>> 
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorData.email || !donorData.firstName || !donorData.lastName || !donorData.phone || !donorData.address || !donorData.city || !donorData.postalCode) {
      toast.error('Please complete all required fields first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ 
          amount, 
          currency: 'usd', 
          donorName: `${donorData.firstName} ${donorData.lastName}`.trim(), 
          donorEmail: donorData.email,
          donorPhone: donorData.phone,
          donorAddress: donorData.address,
          donorCity: donorData.city,
          donorCountry: donorData.country,
          donorPostalCode: donorData.postalCode,
          interval: isRecurring ? 'month' : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Unknown error');
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) { 
      toast.error(err.message || 'Payment failed'); 
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCheckout} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>First Name *</label><input required className={inp} placeholder="First name" value={donorData.firstName} onChange={(e) => setDonorData(prev => ({...prev, firstName: e.target.value}))} /></div>
        <div><label className={lbl}>Last Name *</label><input required className={inp} placeholder="Last name" value={donorData.lastName} onChange={(e) => setDonorData(prev => ({...prev, lastName: e.target.value}))} /></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={lbl}>Email Address (for receipt) *</label><input required type="email" className={inp} placeholder="you@example.com" value={donorData.email} onChange={(e) => setDonorData(prev => ({...prev, email: e.target.value}))} /></div>
        <div><label className={lbl}>Phone Number *</label><input required type="tel" className={inp} placeholder="+256 700 000 000" value={donorData.phone} onChange={(e) => setDonorData(prev => ({...prev, phone: e.target.value}))} /></div>
      </div>

      <div>
        <label className={lbl}>Street Address *</label>
        <input required className={inp} placeholder="Street address or P.O. Box" value={donorData.address} onChange={(e) => setDonorData(prev => ({...prev, address: e.target.value}))} />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div><label className={lbl}>City / Town *</label><input required className={inp} placeholder="City" value={donorData.city} onChange={(e) => setDonorData(prev => ({...prev, city: e.target.value}))} /></div>
        <div><label className={lbl}>Postal / ZIP *</label><input required className={inp} placeholder="Postal code" value={donorData.postalCode} onChange={(e) => setDonorData(prev => ({...prev, postalCode: e.target.value}))} /></div>
        <div>
          <label className={lbl}>Country *</label>
          <select required className={inp} value={donorData.country} onChange={(e) => setDonorData(prev => ({...prev, country: e.target.value}))}>
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
          Your details will be kept securely and will not be shared with third parties. Please see our <Link to="/privacy" className="text-emerald-600 underline font-semibold hover:text-emerald-700">Privacy Notice</Link> and <Link to="/privacy" className="text-emerald-600 underline font-semibold hover:text-emerald-700">Cookies Policy</Link> for more information.
        </p>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors">
        {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : `Continue to ${isRecurring ? 'Monthly' : ''} Checkout`}
      </button>
    </form>
  );
}
