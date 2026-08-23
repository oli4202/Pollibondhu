import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import RequireAuthButton from '@/components/auth/RequireAuthButton';
import { useToast } from '@/components/feedback/ToastProvider';

type Service = { title: string; bangla: string; description: string; time: string; fee: string; category: string; emoji: string; accent: string; badge?: string };
const services: Service[] = [
  { title: 'NID Services', bangla: 'জাতীয় পরিচয়পত্র', description: 'Apply for new NID, correct information, or replace a lost NID card.', time: '5–7 days', fee: 'Free', category: 'Government', emoji: '🪪', accent: 'border-blue-200 bg-blue-50', badge: 'Popular' },
  { title: 'Birth Certificate', bangla: 'জন্ম নিবন্ধন', description: 'Register a new birth or request correction of your birth certificate.', time: '5–7 days', fee: 'Free', category: 'Government', emoji: '👶', accent: 'border-amber-200 bg-amber-50' },
  { title: 'Land Records (Khatian)', bangla: 'ভূমি রেকর্ড', description: 'Check khatian, apply for a certified copy, or verify your land record.', time: '10–15 days', fee: '৳ 100', category: 'Land', emoji: '📜', accent: 'border-emerald-200 bg-emerald-50' },
  { title: 'Mutation (Namjari)', bangla: 'নামজারি', description: 'Apply for mutation after buying, inheriting, or gifting land.', time: '30–45 days', fee: '৳ 300', category: 'Land', emoji: '🏠', accent: 'border-orange-200 bg-orange-50', badge: 'New' },
  { title: 'Health Card', bangla: 'স্বাস্থ্য কার্ড', description: 'Get a government health card for free treatment at public hospitals.', time: '3–5 days', fee: 'Free', category: 'Healthcare', emoji: '🏥', accent: 'border-rose-200 bg-rose-50', badge: 'Free' },
  { title: 'Vaccination Record', bangla: 'টিকা রেকর্ড', description: 'Access or update vaccination records for children and adults.', time: '1–2 days', fee: 'Free', category: 'Healthcare', emoji: '💉', accent: 'border-blue-200 bg-blue-50' },
  { title: 'School Admission', bangla: 'স্কুল ভর্তি', description: 'Apply for admission to government primary and secondary schools online.', time: '7–14 days', fee: '৳ 100', category: 'Education', emoji: '🏫', accent: 'border-sky-200 bg-sky-50', badge: 'New' },
  { title: 'Scholarship', bangla: 'শিক্ষা বৃত্তি', description: 'Apply for primary, secondary, or higher education scholarships.', time: '15–30 days', fee: 'Free', category: 'Education', emoji: '🎓', accent: 'border-indigo-200 bg-indigo-50' },
  { title: 'Farming Subsidy', bangla: 'কৃষি ভর্তুকি', description: 'Apply for government subsidies on seeds and fertilizers.', time: '7-14 days', fee: 'Free', category: 'Agriculture', emoji: '🌾', accent: 'border-green-200 bg-green-50' },
  { title: 'NGO Support', bangla: 'এনজিও সহায়তা', description: 'Request micro-loans or rural development support from local NGOs.', time: '10-20 days', fee: 'Free', category: 'NGOs', emoji: '🤝', accent: 'border-teal-200 bg-teal-50' },
  { title: 'Bank Account Opening', bangla: 'ব্যাংক হিসাব', description: 'Open a mobile banking or rural bank account with zero deposit.', time: 'Instant', fee: 'Free', category: 'Banking', emoji: '🏦', accent: 'border-blue-200 bg-blue-50' },
  { title: 'Trade Licence', bangla: 'ট্রেড লাইসেন্স', description: 'Apply for a new trade licence or renew an existing business licence.', time: '7–14 days', fee: '৳ 500', category: 'Business', emoji: '🏬', accent: 'border-amber-200 bg-amber-50' },
  { title: 'Transport Ticket', bangla: 'পরিবহন টিকিট', description: 'Book bus or train tickets for regional transport.', time: 'Instant', fee: 'Varies', category: 'Transport', emoji: '🚌', accent: 'border-gray-200 bg-gray-50' },
  { title: 'Waste Collection', bangla: 'বর্জ্য সংগ্রহ', description: 'Request scheduled waste collection from your residence or business.', time: '2-3 days', fee: '৳ 50', category: 'Waste', emoji: '🗑️', accent: 'border-slate-200 bg-slate-50' },
  { title: 'Water Connection', bangla: 'পানির সংযোগ', description: 'Apply for a new clean water supply connection or tube-well installation.', time: '15-20 days', fee: '৳ 1000', category: 'Water', emoji: '🚰', accent: 'border-cyan-200 bg-cyan-50' },
  { title: 'Ration Card', bangla: 'রেশন কার্ড', description: 'Apply for a subsidized food ration card for low-income families.', time: '10-15 days', fee: 'Free', category: 'Food', emoji: '🍚', accent: 'border-orange-200 bg-orange-50' },
  { title: 'Local News Broadcast', bangla: 'স্থানীয় খবর', description: 'Subscribe to daily SMS or app notifications for local village news.', time: 'Instant', fee: 'Free', category: 'News', emoji: '📰', accent: 'border-zinc-200 bg-zinc-50' },
  { title: 'Emergency Ambulance', bangla: 'জরুরী অ্যাম্বুলেন্স', description: 'Request an emergency ambulance from the nearest health complex.', time: 'Instant', fee: 'Varies', category: 'Emergency', emoji: '🚑', accent: 'border-red-200 bg-red-50', badge: 'Active' },
  { title: 'Marketplace Stall', bangla: 'হাটের দোকান', description: 'Register for a stall in the weekly village market (Hat).', time: '3-5 days', fee: '৳ 200', category: 'Marketplace', emoji: '🛒', accent: 'border-fuchsia-200 bg-fuchsia-50' },
];


