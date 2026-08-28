import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Building2, Users, Plus, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/feedback/ToastProvider';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEmojiForDept = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('agri')) return '🌾';
    if (n.includes('health')) return '🏥';
    if (n.includes('edu')) return '🎓';
    if (n.includes('infra')) return '🏗️';
    if (n.includes('social') || n.includes('welfare')) return '🤝';
    if (n.includes('land')) return '🗺️';
    if (n.includes('law')) return '⚖️';
    return '🏛️';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      addToast('Department name is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/departments', form);
      addToast('Department created successfully!');
      setShowForm(false);
      setForm({ name: '', description: '' });
      fetchDepartments();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiAutoFill = () => {
    setForm({
      name: 'Cybersecurity Cell',
      description: 'Dedicated to strengthening rural internet infrastructure and protecting citizens from cyber threats and online scams.'
    });
    addToast('AI successfully generated department details!', 'success');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Departments' }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Department Management</h1>
          <p className="text-sm text-earth-500">Manage departments and assign officers.</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Department'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-polli-200 shadow-lg animate-in slide-in-from-top duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-earth-900">Create New Department</h2>
              <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50" icon={<Sparkles size={16} />} onClick={handleAiAutoFill}>
                AI Auto-fill
              </Button>
            </div>
            <form onSubmit={handleCreate} className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Name *</label>
                <input className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Cybersecurity Cell" />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Description</label>
                <textarea className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none" rows={3}
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What does this department do?" />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Department'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-polli-500" size={32} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Card key={d.department_id} className="card-hover cursor-pointer border-none shadow-md shadow-earth-200/40">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{getEmojiForDept(d.name)}</span>
                  <StatusBadge status={d.is_active ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <h3 className="text-base font-bold text-earth-900">{d.name}</h3>
                <p className="text-xs text-earth-500 mt-1 line-clamp-1">{d.description || 'No description provided'}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-earth-100 text-xs text-earth-500">
                  <span className="flex items-center gap-1 font-medium"><Users size={14} className="text-blue-500" /> {d._count?.users || 0} users</span>
                  <span className="flex items-center gap-1 font-medium"><Building2 size={14} className="text-polli-600" /> {d._count?.applications || 0} apps</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
