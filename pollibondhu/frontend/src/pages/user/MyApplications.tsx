import { useState, useEffect } from 'react';
import { FileText, ChevronRight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ApplicationTimeline } from '@/components/ui/ApplicationTimeline';
import { SkeletonCard } from '@/components/ui/Skeleton';
import api from '@/utils/api';
import { useNavigate } from 'react-router-dom';

interface Application {
  application_id: number;
  tracking_id: string;
  status: string;
  submitted_at: string;
  service?: { title: string } | null;
  documents?: any[];
  updates?: any[];
}

const statusProgress: Record<string, number> = {
  SUBMITTED: 10,
  REVIEWING: 25,
  ADDITIONAL_DOCS_REQUIRED: 30,
  RESUBMITTED: 35,
  IN_PROGRESS: 60,
  APPROVED: 90,
  CLOSED: 100,
  REJECTED: 100,
};

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/applications', { params: { limit: 50 } })
      .then((res) => setApplications(res.data.data?.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Applications' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Applications</h1>
          <p className="text-sm text-earth-500 mt-1">Track your government service applications.</p>
        </div>
        <Button size="sm" onClick={() => navigate('/services')}>New Application</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No applications yet"
          description="Start your first government service application."
          action={<Button onClick={() => navigate('/services')}>Browse Services</Button>}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card
              key={app.application_id}
              className="card-hover cursor-pointer"
              onClick={() => setSelected(app)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-polli-50 text-polli-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{app.service?.title || 'Service Application'}</h3>
                      <p className="text-xs text-earth-400 mt-0.5 font-mono">
                        {app.tracking_id} · Applied: {new Date(app.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <ChevronRight size={16} className="text-earth-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={statusProgress[app.status] || 0} size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[80vh] overflow-auto animate-slide-up">
            <div className="flex items-center justify-between border-b border-earth-200 px-6 py-4 sticky top-0 bg-white">
              <div>
                <h2 className="text-base font-bold">{selected.service?.title || 'Application'}</h2>
                <p className="text-xs text-earth-400 font-mono">{selected.tracking_id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-earth-400 hover:text-earth-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-earth-400">
                  Applied: {new Date(selected.submitted_at).toLocaleDateString()}
                </span>
              </div>

              <ProgressBar value={statusProgress[selected.status] || 0} showLabel />

              <div className="mt-6">
                <h3 className="text-sm font-bold mb-3">Timeline</h3>
                <ApplicationTimeline events={selected.updates || []} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
