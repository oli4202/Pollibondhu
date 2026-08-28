import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BookOpen, CloudSun, Droplets, FileText, MapPin, UserRound, Wind, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

type Weather = { district: string; temperature: number; condition: string; humidity: number; rainfall: number };
const quickLinks = [
  { label: 'Crop Advisory', note: 'Guidance for your field', to: '/agriculture', emoji: '🌱', color: '#00A63C' },
  { label: 'Citizen Services', note: 'Find local support', to: '/services', emoji: '🏛️', color: '#2463EB' },
  { label: 'Community Post', note: 'Ask your neighbours', to: '/community', emoji: '💬', color: '#FF9700' },
  { label: 'My Profile', note: 'Keep details current', to: '/dashboard/profile', emoji: '👤', color: '#980FF5' },
];
const initialAnnouncements = [
  { id: 1, type: 'Agriculture', badgeClass: 'bg-emerald-100 text-emerald-700', text: 'Boro paddy subsidy applications are open until Dec 31.' },
  { id: 2, type: 'Citizen', badgeClass: 'bg-blue-100 text-blue-700', text: 'New smart NID card distribution is available locally.' },
  { id: 3, type: 'Alert', badgeClass: 'bg-rose-100 text-rose-700', text: 'Protect your crops if heavy rain arrives tonight.' },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => { api.get('/agriculture/weather').then(res => setWeather(res.data.data)).catch(() => undefined); }, []);
  useEffect(() => {
    const loadActivity = () => api.get('/users/activity').then(res => setActivities(res.data.data || [])).catch(() => undefined);
    loadActivity();
    const timer = window.setInterval(loadActivity, 10000);
    return () => window.clearInterval(timer);
  }, []);
  
  const district = user?.district || weather?.district || 'Your district';
  const completion = [user?.full_name, user?.email, user?.phone, user?.district].filter(Boolean).length * 25;

  return <div className="mx-auto max-w-6xl space-y-5 text-earth-900">
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 to-green-600 px-6 py-7 text-white shadow-sm md:px-8"><div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/10" /><div className="absolute right-20 bottom-[-60px] h-36 w-36 rounded-full bg-emerald-300/25" /><div className="relative"><p className="text-sm text-emerald-100">Good afternoon,</p><h1 className="mt-1 text-3xl font-bold">{user?.full_name || 'PolliBondhu member'}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-50"><MapPin size={15} /> {district}</p></div></section>
    
    <div className="grid gap-5 lg:grid-cols-[1.7fr_.8fr]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold">Quick Services</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map(({ label, note, to, emoji, color }) => 
              <Link key={label} to={to} style={{ backgroundColor: color }} className="group rounded-xl p-4 text-white shadow-sm transition hover:-translate-y-1 hover:brightness-95 hover:shadow-lg flex flex-col justify-center items-center text-center">
                <span aria-hidden="true" className="block text-3xl leading-none mb-3">{emoji}</span>
                <p className="text-sm font-bold">{label}</p>
              </Link>
            )}
          </div>
        </section>
        
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <b className="text-2xl text-blue-600">3</b>
            <p className="mt-1 text-xs font-semibold text-earth-700">Applications</p>
            <span className="text-[10px] text-earth-400">1 pending</span>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <b className="text-2xl text-emerald-600">12</b>
            <p className="mt-1 text-xs font-semibold text-earth-700">Services used</p>
            <span className="text-[10px] text-earth-400">this month</span>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <b className="text-2xl text-amber-600">5</b>
            <p className="mt-1 text-xs font-semibold text-earth-700">Forum posts</p>
            <span className="text-[10px] text-earth-400">2 new replies</span>
          </div>
        </section>
        
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Recent activity</h2>
            <Link className="text-xs font-semibold text-emerald-700 hover:underline" to="/community">View all</Link>
          </div>
          <div className="mt-3 divide-y divide-earth-100">
            {activities.length === 0 ? <p className="py-3 text-sm text-earth-400">No recent activity.</p> : activities.map((activity: any, index) => {
              const color = index % 2 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';
              return <div key={activity.activity_id} className="flex items-center gap-3 py-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${color}`}>
                  <FileText size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{activity.action}</p>
                  <p className="truncate text-xs text-earth-400">{new Date(activity.created_at).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${color}`}>{activity.entity_type.replace('_', ' ')}</span>
              </div>
            })}
          </div>
        </section>
      </div>
      
      <aside className="space-y-5">
        <section className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-sm">
          <p className="flex items-center gap-1 text-xs text-blue-100"><MapPin size={13} /> {weather?.district || district}</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <strong className="text-4xl">{weather?.temperature ?? 28}°C</strong>
              <p className="mt-1 text-sm font-semibold">{weather?.condition || 'Partly Cloudy'}</p>
            </div>
            <CloudSun size={58} className="text-amber-200" />
          </div>
          <div className="mt-5 flex gap-5 border-t border-white/25 pt-4 text-xs">
            <span className="flex items-center gap-1"><Droplets size={14} /> {weather?.humidity ?? 78}% humidity</span>
            <span className="flex items-center gap-1"><Wind size={14} /> {weather?.rainfall ?? 12}mm rain</span>
          </div>
        </section>
        
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Bell size={16} className="text-rose-500" /> Announcements</h2>
            {announcements.length > 0 && (
              <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{announcements.length}</span>
            )}
          </div>
          <div className="mt-4 space-y-4 border-l-2 border-emerald-200 pl-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-500">No new announcements.</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="relative group">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.badgeClass}`}>{a.type}</span>
                    <button 
                      onClick={() => setAnnouncements(announcements.filter(item => item.id !== a.id))}
                      className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs font-medium leading-5 pr-4">{a.text}</p>
                </div>
              ))
            )}
          </div>
        </section>
        
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <UserRound size={20}/>
            </div>
            <div>
              <p className="text-sm font-bold">{user?.full_name}</p>
              <p className="text-[11px] text-earth-400">Profile Completion</p>
            </div>
            <div className="ml-auto font-bold text-sm">{completion}%</div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completion}%` }} />
          </div>
        </section>
      </aside>
    </div>
  </div>;
}
