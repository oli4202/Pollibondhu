import { useState, useEffect } from 'react';
import { GraduationCap, School, BookOpen, Award, Users, MapPin, Search, Building2 } from 'lucide-react';
import api from '@/utils/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Institution {
  id: string;
  name: string;
  type: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  village?: { name: string };
  _count?: { courses: number; teachers: number; students: number };
}

const categoryEmojis: Record<string, string> = {
  primary_school: '🏫', secondary_school: '🎓', college: '🏛️',
  madrasa: '📚', polytechnic: '🔧', vocational: '⚙️',
  university: '🎓', coaching: '📖', nursing: '🏥', other: '📁',
};

const categories = [
  { type: 'primary_school', title: 'Primary Schools', color: 'bg-blue-50 border-blue-200' },
  { type: 'secondary_school', title: 'Secondary Schools', color: 'bg-indigo-50 border-indigo-200' },
  { type: 'college', title: 'Colleges', color: 'bg-violet-50 border-violet-200' },
  { type: 'madrasa', title: 'Madrasas', color: 'bg-emerald-50 border-emerald-200' },
  { type: 'polytechnic', title: 'Polytechnics', color: 'bg-amber-50 border-amber-200' },
  { type: 'vocational', title: 'Vocational Institutes', color: 'bg-rose-50 border-rose-200' },
];

export default function EducationPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    api.get('/education/institutions').then(res => {
      setInstitutions(res.data.data || []);
    }).catch(() => setInstitutions([])).finally(() => setLoading(false));
  }, []);

  const filtered = institutions.filter(inst => {
    const matchesSearch = !search || inst.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || inst.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Education' }]} className="mb-6" />

      <header className="mb-8">
        <h1 className="text-2xl font-bold">শিক্ষা প্রতিষ্ঠান <span className="text-earth-400">— Education</span></h1>
        <p className="mt-1 text-sm text-earth-500">Find schools, colleges, madrasas, training centres, and scholarship opportunities.</p>
      </header>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" size={16} />
          <input
            type="text"
            placeholder="Search institutions..."
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
          {categories.map(c => <option key={c.type} value={c.type}>{c.title}</option>)}
        </select>
      </div>

      {/* Institution Categories */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {categories.map((c) => {
          const count = institutions.filter(i => i.type === c.type).length;
          return (
            <button key={c.type} onClick={() => setFilterType(filterType === c.type ? 'all' : c.type)}
              className={`card-hover border rounded-xl p-4 text-left transition-all ${c.color} ${filterType === c.type ? 'ring-2 ring-green-500' : ''}`}>
              <span className="text-2xl">{categoryEmojis[c.type]}</span>
              <h3 className="mt-2 text-sm font-bold">{c.title}</h3>
              <p className="text-xs text-earth-500">{count} institutions</p>
            </button>
          );
        })}
      </section>

      {/* Institution List */}
      <section>
        <h2 className="text-lg font-bold mb-4">
          {filterType === 'all' ? 'All Institutions' : categories.find(c => c.type === filterType)?.title}
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Building2 size={40} />} title="No institutions found" description="Try adjusting your search or filters" />
        ) : (
          <div className="space-y-3">
            {filtered.map(inst => (
              <Card key={inst.id} className="card-hover">
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-3xl">{categoryEmojis[inst.type] || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate">{inst.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-earth-500">
                      <Badge>{inst.type.replace('_', ' ')}</Badge>
                      {inst._count && (
                        <>
                          <span className="flex items-center gap-1"><Users size={12} /> {inst._count.students} students</span>
                          <span className="flex items-center gap-1"><GraduationCap size={12} /> {inst._count.teachers} teachers</span>
                        </>
                      )}
                      {inst.village && <span className="flex items-center gap-1"><MapPin size={12} /> {inst.village.name}</span>}
                    </div>
                    {inst.description && <p className="mt-1.5 text-xs text-earth-500 line-clamp-2">{inst.description}</p>}
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
