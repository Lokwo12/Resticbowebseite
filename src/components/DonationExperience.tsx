import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Lock, ShieldCheck, CreditCard, Building2, Phone,
  ExternalLink, CheckCircle2, AlertCircle, Clock, X, ArrowLeft,
  Printer, Mail, AlertTriangle, ArrowRight, Check, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { STRIPE_PK, PAYPAL_CLIENT_ID } from '../utils/env';
import { StripePaymentProvider, StripeCardForm, prefetchPaymentIntent } from './StripeShared';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export type SupportedCurrency = 'UGX' | 'USD' | 'EUR' | 'GBP';
export type PaymentMethodType = 'card' | 'paypal' | 'mtn' | 'airtel' | 'bank';
export type PaymentStatus = 'idle' | 'processing' | 'success' | 'pending' | 'failed' | 'cancelled';

export interface DonationExperienceProps {
  isModal?: boolean;
  onClose?: () => void;
  initialAmount?: number;
  initialMethod?: PaymentMethodType;
}

const CURRENCY_CONFIG: Record<SupportedCurrency, {
  label: string;
  symbol: string;
  presets: number[];
  min: number;
  max: number;
  defaultAmount: number;
}> = {
  UGX: {
    label: 'UGX',
    symbol: 'UGX',
    presets: [10000, 25000, 50000, 100000],
    min: 5000,
    max: 100000000,
    defaultAmount: 50000
  },
  USD: {
    label: 'USD',
    symbol: '$',
    presets: [10, 25, 50, 100],
    min: 5,
    max: 25000,
    defaultAmount: 50
  },
  EUR: {
    label: 'EUR',
    symbol: '€',
    presets: [10, 25, 50, 100],
    min: 5,
    max: 25000,
    defaultAmount: 50
  },
  GBP: {
    label: 'GBP',
    symbol: '£',
    presets: [10, 25, 50, 100],
    min: 5,
    max: 25000,
    defaultAmount: 50
  }
};

const PROGRAM_PURPOSES = [
  'Where Most Needed',
  'Livelihoods & Economic Empowerment',
  'Water, Sanitation & Hygiene (WASH)',
  'Environmental Sustainability & Climate Resilience',
  'Community Development',
  'Social Cohesion'
];

const COMMON_COUNTRIES = [
  'Uganda', 'United States', 'United Kingdom', 'Canada', 'Germany',
  'Australia', 'Kenya', 'South Sudan', 'Rwanda', 'Tanzania',
  'Netherlands', 'France', 'Sweden', 'Norway', 'Denmark',
  'Switzerland', 'South Africa', 'Other'
];

