import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Heart } from 'lucide-react';
import { Button } from './ui/button';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address first to reset your password.');
      return;
    }
    
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendConfirmation = async (emailAddress: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailAddress,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      if (error) throw error;
      toast.success('Confirmation email resent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend confirmation email');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Successfully logged in!');
      navigate('/donor/dashboard');
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        toast.error('Invalid email or password. If you recently created an account, please confirm your email address first.', {
          duration: 8000,
          action: {
            label: 'Resend Email',
            onClick: () => handleResendConfirmation(email)
          }
        });
      } else {
        toast.error(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-emerald-600" fill="currentColor" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold font-heading tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
            create a new donor account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-emerald-900/5 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {resetLoading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign in <ArrowRight className="ml-2 w-4 h-4" />
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
