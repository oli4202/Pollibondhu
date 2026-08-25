import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, FileText, Clock, DollarSign, MapPin, ChevronRight } from 'lucide-react';
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
  Agriculture: '🌾', Citizen: '🏛️', Health: '🏥', Education: '🎓',
  NGO: '🤝', Banking: '🏦', Business: '🏬', Transport: '🚌',
  Land: '📜', Waste: '🗑️', Water: '🚰', Food: '🍚',
  News: '📰', Emergency: '🚑', Marketplace: '🛒',
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/services', { params: { limit: 50, status: 'APPROVED' } })
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

  // Static government services for display
  const govServices = [
    { title: 'Birth Registration', emoji: '👶', category: 'Government', time: '5-7 days', fee: 'Free', slug: 'birth-registration' },
    { title: 'NID Services', emoji: '🪪', category: 'Government', time: '5-7 days', fee: 'Free', slug: 'nid-services', external: true },
    { title: 'Land Records (Khatian)', emoji: '📜', category: 'Land', time: '10-15 days', fee: '৳ 100', slug: 'land-records', external: true },
    { title: 'Trade Licence', emoji: '🏬', category: 'Business', time: '7-14 days', fee: '৳ 500', slug: 'trade-license' },
    { title: 'Health Card', emoji: '🏥', category: 'Health', time: '3-5 days', fee: 'Free', slug: 'health-card' },
    { title: 'School Admission', emoji: '🏫', category: 'Education', time: '7-14 days', fee: '৳ 100', slug: 'school-admission' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Services' }]} className="mb-6" />

      <header className="mb-6">
        <h1 className="text-2xl font-bold">নাগরিক সেবা <span className="text-earth-400">— Citizen Services</span></h1>
        <p className="mt-1 text-sm text-earth-500">Access government documents, certificates, and local benefits.</p>
      </header>

      {/* AI Service Finder */}
      <section className="mb-8">
        <AiServiceFinder />
      </section>

      {/* Government Services Quick Access */}
      <section className="mb-8">
        <h2 className="text-sm font-bold mb-3">Government Services</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {govServices.map((s) => (
            <Link key={s.title} to={s.external ? `/${s.slug}` : `/gov-service/${s.slug}`} className="block">
              <Card className="card-hover cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{s.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-earth-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {s.time}</span>
                      <span>{s.fee}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-earth-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Provider Services */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Available Services</h2>
          <SearchInput value={search} onChange={setSearch} placeholder="Search services..." className="w-64" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === cat ? 'bg-polli-700 text-white' : 'border border-earth-200 bg-white text-earth-600 hover:bg-polli-50'
              }`}
            >
              {cat !== 'All' && categoryEmojis[cat] ? `${categoryEmojis[cat]} ` : ''}{cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No services found"
            description={search ? 'Try a different search term.' : 'No services are available in this category yet.'}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((service) => (
              <Card key={service.service_id} className="card-hover cursor-pointer" onClick={() => setSelected(service)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{categoryEmojis[service.category?.name || ''] || '📋'}</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <h3 className="text-sm font-bold">{service.title}</h3>
                  {service.category && <p className="text-xs text-earth-500 mt-0.5">{service.category.name}</p>}
                  {service.description && (
                    <p className="mt-2 text-xs text-earth-600 line-clamp-2 leading-5">{service.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-earth-100 pt-3 text-xs text-earth-500">
                    <span className="flex items-center gap-1">
                      {service.district && <><MapPin size={12} /> {service.district}</>}
                    </span>
                    <span className="font-bold">{service.price ? `৳${service.price}` : 'Free'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Service Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-slide-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-polli-50 text-xl">
                  {categoryEmojis[selected.category?.name || ''] || '📋'}
                </span>
                <div>
                  <h2 className="text-sm font-bold">{selected.title}</h2>
                  <p className="text-xs text-earth-400">{selected.category?.name || 'Service'}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-earth-400 hover:text-earth-600">
                <X size={18} />
              </button>
            </div>

            {selected.description && (
              <p className="mt-4 text-sm text-earth-600">{selected.description}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-earth-50 p-3 text-xs">
              <span className="text-earth-500">Provider</span>
              <b className="text-right">{selected.provider?.full_name || 'Government'}</b>
              <span className="text-earth-500">Fee</span>
              <b className="text-right">{selected.price ? `৳${selected.price}` : 'Free'}</b>
              <span className="text-earth-500">Location</span>
              <b className="text-right">{selected.district || 'All districts'}</b>
            </div>

            <RequireAuthButton
              onAuthorized={() => { setSelected(null); setShowForm(true); }}
              action="openService"
              actionData={{ title: selected.title }}
              className="mt-4 w-full"
            >
              <Button className="w-full">
                <FileText size={16} /> Apply Now
              </Button>
            </RequireAuthButton>
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