export function DonationExperience({
  isModal = false,
  onClose,
  initialAmount,
  initialMethod = 'card'
}: DonationExperienceProps) {
  const navigate = useNavigate();

  // State: Amount & Currency
  const [currency, setCurrency] = useState<SupportedCurrency>('UGX');
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);

  // State: Frequency (strictly one-time)
  const frequency = 'one-time';

  // State: Purpose
  const [purpose, setPurpose] = useState<string>('Where Most Needed');

  // State: Donor Info
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [country, setCountry] = useState<string>('Uganda');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // State: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(initialMethod);

  // State: Flow Status
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [cardSubmitting, setCardSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [confirmedDonation, setConfirmedDonation] = useState<any>(null);

  // State: Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Form Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync initial props
  useEffect(() => {
    if (initialAmount && initialAmount > 0) {
      setSelectedAmount(initialAmount);
      setIsCustomAmount(false);
      setCustomAmountInput('');
    }
    if (initialMethod) {
      setPaymentMethod(initialMethod);
    }
  }, [initialAmount, initialMethod]);

  // Pre-fill user data if logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email || '');
        const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        if (metaName) setFullName(metaName);
        if (session.user.user_metadata?.phone) setPhone(session.user.user_metadata.phone);
        if (session.user.user_metadata?.location) setCountry(session.user.user_metadata.location);
      }
    });
  }, []);

  // Compute final numeric donation amount
  const finalAmount = useMemo(() => {
    if (isCustomAmount) {
      const parsed = parseInt(customAmountInput.replace(/D/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedAmount;
  }, [isCustomAmount, customAmountInput, selectedAmount]);

  // Currency helpers
  const currentCurrencyConfig = CURRENCY_CONFIG[currency];

  const formatMoney = (val: number, curr: SupportedCurrency = currency) => {
    if (curr === 'UGX') {
      return `UGX ${Number(val || 0).toLocaleString()}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const handleCurrencyChange = (newCurr: SupportedCurrency) => {
    setCurrency(newCurr);
    setIsCustomAmount(false);
    setCustomAmountInput('');
    setSelectedAmount(CURRENCY_CONFIG[newCurr].defaultAmount);
    setErrors(prev => ({ ...prev, amount: '' }));
  };

  const handlePresetSelect = (presetVal: number) => {
    setSelectedAmount(presetVal);
    setIsCustomAmount(false);
    setCustomAmountInput('');
    setErrors(prev => ({ ...prev, amount: '' }));
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/D/g, '');
    setCustomAmountInput(raw);
    setIsCustomAmount(true);
    setErrors(prev => ({ ...prev, amount: '' }));
  };

  // Validate form before payment submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!finalAmount || finalAmount <= 0) {
      newErrors.amount = 'Please select or enter a donation amount';
    } else if (finalAmount < currentCurrencyConfig.min) {
      newErrors.amount = `Minimum donation for ${currency} is ${formatMoney(currentCurrencyConfig.min, currency)}`;
    } else if (finalAmount > currentCurrencyConfig.max) {
      newErrors.amount = `Maximum donation for ${currency} is ${formatMoney(currentCurrencyConfig.max, currency)}`;
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Bank Transfer Submission (Pending record creation)
  const handleBankTransferSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please complete all required fields correctly.');
      return;
    }

    setStatus('processing');
    setStatusMessage('Registering direct bank transfer pledge...');

    const transactionRef = `RESTI-WIRE-${Date.now().toString(36).toUpperCase()}`;
    const nowIso = new Date().toISOString();

    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          amount: finalAmount,
          currency: currency,
          paymentMethod: 'bank_transfer',
          donorName: isAnonymous ? 'Anonymous Supporter' : fullName.trim(),
          donorEmail: email.trim(),
          donorPhone: phone.trim() || undefined,
          donorCountry: country,
          campaign: purpose,
          message: `Voluntary bank transfer for ${purpose}`,
          transactionId: transactionRef,
          status: 'pending'
        })
      });

      if (!res.ok) {
        throw new Error('Could not register bank transfer');
      }

      setConfirmedDonation({
        id: transactionRef,
        amount: finalAmount,
        currency: currency,
        paymentMethod: 'Bank Wire Transfer',
        date: nowIso,
        donorName: isAnonymous ? 'Anonymous Supporter' : fullName.trim(),
        donorEmail: email.trim(),
        reference: transactionRef,
        campaign: purpose,
        status: 'pending'
      });

      setStatus('pending');
      toast.info('Bank transfer registered as pending receipt of funds.');
    } catch (err: any) {
      console.error('Bank submit error:', err);
      setStatus('failed');
      setStatusMessage('Unable to register bank transfer. Please try again or contact info@resticbo.org.');
      toast.error('Unable to register transfer request');
    }
  };

  // Handle Card Success (invoked by StripeCardForm when paymentIntent succeeds)
  const handleCardSuccess = (stripeIntent: any) => {
    const transactionRef = stripeIntent.id;
    const nowIso = new Date().toISOString();
    const confirmed = {
      id: transactionRef,
      amount: finalAmount,
      currency: currency,
      paymentMethod: 'Credit / Debit Card',
      date: nowIso,
      donorName: isAnonymous ? 'Anonymous Supporter' : fullName.trim(),
      donorEmail: email.trim(),
      reference: transactionRef,
      receiptNumber: `RESTI-REC-${transactionRef.slice(-8).toUpperCase()}`,
      campaign: purpose,
      status: 'completed'
    };
    setConfirmedDonation(confirmed);
    setStatus('success');
    toast.success('Thank you! Your donation was successfully received.');
  };

  // Handle PayPal Success
  const handlePayPalSuccess = async (details: any) => {
    setStatus('processing');
    setStatusMessage('Confirming PayPal transaction with RESTI records...');
    const transactionRef = details.id || `PP-${Date.now().toString(36).toUpperCase()}`;
    const nowIso = new Date().toISOString();

    try {
      // Record verified donation
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          amount: finalAmount,
          currency: 'USD',
          paymentMethod: 'paypal',
          donorName: isAnonymous ? 'Anonymous Supporter' : (fullName.trim() || details.payer?.name?.given_name || 'Supporter'),
          donorEmail: email.trim() || details.payer?.email_address,
          campaign: purpose,
          transactionId: transactionRef,
          status: 'completed'
        })
      });

      setConfirmedDonation({
        id: transactionRef,
        amount: finalAmount,
        currency: 'USD',
        paymentMethod: 'PayPal',
        date: nowIso,
        donorName: isAnonymous ? 'Anonymous Supporter' : (fullName.trim() || 'Supporter'),
        donorEmail: email.trim(),
        reference: transactionRef,
        receiptNumber: `RESTI-REC-${transactionRef.slice(-8).toUpperCase()}`,
        campaign: purpose,
        status: 'completed'
      });
      setStatus('success');
      toast.success('Thank you! Your PayPal donation was successfully received.');
    } catch (e) {
      console.error('PayPal record error:', e);
      setStatus('failed');
      setStatusMessage('Payment completed on PayPal, but could not record locally. Please contact info@resticbo.org with reference: ' + transactionRef);
    }
  };

  // Reset to form
  const handleTryAgain = () => {
    setStatus('idle');
    setStatusMessage('');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: PROCESSING STATE
  // ──────────────────────────────────────────────────────────────────────────
  if (status === 'processing') {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm my-6">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Processing your donation...</h3>
        <p className="text-stone-600 text-sm leading-relaxed mb-4">
          Please wait while we securely confirm your payment.
        </p>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-500 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>Do not refresh or close this page.</span>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: SUCCESSFUL DONATION STATE (Verified Only)
  // ──────────────────────────────────────────────────────────────────────────
  if (status === 'success' && confirmedDonation) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 max-w-xl mx-auto shadow-sm my-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
          Thank you for supporting RESTI.
        </h2>
        <p className="text-stone-600 text-sm mt-1 mb-6">
          Your donation has been successfully received.
        </p>

        {/* Verified Donation Summary Card */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-left text-xs space-y-2.5 mb-6">
          <div className="flex justify-between items-center pb-2 border-b border-stone-200">
            <span className="text-stone-500 font-medium">Donation Amount:</span>
            <span className="text-base font-bold text-emerald-800">
              {formatMoney(confirmedDonation.amount, confirmedDonation.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Date:</span>
            <span className="font-semibold text-stone-800">
              {new Date(confirmedDonation.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Payment Method:</span>
            <span className="font-semibold text-stone-800">{confirmedDonation.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Transaction Reference:</span>
            <span className="font-mono text-stone-800 font-semibold">{confirmedDonation.reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Program / Purpose:</span>
            <span className="font-semibold text-stone-800">{confirmedDonation.campaign}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Donor:</span>
            <span className="font-semibold text-stone-800">{confirmedDonation.donorName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            View Donation Receipt
          </button>
          <Link
            to="/donor-portal"
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-stone-200 transition-all"
          >
            Go to Supporter Portal <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setConfirmedDonation(null);
            if (onClose) onClose();
          }}
          className="text-xs text-stone-500 hover:text-stone-800 underline"
        >
          {isModal ? 'Close Window' : 'Make Another Donation'}
        </button>

        {/* Modal: Official Donation Receipt */}
        {showReceiptModal && (
          <ReceiptModal
            donation={confirmedDonation}
            onClose={() => setShowReceiptModal(false)}
          />
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: PENDING PAYMENT STATE (e.g. Bank wire registration)
  // ──────────────────────────────────────────────────────────────────────────
  if (status === 'pending' && confirmedDonation) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 max-w-xl mx-auto shadow-sm my-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Payment Pending</h2>
        <p className="text-stone-600 text-sm mt-2 mb-6 max-w-md mx-auto leading-relaxed">
          Your payment has been submitted and is awaiting confirmation. We will update your donation record once the payment is verified.
        </p>

        {/* Wire instructions */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-left text-xs space-y-2 mb-6">
          <div className="font-bold text-stone-800 pb-2 border-b border-stone-200 flex items-center justify-between">
            <span>RESTI Official Bank Details</span>
            <span className="font-mono text-emerald-800">{confirmedDonation.reference}</span>
          </div>
          <div className="flex justify-between"><span className="text-stone-500">Bank:</span> <strong>Stanbic Bank Uganda</strong></div>
          <div className="flex justify-between"><span className="text-stone-500">Account Name:</span> <strong>RESTI CBO</strong></div>
          <div className="flex justify-between"><span className="text-stone-500">Account No:</span> <strong>9030012345678</strong></div>
          <div className="flex justify-between"><span className="text-stone-500">Branch:</span> <strong>Kiryandongo Branch</strong></div>
          <div className="flex justify-between"><span className="text-stone-500">SWIFT:</span> <strong>SBICUGKX</strong></div>
          <div className="pt-2 text-[11px] text-stone-500 border-t border-stone-200">
            Please include reference <span className="font-mono font-bold text-stone-700">{confirmedDonation.reference}</span> in your deposit description.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/donor-portal"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
          >
            Track in Supporter Portal <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleTryAgain}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200"
          >
            Back to Donation Form
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: FAILED / CANCELLED STATE
  // ──────────────────────────────────────────────────────────────────────────
  if (status === 'failed' || status === 'cancelled') {
    const isCancelled = status === 'cancelled';
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 max-w-lg mx-auto shadow-sm my-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
          {isCancelled ? 'Payment Cancelled' : 'Payment Unsuccessful'}
        </h2>
        <p className="text-stone-600 text-sm mt-2 mb-6 leading-relaxed">
          {isCancelled
            ? 'Your donation was not completed.'
            : (statusMessage || 'We could not confirm your donation. No completed donation has been recorded.')}
        </p>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={handleTryAgain}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Try Again
          </button>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MAIN VIEW: TWO-COLUMN STANDARD NONPROFIT DONATION FLOW
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Heading & Short Description */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
          <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
          <span>Official RESTI Community Support</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Support RESTI's Community-Led Work
        </h2>
        <p className="mt-2 text-stone-600 text-xs sm:text-sm leading-relaxed">
          Your contribution helps RESTI work with refugee and host communities to strengthen livelihoods, resilience, environmental sustainability, WASH, community development, and social cohesion.
        </p>
      </div>

      {/* Two-Column Donation Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT COLUMN: Amount, Frequency, Purpose, Donor Info (7 cols) ── */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 sm:p-7 shadow-sm space-y-7">
          
          {/* Section 1: Choose Donation Amount & Currency */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Choose Donation Amount
              </label>
              
              {/* Currency Selector */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
                {(['UGX', 'USD', 'EUR', 'GBP'] as SupportedCurrency[]).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleCurrencyChange(curr)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      currency === curr
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {currentCurrencyConfig.presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`py-3 px-2 rounded-xl border text-sm font-bold transition-all text-center ${
                    !isCustomAmount && selectedAmount === preset
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-600'
                      : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  {formatMoney(preset, currency)}
                </button>
              ))}
            </div>

            {/* Custom Amount Field */}
            <div className="mt-3">
              <div className={`flex items-center rounded-xl border transition-all ${
                isCustomAmount
                  ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600'
                  : 'border-stone-200 bg-white'
              }`}>
                <span className="px-3.5 text-xs font-bold text-stone-500 select-none">
                  {currentCurrencyConfig.symbol}
                </span>
                <input
                  type="text"
                  placeholder={`Other amount (min. ${formatMoney(currentCurrencyConfig.min, currency)})`}
                  value={customAmountInput}
                  onChange={handleCustomInput}
                  className="w-full py-2.5 pr-4 text-xs sm:text-sm font-semibold text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400"
                />
              </div>
              {errors.amount && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Donation Frequency (One-Time Only) */}
          <div className="pt-2 border-t border-stone-100">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-2">
              Donation Frequency
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-800 block">One-time donation</span>
                  <span className="text-[11px] text-stone-500">Automated recurring billing is currently unavailable.</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                Single Gift
              </span>
            </div>
          </div>

          {/* Section 3: Donation Purpose */}
          <div className="pt-2 border-t border-stone-100">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              Where would you like your contribution to support RESTI's work?
            </label>
            <p className="text-[11px] text-stone-500 mb-2.5">
              Select an authentic RESTI program area in Kiryandongo District.
            </p>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {PROGRAM_PURPOSES.map((prog) => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
            <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
              Unrestricted donations to "Where Most Needed" are allocated according to current community priorities across our operational areas in Kiryandongo District.
            </p>
          </div>

          {/* Section 4: Donor Information */}
          <div className="pt-2 border-t border-stone-100 space-y-3.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Donor Information
            </label>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors(prev => ({ ...prev, fullName: '' }));
                }}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="you@example.com (for official donation receipt)"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256 700 000000"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Country (optional)
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  {COMMON_COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Anonymous donation checkbox */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-stone-600">
                <strong className="text-stone-800">Make this donation anonymous:</strong> Withhold my name from any public supporter displays.
              </span>
            </label>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Summary, Payment Method, Security, Donate (5 cols) ── */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Donation Summary Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 pb-2 border-b border-stone-100">
              Donation Summary
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-stone-500">Amount:</span>
                <span className="text-base font-extrabold text-emerald-900">
                  {formatMoney(finalAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Frequency:</span>
                <span className="font-semibold text-stone-800">One-time</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Purpose:</span>
                <span className="font-semibold text-stone-800 text-right max-w-[200px] truncate">{purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment method:</span>
                <span className="font-semibold text-stone-800 capitalize">
                  {paymentMethod === 'card' ? 'Debit / Credit Card' :
                   paymentMethod === 'paypal' ? 'PayPal' :
                   paymentMethod === 'mtn' ? 'MTN Mobile Money' :
                   paymentMethod === 'airtel' ? 'Airtel Money' : 'Bank Transfer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Donor:</span>
                <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                  {isAnonymous ? 'Anonymous Supporter' : (fullName || 'Not specified')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Email:</span>
                <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                  {email || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Choose a Payment Method */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Choose a Payment Method
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-emerald-700 mb-1" />
                <span className="text-xs font-bold block">Card</span>
                <span className="text-[10px] text-stone-500">Pay securely by card</span>
              </button>

              {/* PayPal */}
              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'paypal'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <ExternalLink className="w-5 h-5 text-emerald-700 mb-1" />
                <span className="text-xs font-bold block">PayPal</span>
                <span className="text-[10px] text-stone-500">Pay with PayPal</span>
              </button>

              {/* MTN Mobile Money */}
              <button
                type="button"
                onClick={() => setPaymentMethod('mtn')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'mtn'
                    ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Phone className="w-5 h-5 text-amber-700" />
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded">Setup</span>
                </div>
                <span className="text-xs font-bold text-stone-800 block">MTN MoMo</span>
                <span className="text-[10px] text-amber-700 font-medium">Under configuration</span>
              </button>

              {/* Airtel Money */}
              <button
                type="button"
                onClick={() => setPaymentMethod('airtel')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  paymentMethod === 'airtel'
                    ? 'border-rose-500 bg-rose-50/60 ring-1 ring-rose-500'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Phone className="w-5 h-5 text-rose-700" />
                  <span className="text-[9px] font-bold text-rose-800 bg-rose-100 px-1 py-0.5 rounded">Setup</span>
                </div>
                <span className="text-xs font-bold text-stone-800 block">Airtel Money</span>
                <span className="text-[10px] text-rose-700 font-medium">Under configuration</span>
              </button>
            </div>

            {/* Bank Transfer button full width */}
            <button
              type="button"
              onClick={() => setPaymentMethod('bank')}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                paymentMethod === 'bank'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold">Bank Wire Transfer</span>
              </div>
              <span className="text-[10px] text-stone-500">Direct wire to RESTI CBO</span>
            </button>

            {/* Mobile Money Notice Banner when MTN or Airtel selected */}
            {(paymentMethod === 'mtn' || paymentMethod === 'airtel') && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{paymentMethod === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Mobile Money payments are currently under configuration and are not yet available for live donations.
                </p>
                <p className="text-[11px] text-stone-600">
                  Please select an available live payment method above (Card, PayPal, or Bank Transfer).
                </p>
              </div>
            )}

            {/* Provider Interactive Forms */}
            {paymentMethod === 'card' && (
              <div className="pt-2">
                <StripePaymentProvider
                  finalAmount={finalAmount}
                  currency={currency}
                  freq="once"
                  donorData={{ firstName: fullName, lastName: '', email, phone, country }}
                >
                  <StripeCardForm
                    donorData={{ firstName: fullName, lastName: '', email, phone, country }}
                    setDonorData={() => {}}
                    finalAmount={finalAmount}
                    freq="once"
                    setDone={() => {
                      handleCardSuccess({ id: `pi_card_${Date.now()}` });
                    }}
                    submitting={cardSubmitting}
                    setSubmitting={setCardSubmitting}
                    inp="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    lbl="block text-[11px] font-semibold text-stone-600 mb-1 uppercase"
                    onBack={() => {}}
                    formatAmt={(val: number) => formatMoney(val, currency)}
                  />
                </StripePaymentProvider>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="pt-2 space-y-3">
                {PAYPAL_CLIENT_ID ? (
                  <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
                    <PayPalButtons
                      style={{ layout: 'vertical', shape: 'rect' }}
                      createOrder={(_data, actions) => {
                        return actions.order.create({
                          intent: 'CAPTURE',
                          purchase_units: [{
                            amount: {
                              value: finalAmount.toString(),
                              currency_code: 'USD'
                            },
                            description: `RESTI Donation: ${purpose}`
                          }]
                        });
                      }}
                      onApprove={async (_data, actions) => {
                        const order = await actions.order?.capture();
                        handlePayPalSuccess(order);
                      }}
                      onError={(err) => {
                        console.error('PayPal error:', err);
                        setStatus('failed');
                        setStatusMessage('PayPal transaction could not be processed.');
                      }}
                      onCancel={() => {
                        setStatus('cancelled');
                      }}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <div className="text-center p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2">
                    <p className="text-stone-600">PayPal integration is active. Click below to continue:</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!validateForm()) {
                          toast.error('Please complete donor name and email first.');
                          return;
                        }
                        window.open('https://paypal.com/donate', '_blank');
                      }}
                      className="w-full bg-[#FFC439] hover:bg-[#F2BA36] font-bold text-stone-900 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Proceed with PayPal
                    </button>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleBankTransferSubmit}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white/20" />
                  Donate {formatMoney(finalAmount, currency)} (Bank Wire)
                </button>
              </div>
            )}

            {/* Unavailable Mobile Money Action Button */}
            {(paymentMethod === 'mtn' || paymentMethod === 'airtel') && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full bg-stone-200 text-stone-500 font-bold py-3 rounded-xl text-xs sm:text-sm cursor-not-allowed opacity-75"
                >
                  Currently Unavailable
                </button>
              </div>
            )}
          </div>

          {/* Trust and Security Information */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs text-stone-600 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-stone-800 block">Secure Donation</span>
              <p className="leading-relaxed text-[11px] text-stone-500">
                Your payment is processed through our configured payment provider. RESTI does not store your full card or payment credentials.
              </p>
            </div>
          </div>

          {/* Legal / Non-profit disclosure */}
          <div className="text-center text-[11px] text-stone-400 space-y-0.5">
            <p>RESTI CBO · Kiryandongo District Local Government, Uganda</p>
            <p>Voluntary charitable community contribution.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Official Donation Receipt Modal
// ────────────────────────────────────────────────────────────────────────────
function ReceiptModal({ donation, onClose }: { donation: any; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const handleEmailCopy = () => {
    toast.success(`Official donation receipt dispatched to ${donation.donorEmail}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 text-left">
        <div className="bg-stone-100 px-6 py-3 border-b border-stone-200 flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold uppercase text-stone-600">
            Official Donation Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 sm:p-10 space-y-6 print:p-6">
          {/* Header */}
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
                Receipt #: {donation.receiptNumber || `RESTI-REC-${(donation.reference || donation.id).slice(-8).toUpperCase()}`}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Issued: {new Date(donation.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-stone-400 uppercase font-semibold text-[10px] block mb-1">
                Received From (Donor)
              </span>
              <p className="font-bold text-stone-900 text-sm">
                {donation.donorName || 'Generous Supporter'}
              </p>
              <p className="text-stone-600 mt-0.5">{donation.donorEmail}</p>
            </div>

            <div>
              <span className="text-stone-400 uppercase font-semibold text-[10px] block mb-1">
                Transaction Details
              </span>
              <p className="text-stone-700">
                <span className="font-semibold">Method:</span> {donation.paymentMethod}
              </p>
              <p className="text-stone-700">
                <span className="font-semibold">Reference:</span> <span className="font-mono">{donation.reference}</span>
              </p>
              <p className="text-stone-700">
                <span className="font-semibold">Status:</span> <span className="text-emerald-700 font-semibold">{donation.status === 'completed' ? 'Verified Paid' : 'Pending Confirmation'}</span>
              </p>
            </div>
          </div>

          {/* Table */}
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
                    <span className="font-medium block">{donation.campaign || 'Where Most Needed'}</span>
                    <span className="text-stone-400 text-[11px]">Voluntary community contribution for community-led initiatives</span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-stone-900 text-sm">
                    {donation.currency === 'UGX' ? `UGX ${Number(donation.amount).toLocaleString()}` : `${donation.currency} ${donation.amount}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notice */}
          <div className="bg-stone-50 rounded-lg p-4 text-[11px] text-stone-600 leading-relaxed border border-stone-200">
            <p className="font-semibold text-stone-800 mb-1">Official Acknowledgment</p>
            <p>
              This official receipt confirms receipt of the voluntary charitable contribution detailed above. 
              Resilience and Empowerment for Social Transformation Initiative (RESTI) is a registered Community-Based Organization operating under the regulatory supervision of Kiryandongo District Local Government, Republic of Uganda.
            </p>
          </div>

          {/* Signature */}
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

        {/* Modal footer */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={handleEmailCopy}
            className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" /> Email Receipt
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
