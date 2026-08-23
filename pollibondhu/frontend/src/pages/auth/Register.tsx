import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/feedback/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';

export default function Register() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', role: 'USER' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      addToast('Account created successfully');
      navigate('/dashboard');
    } catch {
      addToast('Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><BrandMark /></div>
          <CardTitle>Create Account</CardTitle>
          <p className="text-sm text-earth-500 mt-1">Join the PolliBondhu community</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Full Name</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full rounded-xl border border-earth-200 bg-white px-3 py-3 text-sm text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-polli-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-earth-200 bg-white px-3 py-3 text-sm text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-polli-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-earth-200 bg-white px-3 py-3 text-sm text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-polli-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Password</label>
              <div className="relative"><input type={showPassword ? 'text' : 'password'} required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-earth-200 bg-white px-3 py-3 pr-11 text-sm text-earth-900 focus:outline-none focus:ring-2 focus:ring-polli-500" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 text-earth-500 hover:text-polli-700">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-earth-200 bg-white px-3 py-3 text-sm text-earth-900 focus:outline-none focus:ring-2 focus:ring-polli-500">
                <option value="USER">Farmer / User</option>
                <option value="PROVIDER">Service Provider</option>
              </select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating...' : 'Create Account'}</Button>
          </form>
          <p className="text-sm text-earth-500 text-center mt-4">
            Already have an account? <Link to="/login" className="text-polli-700 font-medium hover:underline">Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
