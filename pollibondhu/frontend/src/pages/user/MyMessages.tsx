import { useState, useEffect, useRef, useCallback } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  MessageSquare, Send, Users, Plus, Search, Phone, Video, MoreVertical,
  Mic, MicOff, Image, Paperclip, Smile, X, ChevronDown, ChevronLeft,
  Bot, Radio, AlertTriangle, Building2, Shield, Heart, Wrench, FileText,
  Play, Pause, Square, Check, CheckCheck, UserPlus, Sparkles, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/utils/api';
import { io, Socket } from 'socket.io-client';

// ============================================
// TYPES
// ============================================
interface User {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  role: string;
}

interface Conversation {
  conversation_id: number;
  type: string; // DIRECT, GROUP, CHANNEL
  name?: string;
  description?: string;
  avatar_url?: string;
  members: { user: User; role: string }[];
  last_message?: { content: string; created_at: string; sender: { full_name: string } } | null;
  provider?: { full_name: string; role: string };
  service?: { title: string };
  my_role?: string;
  _count?: { members: number; posts?: number };
  created_at: string;
}

interface ChatMessage {
  message_id: number;
  content?: string;
  message_type: string; // TEXT, IMAGE, VOICE, FILE, SYSTEM
  media_url?: string;
  media_duration?: number;
  sender: User;
  reply_to?: { message_id: number; content?: string; sender: { full_name: string } };
  created_at: string;
}

interface ChannelPost {
  post_id: number;
  title?: string;
  content: string;
  post_type: string;
  media_url?: string;
  media_type?: string;
  likes: number;
  comments_count: number;
  is_pinned: boolean;
  author: User;
  comments: { comment_id: number; content: string; user: User; created_at: string }[];
  created_at: string;
}

interface ProviderComplaint {
  complaint_id: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  response?: string;
  rating?: number;
  user: { full_name: string };
  provider: { full_name: string };
  service?: { title: string };
  created_at: string;
}

// ============================================
// COMPLAINT SUGGESTIONS DATA
// ============================================
const SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  GENERAL: [
    'Service not as advertised',
    'Poor customer communication',
    'Misleading pricing information',
    'Failure to respond to inquiries',
  ],
  SERVICE_QUALITY: [
    'Substandard work quality',
    'Service not completed properly',
    'Materials used were not as agreed',
    'Work done without proper tools/equipment',
    'Provider arrived unprepared',
  ],
  DELAY: [
    'Service delayed beyond agreed date',
    'Late arrival without notice',
    'Repeated schedule changes by provider',
    'Project timeline not followed',
    'Delayed delivery of materials/products',
  ],
  BILLING: [
    'Charged more than quoted price',
    'Hidden fees not mentioned earlier',
    'Refund not processed',
    'Overcharged for incomplete work',
    'Payment taken but service not delivered',
  ],
  STAFF: [
    'Rude or unprofessional behavior',
    'Staff did not follow safety guidelines',
    'No-show by assigned staff member',
    'Unqualified personnel sent',
  ],
  OTHER: [
    'Damage to property during service',
    'Warranty claim not honored',
    'Contract terms violated',
    'Other issue (describe below)',
  ],
};

