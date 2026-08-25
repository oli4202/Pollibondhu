import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SearchInput } from '@/components/ui/SearchInput';
import api from '@/utils/api';

interface Complaint {
  complaint_id: number;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  user?: { full_name: string };
}

export default function OfficerComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/complaints')
      .then(res => {
        const data = res.data;
        setComplaints(data.data || data.complaints || (Array.isArray(data) ? data : []));
      })
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = complaints.filter(c =>
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumb items={[{ label: 'Officer', href: '/officer' }, { label: 'Complaints' }]} />
      
      <div>
        <h1 className="text-2xl font-bold">Assigned Complaints</h1>
        <p className="text-sm text-earth-500 mt-1">Handle complaints assigned to you.</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search complaints..." />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={48} />} title="No complaints found" description="No complaints match your search." />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.complaint_id} className="card-hover cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{c.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge>{c.category}</Badge>
                      <span className="text-xs text-earth-400">Citizen: {c.user?.full_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={c.priority === 'CRITICAL' || c.priority === 'HIGH' ? 'danger' : 'warning'}>{c.priority}</Badge>
                  <StatusBadge status={c.status} />
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
