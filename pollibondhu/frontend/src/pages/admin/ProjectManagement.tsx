import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Plus, Calendar, Loader2, Trash2, Edit3, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';

export default function ProjectManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', budget: '', funding_source: '', contractor: '', deadline: '', department_id: '', status: 'PLANNED' });
  const [submitting, setSubmitting] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [correctingField, setCorrectingField] = useState<'title' | 'description' | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/admin/projects');
      setProjects(res.data.data);
    } catch (err: any) {
      addToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data);
    } catch { /* ignore */ }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget) {
      addToast('Title, description, and budget are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/projects', {
        ...form,
        budget: parseFloat(form.budget),
        department_id: form.department_id || null,
      });
      addToast('Project created successfully!');
      setShowForm(false);
      setForm({ title: '', description: '', budget: '', funding_source: '', contractor: '', deadline: '', department_id: '', status: 'PLANNED' });
      fetchProjects();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to create project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      addToast('Project deleted');
      fetchProjects();
    } catch (err: any) {
      addToast('Failed to delete project', 'error');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/admin/projects/${id}`, { status });
      addToast(`Status changed to ${status}`);
      fetchProjects();
    } catch (err: any) {
      addToast('Failed to update', 'error');
    }
  };

  const handleAiAutoFill = async () => {
    setAutoFilling(true);
    try {
      const res = await api.post('/ai/generate-project');
      const randomDepts = departments.length > 0 ? departments : [{ department_id: '1' }];
      const randomDeptId = randomDepts[Math.floor(Math.random() * randomDepts.length)].department_id;
      
      const p = res.data.project;
      setForm({
        title: p.title || 'New Project',
        description: p.description || '',
        budget: (p.budget || 500000).toString(),
        funding_source: p.funding_source || '',
        contractor: p.contractor || '',
        deadline: p.deadline || '',
        department_id: randomDeptId.toString(),
        status: 'PLANNED'
      });
      addToast('AI generated a new unique project!', 'success');
    } catch (err) {
      addToast('Failed to auto-generate project', 'error');
    } finally {
      setAutoFilling(false);
    }
  };

  async function aiCorrectField(field: 'title' | 'description') {
    const text = field === 'title' ? form.title : form.description;
    if (!text.trim()) return;
    setCorrectingField(field);
    try {
      const res = await api.post('/ai/correct', { text, language: 'English' });
      if (res.data.corrected) {
        setForm(f => field === 'title' ? { ...f, title: res.data.corrected } : { ...f, description: res.data.corrected });
        addToast('Text corrected!', 'success');
      }
    } catch {
      addToast('AI correction unavailable', 'error');
    } finally {
      setCorrectingField(null);
    }
  }

  async function aiImproveField(field: 'title' | 'description') {
    const text = field === 'title' ? form.title : form.description;
    if (!text.trim()) return;
    setCorrectingField(field);
    try {
      const res = await api.post('/ai/improve', { text, type: field });
      if (res.data.improved) {
        setForm(f => field === 'title' ? { ...f, title: res.data.improved } : { ...f, description: res.data.improved });
        addToast('Text improved!', 'success');
      }
    } catch {
      addToast('AI improvement unavailable', 'error');
    } finally {
      setCorrectingField(null);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Projects' }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Project Management</h1>
          <p className="text-sm text-earth-500">Track government projects and budget allocation.</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-polli-200 shadow-lg animate-in slide-in-from-top duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-earth-900">Create New Project</h2>
              <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50" icon={autoFilling ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} onClick={handleAiAutoFill} disabled={autoFilling}>
                {autoFilling ? 'Generating...' : 'AI Auto-fill'}
              </Button>
            </div>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-earth-700">Title *</label>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => aiCorrectField('title')} disabled={correctingField === 'title' || !form.title.trim()}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-green-600 hover:bg-green-50 rounded disabled:opacity-50">
                      {correctingField === 'title' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />} Fix grammar
                    </button>
                    <button type="button" onClick={() => aiImproveField('title')} disabled={correctingField === 'title' || !form.title.trim()}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-polli-600 hover:bg-polli-50 rounded disabled:opacity-50">
                      {correctingField === 'title' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI improve
                    </button>
                  </div>
                </div>
                <input className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Road Repair — Naichity Bazaar" />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-earth-700">Description *</label>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => aiCorrectField('description')} disabled={correctingField === 'description' || !form.description.trim()}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-green-600 hover:bg-green-50 rounded disabled:opacity-50">
                      {correctingField === 'description' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />} Fix grammar
                    </button>
                    <button type="button" onClick={() => aiImproveField('description')} disabled={correctingField === 'description' || !form.description.trim()}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-polli-600 hover:bg-polli-50 rounded disabled:opacity-50">
                      {correctingField === 'description' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI improve
                    </button>
                  </div>
                </div>
                <textarea className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none" rows={3}
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detailed project description..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Budget (৳) *</label>
                <input type="number" className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none"
                  value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="500000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Department</label>
                <select className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none"
                  value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Funding Source</label>
                <input className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none"
                  value={form.funding_source} onChange={e => setForm({...form, funding_source: e.target.value})} placeholder="e.g. Government ADP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Contractor</label>
                <input className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none"
                  value={form.contractor} onChange={e => setForm({...form, contractor: e.target.value})} placeholder="Contractor name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Deadline</label>
                <input type="date" className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none"
                  value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Status</label>
                <select className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-polli-500 focus:outline-none"
                  value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Project'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Project List */}
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-polli-500" size={32} /></div>
      ) : projects.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="p-10 text-center text-earth-400">
            <p className="text-lg font-bold">No projects yet</p>
            <p className="text-sm mt-1">Click "New Project" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <Card key={p.project_id} className="border-none shadow-md shadow-earth-200/40 hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-earth-900">{p.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-earth-500">
                      <span className="font-medium text-polli-700">{p.department?.name || 'No Dept'}</span>
                      {p.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(p.deadline).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {p.contractor && <span>🏗️ {p.contractor}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs border border-earth-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-polli-500"
                      value={p.status}
                      onChange={e => handleStatusChange(p.project_id, e.target.value)}
                    >
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                    <button onClick={() => handleDelete(p.project_id)} className="p-1.5 rounded-lg text-earth-400 hover:text-rose-600 hover:bg-rose-50 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-earth-500 mb-3 line-clamp-2">{p.description}</p>
                <ProgressBar value={p.progress || 0} showLabel />
                <div className="flex items-center justify-between mt-3 text-xs text-earth-500 font-medium">
                  <span>Budget: <span className="text-earth-900 font-bold">৳{Number(p.budget || 0).toLocaleString()}</span></span>
                  <span>Spent: <span className="text-amber-600 font-bold">৳{Number(p.spent || 0).toLocaleString()}</span></span>
                  <span>Remaining: <span className="text-emerald-600 font-bold">৳{(Number(p.budget || 0) - Number(p.spent || 0)).toLocaleString()}</span></span>
                </div>
                
                {p.services && p.services.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-earth-100">
                    <p className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={14} className="text-polli-500" /> Linked Subsidized Services
                    </p>
                    <p className="text-[10px] text-earth-500 mb-2 leading-tight">These services automatically deduct from this project's budget when delivered by providers.</p>
                    <div className="space-y-1">
                      {p.services.map((s: any) => (
                        <div key={s.service_id} className="flex justify-between items-center text-xs p-2 rounded bg-earth-50 border border-earth-100">
                          <span className="font-medium text-earth-700">{s.title}</span>
                          <span className="font-bold text-red-600">-৳{s.price} / citizen</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
