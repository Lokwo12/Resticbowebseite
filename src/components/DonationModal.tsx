import React, {
  useState, useEffect, createContext, useContext,
  type ReactNode,
} from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  X, Heart, Lock, Copy, CheckCircle, ChevronRight,
  Phone, CreditCard, Info, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { STRIPE_PK, PAYPAL_CLIENT_ID, PAYPAL_MERCHANT_EMAIL } from '../utils/env';

// ─── Types ─────────────────────────────────────────────────────────────────────
type PayMethod = 'card' | 'paypal' | 'mtn' | 'airtel' | 'bank';
type FreqOption = 'once' | 'monthly';
type ModalStep = 1 | 2 | 3;

// ─── Context ───────────────────────────────────────────────────────────────────
interface DonationModalCtx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DonationModalContext = createContext<DonationModalCtx>({
  isOpen: false,
  open: () => { },
  close: () => { },
});

export function DonationModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DonationModalContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </DonationModalContext.Provider>
  );
}

export const useDonationModal = () => useContext(DonationModalContext);

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const IMPACT_HINTS: Record<number, string> = {
  5: 'Provides a hot meal for a child every day for a week',
  10: 'Provides school supplies for one child for a term',
  25: 'Covers basic healthcare for a family of four',
  50: 'Feeds a family nutritious meals for a full month',
  100: 'Seeds a small-holder farm for one growing season',
  250: 'Builds a clean water point serving a village',
};

const USSD_STEPS: Record<'mtn' | 'airtel', { title: string; steps: string[] }> = {
  mtn: {
    title: 'MTN Mobile Money',
    steps: [
      'Dial *165# on your MTN line',
      'Select option 1 – Send Money',
      'Enter the merchant number shown above',
      'Enter the UGX equivalent of your donation amount',
      'Enter your MTN MoMo PIN to confirm',
      'You will receive an SMS confirmation receipt',
      'Screenshot your SMS & email it to donate@resticbo.org',
    ],
  },
  airtel: {
    title: 'Airtel Money',
    steps: [
      'Dial *185# on your Airtel line',
      'Select option 5 – Pay Bill',
      'Enter the merchant code shown above',
      'Enter the UGX equivalent of your donation amount',
      'Enter your Airtel Money PIN to confirm',
      'You will receive an SMS confirmation receipt',
      'Screenshot your SMS & email it to donate@resticbo.org',
    ],
  },
};

const DEFAULT_CONFIG = {
  merchantMTN: '0772 000 000',
  merchantAirtel: '0701 000 000',
  bankName: 'Stanbic Bank Uganda',
  accountName: 'Resti Kiryandongo CBO',
  accountNumber: '9030012345678',
  branch: 'Kiryandongo Branch',
  swiftCode: 'SBICUGKX',
};

// ─── Utility components ────────────────────────────────────────────────────────
function CopyBtn({ text, light = false }: { text: string; light?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className={`ml-2 p-1.5 rounded-lg transition-colors ${light ? 'hover:bg-white/20' : 'hover:bg-emerald-50'}`} title="Copy">
      {copied
        ? <CheckCircle size={14} className={light ? 'text-emerald-300' : 'text-emerald-500'} />
        : <Copy size={14} className={light ? 'text-white/60' : 'text-gray-400'} />}
    </button>
  );
}

// ─── Stripe Card Form ─────────────────────────────────────────────────────────
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

interface StripeFormProps {
  donorData: { firstName: string; lastName: string; email: string; phone: string };
  setDonorData: React.Dispatch<React.SetStateAction<{ firstName: string; lastName: string; email: string; phone: string }>>;
  finalAmount: number;
  freq: FreqOption;
  setDone: React.Dispatch<React.SetStateAction<boolean>>;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  inp: string;
  lbl: string;
}

