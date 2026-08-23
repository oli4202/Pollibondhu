import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

export default function ComplaintResolution() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  async function fetchComplaints(page = 1) {
    const res = await api.get('/admin/complaints', { params: { page, limit: 10, status: statusFilter } });
    setComplaints(res.data.data.data);
    setMeta(res.data.data.meta || res.data.data);
  }

  useEffect(() => { fetchComplaints(); }, [statusFilter]);

  async function updateStatus(id: number, status: string) {
    try { await api.put(`/complaints/${id}/status`, { status, notes }); addToast(`Complaint marked ${status}`); setSelected(null); setNotes(''); fetchComplaints(meta.page); } catch { addToast('Failed', 'error'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-earth-900">Complaint Resolution</h1><p className="text-sm text-earth-500">Review and resolve user complaints</p></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-polli-500">
          <option value="">All Status</option><option value="PENDING">Pending</option><option value="REVIEWING">Reviewing</option><option value="RESOLVED">Resolved</option><option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Subject</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c) => (
                    <TableRow key={c.complaint_id} className="cursor-pointer" onClick={() => { setSelected(c); setNotes(c.resolution_notes || ''); }}>
                      <TableCell className="font-medium text-earth-800">{c.subject}</TableCell>
                      <TableCell className="text-earth-500 text-sm">{c.category}</TableCell>
                      <TableCell><Badge variant={c.priority === 'HIGH' ? 'danger' : c.priority === 'MEDIUM' ? 'warning' : 'default'}>{c.priority}</Badge></TableCell>
                      <TableCell><Badge variant={c.status === 'RESOLVED' ? 'success' : c.status === 'PENDING' ? 'warning' : c.status === 'REVIEWING' ? 'default' : 'danger'}>{c.status}</Badge></TableCell>
                      <TableCell className="text-earth-400 text-xs">{new Date(c.submitted_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(c); }}><MessageSquare size={14} /></Button></TableCell>
                    </TableRow>
                  ))}
                  {complaints.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-earth-400 py-8">No complaints found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between text-sm text-earth-500 mt-4">
            <span>Showing {complaints.length} of {meta.total}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchComplaints(meta.page - 1)} disabled={meta.page <= 1}><ChevronLeft size={16} /></Button>
              <Button variant="outline" size="sm" onClick={() => fetchComplaints(meta.page + 1)} disabled={meta.page * meta.limit >= meta.total}><ChevronRight size={16} /></Button>
            </div>
          </div>
        </div>

        <div>
          {selected ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Complaint #{selected.complaint_id}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="text-xs font-medium text-earth-500">Subject</label><div className="text-sm font-medium text-earth-800">{selected.subject}</div></div>
                <div><label className="text-xs font-medium text-earth-500">Description</label><div className="text-sm text-earth-600">{selected.description}</div></div>
                <div><label className="text-xs font-medium text-earth-500">From</label><div className="text-sm text-earth-600">{selected.user?.full_name} ({selected.user?.email})</div></div>
                <div>
                  <label className="text-xs font-medium text-earth-500">Resolution Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 rounded-lg border border-earth-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500" rows={3} />
                </div>
                <div className="flex gap-2 pt-2">
                  {selected.status !== 'REVIEWING' && <Button size="sm" className="flex-1" onClick={() => updateStatus(selected.complaint_id, 'REVIEWING')}>Mark Reviewing</Button>}
                  <Button size="sm" variant="outline" className="flex-1 text-green-700 border-green-200 hover:bg-green-50" onClick={() => updateStatus(selected.complaint_id, 'RESOLVED')}>Resolve</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateStatus(selected.complaint_id, 'REJECTED')}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-8 text-center text-earth-400 text-sm">Select a complaint to view details and take action.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
