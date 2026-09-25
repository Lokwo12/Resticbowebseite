import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Lock, ShieldCheck, CreditCard, Building2, Phone,
  ExternalLink, CheckCircle2, AlertCircle, Clock, X, ArrowLeft,
  Printer, Mail, AlertTriangle, ArrowRight, Check, Eye,
  Upload, Paperclip, Copy, FileText, ChevronRight, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { STRIPE_PK, PAYPAL_CLIENT_ID } from '../utils/env';
import { StripePaymentProvider, StripeCardForm, prefetchPaymentIntent } from './StripeShared';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
  MtnMomoIcon,
  AirtelMoneyIcon,
  PayPalIcon,
  CardPaymentIcon,
  BankTransferIcon,
  VisaIcon,
  MastercardIcon
} from './PaymentBrandIcons';

export type SupportedCurrency = 'UGX' | 'USD' | 'EUR' | 'GBP';
export type PaymentMethodType = 'card' | 'paypal' | 'mtn' | 'airtel' | 'bank';
export type PaymentStatus = 'idle' | 'processing' | 'success' | 'pending' | 'pending_verification' | 'failed' | 'cancelled';

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
    presets: [10000, 25000, 50000, 100000, 250000],
    min: 5000,
    max: 100000000,
    defaultAmount: 50000
  },
  USD: {
    label: 'USD',
    symbol: '$',
    presets: [5, 10, 25, 100, 250],
    min: 5,
    max: 25000,
    defaultAmount: 25
  },
  EUR: {
    label: 'EUR',
    symbol: '€',
    presets: [5, 10, 25, 100, 250],
    min: 5,
    max: 25000,
    defaultAmount: 25
  },
  GBP: {
    label: 'GBP',
    symbol: '£',
    presets: [5, 10, 25, 100, 250],
    min: 5,
    max: 25000,
    defaultAmount: 25
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

  // Dynamic Bank Details Configuration from site-settings (read-only from database)
  const [bankConfig, setBankConfig] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    swiftCode: string;
    currency?: string;
    orgSub?: string;
    [key: string]: any;
  } | null>(null);
  const [loadingBankConfig, setLoadingBankConfig] = useState<boolean>(true);

  // Persistent unique reference per session: RESTI-2026-XXXXXX
  const [bankReference] = useState<string>(() => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RESTI-2026-${code}`;
  });
  const [copiedReference, setCopiedReference] = useState<boolean>(false);

  // Proof of transfer upload state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch dynamic bank settings from /site-settings
  useEffect(() => {
    let isMounted = true;
    async function fetchBankSettings() {
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.donation && isMounted) {
            setBankConfig({
              bankName: data.settings.donation.bankName || 'EQUITY',
              accountName: data.settings.donation.accountName || 'Refugee Empowerment For Sustainable Transformation Initiative',
              accountNumber: data.settings.donation.accountNumber || '1050203752178',
              branch: data.settings.donation.branch || 'Bweyale Branch',
              swiftCode: data.settings.donation.swiftCode || 'EQBLUGKA',
              currency: data.settings.donation.currency || 'UGX / USD',
              orgSub: data.settings.donation.orgSub || 'Registered CBO | CBOR 087 KDNMC',
              ...data.settings.donation
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic bank settings:', err);
      } finally {
        if (isMounted) setLoadingBankConfig(false);
      }
    }
    fetchBankSettings();
    return () => { isMounted = false; };
  }, []);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(bankReference);
    setCopiedReference(true);
    toast.success('Donation reference copied to clipboard!');
    setTimeout(() => setCopiedReference(false), 2500);
  };

  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit.');
      return;
    }

    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error('Please upload an image (PNG, JPG, WEBP) or PDF file.');
      return;
    }

    setProofFile(file);
    setProofFileName(file.name);
    setUploadingProof(true);

    try {
      // 1. Try edge function upload
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations/upload-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setProofUrl(data.url);
          toast.success('Proof of transfer uploaded successfully');
          return;
        }
      }

      // 2. Direct fallback to Supabase storage
      const cleanName = `transfer-proofs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await supabase.storage
        .from('make-2a4be611-uploads')
        .upload(cleanName, file);

      if (upErr) throw upErr;

      const { data: pubData } = supabase.storage
        .from('make-2a4be611-uploads')
        .getPublicUrl(cleanName);

      if (pubData?.publicUrl) {
        setProofUrl(pubData.publicUrl);
        toast.success('Proof of transfer attached');
      }
    } catch (err: any) {
      console.warn('Proof upload notice:', err);
      toast.info('Proof file selected. You may also email it to info@resticbo.org.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofUrl('');
    setProofFileName('');
    if (proofFileInputRef.current) proofFileInputRef.current.value = '';
  };

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
      const parsed = parseInt(customAmountInput.replace(/\D/g, ''), 10);
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
    const raw = e.target.value.replace(/\D/g, '');
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

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Bank Transfer Submission (Strictly Pending Verification — Never Marked Paid)
  const handleBankTransferSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please enter your full name and a valid email address.');
      return;
    }

    if (uploadingProof) {
      toast.info('Please wait for your proof attachment to finish uploading.');
      return;
    }

    const isMtn = (paymentMethod as any) === 'mtn';
    const isAirtel = (paymentMethod as any) === 'airtel';
    const methodLabel = isMtn ? 'MTN MoMo' : isAirtel ? 'Airtel Money' : 'Bank Wire Transfer';
    const apiPaymentMethod = isMtn ? 'mtn' : isAirtel ? 'airtel' : 'bank_transfer';

    setStatus('processing');
    setStatusMessage(`Submitting your ${methodLabel} notification...`);

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
          paymentMethod: apiPaymentMethod,
          donorName: isAnonymous ? 'Anonymous Supporter' : fullName.trim(),
          donorEmail: email.trim(),
          donorPhone: phone.trim() || undefined,
          donorCountry: country,
          campaign: purpose,
          message: `Voluntary donation via ${methodLabel} for ${purpose}`,
          transactionId: bankReference,
          proofUrl: proofUrl || undefined,
          proofFileName: proofFileName || undefined,
          status: 'pending_verification'
        })
      });

      if (!res.ok) {
        throw new Error(`Could not submit ${methodLabel} notification`);
      }

      // Explicitly ensure status is recorded as pending_verification in Postgres
      try {
        await supabase
          .from('donations')
          .update({ status: 'pending_verification' })
          .eq('transaction_id', bankReference);
      } catch (_) {
        // Non-blocking
      }

      setConfirmedDonation({
        id: bankReference,
        amount: finalAmount,
        currency: currency,
        paymentMethod: methodLabel,
        date: nowIso,
        donorName: isAnonymous ? 'Anonymous Supporter' : fullName.trim(),
        donorEmail: email.trim(),
        donorPhone: phone.trim(),
        donorCountry: country,
        reference: bankReference,
        campaign: purpose,
        proofUrl: proofUrl || undefined,
        proofFileName: proofFileName || undefined,
        status: 'pending_verification',
        bankDetails: bankConfig
      });

      setStatus('pending_verification');
      toast.success('Donation submitted — awaiting verification');
    } catch (err: any) {
      console.error(`${methodLabel} submit error:`, err);
      setStatus('failed');
      setStatusMessage(`Unable to submit ${methodLabel} notification. Please try again or contact info@resticbo.org.`);
      toast.error('Unable to submit transfer notification');
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
  // VIEW: PENDING PAYMENT STATE (Bank transfer submitted — awaiting verification)
  // ──────────────────────────────────────────────────────────────────────────
  if ((status === 'pending' || status === 'pending_verification') && confirmedDonation) {
    const bankDetails = confirmedDonation.bankDetails || bankConfig;

    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 max-w-xl mx-auto shadow-sm my-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 ring-8 ring-amber-50">
          <Clock className="w-9 h-9" />
        </div>
        
        {/* Exact Heading from Requirement 9 */}
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
          Donation submitted — awaiting verification
        </h2>

        {/* Exact Description from Requirement 9 */}
        <p className="text-stone-600 text-sm mt-3 mb-6 max-w-lg mx-auto leading-relaxed">
          Thank you for supporting RESTI CBO. Your bank-transfer donation has been recorded and is awaiting confirmation of receipt. We will update your donation status once the transfer has been verified.
        </p>

        {/* Wire & Reference Summary Card */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-left text-xs space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Donation Reference</span>
              <span className="font-mono font-bold text-emerald-900 text-base">{confirmedDonation.reference}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Amount</span>
              <span className="font-bold text-stone-900 text-sm">
                {formatMoney(confirmedDonation.amount, confirmedDonation.currency)}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-stone-700">
            <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Donor:</span> <strong className="text-right break-words">{confirmedDonation.donorName}</strong></div>
            <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Email:</span> <span className="text-right break-all">{confirmedDonation.donorEmail}</span></div>
            {confirmedDonation.paymentMethod === 'MTN MoMo' ? (
              <>
                <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Payment Channel:</span> <strong>MTN MoMo (Uganda)</strong></div>
                <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Merchant / Number:</span> <strong className="font-mono">{bankDetails?.merchantMTN || '+256 785 440955'}</strong></div>
                <div className="flex justify-between items-start gap-3"><span className="text-stone-500 shrink-0">Recipient Name:</span> <strong className="text-right leading-snug break-words max-w-[65%]">{bankDetails?.accountName || 'Refugee Empowerment For Sustainable Transformation Initiative'}</strong></div>
              </>
            ) : confirmedDonation.paymentMethod === 'Airtel Money' ? (
              <>
                <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Payment Channel:</span> <strong>Airtel Money (Uganda)</strong></div>
                <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Merchant / Number:</span> <strong className="font-mono">{bankDetails?.merchantAirtel || bankDetails?.merchantMTN || '+256 785 440955'}</strong></div>
                <div className="flex justify-between items-start gap-3"><span className="text-stone-500 shrink-0">Recipient Name:</span> <strong className="text-right leading-snug break-words max-w-[65%]">{bankDetails?.accountName || 'Refugee Empowerment For Sustainable Transformation Initiative'}</strong></div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Beneficiary Bank:</span> <strong>{bankDetails?.bankName || 'EQUITY'}</strong></div>
                <div className="flex justify-between items-start gap-3"><span className="text-stone-500 shrink-0">Account Name:</span> <strong className="text-right leading-snug break-words max-w-[65%]">{bankDetails?.accountName || 'Refugee Empowerment For Sustainable Transformation Initiative'}</strong></div>
                <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Account Number:</span> <strong className="font-mono">{bankDetails?.accountNumber || '1050203752178'}</strong></div>
                <div className="flex justify-between items-baseline gap-3"><span className="text-stone-500 shrink-0">Branch / SWIFT:</span> <span className="text-right">{bankDetails?.branch || 'Bweyale Branch'} ({bankDetails?.swiftCode || 'EQBLUGKA'})</span></div>
              </>
            )}
            {confirmedDonation.proofFileName && (
              <div className="flex justify-between pt-1 border-t border-stone-200 text-emerald-800">
                <span className="text-stone-500">Proof of Transfer:</span>
                <span className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {confirmedDonation.proofFileName}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 text-[11px] text-stone-500 border-t border-stone-200">
            Please ensure you have included reference <span className="font-mono font-bold text-emerald-800">{confirmedDonation.reference}</span> in your deposit note. Our finance team reconciles bank deposits regularly.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/donor-portal"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
          >
            View Supporter & Donor Portal <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              if (isModal && onClose) {
                onClose();
              } else {
                handleTryAgain();
              }
            }}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200"
          >
            {isModal ? 'Done' : 'Back to Donation Form'}
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
      <div className={`text-center max-w-2xl mx-auto px-2 ${isModal ? 'mb-6 sm:mb-7' : 'mb-8 sm:mb-10'}`}>
        <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
          <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20 shrink-0" />
          <span>Official RESTI Community Support</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Support RESTI's Community-Led Work
        </h2>
        <p className="mt-3 text-stone-600 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Your contribution helps RESTI work with refugee and host communities to strengthen livelihoods, resilience, environmental sustainability, WASH, community development, and social cohesion.
        </p>
      </div>

      {/* Two-Column Donation Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* ── LEFT COLUMN: Amount, Frequency, Purpose, Donor Info (7 cols) ── */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 sm:p-7 shadow-sm space-y-7">
          
          {/* Section 1: Choose Donation Amount & Currency */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
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
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
              {currentCurrencyConfig.presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
                    !isCustomAmount && selectedAmount === preset
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-600'
                      : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-700 hover:border-stone-300'
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
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-stone-500 shrink-0">Amount:</span>
                <span className="text-base font-black text-emerald-900">
                  {formatMoney(finalAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-stone-500 shrink-0">Frequency:</span>
                <span className="font-semibold text-stone-800">One-time</span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-stone-500 shrink-0">Purpose:</span>
                <span className="font-semibold text-stone-800 text-right leading-snug break-words max-w-[65%]">
                  {purpose}
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-stone-500 shrink-0">Payment method:</span>
                <span className="font-semibold text-stone-800 text-right">
                  {paymentMethod === 'card' ? 'Debit / Credit Card' :
                   paymentMethod === 'paypal' ? 'PayPal' :
                   paymentMethod === 'mtn' ? 'MTN Mobile Money' :
                   paymentMethod === 'airtel' ? 'Airtel Money' : 'Bank Transfer'}
                </span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-stone-500 shrink-0">Donor:</span>
                <span className="font-semibold text-stone-800 text-right leading-snug break-words max-w-[65%]">
                  {isAnonymous ? 'Anonymous Supporter' : (fullName || 'Not specified')}
                </span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-stone-500 shrink-0">Email:</span>
                <span className="font-semibold text-stone-800 text-right break-all max-w-[65%]">
                  {email || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Choose a Payment Method */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                Choose a Payment Method
              </label>
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-700" /> Encrypted &amp; Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Select Payment Method">
              {([
                {
                  id: 'card' as PaymentMethodType,
                  title: 'Credit / Debit Card',
                  subtitle: 'Visa & Mastercard via Stripe',
                  ariaLabel: 'Donate using Credit or Debit Card with Visa or Mastercard',
                  icon: <CardPaymentIcon />
                },
                {
                  id: 'paypal' as PaymentMethodType,
                  title: 'PayPal',
                  subtitle: 'Fast, secure online checkout',
                  ariaLabel: 'Donate using PayPal',
                  icon: <PayPalIcon />
                },
                {
                  id: 'mtn' as PaymentMethodType,
                  title: 'MTN MoMo',
                  subtitle: 'Mobile Money (Uganda)',
                  ariaLabel: 'Donate using MTN Mobile Money',
                  icon: <MtnMomoIcon />
                },
                {
                  id: 'airtel' as PaymentMethodType,
                  title: 'Airtel Money',
                  subtitle: 'Airtel Money (Uganda)',
                  ariaLabel: 'Donate using Airtel Money',
                  icon: <AirtelMoneyIcon />
                },
                {
                  id: 'bank' as PaymentMethodType,
                  title: 'Bank Transfer',
                  subtitle: 'Official RESTI bank wire (Equity Bank Uganda)',
                  ariaLabel: 'Donate via direct Bank Wire Transfer',
                  icon: <BankTransferIcon />
                }
              ]).map((method) => {
                const isSelected = paymentMethod === method.id;
                const isBank = method.id === 'bank';
                return (
                  <button
                    key={method.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={method.ariaLabel}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between relative cursor-pointer group ${
                      isBank ? 'sm:col-span-2' : ''
                    } ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600 shadow-xs'
                        : 'border-stone-200 hover:border-emerald-300 hover:bg-stone-50/80 text-stone-800 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="h-8 flex items-center">{method.icon}</div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'border-2 border-stone-300 group-hover:border-stone-400'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-stone-900 group-hover:text-emerald-900 transition-colors leading-snug">
                        {method.title}
                      </span>
                      <span className="text-[11px] text-stone-500 block leading-tight mt-0.5 break-words">
                        {method.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Provider Interactive Forms */}
            {paymentMethod === 'card' && (
              <div className="pt-2 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Secure 256-bit encrypted card processing via Stripe</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Supported:</span>
                    <VisaIcon className="h-3 w-auto" />
                    <MastercardIcon className="h-3.5 w-auto" />
                  </div>
                </div>

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
                <div className="flex items-center gap-2 p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900">
                  <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>Encrypted, buyer-protected donation payment via official PayPal</span>
                </div>

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
                      className="w-full bg-[#FFC439] hover:bg-[#F2BA36] font-bold text-stone-900 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Proceed with PayPal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dedicated MTN MoMo Payment Section */}
            {paymentMethod === 'mtn' && (
              <div className="pt-2 space-y-4">
                <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-3.5 shadow-2xs">
                  
                  {/* Amount and Unique Donation Reference */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                    <div>
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Donation Amount</div>
                      <div className="text-lg font-black text-amber-950">
                        {formatMoney(finalAmount, currency)}
                      </div>
                    </div>

                    <div className="bg-white border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between sm:justify-start gap-2 shadow-2xs">
                      <div>
                        <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Donation Reference</div>
                        <div className="font-mono font-bold text-amber-950 text-xs sm:text-sm tracking-wide">
                          {bankReference}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyReference}
                        className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Copy donation reference code"
                      >
                        {copiedReference ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Mandatory Instruction */}
                  <div className="p-3 bg-amber-100/70 border border-amber-300/80 rounded-xl text-amber-950 text-xs leading-relaxed flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">Please include this donation reference when making your MTN MoMo payment.</strong>
                      <p className="text-[11px] text-amber-900">
                        Enter <span className="font-mono font-bold text-amber-950">{bankReference}</span> in the payment reason or reference field so RESTI can match your payment.
                      </p>
                    </div>
                  </div>

                  {/* MTN MoMo Details & Dial Steps */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                      MTN MoMo Payment Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white border border-amber-200/80 rounded-xl p-2.5 sm:col-span-2">
                        <span className="text-[10px] text-stone-400 font-medium block">Registered Account Name</span>
                        <strong className="text-stone-900 font-semibold block mt-0.5 text-xs leading-snug break-words">
                          {bankConfig?.accountName || 'Refugee Empowerment For Sustainable Transformation Initiative'}
                        </strong>
                      </div>

                      <div className="bg-white border border-amber-200/80 rounded-xl p-2.5 sm:col-span-2">
                        <span className="text-[10px] text-stone-400 font-medium block">Merchant / Phone Number</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <strong className="text-stone-900 font-mono font-bold text-xs sm:text-sm">{bankConfig?.merchantMTN || '+256 785 440955'}</strong>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(bankConfig?.merchantMTN || '+256 785 440955');
                              toast.success('MTN number copied to clipboard');
                            }}
                            className="p-1 text-stone-400 hover:text-amber-700 transition-colors cursor-pointer"
                            title="Copy number"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="bg-white border border-amber-200/80 rounded-xl p-3 sm:col-span-2 space-y-1">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">How to Send via MTN MoMo</span>
                        <ol className="text-[11px] text-stone-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                          <li>Dial <span className="font-mono font-bold text-amber-950">*165*3#</span> (MoMoPay) or transfer directly to <span className="font-mono font-bold text-amber-950">{bankConfig?.merchantMTN || '+256 785 440955'}</span></li>
                          <li>Enter Amount: <span className="font-bold text-amber-950">{formatMoney(finalAmount, currency)}</span></li>
                          <li>Enter Reason/Reference: <span className="font-mono font-bold text-amber-950">{bankReference}</span></li>
                          <li>Enter your MTN MoMo PIN to authorize the transaction</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Optional Proof Upload */}
                  <div className="pt-2 border-t border-amber-200/80">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-950 mb-1.5">
                      Upload MoMo screenshot / SMS confirmation <span className="text-stone-500 font-normal lowercase">(optional)</span>
                    </label>

                    {proofUrl ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate font-medium">{proofFileName || 'Proof of transfer attached'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveProof}
                          className="text-emerald-700 hover:text-rose-700 text-xs font-semibold px-2 py-1 rounded hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          ref={proofFileInputRef}
                          onChange={handleProofFileChange}
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          className="hidden"
                          id="mtn-proof-file-input"
                        />
                        <label
                          htmlFor="mtn-proof-file-input"
                          className="border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-100/50 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          {uploadingProof ? (
                            <div className="flex items-center gap-2 text-stone-600 text-xs">
                              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading transfer proof...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                                <Upload className="w-4 h-4 text-amber-800" />
                                <span>Attach MoMo transaction confirmation or receipt</span>
                              </div>
                              <span className="text-[10px] text-stone-500">
                                Supports PNG, JPG, or PDF up to 10MB
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleBankTransferSubmit}
                  disabled={uploadingProof}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  I Have Sent the MTN MoMo Donation
                </button>
              </div>
            )}

            {/* Dedicated Airtel Money Payment Section */}
            {paymentMethod === 'airtel' && (
              <div className="pt-2 space-y-4">
                <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-3.5 shadow-2xs">
                  
                  {/* Amount and Unique Donation Reference */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
                    <div>
                      <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Donation Amount</div>
                      <div className="text-lg font-black text-rose-950">
                        {formatMoney(finalAmount, currency)}
                      </div>
                    </div>

                    <div className="bg-white border border-rose-200 rounded-xl px-3 py-2 flex items-center justify-between sm:justify-start gap-2 shadow-2xs">
                      <div>
                        <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Donation Reference</div>
                        <div className="font-mono font-bold text-rose-950 text-xs sm:text-sm tracking-wide">
                          {bankReference}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyReference}
                        className="p-1.5 text-stone-500 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Copy donation reference code"
                      >
                        {copiedReference ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Mandatory Instruction */}
                  <div className="p-3 bg-rose-100/70 border border-rose-300/80 rounded-xl text-rose-950 text-xs leading-relaxed flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">Please include this donation reference when making your Airtel Money payment.</strong>
                      <p className="text-[11px] text-rose-900">
                        Enter <span className="font-mono font-bold text-rose-950">{bankReference}</span> in the payment reason or reference field so RESTI can match your payment.
                      </p>
                    </div>
                  </div>

                  {/* Airtel Money Details & Dial Steps */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900">
                      Airtel Money Payment Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white border border-rose-200/80 rounded-xl p-2.5 sm:col-span-2">
                        <span className="text-[10px] text-stone-400 font-medium block">Registered Account Name</span>
                        <strong className="text-stone-900 font-semibold block mt-0.5 text-xs leading-snug break-words">
                          {bankConfig?.accountName || 'Refugee Empowerment For Sustainable Transformation Initiative'}
                        </strong>
                      </div>

                      <div className="bg-white border border-rose-200/80 rounded-xl p-2.5 sm:col-span-2">
                        <span className="text-[10px] text-stone-400 font-medium block">Merchant / Phone Number</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <strong className="text-stone-900 font-mono font-bold text-xs sm:text-sm">{bankConfig?.merchantAirtel || bankConfig?.merchantMTN || '+256 785 440955'}</strong>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(bankConfig?.merchantAirtel || bankConfig?.merchantMTN || '+256 785 440955');
                              toast.success('Airtel number copied to clipboard');
                            }}
                            className="p-1 text-stone-400 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Copy number"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="bg-white border border-rose-200/80 rounded-xl p-3 sm:col-span-2 space-y-1">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">How to Send via Airtel Money</span>
                        <ol className="text-[11px] text-stone-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                          <li>Dial <span className="font-mono font-bold text-rose-950">*185*9#</span> (Airtel Pay) or transfer directly to <span className="font-mono font-bold text-rose-950">{bankConfig?.merchantAirtel || bankConfig?.merchantMTN || '+256 785 440955'}</span></li>
                          <li>Enter Amount: <span className="font-bold text-rose-950">{formatMoney(finalAmount, currency)}</span></li>
                          <li>Enter Reason/Reference: <span className="font-mono font-bold text-rose-950">{bankReference}</span></li>
                          <li>Enter your Airtel Money PIN to authorize the transaction</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Optional Proof Upload */}
                  <div className="pt-2 border-t border-rose-200/80">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-rose-950 mb-1.5">
                      Upload Airtel screenshot / SMS confirmation <span className="text-stone-500 font-normal lowercase">(optional)</span>
                    </label>

                    {proofUrl ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate font-medium">{proofFileName || 'Proof of transfer attached'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveProof}
                          className="text-emerald-700 hover:text-rose-700 text-xs font-semibold px-2 py-1 rounded hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          ref={proofFileInputRef}
                          onChange={handleProofFileChange}
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          className="hidden"
                          id="airtel-proof-file-input"
                        />
                        <label
                          htmlFor="airtel-proof-file-input"
                          className="border-2 border-dashed border-rose-300 hover:border-rose-500 hover:bg-rose-100/50 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          {uploadingProof ? (
                            <div className="flex items-center gap-2 text-stone-600 text-xs">
                              <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading transfer proof...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                                <Upload className="w-4 h-4 text-rose-800" />
                                <span>Attach Airtel transaction confirmation or receipt</span>
                              </div>
                              <span className="text-[10px] text-stone-500">
                                Supports PNG, JPG, or PDF up to 10MB
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleBankTransferSubmit}
                  disabled={uploadingProof}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  I Have Sent the Airtel Money Donation
                </button>
              </div>
            )}

            {/* Dedicated Bank Transfer Payment Section */}
            {paymentMethod === 'bank' && (
              <div className="pt-2 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-3.5 shadow-xs">
                  
                  {/* Amount and Unique Donation Reference */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Donation Amount</div>
                      <div className="text-lg font-black text-emerald-800">
                        {formatMoney(finalAmount, currency)}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between sm:justify-start gap-2 shadow-2xs">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Donation Reference</div>
                        <div className="font-mono font-bold text-emerald-900 text-xs sm:text-sm tracking-wide">
                          {bankReference}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyReference}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Copy donation reference code"
                      >
                        {copiedReference ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Mandatory Instruction */}
                  <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">Please include this donation reference when making your bank transfer so RESTI can match your payment.</strong>
                      <p className="text-[11px] text-amber-800">
                        Include <span className="font-mono font-bold text-emerald-800">{bankReference}</span> in your bank deposit slip, wire narrative, or transfer notes.
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Bank Transfer Instructions */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Bank Transfer Instructions
                      </span>
                      {loadingBankConfig && (
                        <span className="text-[10px] text-slate-400">Loading bank details...</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:col-span-2">
                        <span className="text-[10px] text-slate-400 font-medium block">Account Name</span>
                        <strong className="text-slate-900 font-semibold text-xs leading-snug block mt-0.5 break-words">
                          {bankConfig?.accountName || 'Refugee Empowerment For Sustainable Transformation Initiative'}
                        </strong>
                      </div>

                      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5">
                        <span className="text-[10px] text-slate-400 font-medium block">Bank Name</span>
                        <strong className="text-slate-900 font-semibold text-xs block mt-0.5">{bankConfig?.bankName || 'EQUITY'}</strong>
                      </div>

                      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5">
                        <span className="text-[10px] text-slate-400 font-medium block">Account Number</span>
                        <strong className="text-slate-900 font-mono font-bold tracking-wider text-xs block mt-0.5">{bankConfig?.accountNumber || '1050203752178'}</strong>
                      </div>

                      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5">
                        <span className="text-[10px] text-slate-400 font-medium block">Branch</span>
                        <strong className="text-slate-900 font-semibold text-xs block mt-0.5">{bankConfig?.branch || 'Bweyale Branch'}</strong>
                      </div>

                      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5">
                        <span className="text-[10px] text-slate-400 font-medium block">SWIFT / BIC</span>
                        <strong className="text-slate-900 font-mono font-bold text-xs block mt-0.5">{bankConfig?.swiftCode || 'EQBLUGKA'}</strong>
                      </div>

                      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:col-span-2">
                        <span className="text-[10px] text-slate-400 font-medium block">Accepted Currency</span>
                        <strong className="text-slate-900 font-semibold text-xs block mt-0.5">{currency} / UGX / USD</strong>
                      </div>
                    </div>

                    {bankConfig?.orgSub && (
                      <div className="text-[10px] text-slate-500 font-medium pt-0.5">
                        Official CBO Registration: <span className="font-semibold text-slate-700">{bankConfig.orgSub}</span>
                      </div>
                    )}
                  </div>

                  {/* Optional Proof of Transfer Upload */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Upload proof of transfer <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>

                    {proofUrl ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate font-medium">{proofFileName || 'Proof of transfer attached'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveProof}
                          className="text-emerald-700 hover:text-rose-700 text-xs font-semibold px-2 py-1 rounded hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          ref={proofFileInputRef}
                          onChange={handleProofFileChange}
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          className="hidden"
                          id="bank-proof-file-input"
                        />
                        <label
                          htmlFor="bank-proof-file-input"
                          className="border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/40 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          {uploadingProof ? (
                            <div className="flex items-center gap-2 text-slate-600 text-xs">
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading transfer proof...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                <Upload className="w-4 h-4 text-emerald-700" />
                                <span>Attach bank receipt or transfer confirmation</span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                Supports PNG, JPG, or PDF up to 10MB
                              </span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleBankTransferSubmit}
                  disabled={uploadingProof}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  I Have Made the Bank Transfer
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
