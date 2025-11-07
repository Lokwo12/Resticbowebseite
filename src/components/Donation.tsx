import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Heart, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Check, 
  Loader2,
  DollarSign,
  Globe
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

// ⚠️ IMPORTANT: Replace this with your own Stripe publishable key
// Get your test key from: https://dashboard.stripe.com/test/apikeys
// For production, use your LIVE key (pk_live_...)
const STRIPE_PUBLISHABLE_KEY = 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE';

// Only load Stripe if a valid key is provided
const stripePromise = STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY !== 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE' 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

interface DonationStats {
  totalAmount: number;
  totalDonations: number;
}

function CheckoutForm({ 
  amount, 
  currency,
  donorInfo, 
  onSuccess 
}: { 
  amount: number; 
  currency: string;
  donorInfo: { name: string; email: string; phone: string; message: string };
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment system is loading. Please wait a moment and try again.');
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Stripe payment error:', error);
        toast.error(error.message || 'Payment failed. Please check your card details and try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Record the donation
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                amount,
                currency,
                paymentMethod: 'stripe',
                donorName: donorInfo.name,
                donorEmail: donorInfo.email,
                donorPhone: donorInfo.phone,
                message: donorInfo.message,
                paymentIntentId: paymentIntent.id,
              }),
            }
          );

          if (!response.ok) {
            console.error('Failed to record donation:', await response.text());
          }
        } catch (recordError) {
          console.error('Error recording donation:', recordError);
        }

        toast.success('Thank you for your donation! 🎉');
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-gray-600 mb-2">Enter your card details below:</p>
        <PaymentElement />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-emerald-600 text-white px-6 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Processing Payment...
          </>
        ) : (
          <>
            <Heart size={20} />
            Complete Donation - {currency} {amount}
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Powered by Stripe. Your payment information is secure and encrypted.
      </p>
    </form>
  );
}

