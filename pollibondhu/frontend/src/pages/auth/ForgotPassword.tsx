import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/feedback/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';
import api from '@/utils/api';

export default function ForgotPassword() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      addToast(res.data.data?.message || 'Reset code sent to your email', 'success');
      setSent(true);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to send reset code', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) return;
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      addToast('Password reset successful! You can now log in.', 'success');
      navigate('/login');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to reset password', 'error');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl items-stretch overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl lg:grid-cols-[.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-earth-900 p-10 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(76,169,118,.45),transparent_16rem),radial-gradient(circle_at_90%_80%,rgba(245,190,78,.25),transparent_17rem)]" />
        <div className="relative flex h-full flex-col">
          <BrandMark compact />
          <div className="mt-10">
            <h1 className="text-3xl font-bold leading-tight">Reset your password</h1>
            <p className="mt-4 text-sm leading-6 text-earth-200">
              Don't worry — it happens to the best of us. Enter your email and we'll help you get back in.
            </p>
          </div>
          <div className="mt-auto">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-earth-200">Need help?</p>
              <p className="mt-1 text-xs text-earth-300">
                Contact support at <span className="text-polli-400">support@pollibondhu.com</span>
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="p-6 sm:p-10">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center">
            <div className="mb-5 flex justify-center lg:hidden"><BrandMark /></div>
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-polli-600 hover:text-polli-700 mb-3">
              <ArrowLeft size={14} /> Back to Login
            </Link>
            <CardTitle className="text-2xl">
              {sent ? (otpVerified ? 'Set New Password' : 'Enter Reset Code') : 'Forgot Password?'}
            </CardTitle>
            <p className="mt-1 text-sm text-earth-500">
              {sent
                ? otpVerified
                  ? 'Enter your new password below.'
                  : 'Enter the 6-digit code sent to your email.'
                : "Enter your email address and we'll send you a reset code."
              }
            </p>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-earth-200 bg-white pl-10 pr-3 py-3 text-sm text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-polli-500"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </form>
            ) : !otpVerified ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (otp.length >= 6) setOtpVerified(true);
                else addToast('Please enter the 6-digit code', 'error');
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Reset Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full rounded-xl border border-earth-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono text-earth-900 placeholder:text-earth-300 focus:outline-none focus:ring-2 focus:ring-polli-500"
                  />
                  <p className="mt-2 text-xs text-earth-400 text-center">
                    Check your email inbox (and spam folder)
                  </p>
                </div>
                <Button type="submit" disabled={otp.length < 6} className="w-full">
                  Verify Code
                </Button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full text-center text-sm text-polli-600 hover:text-polli-700 font-medium"
                >
                  {loading ? 'Sending...' : 'Resend code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-earth-200 bg-white px-3 py-3 text-sm text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-polli-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    minLength={6}
                    required
                    className={`w-full rounded-xl border bg-white px-3 py-3 text-sm text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-earth-200 focus:ring-polli-500'
                    }`}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-xs text-green-700">
                  <CheckCircle size={16} />
                  Code verified successfully
                </div>
                <Button type="submit" disabled={resetLoading || !newPassword || !confirmPassword} className="w-full">
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}

            <p className="text-sm text-earth-500 text-center mt-6">
              Remember your password? <Link to="/login" className="text-polli-700 font-medium hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