function StripeCardForm({ donorData, setDonorData, finalAmount, freq, setDone, submitting, setSubmitting, inp, lbl }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (finalAmount < 1) { toast.error('Minimum donation is $1'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/create-payment-intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({
            amount: finalAmount,
            currency: 'usd',
            donorName: `${donorData.firstName} ${donorData.lastName}`.trim(),
            donorEmail: donorData.email,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || data.error || !data.clientSecret) {
        toast.error(data.error || 'Could not initialise payment. Please try again.');
        return;
      }
      const cardEl = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardEl!,
          billing_details: {
            name: `${donorData.firstName} ${donorData.lastName}`.trim(),
            email: donorData.email,
          },
        },
      });
      if (error) {
        toast.error(error.message ?? 'Payment failed. Please try again.');
      } else if (paymentIntent?.status === 'succeeded') {
        toast.success(`Thank you, ${donorData.firstName || 'friend'}! Your donation was confirmed.`, { duration: 7000 });
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
      {/* ── Branded header ── */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <div>
          <p className="text-white font-bold text-sm">Secure Card Payment</p>
          <p className="text-gray-400 text-xs mt-0.5">End-to-end encrypted · Powered by Stripe</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md px-2 py-1 text-[10px] font-black italic tracking-tight text-white min-w-[32px] text-center" style={{ background: '#1434CB' }}>VISA</span>
          <span className="rounded-md px-2 py-1 text-[10px] font-black text-white min-w-[32px] text-center" style={{ background: '#EB001B' }}>MC</span>
          <span className="rounded-md px-2 py-1 text-[10px] font-black text-white min-w-[36px] text-center" style={{ background: '#007BC1' }}>AMEX</span>
        </div>
      </div>

      {/* ── Amount summary ── */}
      <div className="mx-6 mt-5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Donation Amount</p>
          <p className="text-lg font-bold text-emerald-700">{formatUSD(finalAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Frequency</p>
          <p className="text-xs font-semibold text-gray-700">{freq === 'once' ? 'One-time' : 'Monthly'}</p>
        </div>
      </div>

      {/* ── Form fields ── */}
      <div className="px-6 pt-4 pb-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={lbl}>First Name</label>
            <input required className={inp} placeholder="John"
              value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className={lbl}>Last Name</label>
            <input required className={inp} placeholder="Smith"
              value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={lbl}>Email Address</label>
          <input required type="email" className={inp} placeholder="you@example.com"
            value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <label className={lbl}>Card Number · Expiry · CVC</label>
          <div className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-50 transition-all">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '12px',
                    color: '#374151',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    '::placeholder': { color: '#9ca3af' },
                  },
                  invalid: { color: '#ef4444', iconColor: '#ef4444' },
                },
                hidePostalCode: true,
              }}
            />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
          <Lock size={12} className="text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 leading-tight">
            256-bit SSL encrypted · Powered by Stripe · Your card data is handled securely and never stored on our servers.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || finalAmount < 1 || !stripe}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md shadow-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting
            ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Processing…</>
            : <><Lock size={14} /> Donate {formatUSD(finalAmount)}</>
          }
        </button>
      </div>
    </form>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export function DonationModal() {
  const { isOpen, close } = useDonationModal();

  const [step, setStep] = useState<ModalStep>(1);
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [freq, setFreq] = useState<FreqOption>('once');
  const [method, setMethod] = useState<PayMethod>('card');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [bankRef, setBankRef] = useState('');
  const [mobileRef, setMobileRef] = useState('');
  const [mobileWaiting, setMobileWaiting] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [donorData, setDonorData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const shouldLockBackground = isOpen;

  const finalAmount = isCustom ? (parseInt(customAmount.replace(/\D/g, '')) || 0) : amount;
  const impactHint = !isCustom ? IMPACT_HINTS[amount] : null;

  // Fetch dynamic config once when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
      signal: AbortSignal.timeout(6000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings?.donation) setConfig(p => ({ ...p, ...data.settings.donation }));
      })
      .catch(() => { });
  }, [isOpen]);

  // Lock page scroll while open
  useEffect(() => {
    if (!shouldLockBackground) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [shouldLockBackground]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close on location change (browser back/forward)
  useEffect(() => {
    if (isOpen) handleClose();
  }, [window.location.pathname]);

  const resetState = () => {
    setStep(1); setDone(false); setIsCustom(false); setCustomAmount('');
    setAmount(50); setFreq('once'); setMethod('card'); setSubmitting(false);
    setBankRef(''); setMobileRef(''); setMobileWaiting(false);
    setDonorData({ firstName: '', lastName: '', email: '', phone: '' });
  };

  const handleClose = () => {
    close();
    setTimeout(resetState, 300);
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 1) { toast.error('Minimum donation is $1'); return; }
    setSubmitting(true);
    const ref = `BT-${Date.now().toString(36).toUpperCase()}`;
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({
            amount: finalAmount,
            currency: 'USD',
            paymentMethod: 'bank_transfer',
            donorName: `${donorData.firstName} ${donorData.lastName}`.trim(),
            donorEmail: donorData.email,
            transactionId: ref,
            message: `Bank transfer – reference: ${ref}`,
            status: 'pending',
          }),
        },
      );
    } catch {
      // Record failure is non-blocking — we still show the donor their reference
    }
    setBankRef(ref);
    setSubmitting(false);
    setDone(true);
    toast.success(
      `Transfer registered! Use reference ${ref} when making your bank transfer.`,
      { duration: 9000 },
    );
  };

  // PayPal Client ID — handled via env utility

  const handleMobileMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 1) { toast.error('Minimum donation is $1'); return; }
    if (!donorData.phone) { toast.error('Please enter your phone number'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/mobile-payment/initiate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({
            provider: method,
            phone: donorData.phone,
            amount: finalAmount,
            currency: 'USD',
            donorName: `${donorData.firstName} ${donorData.lastName}`.trim(),
            donorEmail: donorData.email,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Payment initiation failed. Please try again.');
        setSubmitting(false);
        return;
      }
      setMobileRef(data.referenceId);
      setSubmitting(false);
      setMobileWaiting(true);
      toast.success('PIN prompt sent to your phone! Enter your PIN to complete the payment.', { duration: 8000 });

      // Poll for status every 4 seconds, up to 2 minutes
      let attempts = 0;
      const maxAttempts = 30;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const sr = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/mobile-payment/status/${data.referenceId}?provider=${method}`,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } },
          );
          
          if (!sr.ok) return; // Keep polling if transient network error
          
          const contentType = sr.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) return;

          const sd = await sr.json();
          if (sd.status === 'SUCCESSFUL') {
            clearInterval(poll);
            setMobileWaiting(false);
            setDone(true);
            toast.success('Payment confirmed! Thank you for your donation.', { duration: 7000 });
          } else if (sd.status === 'FAILED') {
            clearInterval(poll);
            setMobileWaiting(false);
            toast.error('Payment was declined or cancelled. Please try again.', { duration: 7000 });
          } else if (attempts >= maxAttempts) {
            clearInterval(poll);
            setMobileWaiting(false);
            toast.error('Payment confirmation timed out. If you completed the payment, contact us with your reference.', { duration: 10000 });
          }
        } catch {
          // ignore poll errors, keep trying
        }
      }, 4000);
    } catch {
      toast.error('Could not reach payment server. Please try again.');
      setSubmitting(false);
    }
  };

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-xs font-normal outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-gray-400 bg-white';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  if (!isOpen) return null;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto overflow-x-hidden p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Donation dialog"
    >
      <style>{`
        @keyframes modalEnter {
          0%   { opacity: 0; transform: translateY(40px) scale(0.95); }
          60%  { opacity: 1; transform: translateY(-6px) scale(1.01); }
          80%  { transform: translateY(3px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .elegant-modal {
          animation: modalEnter 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          background: #ffffff;
        }
      `}</style>

      {/* Backdrop — Modern glassmorphism blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500 cursor-pointer"
        onClick={handleClose}
      />



      {/* Dialog panel — Strict 9:16 portrait ratio (450x800) */}
      <div
        className="elegant-modal relative rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
        style={{
          width: 'min(95vw, calc(95vh * 9 / 16), 520px)',
          aspectRatio: '9 / 16',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 400,
          fontSize: '10px',
        }}
      >



        {/* ── HEADER ───────────────────────────────────────────── */}
        <div
          className="shrink-0 px-6 pt-8 pb-7 flex flex-col items-center relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #059669 0%, #065f46 100%)' }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute left-4 top-4 z-10 bg-white/20 hover:bg-white hover:text-emerald-700 text-white rounded-full p-2 transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Heart size={20} fill="white" className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">RESTI</h2>
              <span className="text-xs text-white/75 tracking-wide">Kiryandongo District, Uganda</span>
            </div>
          </div>

          {/* Step progress dots */}
          {!done && (
            <div className="flex gap-2 mt-5">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-white' : step > i ? 'w-3 bg-emerald-300' : 'w-3 bg-white/25'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── SUCCESS SCREEN ───────────────────────────────────── */}
          {done && method !== 'bank' && method !== 'mtn' && method !== 'airtel' && (
            <div className="flex flex-col items-center py-10 px-8 text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={36} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Thank You{donorData.firstName ? `, ${donorData.firstName}` : ''}!
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your <strong className="text-emerald-700">{formatUSD(finalAmount)}</strong>{' '}
                  {freq === 'once' ? 'one-time' : freq} gift is making a real difference.
                  {donorData.email && <span className="block mt-1">Receipt sent to <strong>{donorData.email}</strong>.</span>}
                </p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">90% of your gift goes directly to community programs in Kiryandongo District, Uganda.</p>
              <button
                onClick={handleClose}
                className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl text-sm transition-all"
              >
                Close
              </button>
            </div>
          )}

          {done && method === 'bank' && (
            <div className="flex flex-col items-center py-8 px-7 text-center gap-5">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 size={32} className="text-blue-600" />
              </div>

              {/* Heading */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">
                  Transfer Registered{donorData.firstName ? `, ${donorData.firstName}` : ''}!
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your intent to donate <strong className="text-emerald-700">{formatUSD(finalAmount)}</strong> has been recorded.
                  Please complete the transfer using the details below.
                </p>
              </div>

              {/* Reference box */}
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 space-y-2">
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Your Transfer Reference</p>
                <div className="flex items-center justify-between gap-3 bg-white border border-amber-200 rounded-lg px-3 py-2.5">
                  <span className="font-mono text-sm font-bold text-gray-900 tracking-wide">{bankRef}</span>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(bankRef); toast.success('Reference copied'); }}
                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  Include this reference in the <strong>payment description</strong> so we can match your transfer.
                </p>
              </div>

              {/* Bank details mini-card */}
              <div className="w-full bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Transfer To</span>
                  <Building2 size={12} className="text-gray-400" />
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { label: 'Bank', value: config.bankName },
                    { label: 'Account Name', value: config.accountName },
                    { label: 'Account No.', value: config.accountNumber },
                    { label: 'Swift', value: config.swiftCode },
                    { label: 'Amount', value: formatUSD(finalAmount) },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between px-4 py-2">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{r.label}</span>
                      <span className="font-mono text-xs text-gray-800 font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {donorData.email && (
                <p className="text-[10px] text-gray-400">
                  Confirmation details sent to <strong>{donorData.email}</strong>
                </p>
              )}

              <button
                onClick={handleClose}
                className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          )}

          {/* ── MOBILE MONEY DONE SCREEN ─────────────────────────── */}
          {done && (method === 'mtn' || method === 'airtel') && (
            <div className="flex flex-col items-center py-8 px-7 text-center gap-5">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: method === 'mtn' ? '#fff3cd' : '#fde8e8' }}
              >
                <Phone size={30} style={{ color: method === 'mtn' ? '#b8860b' : '#c00000' }} />
              </div>

              {/* Heading */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">
                  {method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'} Registered{donorData.firstName ? `, ${donorData.firstName}` : ''}!
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your intent to donate <strong className="text-emerald-700">{formatUSD(finalAmount)}</strong> has been recorded.
                  Please complete the transfer using your phone.
                </p>
              </div>

              {/* Reference box */}
              <div
                className="w-full rounded-xl px-4 py-4 space-y-2 border"
                style={method === 'mtn' ? { backgroundColor: '#fffbeb', borderColor: '#fbbf24' } : { backgroundColor: '#fff5f5', borderColor: '#fca5a5' }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: method === 'mtn' ? '#92400e' : '#991b1b' }}
                >
                  Your Payment Reference
                </p>
                <div className="flex items-center justify-between gap-3 bg-white border rounded-lg px-3 py-2.5" style={{ borderColor: method === 'mtn' ? '#fbbf24' : '#fca5a5' }}>
                  <span className="font-mono text-sm font-bold text-gray-900 tracking-wide">{mobileRef}</span>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(mobileRef); toast.success('Reference copied'); }}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: method === 'mtn' ? '#fef3c7' : '#fee2e2' }}
                  >
                    <Copy size={13} style={{ color: method === 'mtn' ? '#92400e' : '#991b1b' }} />
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: method === 'mtn' ? '#92400e' : '#991b1b' }}>
                  Send your SMS screenshot to <strong>donate@resticbo.org</strong> with this reference.
                </p>
              </div>

              {/* Merchant code mini-card */}
              <div className="w-full bg-gray-900 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 border-b border-gray-700 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Send Payment To</span>
                  <Phone size={12} className="text-gray-400" />
                </div>
                <div className="divide-y divide-gray-800">
                  {[
                    { label: 'Merchant No.', value: method === 'mtn' ? config.merchantMTN : config.merchantAirtel },
                    { label: 'Amount (USD)', value: formatUSD(finalAmount) },
                    { label: 'Reference', value: mobileRef },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{r.label}</span>
                      <span className="font-mono text-xs text-white font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {donorData.email && (
                <p className="text-[10px] text-gray-400">
                  Confirmation details sent to <strong>{donorData.email}</strong>
                </p>
              )}

              <button
                onClick={handleClose}
                className="w-full text-white font-semibold py-3 rounded-xl text-xs transition-all shadow-md"
                style={{ backgroundColor: method === 'mtn' ? '#FFCC00' : '#e40000', color: method === 'mtn' ? '#1a1a1a' : 'white' }}
              >
                Close
              </button>
            </div>
          )}

          {/* ── STEP 1: Amount & Frequency ───────────────────────── */}
          {!done && step === 1 && (
            <div className="px-6 py-6 space-y-6">
              {/* Frequency toggle */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-full">
                {(['once', 'monthly'] as FreqOption[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFreq(f)}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-all duration-200 rounded-full ${freq === f ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {f === 'once' ? 'One-time' : 'Monthly'}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Select Amount</p>

                {/* Amount presets (2 columns) */}
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_AMOUNTS.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setAmount(v); setIsCustom(false); setCustomAmount(''); }}
                      className={`py-2.5 rounded-xl border-2 transition-all duration-200 ${!isCustom && amount === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-white text-gray-700 hover:border-emerald-200'}`}
                    >
                      <span className="text-sm font-bold">{formatUSD(v)}</span>
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className={`flex items-center rounded-xl border-2 transition-all duration-200 ${isCustom ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                  <span className={`shrink-0 pl-4 pr-2 py-2.5 text-sm font-bold select-none ${isCustom ? 'text-emerald-600' : 'text-gray-400'}`}>$</span>
                  <input
                    type="text"
                    placeholder="Other amount"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value.replace(/\D/g, '')); setIsCustom(true); }}
                    className={`flex-1 px-2 py-2.5 text-sm font-semibold outline-none bg-transparent ${isCustom ? 'text-emerald-800 placeholder:text-emerald-300' : 'text-gray-700 placeholder:text-gray-400'}`}
                  />
                </div>
              </div>

              {/* Impact hint */}
              {impactHint && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <Heart size={13} fill="currentColor" className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-700 leading-relaxed">{impactHint}</p>
                </div>
              )}

              {/* Continue button */}
              <button
                type="button"
                onClick={() => { if (finalAmount >= 1) setStep(2); else toast.error('Minimum donation is $1'); }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
              >
                Continue to Payment <ChevronRight size={15} />
              </button>

              <div className="flex flex-col items-center gap-2 pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Accepted payment methods</p>
                <div className="flex items-end gap-3 flex-wrap justify-center">
                  {/* Card */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#3b82f6' }}>
                      <CreditCard size={16} className="text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">Card</span>
                  </div>
                  {/* PayPal */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#003087' }}>
                      <span className="text-[10px] font-black italic text-white leading-none">PP</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">PayPal</span>
                  </div>
                  {/* MTN */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#ffcc00' }}>
                      <span className="text-[10px] font-black text-black leading-none tracking-tight">MTN</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">MTN</span>
                  </div>
                  {/* Airtel */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#e40000' }}>
                      <span className="text-[10px] font-black text-white leading-none tracking-tight">AIR</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">Airtel</span>
                  </div>
                  {/* Bank */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#4b5563' }}>
                      <Building2 size={16} className="text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">Bank</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                  <Lock size={8} /> Secure &amp; Encrypted
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Payment Method ───────────────────────────── */}
          {!done && step === 2 && (
            <div className="px-6 py-7 space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-semibold text-gray-900">Choose Payment Method</h3>
                <p className="text-xs text-gray-400">Select how you'd like to donate</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {([
                  {
                    id: 'card' as PayMethod,
                    circle: <CreditCard size={16} className="text-white" />,
                    bg: '#3b82f6',
                    label: 'Debit / Credit Card',
                    span: false,
                  },
                  {
                    id: 'paypal' as PayMethod,
                    circle: (
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[9px] font-black italic text-white">Pay</span>
                        <span className="text-[9px] font-black italic" style={{ color: '#7ec8e3' }}>Pal</span>
                      </div>
                    ),
                    bg: '#003087',
                    label: 'PayPal',
                    span: false,
                  },
                  {
                    id: 'mtn' as PayMethod,
                    circle: <span className="text-[10px] font-black text-black leading-none tracking-tight">MTN</span>,
                    bg: '#ffcc00',
                    label: 'MTN Mobile Money',
                    span: false,
                  },
                  {
                    id: 'airtel' as PayMethod,
                    circle: <span className="text-[18px] font-black text-white leading-none">A</span>,
                    bg: '#e40000',
                    label: 'Airtel Money',
                    span: false,
                  },
                  {
                    id: 'bank' as PayMethod,
                    circle: <Building2 size={16} className="text-white" />,
                    bg: '#4b5563',
                    label: 'Bank Transfer',
                    span: true,
                  },
                ]).map(({ id, circle, bg, label, span }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    className={`relative py-4 px-3 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      span ? 'col-span-2 flex-row justify-center gap-4 py-3' : ''
                    } ${
                      method === id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 overflow-hidden"
                      style={{ backgroundColor: bg }}
                    >
                      {circle}
                    </div>
                    <span className={`text-xs font-semibold text-center leading-tight ${method === id ? 'text-emerald-700' : 'text-gray-700'}`}>{label}</span>
                    {method === id && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Continue button */}
              <button
                type="button"
                onClick={() => {
                  if (!method) { toast.error('Please select a payment method'); return; }
                  setStep(3);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* ── STEP 3: Payment Details ──────────────────────────── */}
          {!done && step === 3 && (
            <div>

              {/* ── CARD ────────────────────────────────────────── */}
              {method === 'card' && (
                stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <StripeCardForm
                      donorData={donorData}
                      setDonorData={setDonorData}
                      finalAmount={finalAmount}
                      freq={freq}
                      setDone={setDone}
                      submitting={submitting}
                      setSubmitting={setSubmitting}
                      inp={inp}
                      lbl={lbl}
                    />
                  </Elements>
                ) : (
                  /* Full card form layout — Stripe key not yet configured */
                  <div>
                    {/* Branded header */}
                    <div
                      className="px-6 py-5 flex items-center justify-between"
                      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
                    >
                      <div>
                        <p className="text-white font-bold text-sm">Secure Card Payment</p>
                        <p className="text-gray-400 text-xs mt-0.5">End-to-end encrypted · Powered by Stripe</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md px-2 py-1 text-[10px] font-black italic tracking-tight text-white min-w-[32px] text-center" style={{ background: '#1434CB' }}>VISA</span>
                        <span className="rounded-md px-2 py-1 text-[10px] font-black text-white min-w-[32px] text-center" style={{ background: '#EB001B' }}>MC</span>
                        <span className="rounded-md px-2 py-1 text-[10px] font-black text-white min-w-[36px] text-center" style={{ background: '#007BC1' }}>AMEX</span>
                      </div>
                    </div>

                    {/* Amount summary */}
                    <div className="mx-6 mt-5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Donation Amount</p>
                        <p className="text-lg font-bold text-emerald-700">{formatUSD(finalAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Frequency</p>
                        <p className="text-xs font-semibold text-gray-700">{freq === 'once' ? 'One-time' : 'Monthly'}</p>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="px-6 pt-4 pb-6 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className={lbl}>First Name</label>
                          <input className={inp} placeholder="John"
                            value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className={lbl}>Last Name</label>
                          <input className={inp} placeholder="Smith"
                            value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className={lbl}>Email Address</label>
                        <input type="email" className={inp} placeholder="you@example.com"
                          value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} />
                      </div>

                      {/* Card field placeholder */}
                      <div className="space-y-1.5">
                        <label className={lbl}>Card Number · Expiry · CVC</label>
                        <div className="w-full border border-amber-200 rounded-xl px-4 py-3 bg-amber-50">
                          <p className="text-xs text-amber-700 font-medium">
                            Add <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code> to your <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env</code> file to enable card input.
                          </p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Lock size={12} className="text-emerald-600 shrink-0" />
                        <p className="text-xs text-emerald-700 leading-tight">
                          256-bit SSL encrypted · Powered by Stripe · Your card data is handled securely and never stored on our servers.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled
                        className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm shadow-md shadow-emerald-100 flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                      >
                        <Lock size={14} /> Donate {formatUSD(finalAmount)}
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* ── PAYPAL ──────────────────────────────────────── */}
              {method === 'paypal' && (
                <div className="px-6 py-8 space-y-6">
                  {/* Header card */}
                  <div className="rounded-xl overflow-hidden border border-gray-100 shadow-md">
                    <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#003087' }}>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-bold italic text-white">Pay</span>
                        <span className="text-lg font-bold italic" style={{ color: '#009CDE' }}>Pal</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#8BB8D8' }}>
                        <Lock size={11} /> Secure
                      </div>
                    </div>
                    <div className="px-6 py-5 bg-white space-y-4">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Complete your{' '}
                        <strong>{freq === 'once' ? 'one-time' : freq}</strong> contribution of{' '}
                        <strong className="text-blue-700">{formatUSD(finalAmount)}</strong> securely via PayPal.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Info size={13} />
                        <span>Pay with your PayPal balance or any card. Success appears only after payment is confirmed.</span>
                      </div>
                    </div>
                  </div>

                  {/* PayPal SDK Buttons — onApprove fires only after confirmed payment */}
                  {PAYPAL_CLIENT_ID ? (
                    <PayPalScriptProvider
                      options={{
                        clientId: PAYPAL_CLIENT_ID,
                        currency: 'USD',
                        intent: 'capture',
                      }}
                    >
                      <div className="rounded-xl overflow-hidden border border-[#ffc439] shadow-sm">
                        <PayPalButtons
                          style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'donate', height: 48 }}
                          forceReRender={[finalAmount]}
                          createOrder={(_data, actions) => {
                            const merchantEmail = PAYPAL_MERCHANT_EMAIL;
                            const purchaseUnit: any = {
                              amount: { value: finalAmount.toFixed(2), currency_code: 'USD' },
                              description: `Resti Kiryandongo CBO – ${freq === 'once' ? 'One-time' : 'Monthly'} donation`,
                            };
                            
                            // Only add payee if merchant email is configured to avoid API errors
                            if (merchantEmail) {
                              purchaseUnit.payee = { email_address: merchantEmail };
                            }

                            return actions.order.create({
                              intent: 'CAPTURE',
                              purchase_units: [purchaseUnit],
                            });
                          }}
                          onApprove={async (_data, actions) => {
                            if (actions.order) {
                              await actions.order.capture();
                              toast.success('Payment confirmed! Thank you for your generosity.');
                              setDone(true);
                            }
                          }}
                          onError={() => toast.error('PayPal payment failed. Please try again.')}
                          onCancel={() => toast.info('Payment cancelled.')}
                        />
                      </div>
                    </PayPalScriptProvider>
                  ) : (
                    /* Fallback styled button — shown until VITE_PAYPAL_CLIENT_ID is configured */
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          toast.info('Redirecting to PayPal…', { duration: 2000 });
                          setTimeout(() => window.open('https://www.paypal.com/donate', '_blank'), 1000);
                        }}
                        className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98]"
                        style={{ backgroundColor: '#FFC439' }}
                      >
                        <span className="text-xl font-black italic" style={{ color: '#003087' }}>Pay</span>
                        <span className="text-xl font-black italic" style={{ color: '#009CDE' }}>Pal</span>
                        <span className="text-sm font-semibold ml-1" style={{ color: '#003087' }}>
                          — Donate {formatUSD(finalAmount)}
                        </span>
                      </button>
                      <p className="text-[10px] text-amber-600 text-center font-medium bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                        Set <code className="font-mono">VITE_PAYPAL_CLIENT_ID</code> in .env to enable direct payment confirmation. See PAYPAL_SETUP.md.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── MTN / AIRTEL ────────────────────────────────── */}
              {(method === 'mtn' || method === 'airtel') && (
                <>
                  {/* ── WAITING FOR PIN SCREEN ── */}
                  {mobileWaiting && (
                    <div className="flex flex-col items-center py-10 px-8 text-center gap-5">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: method === 'mtn' ? '#FFCC00' : '#e40000' }}
                      >
                        <Phone size={36} style={{ color: method === 'mtn' ? '#1a1a1a' : 'white' }} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-gray-900">Check Your Phone!</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          A PIN prompt has been sent to <strong>{donorData.phone}</strong> via{' '}
                          <strong style={{ color: method === 'mtn' ? '#b8860b' : '#c00000' }}>
                            {method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}
                          </strong>.
                          Enter your PIN on your phone to confirm the payment of{' '}
                          <strong className="text-emerald-700">{formatUSD(finalAmount)}</strong>.
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="animate-spin w-8 h-8 border-[3px] rounded-full" style={{ borderColor: method === 'mtn' ? '#FFCC00' : '#e40000', borderTopColor: 'transparent' }} />
                        <p className="text-[10px] text-gray-400">Waiting for confirmation…</p>
                        <button
                          onClick={() => { setMobileWaiting(false); setStep(3); }}
                          className="mt-4 text-xs font-semibold text-gray-500 hover:text-gray-800 underline transition-colors"
                        >
                          Cancel & Go Back
                        </button>
                      </div>
                      <div className="w-full rounded-xl border border-gray-100 px-4 py-3 bg-gray-50 text-left space-y-1">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Reference</p>
                        <p className="font-mono text-xs font-bold text-gray-700">{mobileRef}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Didn't receive a prompt? Make sure your {method === 'mtn' ? 'MTN' : 'Airtel'} wallet has sufficient balance and try again.
                      </p>
                    </div>
                  )}

                  {/* ── PAYMENT FORM ── */}
                  {!mobileWaiting && (
                    <form onSubmit={handleMobileMoneySubmit}>

                      {/* Branded Header */}
                      <div
                        className="px-6 py-5 flex items-center justify-between"
                        style={{
                          background: method === 'mtn'
                            ? 'linear-gradient(135deg, #FFCC00 0%, #F5A500 100%)'
                            : 'linear-gradient(135deg, #e40000 0%, #a00000 100%)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: method === 'mtn' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)' }}
                          >
                            {method === 'mtn'
                              ? <span className="text-[11px] font-black text-black leading-none tracking-tight">MTN</span>
                              : <span className="text-[18px] font-black text-white leading-none">A</span>}
                          </div>
                          <div>
                            <p className="text-[11px] font-black tracking-wide" style={{ color: method === 'mtn' ? '#1a1a1a' : 'white' }}>
                              {method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}
                            </p>
                            <p className="text-[9px] font-medium" style={{ color: method === 'mtn' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)' }}>
                              Automatic push payment — no dialling required
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-semibold" style={{ color: method === 'mtn' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }}>
                          <Lock size={10} /> Secure
                        </div>
                      </div>

                      {/* Body */}
                      <div className="px-6 pt-8 pb-6 space-y-5">

                        {/* How it works note */}
                        <div
                          className="rounded-xl px-4 py-3 flex items-start gap-3 border"
                          style={method === 'mtn' ? { backgroundColor: '#fffbeb', borderColor: '#fde68a' } : { backgroundColor: '#fff5f5', borderColor: '#fecaca' }}
                        >
                          <Info size={14} className="shrink-0 mt-0.5" style={{ color: method === 'mtn' ? '#b45309' : '#b91c1c' }} />
                          <p className="text-[10px] leading-relaxed" style={{ color: method === 'mtn' ? '#92400e' : '#991b1b' }}>
                            Enter your details below and tap <strong>Pay Now</strong>. We will instantly send a PIN prompt
                            to your {method === 'mtn' ? 'MTN' : 'Airtel'} phone. Just enter your mobile money PIN to complete the donation — no dialling required.
                          </p>
                        </div>

                        {/* Amount card */}
                        <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#f0fdf4' }}>
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Donation Amount</p>
                            <p className="font-mono font-bold text-lg text-emerald-700">{formatUSD(finalAmount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Frequency</p>
                            <p className="text-xs font-semibold text-gray-700 capitalize">{freq === 'once' ? 'One-time' : 'Monthly'}</p>
                          </div>
                        </div>

                        {/* Donor info */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={lbl}>First Name</label>
                              <input
                                className={inp}
                                placeholder="First name"
                                value={donorData.firstName}
                                onChange={e => setDonorData(d => ({ ...d, firstName: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <label className={lbl}>Last Name</label>
                              <input
                                className={inp}
                                placeholder="Last name"
                                value={donorData.lastName}
                                onChange={e => setDonorData(d => ({ ...d, lastName: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={lbl}>Email Address (for receipt)</label>
                            <input
                              type="email"
                              className={inp}
                              placeholder="you@example.com"
                              value={donorData.email}
                              onChange={e => setDonorData(d => ({ ...d, email: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className={lbl}>
                              Your {method === 'mtn' ? 'MTN' : 'Airtel'} Phone Number *
                            </label>
                            <input
                              type="tel"
                              className={inp}
                              placeholder={method === 'mtn' ? '256771234567' : '256751234567'}
                              value={donorData.phone}
                              onChange={e => {
                                let val = e.target.value.replace(/\D/g, '');
                                // Auto-prefix 256 if user starts with 07 or 7
                                if ((val.startsWith('07') && val.length > 2) || (val.startsWith('7') && !val.startsWith('256'))) {
                                   if (val.startsWith('0')) val = '256' + val.substring(1);
                                   else val = '256' + val;
                                }
                                setDonorData(d => ({ ...d, phone: val }));
                              }}
                              required
                            />
                            <p className="mt-1 text-[9px] text-gray-400">
                              Enter in international format, e.g. 256771234567 (no + prefix)
                            </p>
                          </div>
                        </div>

                        {/* Pay button */}
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                          style={{
                            backgroundColor: method === 'mtn' ? '#FFCC00' : '#e40000',
                            color: method === 'mtn' ? '#1a1a1a' : 'white',
                            padding: '14px 0',
                            fontSize: '13px',
                          }}
                        >
                          {submitting
                            ? <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            : <><Phone size={15} /> Pay Now — {formatUSD(finalAmount)}</>}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* ── BANK TRANSFER ───────────────────────────────── */}
              {method === 'bank' && (
                <form onSubmit={handleBankSubmit}>

                  {/* ── Header ── */}
                  <div
                    className="px-6 py-6 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 100%)' }}
                  >
                    <div>
                      <p className="text-white font-bold text-[13px] leading-tight">Bank Transfer</p>
                      <p className="text-blue-200/70 text-[10px] mt-0.5">Secure direct bank deposit</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/20 shrink-0">
                      <Building2 size={15} className="text-white/90" />
                    </div>
                  </div>

                  {/* ── Body ── */}
                  <div className="px-6 pt-10 pb-7 space-y-6">

                    {/* Amount summary */}
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4">
                      <div>
                        <p className="text-[9px] font-semibold text-emerald-600/70 uppercase tracking-wider mb-1 leading-none">Donation Amount</p>
                        <p className="text-base font-bold text-emerald-700 leading-none">{formatUSD(finalAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 leading-none">Frequency</p>
                        <span className="inline-block bg-white border border-emerald-200 text-emerald-700 font-semibold text-[9px] px-2 py-0.5 rounded-full">
                          {freq === 'once' ? 'One-time' : 'Monthly'}
                        </span>
                      </div>
                    </div>

                    {/* ── Donor info ── */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100">Your Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className={lbl}>First Name</label>
                          <input required className={inp} placeholder="John"
                            value={donorData.firstName} onChange={e => setDonorData(p => ({ ...p, firstName: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className={lbl}>Last Name</label>
                          <input required className={inp} placeholder="Smith"
                            value={donorData.lastName} onChange={e => setDonorData(p => ({ ...p, lastName: e.target.value }))} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={lbl}>Email Address</label>
                        <input required type="email" className={inp} placeholder="you@example.com"
                          value={donorData.email} onChange={e => setDonorData(p => ({ ...p, email: e.target.value }))} />
                      </div>
                    </div>

                    {/* ── Bank details ── */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100">Transfer To</p>
                      <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                        {[
                          { label: 'Bank', value: config.bankName },
                          { label: 'Account Name', value: config.accountName },
                          { label: 'Account No.', value: config.accountNumber },
                          { label: 'Swift / BIC', value: config.swiftCode },
                        ].map((r, i) => (
                          <div
                            key={r.label}
                            className={`flex items-center justify-between px-5 py-4 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{r.label}</p>
                              <p className="font-mono text-[12px] text-gray-800 font-semibold leading-snug truncate">{r.value}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(r.value); toast.success(`${r.label} copied`); }}
                              className="ml-4 p-2 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-all shrink-0"
                              title={`Copy ${r.label}`}
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Reference note ── */}
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
                      <Info size={12} className="text-amber-500 shrink-0 mt-px" />
                      <p className="text-[10px] text-amber-800 leading-relaxed">
                        After clicking <strong className="font-semibold">Confirm</strong>, you will receive a unique reference number. Include it in your transfer description so we can match your payment.
                      </p>
                    </div>

                    {/* ── Submit ── */}
                    <button
                      type="submit"
                      disabled={submitting || finalAmount < 1}
                      className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 rounded-xl text-[13px] tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                    >
                      {submitting
                        ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Processing…</>
                        : <><CheckCircle size={15} /> Confirm &amp; Get Reference Number</>
                      }
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        {!done && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
            {finalAmount > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5 shrink-0">
                <Heart size={11} fill="#059669" className="text-emerald-600" />
                <span className="text-sm font-semibold text-gray-800">{formatUSD(finalAmount)}</span>
              </div>
            )}
            <div className="flex gap-5 items-center ml-auto">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => (s - 1) as ModalStep)}
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
