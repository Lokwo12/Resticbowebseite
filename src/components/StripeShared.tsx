import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { STRIPE_PK } from '../utils/env';

export const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

export const formatCurrency = (n: number, currencyCode: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export type FreqOption = 'once' | 'monthly' | 'yearly';

export function StripePaymentProvider({ finalAmount, currency, freq, donorData, children }: any) {
  const [clientSecret, setClientSecret] = useState('');
  
  useEffect(() => {
    if (finalAmount < 1) return;
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ amount: finalAmount, currency: currency.toLowerCase(), donorName: `${donorData.firstName} ${donorData.lastName}`.trim(), donorEmail: donorData.email }),
    })
      .then(r => r.json())
      .then(d => { if (d.clientSecret) setClientSecret(d.clientSecret); else toast.error(d.error || 'Could not initialise payment.'); })
      .catch(() => toast.error('An unexpected error occurred.'));
  }, [finalAmount, currency, donorData, freq]);

  if (!clientSecret) return (
    <div className="px-6 py-12 flex flex-col items-center justify-center space-y-4">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">Initializing secure checkout...</p>
      </div>
    </div>
  );

  return <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>{children}</Elements>;
}

export interface StripeFormProps {
  donorData: { firstName: string; lastName: string; email: string; phone: string };
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
          await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({
              amount: finalAmount, 
              currency: 'USD', // Stripe amount was approximated to USD
              paymentMethod: 'card',
              donorName: `${donorData.firstName} ${donorData.lastName}`.trim(),
              donorEmail: donorData.email,
              donorPhone: donorData.phone || '',
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={lbl}>First Name</label>
            <input required className={inp} style={{ height: 44 }} placeholder="John" value={donorData.firstName} onChange={e => setDonorData((p:any) => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className={lbl}>Last Name</label>
            <input required className={inp} style={{ height: 44 }} placeholder="Smith" value={donorData.lastName} onChange={e => setDonorData((p:any) => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={lbl}>Email Address</label>
          <input required type="email" className={inp} style={{ height: 44 }} placeholder="you@example.com" value={donorData.email} onChange={e => setDonorData((p:any) => ({ ...p, email: e.target.value }))} />
        </div>

        <div className="space-y-1.5 pt-2">
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onBack} disabled={submitting} className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-sm transition-all duration-200" style={{ height: 44 }}>Back</button>
          <button type="submit" disabled={submitting || !stripe || !elements} className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all duration-200" style={{ height: 44 }}>
            {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <><Lock size={14} /> Donate {formatAmt(finalAmount)}</>}
          </button>
        </div>
      </div>
    </form>
  );
}