export function Donation() {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'mobile-money' | 'bank'>('stripe');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DonationStats | null>(null);

  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donation-stats`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleDonateClick = async () => {
    if (!donorInfo.name || !donorInfo.email) {
      toast.error('Please provide your name and email');
      return;
    }

    if (amount < 1) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    if (paymentMethod === 'stripe') {
      // Check if Stripe is configured
      if (!stripePromise) {
        toast.error(
          'Stripe is not configured. Please add your Stripe publishable key in the Donation.tsx file.',
          { duration: 8000 }
        );
        return;
      }

      setLoading(true);
      try {
        // Create payment intent
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/create-payment-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              amount,
              currency: currency.toLowerCase(),
              donorName: donorInfo.name,
              donorEmail: donorInfo.email,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setShowPaymentForm(true);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    } else if (paymentMethod === 'mobile-money') {
      // Handle mobile money
      handleMobileMoneyDonation();
    } else if (paymentMethod === 'bank') {
      // Handle bank transfer
      handleBankTransfer();
    }
  };

  const handleMobileMoneyDonation = async () => {
    if (!donorInfo.phone) {
      toast.error('Please provide your phone number for Mobile Money');
      return;
    }

    setLoading(true);
    try {
      const ugxAmount = currency === 'UGX' ? amount : amount * 3700; // Approximate conversion

      // Record the donation as pending
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/donations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            amount: ugxAmount,
            currency: 'UGX',
            paymentMethod: `mobile-money-${mobileMoneyProvider}`,
            donorName: donorInfo.name,
            donorEmail: donorInfo.email,
            donorPhone: donorInfo.phone,
            message: donorInfo.message,
          }),
        }
      );

      toast.success(
        `Please complete the payment on your phone. You will receive a prompt from ${
          mobileMoneyProvider === 'mtn' ? 'MTN' : 'Airtel'
        } Mobile Money for UGX ${ugxAmount.toLocaleString()}.`,
        { duration: 8000 }
      );

      // Show instructions
      setShowPaymentForm(true);
    } catch (err) {
      console.error('Error processing mobile money donation:', err);
      toast.error('Failed to process mobile money donation');
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = () => {
    setShowPaymentForm(true);
    toast.info('Bank transfer details are shown below. Please complete the transfer and send confirmation.', {
      duration: 6000,
    });
  };

  const resetForm = () => {
    setShowPaymentForm(false);
    setClientSecret('');
    setDonorInfo({ name: '', email: '', phone: '', message: '' });
    setCustomAmount('');
    setSelectedAmount(50);
    fetchStats();
  };

  return (
    <section id="donate" className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="text-white" size={32} />
          </div>
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            Make a Donation
          </h2>
          <p className="text-lg text-gray-600">
            Your generous support helps us continue our mission to empower communities through education, healthcare, and sustainable development.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-3xl text-emerald-600 mb-2">
                    ${stats.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Raised</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl text-emerald-600 mb-2">
                    {stats.totalDonations}
                  </div>
                  <div className="text-sm text-gray-600">Donations</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {!showPaymentForm ? (
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              {/* Amount Selection */}
              <div className="mb-8">
                <label className="text-gray-900 mb-4 block">Select Amount</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(preset);
                        setCustomAmount('');
                      }}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedAmount === preset && !customAmount
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Custom amount"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Currency Selection */}
              <div className="mb-8">
                <label className="text-gray-900 mb-4 block">Currency</label>
                <div className="grid grid-cols-3 gap-3">
                  {['USD', 'EUR', 'UGX'].map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        currency === curr
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      {curr === 'UGX' ? <Smartphone size={16} /> : <Globe size={16} />}
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <label className="text-gray-900 mb-4 block">Payment Method</label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      paymentMethod === 'stripe'
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'stripe' ? 'border-emerald-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'stripe' && (
                        <div className="w-3 h-3 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <CreditCard className="text-gray-600" size={24} />
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">Credit/Debit Card (Stripe)</span>
                        {!stripePromise && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Setup Required</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Global payment via Stripe</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile-money')}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      paymentMethod === 'mobile-money'
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'mobile-money' ? 'border-emerald-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'mobile-money' && (
                        <div className="w-3 h-3 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <Smartphone className="text-gray-600" size={24} />
                    <div className="text-left">
                      <div className="text-gray-900">Mobile Money</div>
                      <div className="text-xs text-gray-500">MTN & Airtel Money (Uganda)</div>
                    </div>
                  </button>

                  {paymentMethod === 'mobile-money' && (
                    <div className="ml-12 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="provider"
                          value="mtn"
                          checked={mobileMoneyProvider === 'mtn'}
                          onChange={() => setMobileMoneyProvider('mtn')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-gray-700">MTN Mobile Money</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="provider"
                          value="airtel"
                          checked={mobileMoneyProvider === 'airtel'}
                          onChange={() => setMobileMoneyProvider('airtel')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-gray-700">Airtel Money</span>
                      </label>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      paymentMethod === 'bank'
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'bank' ? 'border-emerald-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'bank' && (
                        <div className="w-3 h-3 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <Building2 className="text-gray-600" size={24} />
                    <div className="text-left">
                      <div className="text-gray-900">Bank Transfer</div>
                      <div className="text-xs text-gray-500">Direct bank deposit</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Donor Information */}
              <div className="space-y-4 mb-8">
                <h3 className="text-gray-900">Your Information</h3>
                <input
                  type="text"
                  required
                  value={donorInfo.name}
                  onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                  placeholder="Full Name *"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  required
                  value={donorInfo.email}
                  onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                  placeholder="Email *"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="tel"
                  value={donorInfo.phone}
                  onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                  placeholder={`Phone ${paymentMethod === 'mobile-money' ? '*' : '(optional)'}`}
                  required={paymentMethod === 'mobile-money'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  value={donorInfo.message}
                  onChange={(e) => setDonorInfo({ ...donorInfo, message: e.target.value })}
                  placeholder="Message (optional)"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleDonateClick}
                disabled={loading}
                className="w-full bg-emerald-600 text-white px-6 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart size={20} />
                    Continue to Payment
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <button
                onClick={resetForm}
                className="text-gray-600 hover:text-gray-900 mb-6"
              >
                ← Back
              </button>

              {paymentMethod === 'stripe' && clientSecret && stripePromise ? (
                <div>
                  <h3 className="text-xl text-gray-900 mb-6">Complete Your Donation</h3>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      amount={amount} 
                      currency={currency}
                      donorInfo={donorInfo}
                      onSuccess={resetForm}
                    />
                  </Elements>
                </div>
              ) : paymentMethod === 'stripe' && !stripePromise ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8">
                  <h3 className="text-lg text-gray-900 mb-4">⚙️ Stripe Configuration Required</h3>
                  <p className="text-gray-700 mb-4">
                    To accept credit card donations, you need to configure Stripe:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-6">
                    <li>Sign up for a Stripe account at <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">dashboard.stripe.com</a></li>
                    <li>Get your publishable key from the <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">API keys page</a></li>
                    <li>Add your key to <code className="bg-gray-100 px-2 py-1 rounded">/components/Donation.tsx</code></li>
                    <li>Restart your application</li>
                  </ol>
                  <button
                    onClick={resetForm}
                    className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                </div>
              ) : paymentMethod === 'stripe' && !clientSecret ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-emerald-600 mb-4" size={40} />
                  <p className="text-gray-600">Initializing secure payment...</p>
                </div>
              ) : paymentMethod === 'mobile-money' ? (
                <div className="space-y-6">
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <Check className="text-emerald-600 flex-shrink-0 mt-1" size={24} />
                      <div>
                        <h3 className="text-lg text-gray-900 mb-3">
                          Mobile Money Instructions
                        </h3>
                        <ol className="space-y-2 text-gray-700 text-sm">
                          <li>1. You will receive a prompt on your phone from {mobileMoneyProvider === 'mtn' ? 'MTN' : 'Airtel'} Mobile Money</li>
                          <li>2. Enter your Mobile Money PIN to confirm the payment</li>
                          <li>3. You will receive a confirmation SMS</li>
                          <li>4. We will send you a receipt via email</li>
                        </ol>
                        <div className="mt-4 p-4 bg-white rounded-lg">
                          <div className="text-sm text-gray-600">Amount to pay:</div>
                          <div className="text-2xl text-emerald-600">
                            UGX {(currency === 'UGX' ? amount : amount * 3700).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="w-full bg-emerald-600 text-white px-6 py-4 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : paymentMethod === 'bank' ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg text-gray-900 mb-4">Bank Transfer Details</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-gray-600">Bank Name:</div>
                        <div className="text-gray-900">Stanbic Bank Uganda</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Account Name:</div>
                        <div className="text-gray-900">Resti Kiryandongo CBO</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Account Number:</div>
                        <div className="text-gray-900">9030XXXXXXXX</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Branch:</div>
                        <div className="text-gray-900">Kiryandongo Branch</div>
                      </div>
                      <div className="mt-4 p-4 bg-white rounded-lg">
                        <div className="text-gray-600">Amount to transfer:</div>
                        <div className="text-2xl text-blue-600">
                          {currency} {amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      Please send proof of payment to{' '}
                      <a href="mailto:donations@restikirya.org" className="text-emerald-600 hover:underline">
                        donations@restikirya.org
                      </a>
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="w-full bg-emerald-600 text-white px-6 py-4 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Impact Statement */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <div className="bg-white rounded-xl p-8">
            <h3 className="text-xl text-gray-900 mb-4">Your Impact</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-3xl mb-2">📚</div>
                <div className="text-gray-700">$50 provides school supplies for 5 children</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🏥</div>
                <div className="text-gray-700">$100 sponsors a health camp for 50 people</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🌱</div>
                <div className="text-gray-700">$250 supports vocational training for 10 youth</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
