import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SearchInput } from '@/components/ui/SearchInput';
import { Code, Lock, Unlock, Globe, Shield } from 'lucide-react';

interface Endpoint {
  method: string;
  path: string;
  module: string;
  description: string;
  auth: boolean;
  permission?: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800',
};

export default function EndpointViewer() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    api.get('/admin/endpoints')
      .then(res => setEndpoints(res.data.data?.endpoints || []))
      .catch(() => setEndpoints([]))
      .finally(() => setLoading(false));
  }, []);

  const modules = ['all', ...Array.from(new Set(endpoints.map(e => e.module)))];
  const filtered = endpoints.filter(e => {
    const matchSearch = !search ||
      e.path.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.module.toLowerCase().includes(search.toLowerCase());
    const matchModule = !moduleFilter || moduleFilter === 'all' || e.module === moduleFilter;
    return matchSearch && matchModule;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'API Endpoints' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900 flex items-center gap-2"><Code size={22} /> API Endpoints</h1>
          <p className="text-sm text-earth-500">View all registered API endpoints and their access requirements</p>
        </div>
        <Badge variant="info">{filtered.length} endpoints</Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search endpoints..." className="w-64" />
        <div className="flex gap-1 flex-wrap">
          {modules.map(m => (
            <button key={m} onClick={() => setModuleFilter(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                moduleFilter === m || (!moduleFilter && m === 'all') ? 'bg-polli-700 text-white' : 'border border-earth-200 text-earth-600 hover:bg-polli-50'
              }`}>
              {m === 'all' ? 'All Modules' : m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Code size={48} />} title="No endpoints found" description="Try a different search or filter." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-earth-100">
              {filtered.map((ep, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-earth-50/50 transition-colors">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold min-w-[52px] text-center ${methodColors[ep.method] || 'bg-gray-100 text-gray-800'}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm text-earth-800 font-mono flex-1">{ep.path}</code>
                  <span className="text-xs text-earth-500 hidden md:block max-w-[200px] truncate">{ep.description}</span>
                  <Badge>{ep.module}</Badge>
                  {ep.auth ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600"><Lock size={12} /> Auth</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-600"><Unlock size={12} /> Public</span>
                  )}
                  {ep.permission && (
                    <span className="flex items-center gap-1 text-xs text-blue-600"><Shield size={12} /> {ep.permission}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
