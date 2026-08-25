import { useState, useEffect } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SearchInput } from '@/components/ui/SearchInput';
import api from '@/utils/api';

interface Application {
  application_id: number;
  tracking_id: string;
  status: string;
  applicant_name?: string;
  submitted_at: string;
  service?: { title: string };
  user?: { full_name: string };
}

export default function OfficerApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/applications')
      .then(res => {
        const data = res.data;
        setApplications(data.data || data.applications || (Array.isArray(data) ? data : []));
      })
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = applications.filter(a =>
    (a.service?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.tracking_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.applicant_name || a.user?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumb items={[{ label: 'Officer', href: '/officer' }, { label: 'Applications' }]} />
      
      <div>
        <h1 className="text-2xl font-bold">Assigned Applications</h1>
        <p className="text-sm text-earth-500 mt-1">Process applications assigned to you.</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search applications..." />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FileText size={48} />} title="No applications found" description="No applications match your search." />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Card key={app.application_id} className="card-hover cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-polli-50 text-polli-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{app.service?.title || `Application #${app.application_id}`}</h3>
                    <p className="text-xs text-earth-400 mt-0.5">
                      Applicant: {app.applicant_name || app.user?.full_name || 'N/A'} · {app.tracking_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={app.status} />
                  <ChevronRight size={16} className="text-earth-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