export default function ServicesPage() {
  const [filter, setFilter] = useState('All Services');
  const [selected, setSelected] = useState<Service | null>(null);
  const [requestType, setRequestType] = useState('New Application'); const [note, setNote] = useState('');
  const { addToast } = useToast();
  const visible = filter === 'All Services' ? services : services.filter(s => s.category === filter);
  function apply() { if (!selected) return; if (['Land Records', 'Mutation (Namjari)'].includes(selected.title) && !note.trim()) { addToast('Please add the purpose of your land application.', 'error'); return; } addToast(`${requestType} started for ${selected.title}`); setNote(''); setSelected(null); }
  // after-login action auto-open (e.g. apply intent saved by RequireAuthButton)
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('postAuthAction');
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (payload?.action === 'openService' && payload?.actionData?.title) {
        const found = services.find(s => s.title === payload.actionData.title);
        if (found) setSelected(found);
      }
      sessionStorage.removeItem('postAuthAction');
    } catch { }
  }, []);

  return <div className="mx-auto max-w-6xl px-5 py-10 text-earth-900"><header><h1 className="text-2xl font-bold">নাগরিক সেবা <span className="text-earth-400">— Citizen Services</span></h1><p className="mt-1 text-sm text-earth-500">Access government documents, certificates, and local benefits.</p></header>
    <section className="mt-7 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">My applications</h2><button className="text-xs font-bold text-emerald-700">Track all →</button></div><div className="mt-5 space-y-5">{[['Birth Certificate', 'APP-2024-1027', 'Applied: Dec 12, 2024', '67%', 'Processing'], ['Land Records (Khatian)', 'APP-2024-0081', 'Applied: Nov 28, 2024', '100%', 'Ready']].map(([name, id, date, progress, status]) => <div key={id}><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><div><b className="text-sm">{name}</b><span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{status}</span><p className="mt-1 font-mono text-[10px] text-earth-400">{id} · {date}</p></div><button className="font-bold text-emerald-700">Track →</button></div><div className="mt-2 h-1.5 rounded-full bg-earth-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: progress }} /></div></div>)}</div></section>
    
    <div className="mt-5 flex flex-wrap gap-2">
      {[
        { name: 'All Services', icon: '▦' },
        { name: 'Government', icon: '🏛️' },
        { name: 'Healthcare', icon: '🏥' },
        { name: 'Education', icon: '🎓' },
        { name: 'Agriculture', icon: '🌾' },
        { name: 'NGOs', icon: '🤝' },
        { name: 'Banking', icon: '🏦' },
        { name: 'Business', icon: '🏬' },
        { name: 'Transport', icon: '🚌' },
        { name: 'Land', icon: '📜' },
        { name: 'Waste', icon: '🗑️' },
        { name: 'Water', icon: '🚰' },
        { name: 'Food', icon: '🍚' },
        { name: 'News', icon: '📰' },
        { name: 'Emergency', icon: '🚑' },
        { name: 'Marketplace', icon: '🛒' }
      ].map(cat => (
        <button key={cat.name} onClick={() => setFilter(cat.name)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === cat.name ? 'bg-polli-700 text-white' : 'border border-earth-200 bg-white text-earth-600 hover:bg-polli-50 hover:text-polli-700'}`}>
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
    
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{visible.map(service => <article key={service.title} className={`rounded-xl border p-4 ${service.accent}`}><div className="flex items-start justify-between"><span className="text-2xl">{service.emoji}</span>{service.badge && <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-earth-600">{service.badge}</span>}</div><h2 className="mt-4 text-sm font-bold">{service.title}</h2><p className="mt-0.5 text-xs text-earth-500">{service.bangla}</p><p className="mt-3 min-h-[45px] text-xs leading-5 text-earth-600">{service.description}</p><div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-[10px] text-earth-500"><span>◷ {service.time}</span><b>{service.fee}</b></div><RequireAuthButton onAuthorized={() => setSelected(service)} action="openService" actionData={{ title: service.title }} className="mt-4 w-full rounded-lg bg-emerald-700 py-2 text-xs font-bold text-white hover:bg-emerald-800">Apply now</RequireAuthButton></article>)}</div>
    {selected && <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-xl">{selected.emoji}</span><div><h2 className="text-sm font-bold">{selected.title}</h2><p className="text-xs text-earth-400">{selected.bangla}</p></div></div><button onClick={() => setSelected(null)} className="text-earth-400 hover:text-earth-700"><X size={18} /></button></div><div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-earth-50 p-3 text-xs"><span className="text-earth-500">Processing time</span><b className="text-right">{selected.time}</b><span className="text-earth-500">Fee</span><b className="text-right">{selected.fee}</b><span className="text-earth-500">Category</span><b className="text-right">{selected.category}</b></div><label className="mt-5 block text-xs font-bold text-earth-900">Purpose of application<select value={requestType} onChange={e => setRequestType(e.target.value)} className="mt-2 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-normal text-earth-700 outline-none focus:ring-2 focus:ring-emerald-500"><option>New Application</option><option>Correction</option><option>Duplicate Copy</option></select></label>{['Land Records', 'Mutation (Namjari)'].includes(selected.title) && <label className="mt-4 block text-xs font-bold text-earth-900">Additional Note (Optional)<textarea value={note} onChange={e => setNote(e.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-earth-200 p-2 text-sm font-normal text-earth-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="For example: inherited property registration" /></label>}{selected.title === 'Family Card' && <p className="mt-4 rounded-lg bg-teal-50 p-3 text-xs leading-5 text-teal-800">Family Card links household members under one verified address. Add the household head first; you can then add spouses, children, and dependants in the next step.</p>}<button onClick={apply} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-700/20"><FileText size={16} /> Start Application</button></div></div>}
  </div>;
}
