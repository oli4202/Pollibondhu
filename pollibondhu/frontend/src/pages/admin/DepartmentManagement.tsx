import { Building2, Users, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';

const departments = [
  { name: 'Agriculture', officers: 12, services: 8, status: 'ACTIVE', emoji: '🌾' },
  { name: 'Health', officers: 8, services: 5, status: 'ACTIVE', emoji: '🏥' },
  { name: 'Education', officers: 6, services: 4, status: 'ACTIVE', emoji: '🎓' },
  { name: 'Infrastructure', officers: 10, services: 6, status: 'ACTIVE', emoji: '🏗️' },
  { name: 'Social Welfare', officers: 5, services: 3, status: 'ACTIVE', emoji: '🤝' },
];

export default function DepartmentManagement() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Departments' }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Department Management</h1>
          <p className="text-sm text-earth-500">Manage departments and assign officers.</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />}>Add Department</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.name} className="card-hover cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{d.emoji}</span>
                <StatusBadge status={d.status} />
              </div>
              <h3 className="text-base font-bold">{d.name}</h3>
              <div className="flex items-center gap-4 mt-3 text-xs text-earth-500">
                <span className="flex items-center gap-1"><Users size={14} /> {d.officers} officers</span>
                <span className="flex items-center gap-1"><Building2 size={14} /> {d.services} services</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
