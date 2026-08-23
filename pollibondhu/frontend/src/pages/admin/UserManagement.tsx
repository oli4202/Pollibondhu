import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { addToast } = useToast();

  async function fetchUsers(page = 1) {
    const res = await api.get('/admin/users', { params: { page, limit: 10, search, role: roleFilter } });
    setUsers(res.data.data.data);
    setMeta(res.data.data.meta || res.data.data);
  }

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  async function toggleStatus(id: number, is_active: boolean) {
    try {
      await api.put(`/users/${id}/status`, { is_active: !is_active });
      addToast(`User ${is_active ? 'deactivated' : 'activated'}`);
      fetchUsers(meta.page);
    } catch {
      addToast('Failed to update user', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">User Management</h1>
          <p className="text-sm text-earth-500">Search, filter, and manage platform users</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-earth-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search users..." className="pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-polli-500" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-polli-500">
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="PROVIDER">Provider</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium text-earth-800">{u.full_name}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{u.email}</TableCell>
                  <TableCell><Badge>{u.role}</Badge></TableCell>
                  <TableCell className="text-earth-500 text-sm">{u.district || '—'}</TableCell>
                  <TableCell><Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(u.user_id, u.is_active)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-earth-400 py-8">No users found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-earth-500">
        <span>Showing {users.length} of {meta.total} users</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchUsers(meta.page - 1)} disabled={meta.page <= 1}><ChevronLeft size={16} /></Button>
          <Button variant="outline" size="sm" onClick={() => fetchUsers(meta.page + 1)} disabled={meta.page * meta.limit >= meta.total}><ChevronRight size={16} /></Button>
        </div>
      </div>
    </div>
  );
}
