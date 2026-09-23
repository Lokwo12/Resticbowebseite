import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Lock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { STRIPE_PK } from '../utils/env';
import { supabaseUrl } from '../utils/supabase/client';

export const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

export type FreqOption = 'once' | 'monthly' | 'yearly';

// In-memory cache for Payment Intents to make card checkout render instantly
const paymentIntentCache = new Map<string, Promise<string>>();

export function prefetchPaymentIntent(amount: number, currency = 'USD', donorData?: any): Promise<string> | undefined {
  if (!amount || Number.isNaN(amount) || amount < 1 || !STRIPE_PK || STRIPE_PK === 'pk_test_REPLACE_ME') {
    return undefined;
  }
  const curr = (currency || 'USD').toLowerCase();
  const cacheKey = `${amount}_${curr}`;

  if (paymentIntentCache.has(cacheKey)) {
    return paymentIntentCache.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2a4be611/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          amount,
          currency: curr,
          donorName: donorData ? `${donorData.firstName || ''} ${donorData.lastName || ''}`.trim() : '',
          donorEmail: donorData?.email || '',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.clientSecret) {
        throw new Error(data.details || data.error || 'Could not initialise payment.');
      }
      return data.clientSecret as string;
    } catch (err) {
      paymentIntentCache.delete(cacheKey);
      throw err;
    }
  })();

  paymentIntentCache.set(cacheKey, promise);
  return promise;
}

export function StripePaymentProvider({ finalAmount, currency, freq, donorData, children }: any) {
  const [clientSecret, setClientSecret] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    if (!finalAmount || Number.isNaN(finalAmount) || finalAmount < 1) {
      setClientSecret('');
      setErrorMsg('Enter a valid donation amount.');
      return;
    }

    const controller = new AbortController();
    setErrorMsg('');

    const curr = (currency || 'USD').toLowerCase();
    const cacheKey = `${finalAmount}_${curr}`;

    // If retry is requested, clear the existing cached promise
    if (retryCount > 0) {
      paymentIntentCache.delete(cacheKey);
    }

    const initialisePayment = async () => {
      try {
        const promise = prefetchPaymentIntent(finalAmount, curr, donorData);
        if (!promise) return;
        const secret = await promise;
        if (!controller.signal.aborted) {
          setClientSecret(secret);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'An unexpected network error occurred.';
        setErrorMsg(message);
        toast.error(message);
      }
    };

    void initialisePayment();
    return () => controller.abort();
  }, [finalAmount, currency, freq, retryCount]); // retryCount allows manual retry

  // Only show Demo form when the publishable key is genuinely not configured
  if (STRIPE_PK === 'pk_test_REPLACE_ME' || !STRIPE_PK) {
    return (
      <DemoCardForm 
        donorData={donorData} 
        finalAmount={finalAmount} 
        freq={freq}
      >
        {children}
      </DemoCardForm>
    );
  }

  // Show a real error panel (with retry) when the API call fails
  if (errorMsg) {
    return (
      <div className="px-6 py-10 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">Payment initialisation failed</p>
          <p className="text-xs text-gray-500 max-w-xs">{errorMsg}</p>
        </div>
        <button
          type="button"
          onClick={() => setRetryCount(c => c + 1)}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!clientSecret) return (
    <div className="px-6 py-12 flex flex-col items-center justify-center space-y-4">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">Initializing secure checkout...</p>
      </div>
    </div>
  );

  return <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>{children}</Elements>;
}

