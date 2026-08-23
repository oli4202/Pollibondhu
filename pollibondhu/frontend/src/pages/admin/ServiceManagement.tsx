import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

export default function ServiceManagement() {
  const [services, setServices] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const { addToast } = useToast();

  async function fetchServices(page = 1) {
    const res = await api.get('/admin/services', { params: { page, limit: 10, status: statusFilter } });
    setServices(res.data.data.data);
    setMeta(res.data.data.meta || res.data.data);
  }

  useEffect(() => { fetchServices(); }, [statusFilter]);

  async function approveService(id: number) {
    try { await api.put(`/services/${id}/approve`); addToast('Service approved'); fetchServices(meta.page); } catch { addToast('Failed', 'error'); }
  }

  async function deleteService(id: number) {
    if (!confirm('Delete this service?')) return;
    try { await api.delete(`/services/${id}`); addToast('Service deleted'); fetchServices(meta.page); } catch { addToast('Failed', 'error'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-earth-900">Service Management</h1><p className="text-sm text-earth-500">Approve, edit, or remove services</p></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-polli-500">
          <option value="">All Status</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Title</TableHead><TableHead>Provider</TableHead><TableHead>District</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.service_id}>
                  <TableCell className="font-medium text-earth-800">{s.title}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{s.provider?.full_name}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{s.district || '—'}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{s.price ? `৳${s.price}` : 'Free'}</TableCell>
                  <TableCell><Badge variant={s.status === 'APPROVED' ? 'success' : s.status === 'PENDING' ? 'warning' : 'danger'}>{s.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    {s.status === 'PENDING' && <Button size="sm" onClick={() => approveService(s.service_id)}><CheckCircle size={14} className="mr-1" /> Approve</Button>}
                    <Button size="sm" variant="outline" onClick={() => deleteService(s.service_id)} className="text-red-600 border-red-200 hover:bg-red-50"><XCircle size={14} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-earth-400 py-8">No services found</TableCell></TableRow>}
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
    </div>
  );
}
