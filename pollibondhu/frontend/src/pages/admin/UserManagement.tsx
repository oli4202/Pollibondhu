import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, Shield, Eye } from 'lucide-react';

interface User {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  district?: string;
  is_active: boolean;
  phone?: string;
  created_at: string;
}

interface UserForm {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
  district: string;
}

const emptyForm: UserForm = { email: '', password: '', full_name: '', phone: '', role: 'CITIZEN', district: '' };

const roleOptions = [
  'CITIZEN', 'SERVICE_PROVIDER', 'GOV_SERVICE_PROVIDER', 'OFFICER', 'ADMIN',
  'NGO_ADMIN', 'INSTITUTION_ADMIN', 'TEACHER',
];

const districts = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Gazipur', 'Narayanganj', 'Bogura', "Cox's Bazar", 'Jessore', 'Dinajpur',
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const { addToast } = useToast();

  async function fetchUsers(page = 1) {
    try {
      const res = await api.get('/admin/users', { params: { page, limit: 10, search, role: roleFilter } });
      const data = res.data.data;
      setUsers(data.data || []);
      setMeta(data.meta || { page, limit: 10, total: 0 });
    } catch { setUsers([]); }
  }

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  function handleEdit(user: User) {
    setForm({
      email: user.email,
      password: '',
      full_name: user.full_name,
      phone: user.phone || '',
      role: user.role,
      district: user.district || '',
    });
    setEditingId(user.user_id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { addToast('Name is required', 'error'); return; }
    if (!editingId && !form.password) { addToast('Password is required', 'error'); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/admin/users/${editingId}`, {
          full_name: form.full_name,
          phone: form.phone || undefined,
          role: form.role,
          district: form.district || undefined,
        });
        addToast('User updated successfully');
      } else {
        await api.post('/admin/users', form);
        addToast('User created successfully');
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchUsers(meta.page);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed', 'error');
    } finally { setSubmitting(false); }
  }

  async function toggleStatus(id: number, isActive: boolean) {
    try {
      if (isActive) {
        await api.put(`/admin/users/${id}/deactivate`);
        addToast('User deactivated');
      } else {
        await api.put(`/admin/users/${id}`, { is_active: true });
        addToast('User activated');
      }
      fetchUsers(meta.page);
    } catch { addToast('Failed to update', 'error'); }
  }

  async function deleteUser(id: number) {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      addToast('User deleted');
      fetchUsers(meta.page);
    } catch { addToast('Failed to delete', 'error'); }
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'danger', OFFICER: 'info',
      SERVICE_PROVIDER: 'success', GOV_SERVICE_PROVIDER: 'success', CITIZEN: 'default',
      NGO_ADMIN: 'warning', INSTITUTION_ADMIN: 'warning', TEACHER: 'info',
    };
    return <Badge variant={(colors[role] as any) || 'default'}>{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">User Management</h1>
          <p className="text-sm text-earth-500">Create, update, deactivate, and delete platform users</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-earth-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search users..." className="pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-polli-500" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-polli-500">
            <option value="">All Roles</option>
            {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}><Plus size={16} /> New User</Button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-polli-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit User' : 'Create New User'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-earth-400 hover:text-earth-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Full Name *</label>
                  <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                    placeholder="Enter full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    disabled={!!editingId}
                    className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 disabled:bg-earth-50"
                    placeholder="email@example.com" />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">Password *</label>
                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                      placeholder="Minimum 6 characters" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                    placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Role *</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500">
                    {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
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
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update User' : 'Create User'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
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
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell className="text-earth-500 text-sm">{u.district || '—'}</TableCell>
                  <TableCell><Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setViewUser(u)}><Eye size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(u)}><Edit size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(u.user_id, u.is_active)}
                        className={u.is_active ? 'text-amber-600' : 'text-green-600'}>
                        <Shield size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteUser(u.user_id)} className="text-red-600"><Trash2 size={14} /></Button>
                    </div>
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

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">User Details</h2>
              <button onClick={() => setViewUser(null)} className="text-earth-400 hover:text-earth-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Name</span><span className="text-sm font-bold">{viewUser.full_name}</span></div>
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Email</span><span className="text-sm font-bold">{viewUser.email}</span></div>
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Role</span>{roleBadge(viewUser.role)}</div>
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">Phone</span><span className="text-sm font-bold">{viewUser.phone || '—'}</span></div>
              <div className="flex justify-between border-b border-earth-100 pb-2"><span className="text-sm text-earth-500">District</span><span className="text-sm font-bold">{viewUser.district || '—'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-earth-500">Status</span><Badge variant={viewUser.is_active ? 'success' : 'danger'}>{viewUser.is_active ? 'Active' : 'Inactive'}</Badge></div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button size="sm" onClick={() => { setViewUser(null); handleEdit(viewUser); }}><Edit size={14} /> Edit</Button>
              <Button size="sm" variant="outline" onClick={() => { setViewUser(null); toggleStatus(viewUser.user_id, viewUser.is_active); }}>
                {viewUser.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
