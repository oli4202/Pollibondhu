import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sprout, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/marketplace', label: 'Market prices' },
    { to: '/agriculture', label: 'Crop advice' },
    { to: '/services', label: 'Services' },
    { to: '/community', label: 'Community' },
  ];

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-[var(--text-primary)] relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-4 backdrop-blur-md bg-opacity-70 border-b border-[var(--glass-border)]" style={{ backgroundColor: 'var(--glass-bg)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-bold text-2xl tracking-tight text-white transition hover:scale-105">
            <div className="p-2 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-lg shadow-lg">
              <Sprout size={24} className="text-white" />
            </div>
            PolliBondhu
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to={user.role === 'ADMIN' ? '/admin' : user.role === 'PROVIDER' ? '/provider' : '/dashboard'}>
                  <button className="px-5 py-2 text-sm font-medium text-white bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-full hover:bg-[rgba(255,255,255,0.2)] transition-all shadow-md">Dashboard</button>
                </Link>
                <button onClick={handleLogout} className="px-5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">Login</Link>
                <Link to="/register">
                  <button className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full hover:shadow-lg hover:scale-105 transition-all">
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden absolute top-[100%] left-0 w-full glass-panel mt-2 p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="block text-lg font-medium text-white py-2 border-b border-[rgba(255,255,255,0.1)]" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/login" className="w-full text-center py-3 rounded-lg bg-[rgba(255,255,255,0.1)] text-white font-medium" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="w-full text-center py-3 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-medium shadow-md" onClick={() => setMobileOpen(false)}>Register</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--glass-border)] pt-16 pb-8 relative z-10 glass-panel !rounded-none !border-x-0 !border-b-0" style={{ backgroundColor: '#0f172a' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-white">
            <div className="col-span-1">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-500 rounded-lg">
                  <Sprout size={20} className="text-white" />
                </div>
                <span className="font-bold text-xl text-white tracking-wide">PolliBondhu</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Digital services platform for rural citizens of Bangladesh. Powered by the Ministry of Digital Affairs.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-white">Services</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link to="/agriculture" className="hover:text-emerald-400 transition">Agriculture</Link></li>
                <li><Link to="/services" className="hover:text-emerald-400 transition">Citizen Services</Link></li>
                <li><Link to="/services" className="hover:text-emerald-400 transition">Land Records</Link></li>
                <li><Link to="/services" className="hover:text-emerald-400 transition">NID Services</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white">Support</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Report Issue</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Feedback</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white">Legal</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Terms of Use</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Accessibility</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">RTI</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-sm text-slate-400 flex justify-between items-center">
            <p>© 2026 Metropolitan University — SWE-382</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
