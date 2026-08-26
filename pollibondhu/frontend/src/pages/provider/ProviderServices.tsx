import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Wrench, Plus, Edit, Trash2, Eye, EyeOff, XCircle, CheckCircle, Clock, X, Sparkles, Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/utils/api';

interface Service {
  service_id: number;
  title: string;
  description?: string;
  price?: number;
  location?: string;
  district?: string;
  status: string;
  is_available: boolean;
  created_at: string;
}

interface ServiceForm {
  title: string;
  description: string;
  price: string;
  location: string;
  district: string;
  category: string;
}

const emptyForm: ServiceForm = { title: '', description: '', price: '', location: '', district: '', category: '' };

const districts = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Gazipur', 'Narayanganj', 'Bogura', "Cox's Bazar", 'Jessore', 'Dinajpur',
  'Faridpur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj',
  'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail', 'Bandarban', 'Brahmanbaria',
  'Chandpur', 'Feni', 'Lakshmipur', 'Noakhali', 'Habiganj', 'Moulvibazar',
  'Sunamganj', 'Jhalokathi', 'Patuakhali', 'Pirojpur', 'Bagerhat', 'Chuadanga',
  'Jashore', 'Kushtua', 'Magura', 'Meherpur', 'Narail', 'Satkhira',
  'Joypurhat', 'Naogaon', 'Natore', 'Chapainawabganj', 'Pabna', 'Sirajganj',
  'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon',
  'Jamalpur', 'Netrokona', 'Sherpur',
];

// Service title suggestions by category
const titleSuggestions: Record<string, string[]> = {
  Agriculture: ['Power Tiller Rental', 'Seed Supply', 'Crop Harvesting', 'Soil Testing', 'Irrigation Service', 'Pest Control', 'Fertilizer Supply', 'Harvesting Machine Rental'],
  Health: ['Mobile Health Camp', 'Blood Test Service', 'Vaccination Camp', 'Health Consultation', 'Medical Equipment Supply'],
  Education: ['Tutoring Service', ' Coaching Center', 'Online Course', 'Skill Training', 'Career Counseling'],
  Citizen: ['NID Service', 'Birth Certificate', 'Land Survey', 'Trade License', 'Income Certificate', 'Character Certificate'],
  Transport: ['Auto Rickshaw', 'Truck Rental', 'Delivery Service', 'Passenger Bus', 'Cargo Service'],
  Other: ['Tailoring Service', 'Electrician', 'Plumber', 'Carpenter', 'Photography', 'Event Management'],
};

const statusColors: Record<string, string> = {
  APPROVED: 'success', PENDING: 'warning', REJECTED: 'danger',
};

// Government service types with descriptions for AI assistance
const govServiceTypes = [
  { title: 'NID Application', description: 'Apply for new National Identity Card. Required documents: birth certificate, photographs, parents NID. Processing time: 5-7 working days.', price: '0', emoji: '🪪' },
  { title: 'Birth Registration', description: 'Register a new birth or get a birth certificate copy. Required documents: hospital records, parents NID, photographs.', price: '0', emoji: '👶' },
  { title: 'NID Correction', description: 'Correct name, date of birth, or other information on your National ID card. Bring original documents and supporting proof.', price: '50', emoji: '✏️' },
  { title: 'NID Duplicate', description: 'Get a duplicate copy of your lost or damaged National ID card. FIR copy required if lost.', price: '100', emoji: '📋' },
  { title: 'Death Certificate', description: 'Register a death and obtain an official death certificate. Required: hospital report or medical certificate.', price: '0', emoji: '📄' },
  { title: 'Marriage Registration', description: 'Register a marriage and obtain a marriage certificate. Both parties must be present with NID and photographs.', price: '0', emoji: '💍' },
  { title: 'Trade License', description: 'Apply for a new trade license or renew an existing one for business operations. Tax clearance required.', price: '500', emoji: '🏬' },
  { title: 'Land Khatian', description: 'Access and verify land ownership records (khatian). Corrections available upon verification.', price: '100', emoji: '📜' },
  { title: 'Income Certificate', description: 'Obtain an official income certificate from the Union Parishad for various official purposes.', price: '50', emoji: '💰' },
  { title: 'Character Certificate', description: 'Get a character certificate from the local government authority.', price: '20', emoji: '🎖️' },
];

// Regular service templates
const regularServiceTemplates = [
  { title: 'Power Tiller Rental', description: 'Rent power tiller for your field. Available for hourly and daily rental.', category: 'Agriculture' },
  { title: 'Seed Supply', description: 'High quality seeds available for various crops.', category: 'Agriculture' },
  { title: 'Crop Harvesting Service', description: 'Professional harvesting service with modern equipment.', category: 'Agriculture' },
  { title: 'Soil Testing', description: 'Professional soil testing and analysis for optimal crop yield.', category: 'Agriculture' },
  { title: 'Mobile Health Camp', description: 'Free health checkup camp in rural areas.', category: 'Health' },
  { title: 'Land Survey Service', description: 'Professional land measurement and khatian correction.', category: 'Citizen' },
];

