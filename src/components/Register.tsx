import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Heart, User, Eye, EyeOff, Phone, MapPin, Globe, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

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
  'Norway',
  'Sweden',
  'Denmark',
  'Switzerland',
  'South Africa',
  'Nigeria',
  'Ireland',
  'Belgium',
  'Other'
];

export function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Uganda');
  const [postalCode, setPostalCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your first and last name');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!address.trim() || !city.trim() || !country.trim()) {
      toast.error('Please complete your address details (Street, City, Country)');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: fullName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            country: country.trim(),
            postal_code: postalCode.trim(),
            role: 'donor', // Explicitly marking this user as a donor
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        toast.success('Registration successful! Welcome to the RESTI Donor Community.');
        navigate('/donor/dashboard');
      } else {
        // If session is null, email confirmation is required by Supabase auth
        toast.success('Registration successful! Please check your email to confirm your donor account before logging in.', {
          duration: 6000,
        });
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to register donor account');
    } finally {
      setLoading(false);
    }
  };

  const lbl = 'block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5';
  const inp = 'block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-gray-900 bg-white placeholder:text-gray-400 transition-all outline-none';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shadow-2xs">
            <Heart className="w-6 h-6 text-emerald-600" fill="currentColor" />
          </div>
        </div>
        <div className="text-center mt-4">
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold uppercase tracking-widest mb-2">
            DONOR REGISTRATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-gray-900">
            Create Your RESTI Donor Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Your donation helps refugees and host communities access skills, strengthen livelihoods, and build a more resilient future.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Already have a donor account?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-500 underline">
              Sign in to donor portal
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-xl shadow-emerald-950/5 rounded-3xl border border-slate-100">
          <form className="space-y-5" onSubmit={handleRegister}>

            {/* Name Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={lbl}>
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`${inp} pl-10`}
                    placeholder="First name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className={lbl}>
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`${inp} pl-10`}
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details: Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className={lbl}>
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inp} pl-10`}
                    placeholder="donor@example.com"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">For donation receipts & statements</p>
              </div>

              <div>
                <label htmlFor="phone" className={lbl}>
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${inp} pl-10`}
                    placeholder="+256 700 000000"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Mobile Money or SMS updates</p>
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label htmlFor="address" className={lbl}>
                Street Address / P.O. Box <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={16} />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`${inp} pl-10`}
                  placeholder="Plot number, Street or P.O. Box"
                />
              </div>
            </div>

            {/* City, Postal Code, Country */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className={lbl}>
                  City / Town <span className="text-rose-500">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inp}
                  placeholder="e.g. Kampala / Kiryandongo"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className={lbl}>
                  Postal / ZIP Code
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={inp}
                  placeholder="e.g. 256 / 90210"
                />
              </div>

              <div>
                <label htmlFor="country" className={lbl}>
                  Country <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="country"
                    name="country"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={`${inp} appearance-none cursor-pointer pr-8`}
                  >
                    {COMMON_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <Globe size={15} />
                  </div>
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label htmlFor="password" className={lbl}>
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inp} pl-10 pr-10`}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={lbl}>
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inp} pl-10 pr-10`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Security & Privacy Notice */}
            <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl flex items-start gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-900">Security &amp; Privacy is Important to Us</p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                  Your details will be kept securely and will not be shared with third parties. Please see our{' '}
                  <Link to="/privacy" className="text-emerald-700 underline font-semibold hover:text-emerald-800">
                    Privacy Notice
                  </Link>{' '}
                  and{' '}
                  <Link to="/cookies" className="text-emerald-700 underline font-semibold hover:text-emerald-800">
                    Cookies Policy
                  </Link>{' '}
                  for more information.
                </p>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Complete Donor Registration <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