const DESCRIPTION_TEMPLATES: Record<string, string[]> = {
  GENERAL: [
    'I used the service provided by this provider on [date]. The service did not match what was advertised. The provider should honor their commitments as listed on the platform. I request a review of this matter and appropriate resolution.',
    'I contacted the provider on [date] regarding their service. Despite multiple follow-ups, I have not received a satisfactory response. The platform should ensure providers maintain proper communication with customers.',
  ],
  SERVICE_QUALITY: [
    'On [date], I hired this provider for [service]. The quality of work was below acceptable standards. Specifically: 1) [issue 1], 2) [issue 2]. I request the provider to either redo the work or provide a partial refund.',
    'The service was completed on [date] but the quality was poor. [Describe specific issue]. The work does not meet the expected standards for the price charged. I have attached/mentioned evidence of the poor quality.',
  ],
  DELAY: [
    'My service was scheduled for [date] but the provider has delayed it by [X] days without valid explanation. This delay is causing significant inconvenience. I request immediate action or a full refund.',
    'The provider promised delivery by [date] but has not completed the work. I have tried contacting them multiple times but received no response. Please intervene to resolve this matter.',
  ],
  BILLING: [
    'I was quoted ৳[amount] for the service but was charged ৳[actual amount]. The provider did not inform me of any additional charges beforehand. I request a billing review and adjustment to the originally quoted price.',
    'I paid ৳[amount] on [date] for the service but it has not been delivered/completed. The provider is not responding to my requests for a refund. Please help recover my payment.',
  ],
  STAFF: [
    'The staff member who arrived on [date] was unprofessional. [Describe behavior]. This is unacceptable and needs to be addressed. The provider should ensure their staff maintain proper conduct.',
    'No staff member arrived on the scheduled date/time. I waited for [X] hours without any communication from the provider. This lack of professionalism is very disappointing.',
  ],
  OTHER: [
    'During the service on [date], my property was damaged. [Describe damage]. The provider should be held responsible and compensated for the damages caused during their work.',
    'The provider has not honored the warranty terms agreed upon during the service. [Describe warranty issue]. I request the platform to enforce the warranty commitment.',
  ],
};