export default function ProviderServices() {
  const { user, hasRole } = useAuth();
  const { addToast: toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [correctingField, setCorrectingField] = useState<'title' | 'description' | null>(null);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);

  const isGovProvider = hasRole('GOV_SERVICE_PROVIDER');

  useEffect(() => { fetchServices(); }, []);

  async function fetchServices() {
    setLoading(true);
    try {
      const res = await api.get('/services/mine');
      const data = res.data;
      setServices(data.data?.data || []);
    } catch { setServices([]); } finally { setLoading(false); }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Service title is required';
    if (form.title.length > 100) errs.title = 'Title must be under 100 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (form.description.length < 10) errs.description = 'Description must be at least 10 characters';
    if (form.price && (isNaN(Number(form.price)) || Number(form.price) < 0)) errs.price = 'Enter a valid price';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price ? Number(form.price) : undefined,
        location: form.location.trim() || undefined,
        district: form.district || undefined,
        category: form.category || undefined,
      };
      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
        toast('Service updated successfully!', 'success');
      } else {
        await api.post('/services', payload);
        toast('Service created! It will be reviewed by an admin.', 'success');
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchServices();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to save service', 'error');
    } finally { setSubmitting(false); }
  }

  function handleEdit(service: Service) {
    setForm({
      title: service.title, description: service.description || '', price: service.price?.toString() || '',
      location: service.location || '', district: service.district || '', category: '',
    });
    setEditingId(service.service_id);
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try { await api.delete(`/services/${id}`); toast('Service deleted', 'success'); fetchServices(); }
    catch (err: any) { toast(err.response?.data?.error || 'Failed to delete', 'error'); }
  }

  async function toggleAvailability(service: Service) {
    try {
      await api.put(`/services/${service.service_id}`, { is_available: !service.is_available });
      toast(`Service ${service.is_available ? 'hidden' : 'shown'} from marketplace`, 'success');
      fetchServices();
    } catch { toast('Failed to update', 'error'); }
  }

  async function aiCorrectField(field: 'title' | 'description') {
    const text = field === 'title' ? form.title : form.description;
    if (!text.trim()) return;
    setCorrectingField(field);
    try {
      const res = await api.post('/ai/correct', { text, language: 'English' });
      if (res.data.corrected) {
        setForm(f => field === 'title' ? { ...f, title: res.data.corrected } : { ...f, description: res.data.corrected });
        toast('Text corrected!', 'success');
      }
    } catch {
      toast('AI correction unavailable', 'error');
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
        toast('Text improved!', 'success');
      }
    } catch {
      toast('AI improvement unavailable', 'error');
    } finally {
      setCorrectingField(null);
    }
  }

  function applyGovTemplate(template: typeof govServiceTypes[0]) {
    setForm(f => ({ ...f, title: template.title, description: template.description, price: template.price, category: 'Citizen' }));
  }

  function applyRegularTemplate(template: typeof regularServiceTemplates[0]) {
    setForm(f => ({ ...f, title: template.title, description: template.description, category: template.category }));
  }

  const stats = {
    total: services.length,
    approved: services.filter(s => s.status === 'APPROVED').length,
    pending: services.filter(s => s.status === 'PENDING').length,
    rejected: services.filter(s => s.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Provider', href: '/provider' }, { label: 'My Services' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">
            {isGovProvider ? '🏛️ Government Services' : 'My Services'}
          </h1>
          <p className="text-sm text-earth-500 mt-1">
            {isGovProvider ? 'Manage government services for citizens — NID, birth cert, trade license & more' : 'Create and manage your service offerings'}
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
          <Plus size={16} /> {isGovProvider ? 'New Gov Service' : 'New Service'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Wrench, color: 'bg-polli-50 text-polli-600' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-600' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'bg-red-50 text-red-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-earth-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-earth-900 mt-0.5">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${s.color}`}><s.icon size={18} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Government Service Templates */}
      {isGovProvider && !showForm && (
        <Card className="border-blue-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-earth-800 mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" /> Quick Create — Government Service
            </h3>
            <p className="text-xs text-earth-500 mb-4">Click a service below to auto-fill the form with the standard description and pricing.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {govServiceTypes.map(s => (
                <button key={s.title} onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); applyGovTemplate(s); }}
                  className="flex items-center gap-3 rounded-lg border border-earth-100 p-3 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
                  <span className="text-xl">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-earth-800">{s.title}</p>
                    <p className="text-[10px] text-earth-400">{s.price === '0' ? 'Free' : `৳${s.price}`}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Service Templates (non-gov providers) */}
      {!isGovProvider && !showForm && services.length === 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-earth-800 mb-3">💡 Quick Start Templates</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {regularServiceTemplates.map(s => (
                <button key={s.title} onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); applyRegularTemplate(s); }}
                  className="flex items-center gap-3 rounded-lg border border-earth-100 p-3 hover:bg-polli-50 hover:border-polli-300 transition-colors text-left">
                  <Wrench size={16} className="text-polli-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-earth-800">{s.title}</p>
                    <p className="text-[10px] text-earth-400">{s.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-polli-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {editingId ? 'Edit Service' : isGovProvider ? '🏛️ Create Government Service' : 'Create New Service'}
                <Sparkles size={16} className="text-amber-500" />
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-earth-400 hover:text-earth-600"><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title with suggestions + AI */}
              <div className="relative">
                <label className="block text-sm font-medium text-earth-700 mb-1">Service Title *</label>
                <div className="relative">
                  <input type="text" value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setShowTitleSuggestions(true); }}
                    onFocus={() => setShowTitleSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 200)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 pr-24 ${errors.title ? 'border-red-300' : 'border-earth-200'}`}
                    placeholder={isGovProvider ? 'e.g. NID Application, Birth Registration' : 'e.g. Tractor Rental, Crop Harvesting'} />
                  <div className="absolute right-2 top-1.5 flex items-center gap-1">
                    <button type="button" onClick={() => aiCorrectField('title')} disabled={correctingField === 'title' || !form.title.trim()}
                      className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-green-600 hover:bg-green-50 rounded disabled:opacity-50" title="Fix grammar">
                      {correctingField === 'title' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />} Fix
                    </button>
                    <button type="button" onClick={() => aiImproveField('title')} disabled={correctingField === 'title' || !form.title.trim()}
                      className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-polli-600 hover:bg-polli-50 rounded disabled:opacity-50" title="AI improve">
                      {correctingField === 'title' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Improve
                    </button>
                  </div>
                </div>
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                {showTitleSuggestions && !form.title && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-earth-200 shadow-xl max-h-48 overflow-auto">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-polli-600 bg-polli-50">💡 Suggested titles</p>
                    {(titleSuggestions[isGovProvider ? 'Citizen' : 'Agriculture'] || titleSuggestions.Other).map((s, i) => (
                      <button key={i} type="button" onClick={() => { setForm(f => ({ ...f, title: s })); setShowTitleSuggestions(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-earth-700 hover:bg-polli-50 transition-colors border-b border-earth-50 last:border-0">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description with AI */}
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
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 ${errors.description ? 'border-red-300' : 'border-earth-200'}`}
                  placeholder="Describe the service, required documents, processing time..." />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                {form.title && !form.description && (
                  <button type="button" onClick={() => {
                    const template = govServiceTypes.find(t => t.title === form.title);
                    if (template) setForm(f => ({ ...f, description: template.description }));
                    else setForm(f => ({ ...f, description: `Professional ${form.title.toLowerCase()} service. Visit our office with required documents.` }));
                  }} className="mt-2 flex items-center gap-1 text-xs text-polli-600 hover:text-polli-700">
                    <Sparkles size={12} /> AI: Auto-generate description
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Price (৳)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 ${errors.price ? 'border-red-300' : 'border-earth-200'}`}
                    placeholder="0 = Free" min="0" />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                    placeholder={isGovProvider ? 'Office address' : 'Village / Area'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">District</label>
                  <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                    className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500">
                    <option value="">Select district</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update Service' : 'Create Service'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : services.length === 0 ? (
          <EmptyState
            icon={<Wrench size={40} />}
            title="No services yet"
            description={isGovProvider ? "Create your first government service to start receiving citizen applications." : "Create your first service to start receiving requests from citizens."}
            action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Create Service</Button>}
          />
        ) : (
          services.map(s => (
            <Card key={s.service_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-earth-800">{s.title}</h3>
                    <Badge variant={(statusColors[s.status] as any) || 'default'}>{s.status}</Badge>
                    {!s.is_available && <Badge variant="danger">Hidden</Badge>}
                  </div>
                  {s.description && <p className="text-sm text-earth-500 mt-1 line-clamp-1">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-earth-400">
                    {s.price ? <span>৳{s.price}</span> : <span className="text-green-600 font-medium">Free</span>}
                    {s.location && <span>📍 {s.location}</span>}
                    {s.district && <span>{s.district}</span>}
                    <span>Added {new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => toggleAvailability(s)}>
                    {s.is_available ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(s)}>
                    <Edit size={14} />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(s.service_id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
