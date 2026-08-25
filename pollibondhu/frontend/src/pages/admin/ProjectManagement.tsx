import { FolderOpen, Plus, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

const projects = [
  { title: 'Road Repair — Naichity Bazaar', dept: 'Infrastructure', budget: 500000, spent: 320000, progress: 65, status: 'IN_PROGRESS', deadline: 'Mar 2026' },
  { title: 'Solar Irrigation Pump Installation', dept: 'Agriculture', budget: 800000, spent: 150000, progress: 20, status: 'IN_PROGRESS', deadline: 'Jun 2026' },
  { title: 'Health Center Renovation', dept: 'Health', budget: 300000, spent: 300000, progress: 100, status: 'COMPLETED', deadline: 'Dec 2025' },
];

export default function ProjectManagement() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Projects' }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-sm text-earth-500">Track government projects and budget allocation.</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />}>New Project</Button>
      </div>

      <div className="space-y-4">
        {projects.map((p) => (
          <Card key={p.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-earth-500">
                    <span>{p.dept}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> Deadline: {p.deadline}</span>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <ProgressBar value={p.progress} showLabel />
              <div className="flex items-center justify-between mt-3 text-xs text-earth-500">
                <span>Budget: ৳{(p.budget / 1000).toFixed(0)}K</span>
                <span>Spent: ৳{(p.spent / 1000).toFixed(0)}K</span>
                <span>Remaining: ৳{((p.budget - p.spent) / 1000).toFixed(0)}K</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
