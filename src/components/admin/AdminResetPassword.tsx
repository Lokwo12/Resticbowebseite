import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  KeyRound
} from 'lucide-react';
import { Button } from '../ui/button';
import { SEO } from '../SEO';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function AdminResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [siteLogo, setSiteLogo] = useState('/logo.png');
  const [siteName, setSiteName] = useState('RESTI CBO');
  const [tagline, setTagline] = useState('Refugee Empowerment for Sustainable Transformation Initiative');
  const navigate = useNavigate();

  useEffect(() => {
    // Load dynamic site settings (logo, name, tagline)
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.settings?.general) {
          const l = data.settings.general.logoUrl;
          if (l && !l.includes('figma:asset')) setSiteLogo(l);
          if (data.settings.general.siteName) setSiteName(data.settings.general.siteName.trim());
          if (data.settings.general.tagline) setTagline(data.settings.general.tagline);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listen to Supabase auth state change for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setLinkError(null);
        setCheckingSession(false);
      }
    });

    const verifyRecoveryState = async () => {
      // 1. Inspect URL hash and query string for Supabase auth errors
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
      const searchParams = new URLSearchParams(search);

      const errorParam = hashParams.get('error') || searchParams.get('error');
      const errorDescParam = hashParams.get('error_description') || searchParams.get('error_description');

      if (errorParam) {
        const decodedMsg = errorDescParam 
          ? decodeURIComponent(errorDescParam.replace(/\+/g, ' '))
          : 'This password recovery link is invalid or has expired.';
        if (isMounted) {
          setLinkError(decodedMsg);
          setCheckingSession(false);
        }
        return;
      }

      // 2. Check if a code parameter exists (PKCE flow)
      const code = searchParams.get('code');
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session) {
            if (isMounted) {
              setLinkError(null);
              setCheckingSession(false);
            }
            return;
          } else if (error) {
            if (isMounted) {
              setLinkError(error.message || 'The password reset link is invalid or has expired.');
              setCheckingSession(false);
            }
            return;
          }
        } catch (err: any) {
          console.error('Error exchanging code for session:', err);
        }
      }

      // 3. Check if a valid session already exists or was set from the recovery token
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (isMounted) {
            setLinkError(null);
            setCheckingSession(false);
          }
          return;
        }

        // Give the Supabase client up to 1 second to parse tokens from hash/code if present
        const hasTokens = hash.includes('access_token') || hash.includes('refresh_token') || search.includes('code=');
        if (hasTokens) {
          setTimeout(async () => {
            if (!isMounted) return;
            const { data: { session: delayedSession } } = await supabase.auth.getSession();
            if (delayedSession) {
              setLinkError(null);
            } else {
              setLinkError('Unable to authenticate the recovery session. The link may have expired.');
            }
            setCheckingSession(false);
          }, 1000);
        } else {
          // No tokens in URL and no active session
          if (isMounted) {
            setLinkError('No valid password recovery token was found. Please request a new password reset link.');
            setCheckingSession(false);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setLinkError(err?.message || 'Error validating recovery link.');
          setCheckingSession(false);
        }
      }
    };

    verifyRecoveryState();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Automatic countdown and redirect after successful password reset
  useEffect(() => {
    if (!isSuccess) return;

    if (countdown <= 0) {
      navigate('/admin');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, countdown, navigate]);

  // Password requirement validation helpers
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Calculate strength score (0-4)
  const strengthScore = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'Empty', color: 'bg-slate-200' };
    if (strengthScore <= 1) return { label: 'Weak', color: 'bg-red-500' };
    if (strengthScore === 2) return { label: 'Fair', color: 'bg-amber-500' };
    if (strengthScore === 3) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-emerald-600' };
  };

  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      toast.error('Password must contain uppercase letters, lowercase letters, and numbers.');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Clean up the recovery session so administrator signs in cleanly with the new password
      try {
        await supabase.auth.signOut();
      } catch {}

      setIsSuccess(true);
      toast.success('Password updated successfully!');
    } catch (err: any) {
      console.error('Password reset error:', err);
      toast.error(err.message || 'Failed to update password. Please try again or request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      <SEO 
        title="Reset Administrator Password | RESTI CBO"
        description="Reset your RESTI CBO administrator account password securely."
      />

      {/* Decorative ambient background glows matching Admin Portal */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 border border-slate-100 p-6 sm:p-8">
          {/* Prominent Logo & Identity Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center mb-3.5 hover:shadow-md transition-all duration-300">
              <img
                src={siteLogo || '/logo.png'}
                alt={`${siteName} Logo`}
                className="h-20 sm:h-24 w-auto max-w-[200px] object-contain block"
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {siteName}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-xs mt-1 leading-snug">
              {tagline}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 border border-emerald-200/70 rounded-full text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Password Recovery</span>
            </div>
          </div>

          {/* Conditional Views */}
          {checkingSession ? (
            /* Loading State */
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-700">Verifying secure recovery link...</p>
              <p className="text-xs text-slate-400 mt-1">Please wait a moment while we validate your token.</p>
            </div>
          ) : linkError ? (
            /* Invalid or Expired Link State */
            <div className="py-4 text-center">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-xs">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Recovery Link Invalid or Expired</h2>
              <div className="text-sm text-slate-600 leading-relaxed mb-6 bg-red-50/60 p-3.5 rounded-xl border border-red-100 text-left">
                {linkError}
              </div>
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl shadow-md font-semibold text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Admin Sign In
                </Button>
                <p className="text-xs text-slate-500">
                  You can request a new reset link from the "Forgot Password?" option on the login page.
                </p>
              </div>
            </div>
          ) : isSuccess ? (
            /* Success State */
            <div className="py-4 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Password Reset Complete!</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Your administrator password has been updated securely. You can now sign in with your new credentials.
              </p>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl mb-6 text-xs text-emerald-800 font-medium flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Redirecting to Admin Portal in {countdown} second{countdown === 1 ? '' : 's'}...</span>
              </div>

              <Button
                type="button"
                onClick={() => navigate('/admin')}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl shadow-md font-semibold text-sm flex items-center justify-center gap-2"
              >
                <span>Sign In to Admin Portal Now</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            /* Password Reset Form */
            <div>
              <div className="mb-6 pt-4 border-t border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  Set New Password
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm font-normal mt-0.5 leading-relaxed">
                  Enter your new password below. Make sure it satisfies all security requirements.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative rounded-xl shadow-xs group">
                    <div 
                      className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-200"
                      style={{ left: '14px' }}
                    >
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      className="w-full pl-11 pr-11 py-2.5 sm:py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400 font-medium text-slate-800 text-sm focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-emerald-600 transition-colors duration-200 focus:outline-none"
                      style={{ right: '14px' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-xl shadow-xs group">
                    <div 
                      className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-200"
                      style={{ left: '14px' }}
                    >
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      className="w-full pl-11 pr-11 py-2.5 sm:py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400 font-medium text-slate-800 text-sm focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-emerald-600 transition-colors duration-200 focus:outline-none"
                      style={{ right: '14px' }}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Password strength:</span>
                      <span className="font-semibold text-slate-700">{getStrengthLabel().label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strengthScore >= step ? getStrengthLabel().color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirement Checklist */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <span className="font-semibold text-slate-700 block">Security Requirements:</span>
                  <div className="grid grid-cols-1 gap-1.5 text-slate-600">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                      <span>At least 8 characters long</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase && hasLowercase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {hasUppercase && hasLowercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Uppercase & lowercase letters (A-Z, a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                      <span>At least one number (0-9)</span>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 font-medium' : 'text-red-500'}`}>
                        {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-red-500" />}
                        <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold text-sm tracking-wide mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </div>
                  ) : (
                    'Update Administrator Password'
                  )}
                </Button>

                {/* Back Link */}
                <div className="pt-3 text-center">
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Administrator Login</span>
                  </Link>
                </div>
              </form>
            </div>
          )}

          {/* Secondary Trust & Certification Badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-1.5 text-center">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Registered Community-Based Organization</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Kiryandongo District, Uganda • 256-Bit SSL Encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
