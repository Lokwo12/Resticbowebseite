import { useState, useRef, useEffect } from 'react';
import { Heart, Shield, Lock, Copy, CheckCircle, ChevronRight, Star, Users, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type PayMethod = 'card' | 'mtn' | 'airtel' | 'bank';
type FreqOption = 'once' | 'monthly' | 'yearly';

const PRESET_AMOUNTS = [10000, 25000, 50000, 100000, 250000];

const formatUGX = (n: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

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

const USSD_STEPS: Record<'mtn' | 'airtel', { title: string; steps: string[] }> = {
  mtn: {
    title: 'MTN Mobile Money',
    steps: [
      'Dial *165# on your MTN line',
      'Select option 1 — Send Money',
      'Enter merchant number: 0772 000 000',
      'Enter the donation amount in UGX',
      'Enter your MTN MoMo PIN',
      'Confirm the transaction — you\'ll receive an SMS',
      'Screenshot the confirmation and email it to us',
    ],
  },
  airtel: {
    title: 'Airtel Money',
    steps: [
      'Dial *185# on your Airtel line',
      'Select option 5 — Pay Bill',
      'Enter merchant code: 123456',
      'Enter the donation amount in UGX',
      'Enter your Airtel Money PIN',
      'Confirm the transaction — you\'ll receive an SMS',
      'Screenshot the confirmation and email it to us',
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
  const [amount, setAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [freq, setFreq] = useState<FreqOption>('once');
  const [method, setMethod] = useState<PayMethod>('card');
  const [cardData, setCardData] = useState({ name: '', email: '', card: '', expiry: '', cvv: '' });
  const [submitting, setSubmitting] = useState(false);
  const [donationConfig, setDonationConfig] = useState(DEFAULT_DONATION_CONFIG);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
      signal: AbortSignal.timeout(6000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings?.donation) {
          setDonationConfig(prev => ({ ...prev, ...data.settings.donation }));
        }
      })
      .catch(() => {}); // silently keep defaults
  }, []);

  const finalAmount = isCustom ? (parseInt(customAmount.replace(/\D/g, '')) || 0) : amount;

  const handlePreset = (v: number) => { setAmount(v); setIsCustom(false); setCustomAmount(''); };
  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value.replace(/\D/g, ''));
    setIsCustom(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 1000) { toast.error('Minimum donation is UGX 1,000'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    toast.success(`Thank you! Your donation of ${formatUGX(finalAmount)} is being processed.`, { duration: 6000 });
    formRef.current?.reset();
    setCardData({ name: '', email: '', card: '', expiry: '', cvv: '' });
  };

  const tabBtn = (m: PayMethod, label: string, emoji: string) => (
    <button
      type="button"
      onClick={() => setMethod(m)}
      className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
        method === m ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <section id="donate" className="py-20 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <Heart size={14} fill="currentColor" /> Make a Difference Today
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Support Our <span className="gradient-text">Community Programs</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every donation directly funds education, healthcare, and sustainable livelihoods for families in Kiryandongo District, Uganda.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* LEFT: Impact sidebar */}
          <div className="lg:col-span-2 space-y-5">
            {/* Impact cards */}
            {[
              { icon: '📚', amount: 'UGX 10,000', desc: 'Buys school supplies for one child for a term' },
              { icon: '💊', amount: 'UGX 25,000', desc: 'Provides basic healthcare for a family of 4' },
              { icon: '🌱', amount: 'UGX 100,000', desc: 'Seeds a small-holder farm for one season' },
            ].map((c) => (
              <div key={c.amount} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4 items-start card-lift">
                <div className="text-3xl">{c.icon}</div>
                <div>
                  <div className="font-bold text-emerald-700 text-lg">{c.amount}</div>
                  <div className="text-gray-600 text-sm mt-0.5">{c.desc}</div>
                </div>
              </div>
            ))}

            {/* Trust badges */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="font-semibold text-gray-700 text-sm mb-2">Why donate with us?</div>
              {[
                { icon: <Shield size={16} />, text: 'Registered CBO — Uganda NGO Bureau' },
                { icon: <Lock size={16} />, text: 'Secure, encrypted payments' },
                { icon: <Star size={16} />, text: '100% goes to community programs' },
                { icon: <Users size={16} />, text: '2,500+ families already supported' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-emerald-600">{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Donation form */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-80 mb-1">Donating</div>
                  <div className="text-3xl font-extrabold">{finalAmount > 0 ? formatUGX(finalAmount) : 'UGX 0'}</div>
                </div>
                <Heart size={40} className="opacity-20" fill="white" />
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-7">
              {/* Frequency */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Donation Frequency</label>
                <div className="flex gap-2">
                  {(['once', 'monthly', 'yearly'] as FreqOption[]).map((f) => (
                    <button
                      key={f} type="button" onClick={() => setFreq(f)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        freq === f ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount presets */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Amount (UGX)</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_AMOUNTS.map((v) => (
                    <button
                      key={v} type="button" onClick={() => handlePreset(v)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        !isCustom && amount === v
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                      }`}
                    >
                      {formatUGX(v)}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Custom…"
                    value={customAmount}
                    onChange={handleCustom}
                    className={`col-span-3 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold outline-none transition-all ${
                      isCustom ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                    }`}
                  />
                </div>
              </div>

              {/* Payment method tabs */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {tabBtn('card', 'Card', '💳')}
                  {tabBtn('mtn', 'MTN MoMo', '🟡')}
                  {tabBtn('airtel', 'Airtel', '🔴')}
                  {tabBtn('bank', 'Bank', '🏦')}
                </div>
              </div>

              {/* Card form */}
              {method === 'card' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required className="col-span-2 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 transition-colors"
                      placeholder="Full name" value={cardData.name}
                      onChange={e => setCardData(p => ({ ...p, name: e.target.value }))}
                    />
                    <input
                      required type="email" className="col-span-2 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 transition-colors"
                      placeholder="Email address" value={cardData.email}
                      onChange={e => setCardData(p => ({ ...p, email: e.target.value }))}
                    />
                    <input
                      required className="col-span-2 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 transition-colors"
                      placeholder="Card number" maxLength={19} value={cardData.card}
                      onChange={e => setCardData(p => ({ ...p, card: e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim() }))}
                    />
                    <input
                      required className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 transition-colors"
                      placeholder="MM / YY" maxLength={5} value={cardData.expiry}
                      onChange={e => setCardData(p => ({ ...p, expiry: e.target.value }))}
                    />
                    <input
                      required className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 transition-colors"
                      placeholder="CVV" maxLength={4} value={cardData.cvv}
                      onChange={e => setCardData(p => ({ ...p, cvv: e.target.value.replace(/\D/g,'') }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock size={12} /> Payments secured by 256-bit SSL encryption
                  </div>
                </div>
              )}

              {/* MTN / Airtel MoMo */}
              {(method === 'mtn' || method === 'airtel') && (
                <div className={`rounded-2xl p-5 ${method === 'mtn' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Phone size={20} className={method === 'mtn' ? 'text-amber-600' : 'text-red-600'} />
                    <div className="font-bold text-gray-800">{USSD_STEPS[method].title} Instructions</div>
                  </div>
                  <div className="bg-gray-900 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">Merchant Number</div>
                      <div className="text-white font-mono font-bold text-lg">
                        {method === 'mtn' ? donationConfig.merchantMTN : donationConfig.merchantAirtel}
                      </div>
                    </div>
                    <CopyBtn text={method === 'mtn' ? donationConfig.merchantMTN.replace(/\s/g,'') : donationConfig.merchantAirtel.replace(/\s/g,'')} />
                  </div>
                  <ol className="ussd-steps space-y-0">
                    {USSD_STEPS[method].steps.map((s, i) => (
                      <li key={i}>
                        <span className="ussd-step-number">{i + 1}</span>
                        <span className="text-gray-700 text-sm">{s}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 text-xs text-gray-500">
                    After payment, email your confirmation screenshot to{' '}
                    <a href="mailto:donate@resticbo.org" className="text-emerald-600 font-medium underline">donate@resticbo.org</a>
                  </div>
                </div>
              )}

              {/* Bank Transfer */}
              {method === 'bank' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                  <div className="font-bold text-gray-800 mb-2">Bank Transfer Details</div>
                  {[
                    { label: 'Bank', value: donationConfig.bankName },
                    { label: 'Account Name', value: donationConfig.accountName },
                    { label: 'Account No.', value: donationConfig.accountNumber },
                    { label: 'Branch', value: donationConfig.branch },
                    { label: 'Swift Code', value: donationConfig.swiftCode },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-blue-100">
                      <div>
                        <div className="text-xs text-gray-500">{r.label}</div>
                        <div className="font-mono font-semibold text-gray-800 text-sm">{r.value}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(r.value); toast.success(`Copied: ${r.value}`); }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2">
                    Use your name as the payment reference and email confirmation to{' '}
                    <a href="mailto:donate@resticbo.org" className="text-blue-600 underline font-medium">donate@resticbo.org</a>
                  </p>
                </div>
              )}

              {/* Submit */}
              {(method === 'card') && (
                <button
                  type="submit"
                  disabled={submitting || finalAmount < 1000}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 pulse-donate"
                >
                  {submitting ? (
                    <><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Processing…</>
                  ) : (
                    <><Heart size={18} fill="white" /> Donate {finalAmount > 0 ? formatUGX(finalAmount) : ''} {freq !== 'once' ? `/${freq}` : ''} <ChevronRight size={18} /></>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
