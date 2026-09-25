import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Lock, ShieldCheck, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { STRIPE_PK } from '../utils/env';
import { supabaseUrl } from '../utils/supabase/client';

export const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

export type FreqOption = 'once' | 'monthly' | 'yearly';

// Stripe global card network minimums by currency (e.g. UGX 5,000 ≈ €1.20 to guarantee >= €0.50 Stripe threshold)
export const STRIPE_MIN_AMOUNTS: Record<string, number> = {
  ugx: 5000,
  usd: 5,
  eur: 5,
  gbp: 5,
};

export function getStripeMinAmount(currency: string): number {
  return STRIPE_MIN_AMOUNTS[(currency || 'usd').toLowerCase()] ?? 5;
}

// In-memory cache for Payment Intents to make card checkout render instantly
const paymentIntentCache = new Map<string, Promise<string>>();

export function prefetchPaymentIntent(amount: number, currency = 'USD', donorData?: any, campaign?: string): Promise<string> | undefined {
  const curr = (currency || 'USD').toLowerCase();
  const minAmt = getStripeMinAmount(curr);

  if (!amount || Number.isNaN(amount) || amount < minAmt || !STRIPE_PK || STRIPE_PK === 'pk_test_REPLACE_ME') {
    return undefined;
  }
  const cacheKey = `${amount}_${curr}_${donorData?.email || ''}`;

  if (paymentIntentCache.has(cacheKey)) {
    return paymentIntentCache.get(cacheKey);
  }

  const promise = (async () => {
    try {
      // For UGX: Stripe API requires a 2-decimal multiplier (* 100) for legacy compatibility
      // (e.g. 5,000 UGX = 500,000; 50,000 UGX = 5,000,000 in Stripe API units).
      const apiAmount = (curr === 'ugx' && amount < 500_000) ? Math.round(amount * 100) : amount;

      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2a4be611/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          amount: apiAmount,
          currency: curr,
          donorName: donorData ? `${donorData.firstName || ''} ${donorData.lastName || ''}`.trim() : '',
          donorEmail: donorData?.email || '',
          donorPhone: donorData?.phone || '',
          donorCountry: donorData?.country || 'Uganda',
          campaign: campaign || 'Where Most Needed'
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

export function StripePaymentProvider({ 
  finalAmount, 
  currency, 
  freq, 
  donorData, 
  campaign, 
  onSetAmount,
  formatAmt,
  children 
}: any) {
  const [clientSecret, setClientSecret] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const curr = (currency || 'USD').toLowerCase();
  const minAmt = getStripeMinAmount(curr);
  const isBelowMin = !finalAmount || Number.isNaN(finalAmount) || finalAmount < minAmt;

  useEffect(() => {
    // If below minimum, reset secret and don't call backend
    if (isBelowMin) {
      setClientSecret('');
      setErrorMsg('');
      return;
    }

    const controller = new AbortController();
    setErrorMsg('');

    const cacheKey = `${finalAmount}_${curr}_${donorData?.email || ''}`;

    // If retry is requested, clear the existing cached promise
    if (retryCount > 0) {
      paymentIntentCache.delete(cacheKey);
    }

    // Debounce 350ms so typing in custom amount doesn't spam Stripe or cause race conditions
    const timer = setTimeout(() => {
      const initialisePayment = async () => {
        try {
          const promise = prefetchPaymentIntent(finalAmount, curr, donorData, campaign);
          if (!promise) return;
          const secret = await promise;
          if (!controller.signal.aborted) {
            setClientSecret(secret);
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          let message = error instanceof Error ? error.message : 'An unexpected network error occurred.';
          // Translate raw Stripe minimum amount errors into clear user feedback
          if (/convert to at least 50 cents/i.test(message) || /minimum/i.test(message)) {
            const formattedMin = formatAmt ? formatAmt(minAmt) : `${curr.toUpperCase()} ${minAmt.toLocaleString()}`;
            message = `Card payment network minimum for ${curr.toUpperCase()} is ${formattedMin}.`;
          }
          setErrorMsg(message);
          toast.error(message);
        }
      };

      void initialisePayment();
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [finalAmount, curr, minAmt, isBelowMin, freq, retryCount]); // retryCount allows manual retry

  // Friendly below-minimum advisory card (non-blocking, keeps UI responsive)
  if (isBelowMin) {
    const formattedMin = formatAmt ? formatAmt(minAmt) : `${curr.toUpperCase()} ${minAmt.toLocaleString()}`;
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100/90 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-amber-700" />
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-amber-950">
              Minimum Card Donation: {formattedMin}
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              International card processors (Visa/Mastercard) require card transactions to meet a minimum processing threshold (approx. €0.50 / $0.50). For {curr.toUpperCase()}, please enter or select an amount of at least <span className="font-semibold text-amber-950">{formattedMin}</span> to activate card checkout.
            </p>
          </div>
        </div>
        {onSetAmount && (
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSetAmount(minAmt)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Set donation to {formattedMin}
            </button>
          </div>
        )}
      </div>
    );
  }

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
    const formattedMin = formatAmt ? formatAmt(minAmt) : `${curr.toUpperCase()} ${minAmt.toLocaleString()}`;
    return (
      <div className="px-6 py-8 flex flex-col items-center justify-center space-y-4 text-center bg-stone-50/60 rounded-2xl border border-stone-200">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">Card Checkout Notice</p>
          <p className="text-xs text-gray-600 max-w-sm leading-relaxed">{errorMsg}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onSetAmount && (
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                onSetAmount(minAmt);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Set to {formattedMin}
            </button>
          )}
          <button
            type="button"
            onClick={() => setRetryCount(c => c + 1)}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
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
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  setDonorData?: React.Dispatch<React.SetStateAction<any>>;
  finalAmount: number;
  freq: FreqOption;
  setDone: (paymentIntent?: any) => void;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  inp?: string;
  lbl?: string;
  onBack?: () => void;
  formatAmt: (n: number) => string;
}

export function StripeCardForm({ 
  donorData, 
  setDonorData, 
  finalAmount, 
  freq, 
  setDone, 
  submitting, 
  setSubmitting, 
  inp = "w-full border border-stone-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600", 
  lbl = "block text-[11px] font-semibold text-stone-600 mb-1 uppercase", 
  onBack, 
  formatAmt 
}: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set('payment_return', 'stripe');

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl.toString(),
          payment_method_data: {
            billing_details: {
              name: `${donorData.firstName || ''} ${donorData.lastName || ''}`.trim() || undefined,
              email: donorData.email || undefined,
              phone: donorData.phone || undefined,
              address: {
                line1: donorData.address || undefined,
                city: donorData.city || undefined,
                postal_code: donorData.postalCode || undefined,
                country: donorData.country === 'Uganda' ? 'UG' : undefined,
              }
            }
          }
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          toast.error(error.message || 'Payment declined. Please check your card information.');
        } else {
          toast.error(error.message || 'Payment failed. Please try again or select another payment option.');
        }
      } else if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
          case 'requires_capture':
            toast.success('Thank you! Your card donation has been confirmed.', { duration: 7000 });
            setDone(paymentIntent);
            break;
          case 'processing':
            toast.info('Your payment is currently processing. Your official receipt will be sent via email once clearance is received.');
            setDone(paymentIntent);
            break;
          case 'requires_action':
            // 3D Secure / SCA in progress via modal or redirect
            break;
          case 'requires_payment_method':
            toast.error('Payment was declined. Please verify your card details or try a different card.');
            break;
          case 'canceled':
            toast.error('Payment was canceled.');
            break;
          default:
            toast.error(`Payment status: ${paymentIntent.status}.`);
            break;
        }
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasNameAndEmail = donorData.firstName && donorData.email;

  return (
    <form onSubmit={handleCardSubmit} className="space-y-4">
      {/* If name or email are missing, prompt for them inline */}
      {!hasNameAndEmail && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
          <div className="space-y-1">
            <label className={lbl}>Donor Name *</label>
            <input 
              required 
              className={inp} 
              placeholder="Your full name" 
              value={`${donorData.firstName || ''} ${donorData.lastName || ''}`.trim()} 
              onChange={e => {
                if (setDonorData) {
                  const parts = e.target.value.split(' ');
                  setDonorData((p: any) => ({ ...p, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }));
                }
              }} 
            />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Email Address (for receipt) *</label>
            <input 
              required 
              type="email" 
              className={inp} 
              placeholder="you@example.com" 
              value={donorData.email || ''} 
              onChange={e => {
                if (setDonorData) setDonorData((p: any) => ({ ...p, email: e.target.value }));
              }} 
            />
          </div>
        </div>
      )}

      {/* Stripe Payment Card Element */}
      <div className="space-y-1.5 bg-stone-50/70 p-3 sm:p-4 rounded-xl border border-stone-200">
        <label className={lbl}>Card Details</label>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {/* Security & Privacy Notice */}
      <div className="pt-2 border-t border-stone-100 text-left space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
          <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
          <span>Encrypted 256-bit SSL Card Processing</span>
        </div>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          Your card data is processed directly by Stripe's certified PCI-DSS Level 1 infrastructure. RESTI never sees or stores your full card number.
        </p>
      </div>

      <div className="pt-2 flex gap-3">
        {onBack && (
          <button 
            type="button" 
            onClick={onBack} 
            disabled={submitting} 
            className="w-1/3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl text-xs sm:text-sm transition-all"
            style={{ height: 44 }}
          >
            Back
          </button>
        )}
        <button 
          type="submit" 
          disabled={submitting || !stripe || !elements} 
          className={`${onBack ? 'w-2/3' : 'w-full'} bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50`} 
          style={{ height: 44 }}
        >
          {submitting ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Lock size={14} /> 
              <span>Donate {formatAmt(finalAmount)}</span>
            </>
          )}
        </button>
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
          Online card processing is currently being finalized for live production. To donate {formatAmt ? formatAmt(finalAmount) : ''} securely today, please choose <strong>PayPal</strong> or <strong>Bank Wire</strong>.
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
