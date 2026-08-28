import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/utils/api';
import {
  FileText, CheckCircle, XCircle, Clock, RefreshCw, Eye, ChevronDown,
  ChevronUp, User, Calendar, Tag, Search, Filter, Sparkles
} from 'lucide-react';

interface Application {
  application_id: number;
  tracking_id: string;
  status: string;
  priority: string;
  applicant_name?: string;
  applicant_data?: string;
  submitted_at: string;
  reviewed_at?: string;
  notes?: string;
  rejection_reason?: string;
  user?: { full_name: string; email: string; district?: string };
  service?: { title: string };
  department?: { name: string };
  updates?: { new_status: string; notes?: string; created_at: string; user?: { full_name: string } }[];
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'warning',
  REVIEWING: 'info',
  IN_PROGRESS: 'info',
  ADDITIONAL_DOCS_REQUIRED: 'warning',
  RESUBMITTED: 'default',
  APPROVED: 'success',
  REJECTED: 'danger',
  CLOSED: 'default',
};

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string; deducts?: boolean }[]> = {
  SUBMITTED:   [{ label: '🔍 Start Review', next: 'REVIEWING', color: 'bg-blue-600 text-white' }, { label: '❌ Reject', next: 'REJECTED', color: 'bg-red-100 text-red-700' }],
  REVIEWING:   [{ label: '📋 Request Docs', next: 'ADDITIONAL_DOCS_REQUIRED', color: 'bg-amber-100 text-amber-700' }, { label: '⚙️ In Progress', next: 'IN_PROGRESS', color: 'bg-purple-100 text-purple-700' }, { label: '❌ Reject', next: 'REJECTED', color: 'bg-red-100 text-red-700' }],
  IN_PROGRESS: [{ label: '✅ Approve & Deliver', next: 'RESOLVED', color: 'bg-green-600 text-white', deducts: true }, { label: '❌ Reject', next: 'REJECTED', color: 'bg-red-100 text-red-700' }],
  ADDITIONAL_DOCS_REQUIRED: [],
  RESUBMITTED: [{ label: '🔍 Start Review', next: 'REVIEWING', color: 'bg-blue-600 text-white' }, { label: '⚙️ In Progress', next: 'IN_PROGRESS', color: 'bg-purple-100 text-purple-700' }, { label: '✅ Approve & Deliver', next: 'RESOLVED', color: 'bg-green-600 text-white', deducts: true }, { label: '❌ Reject', next: 'REJECTED', color: 'bg-red-100 text-red-700' }],
  APPROVED: [{ label: '🔒 Close', next: 'CLOSED', color: 'bg-earth-200 text-earth-700' }],
  REJECTED: [],
  RESOLVED: [{ label: '🔒 Close', next: 'CLOSED', color: 'bg-earth-200 text-earth-700' }],
  CLOSED: [],
};

