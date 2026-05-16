import React, { useState, useRef, useEffect } from 'react';
import { Heart, Lock, Phone, CreditCard, ChevronRight, Building2, Shield, Star, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { projectId, publicAnonKey } from '../utils/supabase/info';

import { STRIPE_PK, PAYPAL_CLIENT_ID } from '../utils/env';
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

type PayMethod = 'card' | 'paypal' | 'mtn' | 'airtel' | 'bank';
type FreqOption = 'once' | 'monthly' | 'yearly';

interface DonorData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);






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
  const [amount, setAmount] = useState(50);
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
  const [donorData, setDonorData] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
      signal: AbortSignal.timeout(6000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.settings?.donation) setDonationConfig(prev => ({ ...prev, ...data.settings.donation })); })
      .catch(() => { });
  }, []);

  const finalAmount = isCustom ? (parseInt(customAmount.replace(/\D/g, '')) || 0) : amount;

  const handlePreset = (v: number) => { setAmount(v); setIsCustom(false); setCustomAmount(''); };
  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => { setCustomAmount(e.target.value.replace(/\D/g, '')); setIsCustom(true); };

  const resetState = () => {
    setAmount(50); setCustomAmount(''); setIsCustom(false); setFreq('once');
    setMethod('card'); setStep(1); setSubmitting(false); setDone(false);
    setMobileRef(''); setMobileWaiting(false);
    setDonorData({ firstName: '', lastName: '', email: '', phone: '' });
  };

  const handleMobileMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 1) { toast.error('Minimum donation is $1'); return; }
    if (!donorData.phone) { toast.error('Please enter your phone number'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/mobile-payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          provider: method, phone: donorData.phone, amount: finalAmount, currency: 'USD',
          donorName: `${donorData.firstName} ${donorData.lastName}`.trim(), donorEmail: donorData.email,
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
    setSubmitting(true);
    const ref = `BT-${Date.now().toString(36).toUpperCase()}`;
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          amount: finalAmount, currency: 'USD', paymentMethod: 'bank_transfer',
          donorName: `${donorData.firstName} ${donorData.lastName}`.trim(), donorEmail: donorData.email,
          transactionId: ref, status: 'pending',
        }),
      });
    } catch { }
    setSubmitting(false);
    setMobileRef(ref); // Reuse ref state for bank
    setDone(true);
  };

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-gray-400 bg-white';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  const IMPACT_HINTS: Record<number, string> = {
    5: 'Provides a hot meal for a child every day for a week',
    10: 'Provides school supplies for one child for a term',
    25: 'Covers basic healthcare for a family of four',
    50: 'Feeds a family nutritious meals for a full month',
    100: 'Seeds a small-holder farm for one growing season',
    250: 'Builds a clean water point serving a village',
  };
  const impactHint = !isCustom ? IMPACT_HINTS[amount] : null;

  return (
    <section id="donate" className="py-24 bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden relative">
      {/* Abstract background shapes */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Page header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-5 py-2.5 rounded-full mb-5">
            <Heart size={14} fill="currentColor" /> Make a Difference Today
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Support the <span className="gradient-text">Community Foundation</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your donation directly funds education, healthcare, and sustainable livelihoods for families in Kiryandongo District, Uganda.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT COLUMN: Impact & Info */}
          <div className="w-full lg:w-5/12 space-y-6">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent)]"></div>
              <div>
                <div className="font-bold text-lg mb-2">Resticbo Community Foundation</div>
                <div className="text-emerald-100 text-sm mb-6">Registered CBO - Uganda NGO Bureau</div>
                <h3 className="text-3xl font-bold mb-4 leading-snug">Why Your Support Matters</h3>
                <p className="text-emerald-50 text-sm leading-relaxed mb-6">
                  Every contribution helps us provide essential services to vulnerable families. 90% of all donations go directly to our community programs.
                </p>
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
              <div className="border-t border-white/20 pt-6 mt-auto">
                <div className="flex items-center justify-between text-xs text-emerald-100">
                  <span className="flex items-center gap-1"><Lock size={12} /> 256-bit SSL</span>
                  <span className="flex items-center gap-1"><Shield size={12} /> Verified NGO</span>
                </div>
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

                  <button type="button"
                    onClick={() => { if (finalAmount >= 1) setStep(2); else toast.error('Minimum donation is $1'); }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition-all">
                    <Heart size={18} fill="currentColor" />
                    Continue{finalAmount > 0 ? ` — ${formatUSD(finalAmount)}` : ''}
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
                      <div className="text-emerald-700 font-extrabold text-base">{formatUSD(finalAmount)}</div>
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
                      <p className="text-gray-600">Your donation of <span className="font-bold text-emerald-700">{formatUSD(finalAmount)}</span> is confirmed.</p>
                      <button onClick={resetState} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg">Donate Again</button>
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
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={lbl}>First Name</label><input required className={inp} value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} /></div>
                            <div><label className={lbl}>Last Name</label><input required className={inp} value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} /></div>
                          </div>
                          <div><label className={lbl}>Email</label><input required type="email" className={inp} value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} /></div>
                          <div className="bg-white border border-gray-100 rounded-2xl p-6">
                            {stripePromise ? (
                              <Elements stripe={stripePromise}>
                                <StripeCardForm amount={finalAmount} donorData={donorData} onSuccess={() => setDone(true)} />
                              </Elements>
                            ) : <p className="text-xs text-amber-600 text-center">Stripe not configured</p>}
                          </div>
                        </div>
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
                            <button onClick={() => window.open('https://paypal.com/donate', '_blank')} className="w-full bg-[#FFC439] py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                              <ExternalLink size={18} /> Continue to PayPal
                            </button>
                          )}
                        </div>
                      )}

                      {(method === 'mtn' || method === 'airtel') && (
                        <form onSubmit={handleMobileMoneySubmit} className="space-y-6">
                          <div><label className={lbl}>Phone Number</label><input required className={inp} placeholder="256 700 000 000" value={donorData.phone} onChange={e => setDonorData(p => ({ ...p, phone: e.target.value }))} /></div>
                          <button type="submit" disabled={submitting} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                            {submitting ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Phone size={18} /> Pay {formatUSD(finalAmount)}</>}
                          </button>
                        </form>
                      )}

                      {method === 'bank' && (
                        <form onSubmit={handleBankSubmit} className="space-y-6">
                          <div className="bg-gray-50 rounded-2xl p-6 space-y-4 text-xs">
                            <p><strong>Bank:</strong> {donationConfig.bankName}</p>
                            <p><strong>Account:</strong> {donationConfig.accountNumber}</p>
                            <p><strong>SWIFT:</strong> {donationConfig.swiftCode}</p>
                          </div>
                          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg">Register Transfer</button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StripeCardForm({ amount, donorData, onSuccess }: { amount: number, donorData: DonorData, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ amount, currency: 'usd', donorName: `${donorData.firstName} ${donorData.lastName}`.trim(), donorEmail: donorData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement)!, billing_details: { name: `${donorData.firstName} ${donorData.lastName}`.trim(), email: donorData.email } }
      });
      if (error) toast.error(error.message);
      else if (paymentIntent?.status === 'succeeded') onSuccess();
    } catch (err: any) { toast.error(err.message || 'Payment failed'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#374151', '::placeholder': { color: '#9ca3af' } } } }} />
      </div>
      <button type="submit" disabled={loading || !stripe} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
        {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Lock size={18} /> Confirm Donation — {formatUSD(amount)}</>}
      </button>
    </form>
  );
}