import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sprout, Menu, X, ArrowRight, Facebook, Twitter, Youtube, Phone, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import NotificationBell from '@/components/notifications/NotificationBell';
import AiChatWidget from '@/components/chat/AiChatWidget';
import AiInstantHelp from '@/components/ai/AiInstantHelp';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/marketplace', label: 'Market prices' },
    { to: '/agriculture', label: 'Agriculture' },
    { to: '/services', label: 'Services' },
    { to: '/community', label: 'Community' },
    { to: '/ngos', label: 'NGOs' },
  ];

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Skip to content — Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-earth-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-earth-900 hover:text-polli-700 transition-colors">
            <div className="p-1.5 bg-polli-600 rounded-lg">
              <Sprout size={20} className="text-white" />
            </div>
            <span>PolliBondhu</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-earth-600 hover:text-polli-700 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={
                    (user.roles?.includes('SUPER_ADMIN') || user.roles?.includes('SUB_ADMIN') || user.roles?.includes('OFFICER') || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')
                      ? '/admin'
                      : user.role === 'PROVIDER' || user.role === 'SERVICE_PROVIDER'
                      ? '/provider'
                      : '/dashboard'
                  }
                >
                  <button className="px-4 py-2 text-sm font-medium text-white bg-polli-700 rounded-lg hover:bg-polli-800 transition-colors">
                    Dashboard
                  </button>
                </Link>
                <NotificationBell />
                <button onClick={() => setShowLogoutConfirm(true)} className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-earth-600 hover:text-earth-800 transition-colors">
                  Login
                </Link>
                <Link to="/register">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-polli-600 rounded-lg hover:bg-polli-700 transition-colors">
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-earth-600 hover:bg-earth-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-earth-100 bg-white animate-slide-down">
            <nav className="px-4 py-3 space-y-1" aria-label="Mobile navigation">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="block px-3 py-2.5 text-sm font-medium text-earth-700 rounded-lg hover:bg-earth-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-earth-100 pt-3 mt-3 space-y-2">
                {user ? (
                  <>
                    <Link
                      to={
                        (user.roles?.includes('SUPER_ADMIN') || user.roles?.includes('SUB_ADMIN') || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')
                          ? '/admin'
                          : user.role === 'PROVIDER' || user.role === 'SERVICE_PROVIDER'
                          ? '/provider'
                          : '/dashboard'
                      }
                      className="block w-full text-center px-3 py-2.5 rounded-lg bg-polli-600 text-white text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <div className="flex gap-2">
                      <div className="flex-1 flex justify-center"><NotificationBell /></div>
                      <button
                        onClick={() => { setShowLogoutConfirm(true); setMobileOpen(false); }}
                        className="flex-1 text-center px-3 py-2.5 rounded-lg text-red-500 text-sm font-medium hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block w-full text-center px-3 py-2.5 rounded-lg border border-earth-200 text-earth-700 text-sm font-medium hover:bg-earth-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full text-center px-3 py-2.5 rounded-lg bg-polli-600 text-white text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full relative flex flex-col">
        <Outlet />
        <AiChatWidget />
        <AiInstantHelp page={window.location.pathname} />
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        {/* Newsletter / CTA band */}
        <div className="bg-gradient-to-r from-polli-700 via-polli-600 to-emerald-600">
          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h3 className="text-xl md:text-2xl font-bold">Stay updated with PolliBondhu</h3>
              <p className="text-polli-100 text-sm mt-1">Get the latest on new services, market prices, and community updates.</p>
            </div>
            <form
              className="flex w-full md:w-auto" onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-5 py-3 rounded-l-xl bg-white/15 backdrop-blur border border-white/25 text-white placeholder:text-polli-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-r-xl text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                Subscribe <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Main footer */}
        <div className="bg-earth-900 text-white relative overflow-hidden">
          {/* Subtle decorative gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-polli-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 pt-14 pb-8">
            {/* Top row: brand + columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              {/* Brand column */}
              <div className="md:col-span-4 space-y-5">
                <Link to="/" className="inline-flex items-center gap-2.5 group">
                  <div className="p-2 bg-polli-600 rounded-xl group-hover:bg-polli-500 transition-colors">
                    <Sprout size={20} className="text-white" />
                  </div>
                  <span className="font-bold text-xl">PolliBondhu</span>
                </Link>
                <p className="text-sm text-earth-400 leading-relaxed max-w-xs">
                  Your digital gateway to government services, agriculture support, and community resources — empowering rural Bangladesh.
                </p>
                {/* Social links */}
                <div className="flex items-center gap-3">
                  {[
                    { icon: <Facebook size={18} />, href: '#', label: 'Facebook' },
                    { icon: <Twitter size={18} />, href: '#', label: 'Twitter' },
                    { icon: <Youtube size={18} />, href: '#', label: 'YouTube' },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="p-2.5 rounded-xl bg-earth-800 text-earth-400 hover:bg-polli-600 hover:text-white transition-all"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
                {/* Contact info */}
                <div className="space-y-2 text-sm text-earth-400">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-polli-500" />
                    <span>+880 1XXX-XXXXXX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-polli-500" />
                    <span>support@polliBondhu.gov.bd</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-polli-500" />
                    <span>Dhaka, Bangladesh</span>
                  </div>
                </div>
              </div>

              {/* Link columns */}
              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm text-white mb-4 uppercase tracking-wider">Services</h4>
                <ul className="space-y-2.5 text-sm text-earth-400">
                  {[
                    { to: '/agriculture', label: 'Agriculture' },
                    { to: '/services', label: 'Gov Services' },
                    { to: '/healthcare', label: 'Healthcare' },
                    { to: '/village-market', label: 'Village Market' },
                    { to: '/marketplace', label: 'Market Prices' },
                  ].map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="hover:text-polli-400 transition-colors hover:translate-x-1 inline-block">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm text-white mb-4 uppercase tracking-wider">Resources</h4>
                <ul className="space-y-2.5 text-sm text-earth-400">
                  {[
                    { to: '/education', label: 'Education' },
                    { to: '/ngos', label: 'NGOs & Social' },
                    { to: '/community', label: 'Community' },
                    { to: '/help', label: 'Help Center' },
                    { to: '/emergency', label: 'Emergency' },
                  ].map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="hover:text-polli-400 transition-colors hover:translate-x-1 inline-block">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm text-white mb-4 uppercase tracking-wider">Support</h4>
                <ul className="space-y-2.5 text-sm text-earth-400">
                  {[
                    { to: '/contact', label: 'Contact Us' },
                    { to: '/report', label: 'Report Issue' },
                    { to: '/feedback', label: 'Feedback' },
                    { to: '/faq', label: 'FAQ' },
                  ].map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="hover:text-polli-400 transition-colors hover:translate-x-1 inline-block">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm text-white mb-4 uppercase tracking-wider">Legal</h4>
                <ul className="space-y-2.5 text-sm text-earth-400">
                  {[
                    { to: '/privacy', label: 'Privacy Policy' },
                    { to: '/terms', label: 'Terms of Use' },
                    { to: '/accessibility', label: 'Accessibility' },
                    { to: '/rti', label: 'RTI' },
                  ].map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="hover:text-polli-400 transition-colors hover:translate-x-1 inline-block">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 pt-6 border-t border-earth-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-earth-500">
              <p>&copy; {new Date().getFullYear()} PolliBondhu — Smart Village Platform. All rights reserved.</p>
              <div className="flex items-center gap-1">
                <span>Built with</span>
                <span className="text-rose-400">❤</span>
                <span>for Rural Bangladesh</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log out"
        message="Are you sure you want to log out? You will need to log in again to access your account."
        confirmLabel="Log Out"
        cancelLabel="Stay"
        variant="danger"
      />
    </div>
  );
}