// ============================================
// COMPONENT
// ============================================
export default function MyMessages() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // State
  const [activeTab, setActiveTab] = useState<'chats' | 'channels' | 'complaints'>('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channelPosts, setChannelPosts] = useState<ChannelPost[]>([]);
  const [complaints, setComplaints] = useState<ProviderComplaint[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [providers, setProviders] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [complaintTarget, setComplaintTarget] = useState<{ provider_id: number; service_id?: number; provider_name: string } | null>(null);
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
  const [subjectMode, setSubjectMode] = useState<'select' | 'manual'>('select');
  const [descMode, setDescMode] = useState<'select' | 'manual'>('select');
  const [aiLoading, setAiLoading] = useState(false);

  // ============================================
  // SOCKET.IO CONNECTION
  // ============================================
  useEffect(() => {
    const socket = io(api.defaults.baseURL?.replace('/api', '') || 'http://localhost:4000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (user) socket.emit('join_user', user.user_id);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      if (selectedConvo && msg.sender.user_id !== user?.user_id) {
        setMessages(prev => [...prev, msg]);
      }
      // Update last message in conversation list
      setConversations(prev => prev.map(c =>
        c.conversation_id === msg.sender.user_id ? { ...c, last_message: { content: msg.content || '', created_at: msg.created_at, sender: msg.sender } } : c
      ));
    });

    socket.on('chat:typing', (data: { userId: number; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (data.isTyping) next.add(data.userId); else next.delete(data.userId);
        return next;
      });
    });

    socket.on('channel:post', (post: ChannelPost) => {
      setChannelPosts(prev => [post, ...prev]);
    });

    socket.on('channel:comment', (data: any) => {
      setChannelPosts(prev => prev.map(p =>
        p.post_id === data.post_id ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
    });

    return () => { socket.disconnect(); };
  }, [user, selectedConvo]);

  // ============================================
  // DATA FETCHING
  // ============================================
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.data || []);
    } catch { setConversations([]); }
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await api.get('/chat/channels');
      setChannels(res.data.data || []);
    } catch { setChannels([]); }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await api.get('/chat/providers');
      setProviders(res.data.data || []);
    } catch {}
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await api.get('/chat/users');
      setAllUsers(res.data.data || []);
    } catch {}
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      const res = await api.get('/chat/complaints');
      setComplaints(res.data.data || []);
    } catch { setComplaints([]); }
  }, []);

  useEffect(() => {
    Promise.all([fetchConversations(), fetchChannels(), fetchComplaints()])
      .finally(() => setLoading(false));
  }, [fetchConversations, fetchChannels, fetchComplaints]);

  // ============================================
  // SELECT CONVERSATION
  // ============================================
  async function selectConversation(convo: Conversation) {
    setSelectedConvo(convo);
    setMessages([]);
    setChannelPosts([]);
    socketRef.current?.emit('chat:join', convo.conversation_id);

    if (convo.type === 'CHANNEL') {
      try {
        const res = await api.get(`/chat/conversations/${convo.conversation_id}/posts`);
        setChannelPosts(res.data.data || []);
      } catch {}
    } else {
      try {
        const res = await api.get(`/chat/conversations/${convo.conversation_id}/messages`);
        setMessages(res.data.data || []);
      } catch {}
    }
  }

  // ============================================
  // SEND MESSAGE
  // ============================================
  function sendMessage() {
    if (!input.trim() || !selectedConvo || !user) return;
    const msg = {
      conversationId: selectedConvo.conversation_id,
      senderId: user.user_id,
      content: input,
      messageType: 'TEXT',
    };
    socketRef.current?.emit('chat:message', msg);

    // Optimistic update
    setMessages(prev => [...prev, {
      message_id: Date.now(),
      content: input,
      message_type: 'TEXT',
      sender: { user_id: user.user_id, full_name: user.full_name, role: user.role },
      created_at: new Date().toISOString(),
    }]);
    setInput('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  // ============================================
  // VOICE RECORDING
  // ============================================
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        // In production: upload to server, then send message
        if (selectedConvo && user) {
          socketRef.current?.emit('chat:voice_complete', {
            conversationId: selectedConvo.conversation_id,
            senderId: user.user_id,
            mediaUrl: url,
            duration: 0,
          });
          setMessages(prev => [...prev, {
            message_id: Date.now(),
            message_type: 'VOICE',
            media_url: url,
            sender: { user_id: user.user_id, full_name: user.full_name, role: user.role },
            created_at: new Date().toISOString(),
          }]);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch { addToast('Microphone access denied', 'error'); }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  // ============================================
  // CREATE GROUP
  // ============================================
  async function createGroup() {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    try {
      const res = await api.post('/chat/conversations/group', {
        name: groupName,
        description: groupDesc,
        member_ids: selectedUsers,
      });
      const newConvo = res.data.data;
      setConversations(prev => [newConvo, ...prev]);
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDesc('');
      setSelectedUsers([]);
      addToast('Group created!');
      selectConversation(newConvo);
    } catch { addToast('Failed to create group', 'error'); }
  }

  // ============================================
  // START 1-ON-1 CHAT
  // ============================================
  async function startDirectChat(targetUserId: number) {
    try {
      const res = await api.post('/chat/conversations/direct', { user_id: targetUserId });
      const convo = res.data.data;
      if (!conversations.find(c => c.conversation_id === convo.conversation_id)) {
        setConversations(prev => [convo, ...prev]);
      }
      setShowNewChat(false);
      selectConversation(convo);
    } catch { addToast('Failed to start chat', 'error'); }
  }

  // ============================================
  // AI SUGGEST COMPLAINT
  // ============================================
  async function aiSuggestComplaint() {
    if (!complaintForm.category || !complaintForm.description) {
      addToast('Please select a category and type a brief description first', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/ai/chat', {
        prompt: `Generate a professional complaint title and detailed description for this issue:

Category: ${complaintForm.category.replace(/_/g, ' ')}
Provider: ${complaintTarget?.provider_name || 'Service Provider'}
Brief note: ${complaintForm.description}

Respond in JSON format ONLY:
{"title": "short complaint title", "description": "detailed professional description with clear points"}`,
      });
      const text = res.data?.response || '';
      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.title) setComplaintForm(f => ({ ...f, subject: parsed.title }));
        if (parsed.description) setComplaintForm(f => ({ ...f, description: parsed.description }));
        setSubjectMode('manual');
        setDescMode('manual');
        addToast('AI suggestions applied! Review and edit as needed.');
      } else {
        addToast('AI response was not in expected format. Try again.', 'error');
      }
    } catch {
      addToast('AI suggestion failed. Please fill manually.', 'error');
    } finally {
      setAiLoading(false);
    }
  }

  // ============================================
  // FILE COMPLAINT
  // ============================================
  async function fileComplaint() {
    if (!complaintTarget || !complaintForm.subject || !complaintForm.description) return;
    try {
      await api.post('/chat/complaints', {
        provider_id: complaintTarget.provider_id,
        service_id: complaintTarget.service_id,
        ...complaintForm,
      });
      addToast('Complaint filed! You can chat with the provider about it.');
      setShowComplaintForm(false);
      setComplaintForm({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
      fetchComplaints();
      fetchConversations();
    } catch { addToast('Failed to file complaint', 'error'); }
  }

  // ============================================
  // RENDER
  // ============================================
  const getConvoName = (c: Conversation) => {
    if (c.name) return c.name;
    if (c.type === 'DIRECT') {
      const other = c.members?.find(m => m.user.user_id !== user?.user_id);
      return other?.user.full_name || 'Unknown';
    }
    return 'Unknown';
  };

  const getConvoAvatar = (c: Conversation) => {
    if (c.type === 'DIRECT') {
      const other = c.members?.find(m => m.user.user_id !== user?.user_id);
      return other?.user.full_name?.charAt(0) || '?';
    }
    return c.name?.charAt(0) || '#';
  };

  const filteredConvos = conversations.filter(c =>
    getConvoName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-earth-200 overflow-hidden">
      {/* ============================================ */}
      {/* SIDEBAR — Conversation List */}
      {/* ============================================ */}
      <div className={`w-80 border-r border-earth-200 flex flex-col shrink-0 ${selectedConvo ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-earth-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">Messages</h1>
            <div className="flex gap-1">
              <button onClick={() => { setShowNewChat(true); fetchProviders(); }}
                className="p-2 rounded-lg hover:bg-earth-100 text-earth-500" title="New Chat">
                <Plus size={18} />
              </button>
              <button onClick={() => { setShowCreateGroup(true); fetchAllUsers(); }}
                className="p-2 rounded-lg hover:bg-earth-100 text-earth-500" title="New Group">
                <Users size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-earth-50 rounded-lg p-1">
            {(['chats', 'channels', 'complaints'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeTab === tab ? 'bg-white shadow-sm text-polli-700' : 'text-earth-500'
                }`}>
                {tab === 'chats' ? '💬 Chats' : tab === 'channels' ? '📢 Channels' : '⚠️ Complaints'}
              </button>
            ))}
          </div>

          {/* Search */}
          {activeTab === 'chats' && (
            <div className="relative mt-3">
              <Search size={14} className="absolute left-3 top-2.5 text-earth-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-earth-200 focus:outline-none focus:ring-1 focus:ring-polli-500" />
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' && (
            <>
              {filteredConvos.length === 0 ? (
                <div className="p-8 text-center text-earth-400 text-sm">
                  <MessageSquare size={32} className="mx-auto mb-2 text-earth-300" />
                  No conversations yet<br />
                  <button onClick={() => { setShowNewChat(true); fetchProviders(); }}
                    className="mt-2 text-polli-600 font-medium">Start a chat</button>
                </div>
              ) : filteredConvos.map(c => (
                <button key={c.conversation_id} onClick={() => selectConversation(c)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-earth-50 transition border-b border-earth-50 ${
                    selectedConvo?.conversation_id === c.conversation_id ? 'bg-polli-50 border-l-2 border-l-polli-500' : ''
                  }`}>
                  <div className="h-10 w-10 rounded-full bg-polli-100 text-polli-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {c.type === 'GROUP' ? <Users size={16} /> : getConvoAvatar(c)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{getConvoName(c)}</span>
                      {c.type === 'GROUP' && <Badge variant="outline" className="text-[9px]">Group</Badge>}
                      {c.type === 'CHANNEL' && <Badge variant="info" className="text-[9px]">Channel</Badge>}
                    </div>
                    <p className="text-xs text-earth-400 truncate mt-0.5">
                      {c.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                  {c.last_message && (
                    <span className="text-[10px] text-earth-400 shrink-0">
                      {new Date(c.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {activeTab === 'channels' && (
            <>
              {channels.length === 0 ? (
                <div className="p-8 text-center text-earth-400 text-sm">
                  <Radio size={32} className="mx-auto mb-2 text-earth-300" />
                  No channels yet<br />
                  Providers will create channels for updates
                </div>
              ) : channels.map(ch => (
                <button key={ch.conversation_id} onClick={() => { selectConversation(ch); setActiveTab('chats'); }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-earth-50 transition border-b border-earth-50">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Radio size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold">{ch.name}</span>
                    <p className="text-xs text-earth-400 truncate">{ch.provider?.full_name} · {ch._count?.members || 0} members</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {activeTab === 'complaints' && (
            <>
              <div className="p-3">
                <Button size="sm" onClick={() => { setShowComplaintForm(true); fetchProviders(); }} className="w-full">
                  <AlertTriangle size={14} /> New Complaint
                </Button>
              </div>
              {complaints.length === 0 ? (
                <div className="p-8 text-center text-earth-400 text-sm">
                  <Shield size={32} className="mx-auto mb-2 text-earth-300" />
                  No complaints filed
                </div>
              ) : complaints.map(c => (
                <div key={c.complaint_id} className="px-4 py-3 border-b border-earth-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{c.subject}</span>
                    <Badge variant={c.status === 'RESOLVED' ? 'success' : c.status === 'OPEN' ? 'warning' : 'info'} className="text-[9px]">{c.status}</Badge>
                  </div>
                  <p className="text-xs text-earth-400 mt-0.5">To: {c.provider.full_name} · {c.category}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* MAIN — Chat Area */}
      {/* ============================================ */}
      <div className={`flex-1 flex flex-col ${!selectedConvo && activeTab === 'chats' ? 'hidden md:flex' : ''}`}>
        {!selectedConvo ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare size={48} className="mx-auto mb-4 text-earth-300" />
              <h2 className="text-lg font-bold text-earth-700">Select a conversation</h2>
              <p className="text-sm text-earth-400 mt-1">Choose from the sidebar or start a new chat</p>
              <div className="mt-6 grid gap-3 max-w-xs mx-auto text-left">
                <button onClick={() => { setShowNewChat(true); fetchProviders(); }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-earth-200 hover:border-polli-300 hover:bg-polli-50 transition">
                  <div className="h-9 w-9 rounded-full bg-polli-100 text-polli-600 flex items-center justify-center"><UserPlus size={16} /></div>
                  <div><p className="text-sm font-medium">1-on-1 Chat</p><p className="text-[10px] text-earth-400">Message a provider or user</p></div>
                </button>
                <button onClick={() => { setShowCreateGroup(true); fetchAllUsers(); }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-earth-200 hover:border-polli-300 hover:bg-polli-50 transition">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Users size={16} /></div>
                  <div><p className="text-sm font-medium">Create Group</p><p className="text-[10px] text-earth-400">Group chat with multiple users</p></div>
                </button>
                <button onClick={() => { setShowComplaintForm(true); fetchProviders(); }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-earth-200 hover:border-amber-300 hover:bg-amber-50 transition">
                  <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><AlertTriangle size={16} /></div>
                  <div><p className="text-sm font-medium">File Complaint</p><p className="text-[10px] text-earth-400">Report to a service provider</p></div>
                </button>
              </div>
            </div>
          </div>
        ) : selectedConvo.type === 'CHANNEL' ? (
          /* ============================================ */
          /* CHANNEL VIEW (Telegram-like) */
          /* ============================================ */
          <>
            <div className="px-4 py-3 border-b border-earth-100 flex items-center gap-3">
              <button onClick={() => setSelectedConvo(null)} className="md:hidden p-1"><ChevronLeft size={20} /></button>
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Radio size={16} /></div>
              <div className="flex-1">
                <h2 className="text-sm font-bold">{selectedConvo.name}</h2>
                <p className="text-xs text-earth-400">{selectedConvo._count?.members || 0} subscribers · {selectedConvo.provider?.full_name}</p>
              </div>
              <Badge variant="info">Channel</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {channelPosts.length === 0 ? (
                <div className="text-center text-earth-400 py-12">
                  <Radio size={40} className="mx-auto mb-3 text-earth-300" />
                  <p className="text-sm">No posts yet in this channel</p>
                </div>
              ) : channelPosts.map(post => (
                <Card key={post.post_id} className={post.is_pinned ? 'border-amber-300 bg-amber-50/30' : ''}>
                  <CardContent className="p-4">
                    {post.is_pinned && <p className="text-[10px] text-amber-600 font-bold mb-1">📌 PINNED</p>}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-polli-100 text-polli-700 flex items-center justify-center text-xs font-bold">{post.author.full_name.charAt(0)}</div>
                      <div>
                        <span className="text-sm font-semibold">{post.author.full_name}</span>
                        <Badge variant="outline" className="ml-2 text-[9px]">{post.post_type}</Badge>
                        <p className="text-[10px] text-earth-400">{new Date(post.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {post.title && <h3 className="font-bold text-earth-900 mb-1">{post.title}</h3>}
                    <p className="text-sm text-earth-600 whitespace-pre-wrap">{post.content}</p>
                    {post.media_url && (
                      <div className="mt-3 rounded-lg overflow-hidden bg-earth-100">
                        {post.media_type === 'video' ? (
                          <video src={post.media_url} controls className="w-full max-h-64" />
                        ) : (
                          <img src={post.media_url} alt="" className="w-full max-h-64 object-cover" />
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs text-earth-400">
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.comments_count} comments</span>
                    </div>
                    {post.comments.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-earth-100 pt-3">
                        {post.comments.slice(0, 3).map(c => (
                          <div key={c.comment_id} className="flex gap-2 text-xs">
                            <span className="font-semibold">{c.user.full_name}:</span>
                            <span className="text-earth-600">{c.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          /* ============================================ */
          /* CHAT VIEW (1-on-1 / Group) */
          /* ============================================ */
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-earth-100 flex items-center gap-3">
              <button onClick={() => setSelectedConvo(null)} className="md:hidden p-1"><ChevronLeft size={20} /></button>
              <div className="h-10 w-10 rounded-full bg-polli-100 text-polli-700 flex items-center justify-center font-bold text-sm">
                {selectedConvo.type === 'GROUP' ? <Users size={16} /> : getConvoAvatar(selectedConvo)}
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold">{getConvoName(selectedConvo)}</h2>
                <p className="text-xs text-earth-400">
                  {selectedConvo.type === 'GROUP' ? `${selectedConvo.members?.length || 0} members` : selectedConvo.members?.[0]?.user.role || ''}
                  {typingUsers.size > 0 && <span className="text-polli-500 ml-2">typing...</span>}
                </p>
              </div>
              <div className="flex gap-1">
                <button className="p-2 rounded-lg hover:bg-earth-100 text-earth-500"><Phone size={16} /></button>
                <button className="p-2 rounded-lg hover:bg-earth-100 text-earth-500"><Video size={16} /></button>
                <button className="p-2 rounded-lg hover:bg-earth-100 text-earth-500"><MoreVertical size={16} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-earth-50/30">
              {messages.length === 0 && (
                <div className="text-center text-earth-400 py-12">
                  <MessageSquare size={40} className="mx-auto mb-3 text-earth-300" />
                  <p className="text-sm">Start the conversation</p>
                </div>
              )}
              {messages.map(msg => {
                const isMine = msg.sender.user_id === user?.user_id;
                return (
                  <div key={msg.message_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isMine ? 'order-2' : ''}`}>
                      {selectedConvo.type === 'GROUP' && !isMine && (
                        <p className="text-[10px] font-semibold text-polli-600 mb-1 ml-1">{msg.sender.full_name}</p>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? 'bg-polli-600 text-white rounded-br-md'
                          : 'bg-white text-earth-800 border border-earth-200 rounded-bl-md shadow-sm'
                      }`}>
                        {msg.message_type === 'VOICE' ? (
                          <div className="flex items-center gap-2">
                            <button className="p-1"><Play size={14} /></button>
                            <div className="flex-1 h-6 bg-earth-200 rounded-full overflow-hidden">
                              <div className="h-full w-1/3 bg-polli-400 rounded-full" />
                            </div>
                            <span className="text-[10px]">{msg.media_duration ? `${msg.media_duration}s` : '0:12'}</span>
                          </div>
                        ) : msg.message_type === 'IMAGE' ? (
                          <img src={msg.media_url} alt="" className="rounded-lg max-w-full" />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                      <p className={`text-[10px] mt-0.5 ${isMine ? 'text-right' : 'text-left'} text-earth-400`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMine && <CheckCheck size={10} className="inline ml-1 text-polli-500" />}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="px-4 py-3 border-t border-earth-100 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-earth-100 text-earth-500"><Image size={18} /></button>
                <button className="p-2 rounded-lg hover:bg-earth-100 text-earth-500"><Paperclip size={18} /></button>

                <div className="flex-1 relative">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    onFocus={() => socketRef.current?.emit('chat:typing', { userId: user?.user_id, conversationId: selectedConvo.conversation_id, isTyping: true })}
                    onBlur={() => socketRef.current?.emit('chat:typing', { userId: user?.user_id, conversationId: selectedConvo.conversation_id, isTyping: false })}
                    placeholder="Type a message..."
                    className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 bg-earth-50" />
                </div>

                {input.trim() ? (
                  <button onClick={sendMessage}
                    className="p-2.5 rounded-xl bg-polli-600 text-white hover:bg-polli-700 transition">
                    <Send size={16} />
                  </button>
                ) : (
                  <button onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2.5 rounded-xl transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-earth-100 text-earth-500 hover:bg-earth-200'}`}>
                    {isRecording ? <Square size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>
              {isRecording && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Recording... Tap stop to send
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">New Chat</h2>
              <button onClick={() => setShowNewChat(false)}><X size={18} /></button>
            </div>
            <p className="text-xs text-earth-500 mb-3">Select a provider or user to chat with</p>
            <div className="flex-1 overflow-y-auto space-y-1">
              {providers.map(p => (
                <button key={p.user_id} onClick={() => startDirectChat(p.user_id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-polli-50 flex items-center gap-3 transition">
                  <div className="h-9 w-9 rounded-full bg-polli-100 text-polli-700 flex items-center justify-center font-bold text-sm">{p.full_name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium">{p.full_name}</p>
                    <p className="text-[10px] text-earth-400">{p.role.replace(/_/g, ' ')}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create Group</h2>
              <button onClick={() => setShowCreateGroup(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3 mb-4">
              <input value={groupName} onChange={e => setGroupName(e.target.value)}
                placeholder="Group name" className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500" />
              <input value={groupDesc} onChange={e => setGroupDesc(e.target.value)}
                placeholder="Description (optional)" className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500" />
            </div>
            <p className="text-xs font-semibold text-earth-500 mb-2">Select members</p>
            <div className="flex-1 overflow-y-auto space-y-1 max-h-60">
              {allUsers.map(u => (
                <label key={u.user_id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-earth-50 cursor-pointer">
                  <input type="checkbox" checked={selectedUsers.includes(u.user_id)}
                    onChange={e => setSelectedUsers(prev => e.target.checked ? [...prev, u.user_id] : prev.filter(id => id !== u.user_id))}
                    className="rounded text-polli-600" />
                  <div className="h-8 w-8 rounded-full bg-earth-100 flex items-center justify-center text-xs font-bold">{u.full_name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium">{u.full_name}</p>
                    <p className="text-[10px] text-earth-400">{u.role.replace(/_/g, ' ')}</p>
                  </div>
                </label>
              ))}
            </div>
            <Button onClick={createGroup} disabled={!groupName.trim() || selectedUsers.length === 0} className="mt-4 w-full">
              Create Group ({selectedUsers.length} members)
            </Button>
          </div>
        </div>
      )}

      {/* Complaint Form Modal */}
      {showComplaintForm && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> File Complaint</h2>
              <button onClick={() => setShowComplaintForm(false)}><X size={18} /></button>
            </div>

            {/* Provider Selector */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-earth-500">To Provider *</label>
              <select value={complaintTarget?.provider_id || ''} onChange={e => {
                const p = providers.find(pr => pr.user_id === Number(e.target.value));
                setComplaintTarget(p ? { provider_id: p.user_id, provider_name: p.full_name } : null);
              }} className="w-full border border-earth-200 rounded-lg px-3 py-2 text-sm mt-1">
                <option value="">Select provider...</option>
                {providers.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name} ({p.role.replace(/_/g, ' ')})</option>)}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-earth-500">Category *</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {['GENERAL', 'SERVICE_QUALITY', 'DELAY', 'BILLING', 'STAFF', 'OTHER'].map(cat => (
                  <button key={cat} onClick={() => setComplaintForm(f => ({ ...f, category: cat }))}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border transition ${
                      complaintForm.category === cat ? 'border-polli-500 bg-polli-50 text-polli-700' : 'border-earth-200'
                    }`}>{cat.replace(/_/g, ' ')}</button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-earth-500">Priority</label>
              <div className="flex gap-2 mt-1">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                  <button key={p} onClick={() => setComplaintForm(f => ({ ...f, priority: p }))}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                      complaintForm.priority === p
                        ? p === 'URGENT' ? 'border-red-500 bg-red-50 text-red-700'
                          : p === 'HIGH' ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-polli-500 bg-polli-50 text-polli-700'
                        : 'border-earth-200'
                    }`}>{p}</button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-earth-500">Subject *</label>
                <div className="flex gap-1">
                  <button onClick={() => setSubjectMode('select')}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium transition ${subjectMode === 'select' ? 'bg-polli-100 text-polli-700' : 'text-earth-400 hover:text-earth-600'}`}>
                    Select</button>
                  <button onClick={() => setSubjectMode('manual')}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium transition ${subjectMode === 'manual' ? 'bg-polli-100 text-polli-700' : 'text-earth-400 hover:text-earth-600'}`}>
                    Manual</button>
                </div>
              </div>
              {subjectMode === 'select' ? (
                <div className="space-y-1">
                  {SUBJECT_SUGGESTIONS[complaintForm.category as keyof typeof SUBJECT_SUGGESTIONS]?.map((subj, i) => (
                    <button key={i} onClick={() => setComplaintForm(f => ({ ...f, subject: subj }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition hover:bg-polli-50 ${
                        complaintForm.subject === subj ? 'border-polli-500 bg-polli-50 text-polli-700' : 'border-earth-200 text-earth-600'
                      }`}>
                      {subj}
                    </button>
                  )) || (
                    <p className="text-xs text-earth-400 py-2">Select a category first</p>
                  )}
                  <button onClick={() => setSubjectMode('manual')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs border border-dashed border-earth-300 text-earth-400 hover:border-polli-400 hover:text-polli-600 transition">
                    ✏️ Write my own subject...
                  </button>
                </div>
              ) : (
                <input value={complaintForm.subject} onChange={e => setComplaintForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Enter complaint subject" className="w-full border border-earth-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-polli-500" />
              )}
            </div>

            {/* Description */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-earth-500">Description *</label>
                <div className="flex gap-1">
                  <button onClick={() => setDescMode('select')}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium transition ${descMode === 'select' ? 'bg-polli-100 text-polli-700' : 'text-earth-400 hover:text-earth-600'}`}>
                    Templates</button>
                  <button onClick={() => setDescMode('manual')}
                    className={`px-2 py-0.5 rounded text-[9px] font-medium transition ${descMode === 'manual' ? 'bg-polli-100 text-polli-700' : 'text-earth-400 hover:text-earth-600'}`}>
                    Manual</button>
                </div>
              </div>
              {descMode === 'select' ? (
                <div className="space-y-1">
                  {DESCRIPTION_TEMPLATES[complaintForm.category as keyof typeof DESCRIPTION_TEMPLATES]?.map((tpl, i) => (
                    <button key={i} onClick={() => setComplaintForm(f => ({ ...f, description: tpl }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition hover:bg-polli-50 ${
                        complaintForm.description === tpl ? 'border-polli-500 bg-polli-50 text-polli-700' : 'border-earth-200 text-earth-600'
                      }`}>
                      <span className="line-clamp-2">{tpl}</span>
                    </button>
                  )) || (
                    <p className="text-xs text-earth-400 py-2">Select a category first</p>
                  )}
                  <button onClick={() => setDescMode('manual')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs border border-dashed border-earth-300 text-earth-400 hover:border-polli-400 hover:text-polli-600 transition">
                    ✏️ Write my own description...
                  </button>
                </div>
              ) : (
                <textarea value={complaintForm.description} onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue in detail" rows={4}
                  className="w-full border border-earth-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-polli-500" />
              )}
            </div>

            {/* AI Suggestion Button */}
            <button onClick={aiSuggestComplaint} disabled={aiLoading || !complaintForm.description}
              className="w-full mb-4 py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {aiLoading ? (
                <><Loader2 size={16} className="animate-spin" /> AI is generating...</>
              ) : (
                <><Sparkles size={16} /> AI Suggest Title & Description</>
              )}
            </button>
            <p className="text-[10px] text-earth-400 -mt-3 mb-4 text-center">Describe the issue briefly above, then click AI to generate a professional complaint</p>

            <Button onClick={fileComplaint} disabled={!complaintTarget || !complaintForm.subject || !complaintForm.description} className="w-full">
              Submit Complaint
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
