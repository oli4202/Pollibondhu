import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/feedback/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Eye, EyeOff, HeartPulse, GraduationCap, Wheat } from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      addToast('Login successful');
      try {
        const params = new URLSearchParams(location.search);
        const next = params.get('next');
        if (next) {
          navigate(next);
        } else {
          const roles = loggedInUser?.roles || [];
          const role = loggedInUser?.role;
          const allRoles = [...new Set([...roles, role].filter(Boolean))];
          if (allRoles.includes('ADMIN') || allRoles.includes('OFFICER')) {
            navigate('/admin');
          } else if (allRoles.some(r => ['PROVIDER', 'SERVICE_PROVIDER', 'GOV_SERVICE_PROVIDER'].includes(r))) {
            navigate('/provider');
          } else {
            navigate('/dashboard');
          }
        }
      } catch {
        navigate('/dashboard');
      }
    } catch {
      addToast('Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSocialLogin(provider: 'Google' | 'Facebook') {
    addToast(`${provider} sign-in needs OAuth credentials before it can be enabled.`, 'error');
  }

  return (
    <div className="mx-auto grid max-w-5xl items-stretch overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl lg:grid-cols-[.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-earth-900 p-10 text-white lg:block">
        {/* Background image */}
        <img
          src="https://tse3.mm.bing.net/th/id/OIP.rCXl0qzvWJe4frGftb5VGgHaE6?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Green overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-polli-800/85 via-polli-700/80 to-emerald-800/85" />
        {/* Decorative blurs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex h-full flex-col">
          <BrandMark compact />

          <p className="mt-10 text-sm font-semibold uppercase tracking-[.2em] text-polli-200">Connected village life</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">আপনার গ্রামের সেবাগুলো, হাতের মুঠোয়।</h1>
          <p className="mt-4 text-sm leading-6 text-polli-100/80">Agriculture, health, education, emergency help, and your community — one simple place to begin.</p>

          <div className="mt-auto grid grid-cols-3 gap-3 pt-10">
            {[[Wheat, 'কৃষি'], [HeartPulse, 'স্বাস্থ্য'], [GraduationCap, 'শিক্ষা']].map(([Icon, label]) => {
              const ServiceIcon = Icon as typeof Wheat;
              return (
                <div key={label as string} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-sm hover:bg-white/15 transition-colors">
                  <ServiceIcon className="mx-auto text-amber-300" size={22} />
                  <p className="mt-2 text-xs font-medium">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
      <div className="p-6 sm:p-10">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center">
            <div className="mb-5 flex justify-center lg:hidden"><BrandMark /></div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p className="mt-1 text-sm text-earth-500">Sign in to your PolliBondhu account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full rounded-xl border border-earth-200 bg-white px-3 py-3 text-sm text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-polli-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                    className="w-full rounded-xl border border-earth-200 bg-white px-3 py-3 pr-11 text-sm text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-polli-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 text-earth-500 hover:text-polli-700">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-earth-600">
                  <input type="checkbox" className="rounded border-earth-300 text-polli-600 focus:ring-polli-500" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-polli-600 hover:text-polli-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign In'}</Button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-earth-400">
              <span className="h-px flex-1 bg-earth-200" />
              or continue with
              <span className="h-px flex-1 bg-earth-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => handleSocialLogin('Google')} className="flex items-center justify-center gap-2 rounded-xl border border-earth-200 bg-white px-3 py-3 text-sm font-semibold text-earth-700 transition hover:border-polli-300 hover:bg-polli-50">
                <GoogleLogo /> Google
              </button>
              <button type="button" onClick={() => handleSocialLogin('Facebook')} className="flex items-center justify-center gap-2 rounded-xl border border-earth-200 bg-white px-3 py-3 text-sm font-semibold text-earth-700 transition hover:border-polli-300 hover:bg-polli-50">
                <FacebookLogo /> Facebook
              </button>
            </div>
            <p className="text-sm text-earth-500 text-center mt-4">
              Don't have an account? <Link to="/register" className="text-polli-700 font-medium hover:underline">Register</Link>
            </p>
            <div className="mt-4 p-3 bg-earth-50 rounded-lg text-xs text-earth-500">
              <p className="font-medium mb-1">Demo accounts:</p>
              <p>Admin: admin@pollibondhu.test / admin123</p>
              <p>User: rahim@pollibondhu.test / user123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.8 12.23c0-.71-.06-1.23-.2-1.78H12v3.41h5.64c-.11.85-.72 2.13-2.08 2.99l-.02.11 3.02 2.34.21.02c1.93-1.78 3.03-4.4 3.03-7.09Z"/><path fill="#34A853" d="M12 22c2.76 0 5.08-.91 6.77-2.47l-3.23-2.5c-.86.6-2.02 1.02-3.54 1.02-2.7 0-4.99-1.78-5.8-4.24l-.1.01-3.14 2.43-.03.1A10.23 10.23 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.2 13.81A6.18 6.18 0 0 1 5.87 12c0-.63.12-1.24.32-1.81l-.01-.12-3.18-2.47-.1.05A10 10 0 0 0 2 12c0 1.57.38 3.05 1.05 4.35l3.15-2.54Z"/><path fill="#EA4335" d="M12 5.95c1.92 0 3.22.83 3.96 1.53l2.89-2.82C17.07 3 14.76 2 12 2a10.23 10.23 0 0 0-8.98 5.65l3.29 2.54C7.03 7.73 9.3 5.95 12 5.95Z"/></svg>;
}

function FacebookLogo() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.97.94-1.97 1.9v2.28h3.35l-.54 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07Z"/></svg>;
}
