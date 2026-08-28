import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/utils/api';
import {
  AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle,
  ChevronRight, Send, Loader2, Star, User, Calendar, Tag, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { useRef } from 'react';

// ============================================
// TYPES
// ============================================
interface ProviderComplaint {
  complaint_id: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  response?: string;
  rating?: number;
  feedback?: string;
  conversation_id?: number;
  created_at: string;
  responded_at?: string;
  resolved_at?: string;
  user: { full_name: string; avatar_url?: string; email?: string };
  provider: { full_name: string };
  service?: { title: string };
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'default',
  REJECTED: 'danger',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: '📋 General',
  SERVICE_QUALITY: '🔧 Service Quality',
  DELAY: '⏰ Delay',
  BILLING: '💰 Billing',
  STAFF: '👤 Staff',
  OTHER: '📌 Other',
};

// ============================================
// COMPONENT
// ============================================
export default function ProviderComplaints() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  const [complaints, setComplaints] = useState<ProviderComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProviderComplaint | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/chat/complaints', { params });
      setComplaints(res.data.data || []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // SOCKET.IO REAL-TIME UPDATES
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(api.defaults.baseURL?.replace('/api', '') || 'http://localhost:4000', {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('complaint:new', (complaint: ProviderComplaint) => {
      setComplaints((prev) => [complaint, ...prev]);
      addToast(`New complaint received: ${complaint.subject}`, 'success');
    });

    socket.on('complaint:update', (updatedComplaint: ProviderComplaint) => {
      setComplaints((prev) => prev.map(c => c.complaint_id === updatedComplaint.complaint_id ? updatedComplaint : c));
      if (selected?.complaint_id === updatedComplaint.complaint_id) {
        setSelected(updatedComplaint);
      }
      addToast(`Complaint updated: ${updatedComplaint.subject}`, 'success');
    });

    return () => {
      socket.off('complaint:new');
      socket.off('complaint:update');
      socket.disconnect();
    };
  }, [user, selected, addToast]);

  // ============================================
  // RESPOND TO COMPLAINT
  // ============================================
  async function handleRespond() {
    if (!selected || !responseText.trim()) return;
    setSubmitting(true);
    try {
      await api.put(`/chat/complaints/${selected.complaint_id}/respond`, {
        response: responseText.trim(),
        status: 'IN_PROGRESS',
      });
      addToast('Response submitted successfully');
      setResponseText('');
      fetchComplaints();
      // Update selected with response
      setSelected(prev => prev ? { ...prev, response: responseText.trim(), status: 'IN_PROGRESS' } : null);
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to submit response', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================
  // AI AUTO REPLY
  // ============================================
  async function handleAiAutoReply(action: 'RESOLVE' | 'RESPOND') {
    if (!selected) return;
    setGeneratingAi(true);
    try {
      const res = await api.post('/ai/complaint-response', {
        action,
        complaintSubject: selected.subject,
        complaintDescription: selected.description,
        citizenName: selected.user.full_name,
      });
      setResponseText(res.data.response);
      addToast('AI drafted a response!', 'success');
    } catch (err) {
      addToast('Failed to generate AI response', 'error');
    } finally {
      setGeneratingAi(false);
    }
  }

  // ============================================
  // RESOLVE COMPLAINT
  // ============================================
  async function handleResolve() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/chat/complaints/${selected.complaint_id}/resolve`, {
        status: 'RESOLVED',
      });
      addToast('Complaint marked as resolved');
      fetchComplaints();
      setSelected(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to resolve complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================
  // NAVIGATION
  // ============================================
  function goToChat(conversationId: number) {
    navigate('/provider/messages', { state: { conversationId } });
  }

  // ============================================
  // STATS
  // ============================================
  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'OPEN').length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Provider Dashboard', href: '/provider' }, { label: 'Complaints' }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Complaints</h1>
          <p className="text-sm text-earth-500">View and respond to complaints filed by citizens against your services</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-earth-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-polli-500"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: AlertTriangle, color: 'bg-earth-50 text-earth-600' },
          { label: 'Open', value: stats.open, icon: Clock, color: 'bg-amber-50 text-amber-600' },
          { label: 'In Progress', value: stats.inProgress, icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-earth-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-earth-900">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${s.color}`}>
                <s.icon size={18} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Complaints List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <Card><CardContent className="p-8 text-center"><Loader2 size={24} className="animate-spin mx-auto text-earth-400" /></CardContent></Card>
          ) : complaints.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
                <h3 className="font-semibold text-earth-700 mb-1">No complaints found</h3>
                <p className="text-sm text-earth-400">
                  {statusFilter ? 'No complaints with this status' : 'No complaints have been filed against your services'}
                </p>
              </CardContent>
            </Card>
          ) : complaints.map(c => (
            <Card
              key={c.complaint_id}
              className={`cursor-pointer hover:shadow-md transition-all ${
                selected?.complaint_id === c.complaint_id ? 'ring-2 ring-polli-500 shadow-md' : ''
              }`}
              onClick={() => { setSelected(c); setResponseText(c.response || ''); }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-earth-800 truncate">{c.subject}</h3>
                      <Badge variant={STATUS_COLORS[c.status] as any || 'default'} className="text-[9px] shrink-0">
                        {c.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant={PRIORITY_COLORS[c.priority] as any || 'default'} className="text-[9px] shrink-0">
                        {c.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-earth-500 line-clamp-2 mb-2">{c.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-earth-400">
                      <span className="flex items-center gap-1"><User size={10} /> {c.user.full_name}</span>
                      <span className="flex items-center gap-1"><Tag size={10} /> {CATEGORY_LABELS[c.category] || c.category}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-earth-300 shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Complaint #{selected.complaint_id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status & Priority */}
                  <div className="flex gap-2">
                    <Badge variant={STATUS_COLORS[selected.status] as any || 'default'}>
                      {selected.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant={PRIORITY_COLORS[selected.priority] as any || 'default'}>
                      {selected.priority}
                    </Badge>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-[10px] font-semibold text-earth-400 uppercase">Subject</label>
                    <p className="text-sm font-medium text-earth-800 mt-0.5">{selected.subject}</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-semibold text-earth-400 uppercase">Description</label>
                    <p className="text-sm text-earth-600 mt-0.5 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
                  </div>

                  {/* From */}
                  <div>
                    <label className="text-[10px] font-semibold text-earth-400 uppercase">Filed By</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-7 w-7 rounded-full bg-polli-100 text-polli-700 flex items-center justify-center text-xs font-bold">
                        {selected.user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-earth-800">{selected.user.full_name}</p>
                        <p className="text-[10px] text-earth-400">
                          {new Date(selected.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Service */}
                  {selected.service && (
                    <div>
                      <label className="text-[10px] font-semibold text-earth-400 uppercase">Related Service</label>
                      <p className="text-sm text-earth-600 mt-0.5">{selected.service.title}</p>
                    </div>
                  )}

                  {/* Existing Response */}
                  {selected.response && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <label className="text-[10px] font-semibold text-blue-600 uppercase">Your Response</label>
                      <p className="text-sm text-blue-800 mt-1 whitespace-pre-wrap">{selected.response}</p>
                      {selected.responded_at && (
                        <p className="text-[10px] text-blue-400 mt-1">
                          Responded {new Date(selected.responded_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rating (if resolved) */}
                  {selected.rating && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <label className="text-[10px] font-semibold text-green-600 uppercase">Citizen Rating</label>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= selected.rating! ? 'text-amber-400 fill-amber-400' : 'text-earth-200'}
                          />
                        ))}
                        <span className="text-sm text-earth-600 ml-1">{selected.rating}/5</span>
                      </div>
                      {selected.feedback && (
                        <p className="text-xs text-earth-600 mt-1 italic">"{selected.feedback}"</p>
                      )}
                    </div>
                  )}

                  {/* Response Input */}
                  {selected.status !== 'RESOLVED' && selected.status !== 'CLOSED' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-semibold text-earth-400 uppercase block">
                          {selected.response ? 'Update Response' : 'Your Response'}
                        </label>
                        <button
                          onClick={() => handleAiAutoReply('RESPOND')}
                          disabled={generatingAi}
                          className="flex items-center gap-1 text-[10px] font-bold text-polli-600 bg-polli-50 hover:bg-polli-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          {generatingAi ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          AI Auto Reply
                        </button>
                      </div>
                      <textarea
                        value={responseText}
                        onChange={e => setResponseText(e.target.value)}
                        placeholder="Type your response to this complaint..."
                        rows={3}
                        className="w-full border border-earth-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    {selected.status !== 'RESOLVED' && selected.status !== 'CLOSED' && (
                      <>
                        <Button
                          onClick={handleRespond}
                          disabled={!responseText.trim() || submitting}
                          className="w-full"
                          size="sm"
                        >
                          {submitting ? (
                            <><Loader2 size={14} className="animate-spin" /> Sending...</>
                          ) : (
                            <><Send size={14} /> {selected.response ? 'Update Response' : 'Send Response'}</>
                          )}
                        </Button>
                        <Button
                          onClick={handleResolve}
                          disabled={submitting}
                          variant="outline"
                          className="w-full text-green-700 border-green-200 hover:bg-green-50"
                          size="sm"
                        >
                          <CheckCircle size={14} /> Mark as Resolved
                        </Button>
                      </>
                    )}

                    {selected.conversation_id && (
                      <Button
                        onClick={() => goToChat(selected.conversation_id!)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <MessageSquare size={14} /> Open Chat with Citizen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-earth-400 text-sm">
                <AlertTriangle size={32} className="mx-auto mb-2 text-earth-300" />
                Select a complaint to view details and respond
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
