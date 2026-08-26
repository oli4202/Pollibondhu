import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, ChevronRight, X, MapPin, Sparkles, Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import api from '@/utils/api';
import { useToast } from '@/components/feedback/ToastProvider';

interface Complaint {
  complaint_id: number;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  description?: string;
}

const categoryOptions = [
  { value: 'Infrastructure', label: 'Infrastructure', emoji: '🏗️', desc: 'Roads, bridges, buildings' },
  { value: 'Agriculture', label: 'Agriculture', emoji: '🌾', desc: 'Farming, irrigation, crops' },
  { value: 'Health', label: 'Health', emoji: '🏥', desc: 'Healthcare, hospitals, doctors' },
  { value: 'Education', label: 'Education', emoji: '🎓', desc: 'Schools, teachers, curriculum' },
  { value: 'Environment', label: 'Environment', emoji: '🌳', desc: 'Pollution, waste, trees' },
  { value: 'Electricity', label: 'Electricity', emoji: '⚡', desc: 'Power outage, connections' },
  { value: 'Water', label: 'Water', emoji: '💧', desc: 'Water supply, quality' },
  { value: 'Law & Order', label: 'Law & Order', emoji: '👮', desc: 'Safety, crime, disputes' },
  { value: 'Corruption', label: 'Corruption', emoji: '⚠️', desc: 'Misuse of power, bribery' },
  { value: 'Other', label: 'Other', emoji: '📌', desc: 'General complaints' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'text-green-600 border-green-200', desc: 'Not urgent' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-amber-600 border-amber-200', desc: 'Should be addressed soon' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600 border-orange-200', desc: 'Important, needs attention' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-600 border-red-200', desc: 'Emergency, immediate action' },
];

const locationSuggestions = [
  'Main road near bazaar', 'Union Parishad office area', 'Near government primary school',
  'Market area', 'Village mosque area', 'Near health center',
  'Agricultural field area', 'Near the bridge/embankment',
];

const aiSuggestions: Record<string, string[]> = {
  Infrastructure: [
    'The main road in our area has developed large potholes making it dangerous for vehicles and pedestrians.',
    'The street lights on our road have been non-functional for over a week causing safety concerns.',
    'The drainage system in our area is blocked causing water logging during rain.',
  ],
  Agriculture: [
    'Local dealers are not getting adequate fertilizer supply affecting the current season crops.',
    'The irrigation canal has not been cleaned for months reducing water flow to our fields.',
    'Pest infestation in Boro paddy fields needs immediate attention from agricultural officers.',
  ],
  Health: [
    'The assigned doctor has been absent from the Union Health Center for several days.',
    'Essential medicines are not available at the local health center.',
    'The health center lacks basic equipment for proper patient treatment.',
  ],
};

export default function MyComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();
  const [form, setForm] = useState({
    category: '', subject: '', description: '', priority: 'MEDIUM', location: '',
  });
  const [correctingField, setCorrectingField] = useState<'subject' | 'description' | null>(null);

  useEffect(() => {
    api.get('/complaints')
      .then(res => {
        const data = res.data;
        setComplaints(data.data?.data || data.complaints || (Array.isArray(data) ? data : []));
      })
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  async function aiCorrectField(field: 'subject' | 'description') {
    const text = field === 'subject' ? form.subject : form.description;
    if (!text.trim()) return;
    setCorrectingField(field);
    try {
      const res = await api.post('/ai/correct', { text, language: 'English' });
      if (res.data.corrected) {
        setForm(f => field === 'subject' ? { ...f, subject: res.data.corrected } : { ...f, description: res.data.corrected });
        addToast('Text corrected!', 'success');
      }
    } catch {
      addToast('AI correction unavailable', 'error');
    } finally {
      setCorrectingField(null);
    }
  }

  async function aiImproveField(field: 'subject' | 'description') {
    const text = field === 'subject' ? form.subject : form.description;
    if (!text.trim()) return;
    setCorrectingField(field);
    try {
      const res = await api.post('/ai/improve', { text, type: 'complaint' });
      if (res.data.improved) {
        setForm(f => field === 'subject' ? { ...f, subject: res.data.improved } : { ...f, description: res.data.improved });
        addToast('Text improved!', 'success');
      }
    } catch {
      addToast('AI improvement unavailable', 'error');
    } finally {
      setCorrectingField(null);
    }
  }

  async function handleSubmit() {
    if (!form.category || !form.subject || !form.description) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    setSending(true);
    try {
      await api.post('/complaints', {
        category: form.category,
        subject: form.subject,
        description: form.description + (form.location ? `\n\nLocation: ${form.location}` : ''),
        priority: form.priority,
      });
      addToast('Complaint submitted successfully! You will receive a notification when it is reviewed.', 'success');
      setShowForm(false);
      setForm({ category: '', subject: '', description: '', priority: 'MEDIUM', location: '' });
      // Refresh
      const res = await api.get('/complaints');
      setComplaints(res.data.data?.data || []);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to submit complaint', 'error');
    } finally { setSending(false); }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Complaints' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Complaints</h1>
          <p className="text-sm text-earth-500 mt-1">File and track complaints about local issues</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus size={16} /> New Complaint</Button>
      </div>

      {/* Complaint Form */}
      {showForm && (
        <Card className="border-polli-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">File a Complaint</h2>
              <button onClick={() => setShowForm(false)} className="text-earth-400 hover:text-earth-600"><X size={20} /></button>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {categoryOptions.map(c => (
                  <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-colors ${
                      form.category === c.value ? 'border-polli-500 bg-polli-50 ring-2 ring-polli-200' : 'border-earth-200 hover:border-polli-300'
                    }`}>
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-xs font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject with AI correction */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-earth-700">Subject *</label>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => aiCorrectField('subject')} disabled={correctingField === 'subject' || !form.subject.trim()}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-green-600 hover:bg-green-50 rounded disabled:opacity-50">
                    {correctingField === 'subject' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />} Fix grammar
                  </button>
                  <button type="button" onClick={() => aiImproveField('subject')} disabled={correctingField === 'subject' || !form.subject.trim()}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-polli-600 hover:bg-polli-50 rounded disabled:opacity-50">
                    {correctingField === 'subject' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI improve
                  </button>
                </div>
              </div>
              <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                placeholder="Brief summary of the issue" />
            </div>

            {/* Priority Dropdown */}
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Priority *</label>
              <div className="flex gap-2">
                {priorityOptions.map(p => (
                  <button key={p.value} onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.priority === p.value ? `border-current ${p.color} bg-opacity-10` : 'border-earth-200 hover:border-polli-300'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Dropdown */}
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Location (optional)</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-earth-400" />
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full border border-earth-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                  placeholder="Where did this happen?" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {locationSuggestions.slice(0, 4).map((loc, i) => (
                  <button key={i} onClick={() => setForm(f => ({ ...f, location: loc }))}
                    className="px-2.5 py-1 rounded-full border border-earth-200 text-[10px] text-earth-500 hover:bg-polli-50 hover:border-polli-300 transition-colors">
                    📍 {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Description with AI correction + suggestions */}
            <div>
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
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 resize-none"
                placeholder="Describe the issue in detail..." />
              {form.category && aiSuggestions[form.category] && (
                <div className="mt-2 p-3 bg-polli-50 rounded-lg border border-polli-100">
                  <p className="text-xs font-medium text-polli-700 mb-2 flex items-center gap-1"><Sparkles size={12} /> AI suggested descriptions:</p>
                  <div className="space-y-1.5">
                    {aiSuggestions[form.category].map((s, i) => (
                      <button key={i} onClick={() => setForm(f => ({ ...f, description: s }))}
                        className="w-full text-left p-2 text-xs text-earth-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-polli-200">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={sending}>{sending ? 'Submitting...' : 'Submit Complaint'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : complaints.length === 0 && !showForm ? (
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="No complaints filed"
          description="Report issues in your community to get them resolved."
          action={<Button onClick={() => setShowForm(true)}>File Complaint</Button>}
        />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <Card key={c.complaint_id} className="card-hover cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{c.subject}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge>{c.category}</Badge>
                        <span className="text-xs text-earth-400 font-mono">#{c.complaint_id}</span>
                        <span className="text-xs text-earth-400">· {new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={c.priority === 'HIGH' || c.priority === 'CRITICAL' ? 'danger' : c.priority === 'MEDIUM' ? 'warning' : 'default'}>{c.priority}</Badge>
                    <StatusBadge status={c.status} />
                    <ChevronRight size={16} className="text-earth-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
