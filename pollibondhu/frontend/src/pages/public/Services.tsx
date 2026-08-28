import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, FileText, DollarSign, MapPin, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import AiServiceFinder from '@/components/ai/AiServiceFinder';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import RequireAuthButton from '@/components/auth/RequireAuthButton';
import ApplicationForm from '@/components/forms/ApplicationForm';
import api from '@/utils/api';

interface Service {
  service_id: number;
  title: string;
  description?: string | null;
  price?: string | null;
  district?: string | null;
  status: string;
  category?: { name: string } | null;
  provider?: { full_name: string; district?: string | null } | null;
  created_at: string;
}

const categoryEmojis: Record<string, string> = {
  'Birth & Childhood': '👶',
  'Education': '🎓',
  'Identity & Documents': '🪪',
  'Driving & Transportation': '🚗',
  'Job & Career': '💼',
  'Banking & Financial Life': '🏦',
  'Marriage & Family': '💍',
  'Home & Property': '🏠',
  'Agriculture & Rural Life': '🌾',
  'Healthcare': '🏥',
  'Business & Entrepreneurship': '🏪',
  'Social Welfare': '🤝',
  'Legal & Police': '⚖️',
  'Travel & Migration': '✈️',
  'Old Age & Retirement': '👴',
  'Death & After Death': '⚰️',
  'NGO & Development Services': '🕊️',
  'Shops & Local Businesses': '🛒',
  'Technology & Digital Services': '💻',
  'Women & Family Services': '👩‍👧‍👦',
  'Emergency & Community Services': '🚑',
  'Religious & Social Services': '🕌',
  'Event & Personal Services': '🎉'
};