export default function ProviderApplications() {
  const { addToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [showNotesFor, setShowNotesFor] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{ id: number; status: string } | null>(null);
  const [aiGenerating, setAiGenerating] = useState<number | null>(null);
  const [uploadingDocFor, setUploadingDocFor] = useState<number | null>(null);

  const generateAIResponse = async (app: Application) => {
    const actionStatus = pendingAction ? pendingAction.status : app.status;
    setAiGenerating(app.application_id);
    try {
      const res = await api.post('/ai/application-response', {
        status: actionStatus,
        serviceName: app.service?.title,
        applicantName: app.user?.full_name || app.applicant_name,
      });
      if (res.data.success && res.data.response) {
        setNotes(prev => ({ ...prev, [app.application_id]: res.data.response }));
        addToast('AI response generated. You can edit it before confirming.', 'success');
      }
    } catch {
      addToast('Failed to generate AI response', 'error');
    } finally {
      setAiGenerating(null);
    }
  };

  const handleFileUpload = async (application_id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingDocFor(application_id);
    try {
      // Create a fake file url for now, since we aren't using S3/storage yet.
      // In a real app, you'd upload this to an endpoint that returns a URL.
      const mockUrl = URL.createObjectURL(file);
      
      await api.post(`/applications/${application_id}/documents`, {
        doc_type: 'PROVIDER_DOCUMENT',
        file_name: file.name,
        file_url: mockUrl,
        file_size: file.size,
        mime_type: file.type
      });
      addToast('Document uploaded successfully.', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to upload document', 'error');
    } finally {
      setUploadingDocFor(null);
    }
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '50' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/applications', { params });
      setApplications(res.data.data?.data || res.data.data || []);
    } catch {
      addToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const processApplication = async (application_id: number, status: string) => {
    const noteText = notes[application_id] || '';
    const needsNotes = ['REJECTED', 'APPROVED', 'ADDITIONAL_DOCS_REQUIRED'].includes(status);
    if (needsNotes && !noteText.trim()) {
      setShowNotesFor(application_id);
      setPendingAction({ id: application_id, status });
      addToast('Please add a note before proceeding', 'error');
      return;
    }
    setActionLoading(application_id);
    try {
      await api.put(`/applications/${application_id}/process`, {
        status,
        notes: noteText || undefined,
        rejection_reason: status === 'REJECTED' ? (noteText || 'Application rejected by provider') : undefined,
      });
      addToast(`Application ${status.toLowerCase().replace(/_/g, ' ')} successfully`, 'success');
      setShowNotesFor(null);
      setPendingAction(null);
      setNotes(prev => { const n = { ...prev }; delete n[application_id]; return n; });
      fetchApplications();
    } catch (err: any) {
      addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to update application', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmNoteAction = () => {
    if (pendingAction) processApplication(pendingAction.id, pendingAction.status);
  };

  const filtered = applications.filter(app => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      app.tracking_id.toLowerCase().includes(q) ||
      (app.applicant_name || '').toLowerCase().includes(q) ||
      (app.user?.full_name || '').toLowerCase().includes(q) ||
      (app.service?.title || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: applications.length,
    submitted: applications.filter(a => a.status === 'SUBMITTED').length,
    inProgress: applications.filter(a => ['REVIEWING', 'IN_PROGRESS', 'RESUBMITTED', 'ADDITIONAL_DOCS_REQUIRED'].includes(a.status)).length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Provider', href: '/provider' }, { label: 'Applications' }]} />

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">🏛️ Government Service Portal</p>
            <h1 className="text-2xl font-bold mt-1">Citizen Applications</h1>
            <p className="text-blue-200 text-sm mt-1">Review and process all citizen service requests</p>
          </div>
          <button onClick={fetchApplications} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-earth-50 text-earth-700', filter: '' },
          { label: 'New', value: stats.submitted, color: 'bg-amber-50 text-amber-700', filter: 'SUBMITTED' },
          { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-50 text-blue-700', filter: 'REVIEWING' },
          { label: 'Approved', value: stats.approved, color: 'bg-green-50 text-green-700', filter: 'APPROVED' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700', filter: 'REJECTED' },
        ].map(s => (
          <button key={s.label} onClick={() => setStatusFilter(statusFilter === s.filter ? '' : s.filter)}
            className={`rounded-xl p-4 text-left transition hover:shadow-md ${s.color} ${statusFilter === s.filter ? 'ring-2 ring-blue-400' : ''}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, tracking ID or service..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-earth-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 text-sm border border-earth-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
            <option value="">All Status</option>
            {['SUBMITTED','REVIEWING','IN_PROGRESS','ADDITIONAL_DOCS_REQUIRED','RESUBMITTED','APPROVED','REJECTED','CLOSED'].map(s =>
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            )}
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <FileText size={48} className="mx-auto text-earth-300 mb-3" />
            <h3 className="font-bold text-earth-600 mb-1">No applications found</h3>
            <p className="text-sm text-earth-400">When citizens submit service requests, they will appear here.</p>
          </CardContent></Card>
        ) : filtered.map(app => {
          const isExpanded = expanded === app.application_id;
          const actions = STATUS_ACTIONS[app.status] || [];
          const appData = (() => { try { return JSON.parse(app.applicant_data || '{}'); } catch { return {}; } })();

          return (
            <Card key={app.application_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Card Header */}
                <div className="p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {(app.applicant_name || app.user?.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-earth-800">{app.applicant_name || app.user?.full_name || 'Unknown'}</h3>
                      <Badge variant={STATUS_COLORS[app.status] as any}>{app.status.replace(/_/g, ' ')}</Badge>
                      {app.priority !== 'NORMAL' && <Badge variant="danger">{app.priority}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-earth-500 flex items-center gap-1"><Tag size={11} />{app.service?.title || 'General Service'}</span>
                      <span className="text-xs font-mono text-polli-600">{app.tracking_id}</span>
                      <span className="text-xs text-earth-400 flex items-center gap-1"><Calendar size={11} />{new Date(app.submitted_at).toLocaleDateString('en-GB')}</span>
                      {app.user?.district && <span className="text-xs text-earth-400 flex items-center gap-1"><User size={11} />{app.user.district}</span>}
                    </div>
                  </div>
                  <button onClick={() => setExpanded(isExpanded ? null : app.application_id)}
                    className="p-1.5 rounded-lg hover:bg-earth-100 transition shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-earth-100 p-4 space-y-4 bg-earth-50/50">
                    {/* Applicant Info */}
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white rounded-xl p-3 border border-earth-100">
                        <p className="font-bold text-earth-600 mb-2 flex items-center gap-1"><User size={12}/> Applicant Info</p>
                        <p><span className="text-earth-400">Name:</span> {app.user?.full_name || app.applicant_name || '—'}</p>
                        <p><span className="text-earth-400">Email:</span> {app.user?.email || '—'}</p>
                        <p><span className="text-earth-400">District:</span> {app.user?.district || '—'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-earth-100">
                        <p className="font-bold text-earth-600 mb-2 flex items-center gap-1"><FileText size={12}/> Application Details</p>
                        <p><span className="text-earth-400">Service:</span> {app.service?.title || 'Gov. Service'}</p>
                        <p><span className="text-earth-400">Submitted:</span> {new Date(app.submitted_at).toLocaleString()}</p>
                        {app.notes && <p><span className="text-earth-400">Notes:</span> {app.notes}</p>}
                      </div>
                    </div>

                    {/* Form Data */}
                    {Object.keys(appData).filter(k => k !== 'service' && appData[k]).length > 0 && (
                      <div className="bg-white rounded-xl p-3 border border-earth-100">
                        <p className="font-bold text-earth-600 mb-2 text-xs">📋 Submitted Form Data</p>
                        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(appData).filter(([k]) => k !== 'service').map(([k, v]) => (
                            <p key={k} className="text-xs">
                              <span className="text-earth-400 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}: </span>
                              <span className="text-earth-700 font-medium">{String(v)}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Input */}
                    {(showNotesFor === app.application_id || actions.length > 0) && (
                      <div className="bg-white rounded-xl p-3 border border-earth-100">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-earth-600">
                            📝 Notes / Response (required for approve/reject)
                          </label>
                          <button 
                            onClick={() => generateAIResponse(app)}
                            disabled={aiGenerating === app.application_id}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50 transition bg-blue-50 px-2 py-1 rounded-md"
                            title="Generate an automatic response based on the application status"
                          >
                            <Sparkles size={12} />
                            {aiGenerating === app.application_id ? 'Generating...' : 'AI Auto-Reply'}
                          </button>
                        </div>
                        <textarea
                          value={notes[app.application_id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [app.application_id]: e.target.value }))}
                          rows={3}
                          placeholder="Add review notes, approval instructions, or rejection reason..."
                          className="w-full text-sm border border-earth-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                        />
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <input
                              type="file"
                              id={`upload-${app.application_id}`}
                              className="hidden"
                              onChange={(e) => handleFileUpload(app.application_id, e)}
                              disabled={uploadingDocFor === app.application_id}
                            />
                            <label
                              htmlFor={`upload-${app.application_id}`}
                              className={`text-xs font-bold px-3 py-1.5 border border-earth-200 rounded-lg cursor-pointer transition ${uploadingDocFor === app.application_id ? 'opacity-50' : 'hover:bg-earth-50'}`}
                            >
                              {uploadingDocFor === app.application_id ? 'Uploading...' : '📎 Upload Final Document'}
                            </label>
                          </div>
                        </div>

                        {showNotesFor === app.application_id && pendingAction && (
                          <div className="flex gap-2 mt-2 pt-2 border-t border-earth-100">
                            <button onClick={confirmNoteAction} disabled={!notes[app.application_id]?.trim()}
                              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                              Confirm Action
                            </button>
                            <button onClick={() => { setShowNotesFor(null); setPendingAction(null); }}
                              className="px-4 py-2 border border-earth-200 text-earth-600 text-xs font-bold rounded-lg hover:bg-earth-50 transition">
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {actions.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 flex-wrap">
                          {actions.map(action => (
                            <button
                              key={action.next}
                              onClick={() => {
                                addToast("This application has been processed.", "success");
                                processApplication(app.application_id, action.next);
                              }}
                              disabled={actionLoading === app.application_id}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition hover:opacity-90 disabled:opacity-50 ${action.color}`}
                            >
                              {actionLoading === app.application_id ? (
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                              ) : null}
                              {action.label}
                            </button>
                          ))}
                        </div>
                        {actions.some(a => a.deducts) && (
                          <p className="text-xs text-amber-600 font-medium mt-1">
                            ⚠️ Note: Delivering this service will automatically deduct its cost from the linked Project budget.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Timeline */}
                    {app.updates && app.updates.length > 0 && (
                      <div className="bg-white rounded-xl p-3 border border-earth-100">
                        <p className="font-bold text-earth-600 mb-2 text-xs flex items-center gap-1"><Clock size={11}/> Status History</p>
                        <div className="space-y-2">
                          {app.updates.map((u, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0"/>
                              <div>
                                <span className="font-semibold text-earth-700">{u.new_status?.replace(/_/g, ' ')}</span>
                                {u.notes && <span className="text-earth-400"> — {u.notes}</span>}
                                <p className="text-earth-400">{new Date(u.created_at).toLocaleString()} {u.user?.full_name && `· ${u.user.full_name}`}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length > 0 && (
        <p className="text-center text-sm text-earth-400">
          Showing {filtered.length} of {applications.length} applications
        </p>
      )}
    </div>
  );
}
