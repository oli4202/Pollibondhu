import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trash2, Eye, X } from 'lucide-react';

interface Service {
  service_id: number;
  title: string;
  description?: string;
  price?: number;
  district?: string;
  status: string;
  is_available: boolean;
  provider?: { full_name: string; email: string } | null;
  category?: { name: string } | null;
  created_at: string;
}

export default function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewService, setViewService] = useState<Service | null>(null);
  const { addToast } = useToast();

  async function fetchServices(page = 1) {
    try {
      const res = await api.get('/admin/services', { params: { page, limit: 10, status: statusFilter, search } });
      const data = res.data.data;
      setServices(data.data || []);
      setMeta(data.meta || { page: data.page || page, limit: data.limit || 10, total: data.total || 0 });
    } catch { setServices([]); }
  }

  useEffect(() => { fetchServices(); }, [statusFilter]);

  async function approveService(id: number) {
    try {
      await api.put(`/admin/services/${id}/approve`);
      addToast('Service approved — provider notified');
      fetchServices(meta.page);
    } catch { addToast('Failed', 'error'); }
  }

  async function rejectService(id: number) {
    const reason = prompt('Rejection reason (optional):');
    try {
      await api.put(`/admin/services/${id}/reject`, { reason });
      addToast('Service rejected — provider notified');
      fetchServices(meta.page);
    } catch { addToast('Failed', 'error'); }
  }

  async function deleteService(id: number) {
    if (!confirm('Delete this service permanently?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      addToast('Service deleted');
      fetchServices(meta.page);
    } catch { addToast('Failed', 'error'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Service Management</h1>
          <p className="text-sm text-earth-500">Approve, reject, edit, or remove services</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-earth-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchServices()}
              placeholder="Search services..." className="pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-polli-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-polli-500">
            <option value="">All Status</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.service_id}>
                  <TableCell className="font-medium text-earth-800">{s.title}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{s.provider?.full_name || '—'}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{s.category?.name || '—'}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{s.price ? `৳${s.price}` : 'Free'}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{s.district || '—'}</TableCell>
                  <TableCell><Badge variant={s.status === 'APPROVED' ? 'success' : s.status === 'PENDING' ? 'warning' : 'danger'}>{s.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setViewService(s)}><Eye size={14} /></Button>
                      {s.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => approveService(s.service_id)} className="text-green-600"><CheckCircle size={14} /></Button>
                          <Button size="sm" variant="ghost" onClick={() => rejectService(s.service_id)} className="text-amber-600"><XCircle size={14} /></Button>
                        </>
                      )}
                      {s.status === 'APPROVED' && (
                        <Button size="sm" variant="ghost" onClick={() => rejectService(s.service_id)} className="text-amber-600"><XCircle size={14} /></Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteService(s.service_id)} className="text-red-600"><Trash2 size={14} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-earth-400 py-8">No services found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-earth-500">
        <span>Showing {services.length} of {meta.total} services</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchServices(meta.page - 1)} disabled={meta.page <= 1}><ChevronLeft size={16} /></Button>
          <Button variant="outline" size="sm" onClick={() => fetchServices(meta.page + 1)} disabled={meta.page * meta.limit >= meta.total}><ChevronRight size={16} /></Button>
        </div>
      </div>

      {/* View Service Modal */}
      {viewService && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Service Details</h2>
              <button onClick={() => setViewService(null)} className="text-earth-400 hover:text-earth-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Title</span><span className="text-sm font-bold">{viewService.title}</span></div>
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Description</span><span className="text-sm text-right max-w-[200px]">{viewService.description || '—'}</span></div>
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Provider</span><span className="text-sm font-bold">{viewService.provider?.full_name || '—'}</span></div>
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Category</span><span className="text-sm font-bold">{viewService.category?.name || '—'}</span></div>
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Price</span><span className="text-sm font-bold">{viewService.price ? `৳${viewService.price}` : 'Free'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-earth-500">Status</span><Badge variant={viewService.status === 'APPROVED' ? 'success' : viewService.status === 'PENDING' ? 'warning' : 'danger'}>{viewService.status}</Badge></div>
            </div>
            <div className="flex gap-2 mt-6">
              {viewService.status === 'PENDING' && (
                <>
                  <Button size="sm" onClick={() => { approveService(viewService.service_id); setViewService(null); }}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => { rejectService(viewService.service_id); setViewService(null); }}>Reject</Button>
                </>
              )}
              <Button size="sm" variant="danger" onClick={() => { deleteService(viewService.service_id); setViewService(null); }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