const lifeCycleStages = [
  { id: 'Birth & Childhood', label: 'Birth & Childhood', icon: '👶', color: 'bg-pink-100 text-pink-600', border: 'border-pink-200' },
  { id: 'Education', label: 'Education', icon: '🎓', color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
  { id: 'Identity & Documents', label: 'Identity & Documents', icon: '🪪', color: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200' },
  { id: 'Driving & Transportation', label: 'Driving & Transportation', icon: '🚗', color: 'bg-sky-100 text-sky-600', border: 'border-sky-200' },
  { id: 'Job & Career', label: 'Job & Career', icon: '💼', color: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200' },
  { id: 'Banking & Financial Life', label: 'Banking & Financial', icon: '🏦', color: 'bg-green-100 text-green-600', border: 'border-green-200' },
  { id: 'Marriage & Family', label: 'Marriage & Family', icon: '💍', color: 'bg-rose-100 text-rose-600', border: 'border-rose-200' },
  { id: 'Home & Property', label: 'Home & Property', icon: '🏠', color: 'bg-amber-100 text-amber-600', border: 'border-amber-200' },
  { id: 'Agriculture & Rural Life', label: 'Agriculture & Rural', icon: '🌾', color: 'bg-lime-100 text-lime-600', border: 'border-lime-200' },
  { id: 'Healthcare', label: 'Healthcare', icon: '🏥', color: 'bg-red-100 text-red-600', border: 'border-red-200' },
  { id: 'Business & Entrepreneurship', label: 'Business & Entrepreneurship', icon: '🏪', color: 'bg-purple-100 text-purple-600', border: 'border-purple-200' },
  { id: 'Social Welfare', label: 'Social Welfare', icon: '🤝', color: 'bg-teal-100 text-teal-600', border: 'border-teal-200' },
  { id: 'Legal & Police', label: 'Legal & Police', icon: '⚖️', color: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
  { id: 'Travel & Migration', label: 'Travel & Migration', icon: '✈️', color: 'bg-cyan-100 text-cyan-600', border: 'border-cyan-200' },
  { id: 'Old Age & Retirement', label: 'Old Age & Retirement', icon: '👴', color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
  { id: 'Death & After Death', label: 'Death & After Death', icon: '⚰️', color: 'bg-stone-100 text-stone-600', border: 'border-stone-200' },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/services', { params: { limit: 500, status: 'APPROVED' } })
      .then((res) => setServices(res.data.data?.data || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category?.name).filter((n): n is string => !!n)))];
  const visible = services.filter((s) => {
    const matchesFilter = filter === 'All' || s.category?.name === filter;
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Static government services for display (with dedicated UI pages)
  const govServices = [
    { title: 'Birth Registration', emoji: '👶', category: 'Government', time: '5-7 days', fee: 'Free', slug: 'birth-registration' },
    { title: 'NID Services', emoji: '🪪', category: 'Government', time: '5-7 days', fee: 'Free', slug: 'nid-services', external: true },
    { title: 'Land Records (Khatian)', emoji: '📜', category: 'Land', time: '10-15 days', fee: '৳ 100', slug: 'land-records', external: true },
    { title: 'Trade Licence', emoji: '🏬', category: 'Business', time: '7-14 days', fee: '৳ 500', slug: 'trade-license' },
    { title: 'Health Card', emoji: '🏥', category: 'Health', time: '3-5 days', fee: 'Free', slug: 'health-card' },
    { title: 'School Admission', emoji: '🏫', category: 'Education', time: '7-14 days', fee: '৳ 100', slug: 'school-admission' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Services' }]} className="mb-6" />

      {/* PREMIUM HERO BANNER */}
      <section className="relative mb-16 rounded-3xl overflow-hidden bg-gradient-to-br from-polli-700 via-polli-600 to-emerald-600 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            নাগরিক সেবা <span className="block mt-2 text-polli-100 font-medium text-2xl">— Citizen Services</span>
          </h1>
          <p className="text-polli-50 text-lg leading-relaxed">
            Access government documents, local benefits, and essential services instantly. Let our AI assistant find exactly what you need.
          </p>
          <div className="pt-4 drop-shadow-2xl">
            <AiServiceFinder />
          </div>
        </div>
      </section>

      {/* GOVERNMENT SERVICES QUICK ACCESS */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-earth-900 flex items-center gap-3">
            <span className="w-2 h-8 rounded-full bg-polli-500"></span>
            Essential Government Services
          </h2>
        </div>
        
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {govServices.map((s) => {
            let gradient = "from-blue-50 to-indigo-50 border-blue-100 text-blue-900";
            let iconBg = "bg-blue-100 text-blue-600";
            if (s.category === 'Land') { gradient = "from-amber-50 to-orange-50 border-amber-100 text-amber-900"; iconBg = "bg-amber-100 text-amber-600"; }
            if (s.category === 'Business') { gradient = "from-purple-50 to-pink-50 border-purple-100 text-purple-900"; iconBg = "bg-purple-100 text-purple-600"; }
            if (s.category === 'Health') { gradient = "from-rose-50 to-red-50 border-rose-100 text-rose-900"; iconBg = "bg-rose-100 text-rose-600"; }
            if (s.category === 'Education') { gradient = "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-900"; iconBg = "bg-emerald-100 text-emerald-600"; }
            
            return (
              <Link key={s.title} to={s.external ? `/${s.slug}` : `/gov-service/${s.slug}`} className="block group h-full">
                <div className={`relative h-full overflow-hidden rounded-3xl border ${gradient} p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between`}>
                  <div className="absolute top-0 right-0 p-4 opacity-5"><FileText size={100} /></div>
                  <div className="flex items-start gap-4 relative z-10 mb-6">
                    <div className={`h-14 w-14 flex-shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
                      {s.emoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1 leading-tight">{s.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-white/60 rounded-md shadow-sm backdrop-blur-sm"><Clock size={12} /> {s.time}</span>
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-white/60 rounded-md shadow-sm backdrop-blur-sm">{s.fee}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto flex justify-end relative z-10">
                    <span className="flex items-center text-sm font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                      Apply Now <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* CITIZEN JOURNEY: LIFE CYCLE SERVICES */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-earth-900 flex items-center gap-3">
              <span className="w-2 h-8 rounded-full bg-polli-500"></span>
              Citizen Life-Cycle Services
            </h2>
            <p className="text-sm text-earth-500 mt-1 pl-5">Find essential services organized by every stage of life.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {lifeCycleStages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => {
                setFilter(stage.id);
                document.getElementById('provider-directory')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`group flex flex-col items-center justify-center p-6 bg-white rounded-3xl border ${stage.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`h-16 w-16 mb-4 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${stage.color}`}>
                {stage.icon}
              </div>
              <h3 className="text-sm font-bold text-earth-900 text-center leading-tight">{stage.label}</h3>
            </button>
          ))}
        </div>
      </section>

      {/* PROVIDER SERVICES */}
      <section id="provider-directory" className="bg-earth-50/80 -mx-5 px-5 py-12 lg:-mx-10 lg:px-10 rounded-t-[3rem] border-t border-earth-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-earth-900 flex items-center gap-3">
              <span className="w-2 h-8 rounded-full bg-emerald-500"></span>
              Local Provider Services
            </h2>
            <p className="text-sm text-earth-500 mt-1 pl-5">Discover services offered by approved local providers in your area.</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search anything..." className="w-full md:w-72 bg-white shadow-sm rounded-2xl" />
        </div>

        {/* Category Filter - Scrollable Pill Nav */}
        <div className="flex overflow-x-auto gap-3 pb-4 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300 shadow-sm ${
                filter === cat 
                  ? 'bg-polli-700 text-white shadow-polli-700/20 scale-105 border border-polli-600' 
                  : 'bg-white text-earth-600 hover:bg-polli-50 border border-earth-200'
              }`}
            >
              {cat !== 'All' && categoryEmojis[cat] && <span className="text-lg">{categoryEmojis[cat]}</span>}
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No services found"
            description={search ? 'Try a different search term.' : 'No services are available in this category yet.'}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((service) => (
              <div 
                key={service.service_id} 
                className="group bg-white rounded-3xl p-6 border border-earth-100 shadow-sm hover:shadow-xl hover:border-polli-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
                onClick={() => setSelected(service)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-earth-50 flex items-center justify-center text-2xl group-hover:bg-polli-50 group-hover:scale-110 transition-transform">
                    {categoryEmojis[service.category?.name || ''] || '📋'}
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-bold shadow-sm">Active</span>
                </div>
                <h3 className="text-lg font-bold text-earth-900 group-hover:text-polli-700 transition-colors leading-tight">{service.title}</h3>
                {service.category && <p className="text-xs font-bold text-polli-600 mt-1.5 uppercase tracking-wide">{service.category.name}</p>}
                
                {service.description && (
                  <p className="mt-3 text-sm text-earth-600 line-clamp-2 leading-relaxed flex-grow">{service.description}</p>
                )}
                
                <div className="mt-6 flex items-center justify-between border-t border-earth-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-earth-500 bg-earth-50 px-2.5 py-1 rounded-lg border border-earth-100">
                    <MapPin size={14} className="text-earth-400" /> 
                    {service.district || 'Anywhere'}
                  </div>
                  <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                    {service.price ? `৳${service.price}` : 'Free'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Premium Service Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/60 p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="relative h-32 bg-gradient-to-br from-polli-100 to-emerald-50 p-6 flex flex-col justify-end">
              <button 
                onClick={() => setSelected(null)} 
                className="absolute top-4 right-4 h-8 w-8 bg-white/50 hover:bg-white rounded-full flex items-center justify-center text-earth-600 transition backdrop-blur-sm shadow-sm border border-white"
              >
                <X size={18} />
              </button>
              <div className="absolute -bottom-6 left-6 h-16 w-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-4xl border border-earth-100">
                {categoryEmojis[selected.category?.name || ''] || '📋'}
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 pt-10 pb-6">
              <div className="mb-6">
                <span className="inline-block px-2.5 py-1 bg-polli-50 text-polli-700 text-xs font-extrabold uppercase tracking-wider rounded-lg mb-3 border border-polli-100">
                  {selected.category?.name || 'Service'}
                </span>
                <h2 className="text-2xl font-bold text-earth-900 leading-tight">{selected.title}</h2>
                <p className="mt-1.5 text-sm text-earth-500">Offered by <span className="font-bold text-earth-700">{selected.provider?.full_name || 'Verified Provider'}</span></p>
              </div>

              {selected.description && (
                <div className="bg-earth-50 rounded-2xl p-4 mb-6 text-sm text-earth-700 leading-relaxed border border-earth-100 shadow-sm">
                  {selected.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white border border-earth-200 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3"><DollarSign size={20}/></span>
                  <span className="text-xs text-earth-500 font-bold uppercase tracking-wider">Service Fee</span>
                  <span className="text-lg font-bold text-emerald-700 mt-1">{selected.price ? `৳${selected.price}` : 'Free'}</span>
                </div>
                <div className="bg-white border border-earth-200 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3"><MapPin size={20}/></span>
                  <span className="text-xs text-earth-500 font-bold uppercase tracking-wider">Location</span>
                  <span className="text-sm font-bold text-earth-900 mt-1">{selected.district || 'Anywhere'}</span>
                </div>
              </div>

              <RequireAuthButton
                onAuthorized={() => { setSelected(null); setShowForm(true); }}
                action="openService"
                actionData={{ title: selected.title }}
                className="w-full block"
              >
                <button className="w-full py-4 rounded-2xl bg-polli-600 text-white font-bold text-lg hover:bg-polli-700 hover:-translate-y-0.5 transition-all duration-300 shadow-xl shadow-polli-600/30 flex items-center justify-center gap-2">
                  <FileText size={20} /> Request Service Now
                </button>
              </RequireAuthButton>
            </div>
          </div>
        </div>
      )}

      {/* Application Form */}
      {showForm && selected && (
        <ApplicationForm
          serviceName={selected.title}
          serviceId={selected.service_id}
          onClose={() => { setShowForm(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
