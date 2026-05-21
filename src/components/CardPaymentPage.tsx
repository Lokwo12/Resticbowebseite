import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, Heart, ArrowLeft, CreditCard, Phone, Building2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { STRIPE_PK, PAYPAL_CLIENT_ID } from '../utils/env';

const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-gray-400 bg-white';
const lbl = 'block text-xs font-semibold text-gray-600 mb-1';
interface DonorData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function CardPaymentPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [method, setMethod] = useState<'card' | 'paypal' | 'mtn' | 'airtel' | 'bank'>('card');
  const [donorData, setDonorData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [mobileRef, setMobileRef] = useState('');
  const [mobileWaiting, setMobileWaiting] = useState(false);
  const [done, setDone] = useState(false);

  const finalAmount = isCustom ? (parseInt(customAmount.replace(/\D/g, '')) || 0) : amount;

  const handleMobileMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/mobile-payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ provider: method, phone: donorData.phone, amount: finalAmount, currency: 'USD', donorName: `${donorData.firstName} ${donorData.lastName}`.trim(), donorEmail: donorData.email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to initiate'); setSubmitting(false); return; }
      setMobileRef(data.referenceId);
      setMobileWaiting(true);
      setSubmitting(false);
      
      const poll = setInterval(async () => {
        try {
          const sr = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/mobile-payment/status/${data.referenceId}?provider=${method}`, { headers: { Authorization: `Bearer ${publicAnonKey}` } });
          const sd = await sr.json();
          if (sd.status === 'SUCCESSFUL') { clearInterval(poll); setDone(true); }
          else if (sd.status === 'FAILED') { clearInterval(poll); setMobileWaiting(false); toast.error('Payment failed'); }
        } catch {}
      }, 4000);
    } catch { toast.error('Connection error'); setSubmitting(false); }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Heart size={36} fill="#059669" className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold">Thank You!</h2>
          <p className="text-gray-500">Your {formatUSD(finalAmount)} donation is confirmed.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 sm:pt-36 pb-10">
      <div className="max-w-lg mx-auto px-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
          <ArrowLeft size={15} /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Amount selector */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 space-y-3">
             <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map(v => (
                <button key={v} onClick={() => { setAmount(v); setIsCustom(false); }}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${!isCustom && amount === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-gray-50'}`}>
                  {formatUSD(v)}
                </button>
              ))}
            </div>
            <input type="number" placeholder="Custom amount" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setIsCustom(true); }}
              className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all ${isCustom ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`} />
          </div>

          {/* Tabs */}
          <div className="px-6 py-4 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'card', icon: CreditCard, label: 'Card' },
              { id: 'paypal', icon: ExternalLink, label: 'PayPal' },
              { id: 'mtn', icon: Phone, label: 'MTN' },
              { id: 'airtel', icon: Phone, label: 'Airtel' },
              { id: 'bank', icon: Building2, label: 'Bank' },
            ].map(m => (
              <button key={m.id} onClick={() => setMethod(m.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shrink-0 ${method === m.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                <m.icon size={14} /> {m.label}
              </button>
            ))}
          </div>

          <div className="px-6 py-6">
            {!mobileWaiting ? (
              <>
                {method === 'card' && (
                  stripePromise ? (
                    <Elements stripe={stripePromise}>
                      <StripeCardForm amount={finalAmount} donorData={donorData} onSuccess={() => setDone(true)} />
                    </Elements>
                  ) : <p className="text-center text-amber-600 text-xs">Stripe not configured</p>
                )}

                {method === 'paypal' && (
                  <div className="space-y-4">
                     <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-blue-800 text-sm">Secure checkout via PayPal</div>
                     {PAYPAL_CLIENT_ID ? (
                       <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
                         <PayPalButtons 
                           style={{ layout: 'vertical' }}
                           createOrder={(d, a) => a.order.create({ purchase_units: [{ amount: { value: finalAmount.toString(), currency_code: 'USD' } }] })}
                           onApprove={async (d, a) => { await a.order?.capture(); setDone(true); }}
                         />
                       </PayPalScriptProvider>
                     ) : <button onClick={() => window.open('https://paypal.com/donate', '_blank')} className="w-full bg-[#FFC439] py-3 rounded-xl font-bold">Continue to PayPal</button>}
                  </div>
                )}

                {(method === 'mtn' || method === 'airtel') && (
                  <form onSubmit={handleMobileMoneySubmit} className="space-y-5">
                    {/* Carrier Header */}
                    <div 
                      className="rounded-xl px-5 py-4 flex items-center justify-between mb-2 shadow-sm"
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
                          <p className="text-[10px] opacity-80">Instant PIN prompt will be sent</p>
                        </div>
                      </div>
                      <Lock size={14} className="opacity-60" />
                    </div>

                    {/* Info Box */}
                    <div className={`rounded-xl p-4 border text-xs leading-relaxed ${method === 'mtn' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                      Enter your details and tap <strong>Pay Now</strong>. A PIN prompt will be sent to your phone. Simply enter your PIN to confirm your <strong>{formatUSD(finalAmount)}</strong> donation.
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>First Name</label><input required className={inp} placeholder="First name" value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} /></div>
                      <div><label className={lbl}>Last Name</label><input required className={inp} placeholder="Last name" value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} /></div>
                    </div>
                    <div><label className={lbl}>Email Address (for receipt)</label><input required type="email" className={inp} placeholder="you@example.com" value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} /></div>
                    <div>
                      <label className={lbl}>Phone Number</label>
                      <input 
                        required 
                        type="tel"
                        className={inp} 
                        placeholder="256 700 000 000" 
                        value={donorData.phone} 
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if ((val.startsWith('07') && val.length > 2) || (val.startsWith('7') && !val.startsWith('256'))) {
                             if (val.startsWith('0')) val = '256' + val.substring(1);
                             else val = '256' + val;
                          }
                          setDonorData(p => ({ ...p, phone: val }));
                        }} 
                      />
                      <p className="text-[10px] text-gray-400 mt-1">International format (e.g. 25677...)</p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={submitting} 
                      className={`w-full text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${method === 'mtn' ? 'bg-[#FFCC00] !text-black hover:bg-[#F5A500]' : 'bg-[#e40000] hover:bg-[#c00000]'}`}
                    >
                      {submitting ? <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : `Pay ${formatUSD(finalAmount)} Now`}
                    </button>
                  </form>
                )}

                {method === 'bank' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs space-y-2">
                      <p><strong>Bank:</strong> Stanbic Bank Uganda</p>
                      <p><strong>Account:</strong> 9030012345678</p>
                    </div>
                    <button onClick={() => setDone(true)} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl">Register Transfer</button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 space-y-6">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                <h2 className="text-xl font-bold">Check Your Phone</h2>
                <button onClick={() => setMobileWaiting(false)} className="text-sm text-gray-400 underline">Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
      <button type="submit" disabled={loading || !stripe} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
        {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : `Donate ${formatUSD(amount)}`}
      </button>
    </form>
  );
}
