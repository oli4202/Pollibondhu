import { useState, useEffect } from 'react';
import { Heart, Users, Building2, Search, MapPin, ExternalLink, TrendingUp } from 'lucide-react';
import api from '@/utils/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Organisation {
  organisation_id: number;
  name: string;
  name_bn?: string;
  type: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  logo_url?: string;
  is_verified?: boolean;
  programmes?: any[];
  _count?: { programmes: number; donations: number };
}

const typeEmojis: Record<string, string> = {
  NGO: '❤️', CHARITY: '🤲', GOVERNMENT: '🏛️', COOPERATIVE: '🤝',
  SOCIAL: '👥', RELIGIOUS: '🕌', EDUCATIONAL: '🎓', HEALTH: '🏥',
};

export default function NGOsPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    api.get('/ngos').then(res => {
      setOrganisations(Array.isArray(res.data) ? res.data : res.data.data || []);
    }).catch(() => setOrganisations([])).finally(() => setLoading(false));
  }, []);

  const allTypes = [...new Set(organisations.map(o => o.type))];

  const filtered = organisations.filter(org => {
    const matchesSearch = !search || org.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || org.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'NGOs' }]} className="mb-6" />

      <header className="mb-8">
        <h1 className="text-2xl font-bold">এনজিও ও সামাজিক সেবা <span className="text-earth-400">— NGOs & Social Support</span></h1>
        <p className="mt-1 text-sm text-earth-500">Find NGOs, charitable programmes, donation opportunities, and community support services.</p>
      </header>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" size={16} />
          <input
            type="text"
            placeholder="Search organisations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-earth-200 pl-10 pr-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-xl border border-earth-200 px-4 py-2.5 text-sm focus:border-green-500 outline-none"
        >
          <option value="all">All Types</option>
          {allTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Organisation Cards */}
      <section>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Heart size={40} />} title="No organisations found" description="Try adjusting your search or check back later" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map(org => (
              <Card key={org.organisation_id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          <Heart size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{org.name}</h3>
                        {org.name_bn && <p className="text-xs text-earth-400">{org.name_bn}</p>}
                        {org.district && (
                          <p className="text-xs text-earth-500 flex items-center gap-1">
                            <MapPin size={12} /> {org.district}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {org.is_verified && <Badge className="bg-green-50 text-green-700">✓ Verified</Badge>}
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noopener noreferrer"
                          className="text-earth-400 hover:text-green-600 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {org.description && (
                    <p className="mt-3 text-xs text-earth-500 line-clamp-2 leading-relaxed">{org.description}</p>
                  )}

                  {/* Type Badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge>{typeEmojis[org.type] || '📌'} {org.type}</Badge>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 border-t border-earth-100 pt-3 text-xs text-earth-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {org._count?.programmes || 0} programmes</span>
                    <span className="flex items-center gap-1"><TrendingUp size={12} /> {org._count?.donations || 0} donations</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