export interface StripeFormProps {
  donorData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  setDonorData: React.Dispatch<React.SetStateAction<any>>;
  finalAmount: number;
  freq: FreqOption;
  setDone: React.Dispatch<React.SetStateAction<boolean>>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  inp: string;
  lbl: string;
  onBack: () => void;
  formatAmt: (n: number) => string;
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

export function StripeCardForm({ donorData, setDonorData, finalAmount, freq, setDone, submitting, setSubmitting, inp, lbl, onBack, formatAmt }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: {
              name: `${donorData.firstName} ${donorData.lastName}`.trim(),
              email: donorData.email,
              phone: donorData.phone || undefined,
              address: {
                line1: donorData.address || undefined,
                city: donorData.city || undefined,
                postal_code: donorData.postalCode || undefined,
              }
            }
          }
        },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message ?? 'Payment failed. Please try again.');
      } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
        try {
          // Record donation in Postgres and trigger automated Email Receipt
          await fetch(`${supabaseUrl}/functions/v1/make-server-2a4be611/donations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({
              amount: finalAmount, 
              currency: paymentIntent.currency?.toUpperCase() || 'USD',
              paymentMethod: 'card',
              donorName: `${donorData.firstName} ${donorData.lastName}`.trim(),
              donorEmail: donorData.email,
              donorPhone: donorData.phone || '',
              donorAddress: donorData.address || '',
              donorCity: donorData.city || '',
              donorCountry: donorData.country || '',
              donorPostalCode: donorData.postalCode || '',
              paymentIntentId: paymentIntent.id,
              transactionId: paymentIntent.id
            })
          });
        } catch (e) { console.error('Failed to record donation email logic', e) }

        toast.success('Thank you! Your donation was confirmed.', { duration: 7000 });
        setDone(true);
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCardSubmit}>
      <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div>
          <p className="text-white font-bold text-sm">Secure Payment</p>
          <p className="text-gray-400 text-xs mt-0.5">End-to-end encrypted · Powered by Stripe</p>
        </div>
        <Lock size={16} className="text-white" />
      </div>

      <div className="mx-6 mt-5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Donation Amount</p>
          <p className="text-lg font-bold text-emerald-700">{formatAmt(finalAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Frequency</p>
          <p className="text-xs font-semibold text-gray-700">{freq === 'once' ? 'One-time' : 'Monthly'}</p>
        </div>
      </div>

      <div className="px-6 pt-4 pb-6 space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={lbl}>First Name *</label>
            <input required className={inp} style={{ height: 44 }} placeholder="John" value={donorData.firstName} onChange={e => setDonorData((p:any) => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className={lbl}>Last Name *</label>
            <input required className={inp} style={{ height: 44 }} placeholder="Smith" value={donorData.lastName} onChange={e => setDonorData((p:any) => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={lbl}>Email Address (for receipt) *</label>
            <input required type="email" className={inp} style={{ height: 44 }} placeholder="you@example.com" value={donorData.email} onChange={e => setDonorData((p:any) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className={lbl}>Phone Number *</label>
            <input required type="tel" className={inp} style={{ height: 44 }} placeholder="+256 700 000 000" value={donorData.phone || ''} onChange={e => setDonorData((p:any) => ({ ...p, phone: e.target.value }))} />
          </div>
        </div>

        {/* Street Address */}
        <div className="space-y-1.5">
          <label className={lbl}>Street Address *</label>
          <input required className={inp} style={{ height: 44 }} placeholder="Street address or P.O. Box" value={donorData.address || ''} onChange={e => setDonorData((p:any) => ({ ...p, address: e.target.value }))} />
        </div>

        {/* City, Postal Code & Country */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-1.5">
            <label className={lbl}>City / Town *</label>
            <input required className={inp} style={{ height: 44 }} placeholder="City" value={donorData.city || ''} onChange={e => setDonorData((p:any) => ({ ...p, city: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className={lbl}>Postal / ZIP *</label>
            <input required className={inp} style={{ height: 44 }} placeholder="Postal code" value={donorData.postalCode || ''} onChange={e => setDonorData((p:any) => ({ ...p, postalCode: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className={lbl}>Country *</label>
            <select required className={inp} style={{ height: 44 }} value={donorData.country || 'Uganda'} onChange={e => setDonorData((p:any) => ({ ...p, country: e.target.value }))}>
              {COMMON_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Stripe Payment Card Element */}
        <div className="space-y-1.5 pt-2">
          <label className={lbl}>Payment Details</label>
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>

        {/* Security & Privacy Notice */}
        <div className="pt-3 border-t border-gray-100 text-left space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Security & Privacy is Important to Us</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Your details will be kept securely and will not be shared with third parties. Please see our <Link to="/privacy" className="text-emerald-600 underline font-semibold hover:text-emerald-700">Privacy Notice</Link> and <Link to="/privacy" className="text-emerald-600 underline font-semibold hover:text-emerald-700">Cookies Policy</Link> for more information.
          </p>
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onBack} disabled={submitting} className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-sm transition-all duration-200" style={{ height: 44 }}>Back</button>
          <button type="submit" disabled={submitting || !stripe || !elements} className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer" style={{ height: 44 }}>
            {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <><Lock size={14} /> Donate {formatAmt(finalAmount)}</>}
          </button>
        </div>
      </div>
    </form>
  );
}

// Gateway notice shown when Stripe publishable key is pending production setup
export function DemoCardForm({ donorData, finalAmount, freq, children }: any) {
  const childProps = children?.props || {};
  const { onBack, formatAmt } = childProps;
  
  return (
    <div className="p-6 sm:p-8 text-center space-y-5">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
        <Lock size={22} />
      </div>
      <div className="space-y-2">
        <h4 className="text-base font-bold text-slate-800">Card Payment Notice</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Online card processing is currently being finalized for live production. To donate {formatAmt ? formatAmt(finalAmount) : ''} securely today, please choose <strong>Mobile Money (MTN / Airtel)</strong>, <strong>PayPal</strong>, or <strong>Bank Wire</strong>.
        </p>
      </div>
      <div className="pt-2">
        <button 
          type="button" 
          onClick={onBack} 
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm active:scale-95"
        >
          Select Another Payment Method
        </button>
      </div>
    </div>
  );
}
