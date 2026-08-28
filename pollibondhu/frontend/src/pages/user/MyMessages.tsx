import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  MessageSquare, Send, Users, Plus, Search, Phone, Video, MoreVertical,
  Mic, MicOff, Image, Paperclip, Smile, X, ChevronDown, ChevronLeft,
  Bot, Radio, AlertTriangle, Building2, Shield, Heart, Wrench, FileText,
  Play, Pause, Square, Check, CheckCheck, UserPlus, Sparkles, Loader2, Download, FileIcon, Eye, Pencil, Trash2, CornerUpLeft
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
  unread_count?: number;
  _count?: { members: number; posts?: number };
  created_at: string;
}

interface ChatMessage {
  message_id: number;
  conversation_id: number;
  content?: string;
  message_type: string; // TEXT, IMAGE, VOICE, FILE, SYSTEM
  media_url?: string;
  media_duration?: number;
  sender: User;
  reply_to?: { message_id: number; content?: string; sender: { full_name: string } };
  reads?: { user_id: number; read_at: string }[];
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
  conversation_id?: number;
}

// ============================================
// HELPERS
// ============================================
const getFileUrl = (url: string | undefined) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:4000';
  return `${baseUrl}${url}`;
};

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
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<'chats' | 'channels' | 'complaints'>('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channelPosts, setChannelPosts] = useState<ChannelPost[]>([]);
  const [complaints, setComplaints] = useState<ProviderComplaint[]>([]);
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [channelInput, setChannelInput] = useState('');
  const [generatingChannelAi, setGeneratingChannelAi] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
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
  const [complaintFile, setComplaintFile] = useState<File | null>(null);
  const [complaintFileUploading, setComplaintFileUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingAiChat, setGeneratingAiChat] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref to track selected conversation without causing socket reconnections
  const selectedConvoRef = useRef<Conversation | null>(null);
  selectedConvoRef.current = selectedConvo;

  // ============================================
  // SOCKET.IO CONNECTION (stable — only reconnects when user changes)
  // ============================================
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(api.defaults.baseURL?.replace('/api', '') || 'http://localhost:4000', {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_user', user.user_id);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      const currentConvo = selectedConvoRef.current;
      // Add message to chat if it belongs to the currently open conversation
      // and is not from the current user (we do optimistic update for own messages)
      if (currentConvo && msg.conversation_id === currentConvo.conversation_id && msg.sender.user_id !== user.user_id) {
        setMessages(prev => [...prev, msg]);
      }
      // Update last message in conversation sidebar
      setConversations(prev => prev.map(c =>
        c.conversation_id === msg.conversation_id
          ? { ...c, last_message: { content: msg.content || '', created_at: msg.created_at, sender: msg.sender } }
          : c
      ));
    });

    socket.on('chat:edit', (editedMsg: ChatMessage) => {
      setMessages(prev => prev.map(m => m.message_id === editedMsg.message_id ? editedMsg : m));
    });

    socket.on('chat:delete', (deletedMsg: ChatMessage) => {
      setMessages(prev => prev.map(m => m.message_id === deletedMsg.message_id ? deletedMsg : m));
    });

    socket.on('chat:typing', (data: { userId: number; conversationId: number; isTyping: boolean }) => {
      if (data.conversationId === selectedConvoRef.current?.conversation_id) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (data.isTyping) next.add(data.userId); else next.delete(data.userId);
          return next;
        });
      }
    });

    socket.on('channel:post', (post: ChannelPost) => {
      setChannelPosts(prev => [post, ...prev]);
    });

    socket.on('complaint:update', (updatedComplaint: ProviderComplaint) => {
      setComplaints(prev => prev.map(c => c.complaint_id === updatedComplaint.complaint_id ? updatedComplaint : c));
      addToast(`Provider responded to your complaint: ${updatedComplaint.subject}`, 'success');
    });

    socket.on('channel:comment', (data: any) => {
      setChannelPosts(prev => prev.map(p =>
        p.post_id === data.post_id ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
    });

    socket.on('chat:read', (data: { userId: number; conversationId: number; readAt: string }) => {
      // Update unread count for the conversation in sidebar
      setConversations(prev => prev.map(c =>
        c.conversation_id === data.conversationId
          ? { ...c, unread_count: 0 }
          : c
      ));
      // Update read status on messages if viewing that conversation
      const currentConvo = selectedConvoRef.current;
      if (currentConvo && data.conversationId === currentConvo.conversation_id) {
        setMessages(prev => prev.map(msg => {
          if (msg.sender.user_id !== user.user_id && (!msg.reads || !msg.reads.some(r => r.user_id === data.userId))) {
            return {
              ...msg,
              reads: [...(msg.reads || []), { user_id: data.userId, read_at: data.readAt }],
            };
          }
          return msg;
        }));
      }
    });

    socket.on('chat:error', (data: { error: string }) => {
      addToast(data.error, 'error');
    });

    return () => { socket.disconnect(); };
  }, [user, addToast]);

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

  useEffect(() => {
    api.get('/users').then(res => setAllUsers(res.data.data)).catch(() => undefined);
  }, []);

  // Handle incoming conversationId from routing state (e.g. from ProviderComplaints)
  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0 && !selectedConvo) {
      const convo = conversations.find(c => c.conversation_id === location.state.conversationId);
      if (convo) {
        setSelectedConvo(convo);
        setActiveTab('chats');
        // Clear state to prevent re-triggering
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, conversations, selectedConvo, navigate, location.pathname]);

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
    // Leave previous conversation room
    if (selectedConvo) {
      socketRef.current?.emit('chat:leave', selectedConvo.conversation_id);
    }
    setSelectedConvo(convo);
    setMessages([]);
    setChannelPosts([]);
    setTypingUsers(new Set());
    socketRef.current?.emit('chat:join', convo.conversation_id);

    // Mark as read
    socketRef.current?.emit('chat:read', { conversationId: convo.conversation_id });
    setConversations(prev => prev.map(c =>
      c.conversation_id === convo.conversation_id ? { ...c, unread_count: 0 } : c
    ));

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
    
    if (editingMessageId) {
      // Handle Edit
      api.put(`/chat/messages/${editingMessageId}`, { content: input }).then(res => {
        setMessages(prev => prev.map(m => m.message_id === editingMessageId ? res.data.data : m));
        setEditingMessageId(null);
        setInput('');
      }).catch(() => alert('Failed to edit message'));
      return;
    }

    const msg = {
      conversationId: selectedConvo.conversation_id,
      senderId: user.user_id,
      content: input,
      messageType: 'TEXT',
      replyToId: replyingToMessage?.message_id,
    };
    socketRef.current?.emit('chat:message', msg);

    // Optimistic update
    setMessages(prev => [...prev, {
      message_id: Date.now(),
      conversation_id: selectedConvo.conversation_id,
      content: input,
      message_type: 'TEXT',
      sender: { user_id: user.user_id, full_name: user.full_name, role: user.role, avatar_url: user.avatar_url },
      created_at: new Date().toISOString(),
      reply_to: replyingToMessage ? { message_id: replyingToMessage.message_id, content: replyingToMessage.content, sender: { full_name: replyingToMessage.sender.full_name } } : undefined
    }]);
    setInput('');
    setReplyingToMessage(null);
    setShowEmojiPicker(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function handleDeleteMessage(messageId: number) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await api.delete(`/chat/messages/${messageId}`);
      setMessages(prev => prev.map(m => m.message_id === messageId ? res.data.data : m));
    } catch {
      alert('Failed to delete message');
    }
  }

  function handleEditInit(msg: ChatMessage) {
    setEditingMessageId(msg.message_id);
    setInput(msg.content || '');
  }

  async function createChannelPost() {
    if (!channelInput.trim() || !selectedConvo || !user) return;
    try {
      const res = await api.post(`/chat/conversations/${selectedConvo.conversation_id}/posts`, {
        content: channelInput,
        post_type: 'UPDATE',
      });
      setChannelPosts([res.data.data, ...channelPosts]); // posts are ordered desc
      setChannelInput('');
    } catch (err) {
      alert('Failed to post to channel');
    }
  }

  async function handleAiMagicBroadcast() {
    setGeneratingChannelAi(true);
    try {
      const res = await api.post('/ai/complaint-response', { 
        subject: 'Channel Broadcast', 
        description: channelInput || 'Write a professional general update for citizens in my channel.' 
      });
      if (res.data.response) setChannelInput(res.data.response);
    } catch {
      alert('Failed to generate magic broadcast');
    } finally {
      setGeneratingChannelAi(false);
    }
  }

  async function handleAiSuggestReply() {
    const lastOtherMsg = [...messages].reverse().find(m => m.sender.user_id !== user?.user_id && m.message_type === 'TEXT');
    if (!lastOtherMsg) {
      addToast('No recent text message to reply to.', 'info');
      return;
    }
    
    setGeneratingAiChat(true);
    try {
      const res = await api.post('/ai/suggest-reply', {
        receivedMessage: lastOtherMsg.content,
        context: `Chat with ${lastOtherMsg.sender.full_name}`
      });
      if (res.data.suggestions) setSuggestedReplies(res.data.suggestions);
    } catch {
      alert('Failed to generate suggestions');
    } finally {
      setGeneratingAiChat(false);
    }
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
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (selectedConvo && user) {
          try {
            // Upload the audio blob as a file
            const formData = new FormData();
            formData.append('file', blob, 'voice_message.webm');
            
            const res = await api.post(`/chat/conversations/${selectedConvo.conversation_id}/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            const { file_url } = res.data.data;

            // Emit the voice message via socket with the real server URL
            socketRef.current?.emit('chat:voice_complete', {
              conversationId: selectedConvo.conversation_id,
              senderId: user.user_id,
              mediaUrl: file_url,
              duration: 0,
            });

            // Optimistic update
            setMessages(prev => [...prev, {
              message_id: Date.now(),
              conversation_id: selectedConvo.conversation_id,
              message_type: 'VOICE',
              media_url: file_url,
              sender: { user_id: user.user_id, full_name: user.full_name, role: user.role },
              created_at: new Date().toISOString(),
            }]);
            
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          } catch (error) {
            console.error('Failed to upload voice message', error);
            addToast('Failed to send voice message', 'error');
          }
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
  // FILE UPLOAD
  // ============================================
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') {
    const file = e.target.files?.[0];
    if (!file || !selectedConvo || !user) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast('File too large. Maximum size is 10MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/chat/conversations/${selectedConvo.conversation_id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { file_url, mime_type } = res.data.data;

      // Determine message type from mime
      let messageType = 'FILE';
      if (mime_type.startsWith('image/')) messageType = 'IMAGE';
      else if (mime_type.startsWith('video/')) messageType = 'VIDEO';

      // Send via socket
      socketRef.current?.emit('chat:message', {
        conversationId: selectedConvo.conversation_id,
        content: file.name,
        messageType,
        mediaUrl: file_url,
      });

      // Optimistic update
      setMessages(prev => [...prev, {
        message_id: Date.now(),
        conversation_id: selectedConvo.conversation_id,
        content: file.name,
        message_type: messageType,
        media_url: file_url,
        sender: { user_id: user.user_id, full_name: user.full_name, role: user.role },
        created_at: new Date().toISOString(),
      }]);

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      addToast('Failed to upload file', 'error');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
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
    if (!complaintForm.category) {
      addToast('Please select a category first', 'error');
      return;
    }
    if (!complaintForm.description) {
      addToast('Please type a brief description first', 'error');
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
  // AI CHAT ASSISTANCE
  // ============================================
  const handleAiCorrectChat = async () => {
    if (!input.trim()) return;
    setGeneratingAiChat(true);
    try {
      const res = await api.post('/ai/correct', { text: input, language: 'English' });
      if (res.data.corrected) setInput(res.data.corrected);
      addToast('Grammar corrected!', 'success');
    } catch (err) {
      addToast('Failed to correct text', 'error');
    } finally {
      setGeneratingAiChat(false);
    }
  };

  const handleAiImproveChat = async () => {
    if (!input.trim()) return;
    setGeneratingAiChat(true);
    try {
      const res = await api.post('/ai/improve', { text: input, type: 'complaint' });
      if (res.data.improved) setInput(res.data.improved);
      addToast('Text improved!', 'success');
    } catch (err) {
      addToast('Failed to improve text', 'error');
    } finally {
      setGeneratingAiChat(false);
    }
  };

  // ============================================
  // FILE COMPLAINT
  // ============================================
  async function fileComplaint() {
    if (!complaintTarget) {
      addToast('Please select a provider to file the complaint against', 'error');
      return;
    }
    if (!complaintForm.subject) {
      addToast('Please enter a complaint subject', 'error');
      return;
    }
    if (!complaintForm.description) {
      addToast('Please enter a complaint description', 'error');
      return;
    }
    setComplaintFileUploading(true);
    try {
      // Upload attachment if present
      let attachmentUrl: string | undefined;
      if (complaintFile) {
        const formData = new FormData();
        formData.append('file', complaintFile);
        const uploadRes = await api.post('/upload/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        attachmentUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
      }

      await api.post('/chat/complaints', {
        provider_id: complaintTarget.provider_id,
        service_id: complaintTarget.service_id,
        ...complaintForm,
        attachment_url: attachmentUrl || null,
      });
      addToast('Complaint filed! You can chat with the provider about it.');
      setShowComplaintForm(false);
      setComplaintForm({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
      setComplaintFile(null);
      fetchComplaints();
      fetchConversations();
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to file complaint', 'error');
    } finally {
      setComplaintFileUploading(false);
    }
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
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.last_message && (
                      <span className="text-[10px] text-earth-400">
                        {new Date(c.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {(c.unread_count ?? 0) > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-polli-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {c.unread_count! > 99 ? '99+' : c.unread_count}
                      </span>
                    )}
                  </div>
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
                <div key={c.complaint_id} 
                  onClick={() => {
                    if (c.conversation_id) {
                      const convo = conversations.find(conv => conv.conversation_id === c.conversation_id);
                      if (convo) {
                        setSelectedConvo(convo);
                        setActiveTab('chats');
                      } else {
                        addToast('Chat not found for this complaint', 'error');
                      }
                    }
                  }}
                  className="px-4 py-3 border-b border-earth-50 hover:bg-earth-50 cursor-pointer transition">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{c.subject}</span>
                      <Badge variant={c.status === 'RESOLVED' ? 'success' : c.status === 'OPEN' ? 'warning' : 'info'} className="text-[9px]">{c.status}</Badge>
                    </div>
                    {c.conversation_id && <MessageSquare size={14} className="text-polli-500" />}
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
                          <video src={getFileUrl(post.media_url)} controls className="w-full max-h-64" />
                        ) : (
                          <img src={getFileUrl(post.media_url)} alt="" className="w-full max-h-64 object-cover" />
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

            {selectedConvo.my_role === 'OWNER' && (
              <div className="p-4 border-t border-earth-200 bg-white">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <textarea 
                      value={channelInput}
                      onChange={(e) => setChannelInput(e.target.value)}
                      placeholder="Write an update for your channel followers..."
                      rows={2}
                      className="w-full bg-earth-50 border-transparent focus:border-polli-500 focus:ring-2 focus:ring-polli-200 rounded-xl px-4 py-2 text-sm resize-none"
                    />
                    <button 
                      onClick={handleAiMagicBroadcast}
                      disabled={generatingChannelAi}
                      className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-bold text-polli-600 bg-polli-50 hover:bg-polli-100 px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50 border border-polli-200"
                    >
                      {generatingChannelAi ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Magic Fill
                    </button>
                  </div>
                  <button onClick={createChannelPost} disabled={!channelInput.trim()} className="bg-polli-600 hover:bg-polli-700 text-white p-3 rounded-xl transition flex-shrink-0 disabled:opacity-50 self-end">
                    <Send size={20} />
                  </button>
                </div>
              </div>
            )}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-earth-50/50">
              {messages.length === 0 && (
                <div className="text-center text-earth-400 py-16 animate-in fade-in zoom-in duration-500">
                  <div className="h-20 w-20 bg-earth-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <MessageSquare size={40} className="text-earth-400" />
                  </div>
                  <p className="text-sm font-medium">Say hello to start the conversation!</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMine = msg.sender.user_id === user?.user_id;
                // Add a small gap between messages of different users, or tight gap for same user
                const prevMsg = messages[idx - 1];
                const isFirstInGroup = !prevMsg || prevMsg.sender.user_id !== msg.sender.user_id;

                return (
                  <div key={msg.message_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-6' : 'mt-1'}`}>
                    <div className={`max-w-[75%] animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMine ? 'order-2' : ''}`}>
                      {selectedConvo.type === 'GROUP' && !isMine && isFirstInGroup && (
                        <p className="text-[10px] font-bold text-polli-600 mb-1 ml-3 tracking-wide">{msg.sender.full_name}</p>
                      )}
                      <div className={`px-4 py-2.5 shadow-sm relative group ${
                        isMine
                          ? 'bg-gradient-to-br from-polli-600 to-emerald-600 text-white rounded-3xl rounded-tr-sm'
                          : 'bg-white text-earth-800 border border-earth-100 rounded-3xl rounded-tl-sm'
                      }`}>
                        
                        {/* Render Reply Context if any */}
                        {msg.reply_to && (
                          <div className={`text-[10px] p-1.5 rounded-lg mb-1 border-l-2 ${isMine ? 'bg-black/10 border-white/50 text-white/90' : 'bg-earth-50 border-polli-500 text-earth-600'}`}>
                            <span className="font-bold">{msg.reply_to.sender?.full_name}:</span> {msg.reply_to.content}
                          </div>
                        )}

                        {/* Actions Overlay */}
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? '-left-20' : '-right-8'} flex items-center gap-1 bg-white shadow-sm border border-earth-200 rounded-full px-1.5 py-1 z-10 opacity-20 group-hover:opacity-100 focus-within:opacity-100 transition-opacity`}>
                          {!isMine && (
                            <button onClick={() => setReplyingToMessage(msg)} className="p-1 hover:bg-earth-100 rounded-full text-earth-500 hover:text-polli-600 transition" title="Reply">
                              <CornerUpLeft size={12} />
                            </button>
                          )}
                          {isMine && msg.message_type === 'TEXT' && (
                            <>
                              <button onClick={() => handleEditInit(msg)} className="p-1 hover:bg-earth-100 rounded-full text-earth-500 hover:text-polli-600 transition" title="Edit">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => handleDeleteMessage(msg.message_id)} className="p-1 hover:bg-earth-100 rounded-full text-earth-500 hover:text-red-600 transition" title="Delete">
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>

                        {msg.message_type === 'VOICE' ? (
                          <div className="flex flex-col gap-1 min-w-[200px]">
                            <audio src={getFileUrl(msg.media_url)} controls className={`h-10 w-full ${isMine ? 'invert brightness-200 contrast-200 opacity-90' : ''}`} />
                            {msg.content && <p className="text-sm mt-1">{msg.content}</p>}
                          </div>
                        ) : msg.message_type === 'IMAGE' ? (
                          <div className="-mx-2 -mt-1 -mb-1">
                            <img
                              src={getFileUrl(msg.media_url)}
                              alt={msg.content || 'Image'}
                              className="rounded-2xl max-w-full sm:max-w-xs max-h-72 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => msg.media_url && setImagePreview(getFileUrl(msg.media_url))}
                            />
                            {msg.content && <p className={`text-sm mt-2 px-2 ${isMine ? 'text-white' : 'text-earth-800'}`}>{msg.content}</p>}
                          </div>
                        ) : msg.message_type === 'VIDEO' ? (
                          <div className="-mx-2 -mt-1 -mb-1">
                            <video
                              src={getFileUrl(msg.media_url)}
                              controls
                              className="rounded-2xl max-w-full sm:max-w-xs max-h-72 object-cover bg-black"
                            />
                            {msg.content && <p className={`text-sm mt-2 px-2 ${isMine ? 'text-white' : 'text-earth-800'}`}>{msg.content}</p>}
                          </div>
                        ) : msg.message_type === 'FILE' ? (
                          <a
                            href={getFileUrl(msg.media_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-2 rounded-xl transition ${isMine ? 'bg-black/10 hover:bg-black/20 text-white' : 'bg-earth-50 hover:bg-earth-100 text-earth-900'}`}
                          >
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isMine ? 'bg-white/20' : 'bg-polli-100 text-polli-600'}`}>
                              <FileIcon size={18} />
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-sm font-bold truncate">{msg.content || 'Attachment'}</p>
                              <p className={`text-[10px] ${isMine ? 'text-white/70' : 'text-earth-500'}`}>Click to open</p>
                            </div>
                            <Download size={16} className={`shrink-0 ${isMine ? 'text-white/50' : 'text-earth-400'}`} />
                          </a>
                        ) : (
                          <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                      <p className={`text-[10px] mt-1 px-1 ${isMine ? 'text-right' : 'text-left'} text-earth-400 font-medium`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMine && (
                          (msg.reads && msg.reads.length > 0)
                            ? <span title="Read"><CheckCheck size={12} className="inline ml-1 text-polli-500" /></span>
                            : <span title="Sent"><CheckCheck size={12} className="inline ml-1 opacity-50" /></span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Bar (Floating Pill Style) */}
            <div className="p-4 bg-earth-50/50">
              
              {/* AI Suggested Replies */}
              {suggestedReplies.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1 no-scrollbar animate-in slide-in-from-bottom-2">
                  {suggestedReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setInput(reply); setSuggestedReplies([]); }}
                      className="whitespace-nowrap px-3 py-1.5 bg-polli-50 hover:bg-polli-100 text-polli-700 text-xs font-semibold rounded-full border border-polli-200 transition-colors shadow-sm"
                    >
                      {reply}
                    </button>
                  ))}
                  <button onClick={() => setSuggestedReplies([])} className="p-1.5 bg-earth-100 hover:bg-earth-200 text-earth-500 rounded-full transition-colors">
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Editing Indicator */}
              {editingMessageId && (
                <div className="flex items-center justify-between bg-polli-50 border border-polli-200 rounded-t-xl px-4 py-2 mb-[-10px] relative z-0">
                  <div className="flex items-center gap-2 text-xs text-polli-700">
                    <Pencil size={12} />
                    <span className="font-semibold">Editing message...</span>
                  </div>
                  <button onClick={() => { setEditingMessageId(null); setInput(''); }} className="text-earth-400 hover:text-earth-600"><X size={14} /></button>
                </div>
              )}

              {/* Replying Indicator */}
              {replyingToMessage && (
                <div className="flex items-center justify-between bg-polli-50 border border-polli-200 rounded-t-xl px-4 py-2 mb-[-10px] relative z-0">
                  <div className="flex items-center gap-2 text-xs text-polli-700">
                    <CornerUpLeft size={12} />
                    <span className="font-semibold">Replying to {replyingToMessage.sender.full_name}:</span>
                    <span className="truncate max-w-[150px] text-earth-600">{replyingToMessage.content}</span>
                  </div>
                  <button onClick={() => setReplyingToMessage(null)} className="text-earth-400 hover:text-earth-600"><X size={14} /></button>
                </div>
              )}

              <div className="bg-white rounded-full shadow-lg border border-earth-100 p-2 flex items-center gap-2 relative z-10 transition-shadow focus-within:shadow-xl focus-within:border-polli-300">
                
                {/* Hidden file inputs */}
                <input ref={imageInputRef} type="file" accept="image/*,image/gif" className="hidden"
                  onChange={e => handleFileUpload(e, 'image')} />
                <input ref={fileInputRef} type="file" accept="*/*" className="hidden"
                  onChange={e => handleFileUpload(e, 'file')} />

                {/* Left Attachment Buttons */}
                <div className="flex items-center gap-1 pl-2 relative">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-full hover:bg-polli-50 text-earth-400 hover:text-polli-600 transition-colors"
                    title="Insert Emoji">
                    <Smile size={20} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-earth-200 shadow-xl rounded-xl p-2 z-50 flex gap-2 w-64 flex-wrap">
                      {['👍', '🙏', '😊', '✅', '❌', '❤️', '👏', '🤔', '🔥', '🎉'].map(emoji => (
                        <button key={emoji} className="text-xl hover:bg-earth-100 p-1 rounded transition" onClick={() => setInput(prev => prev + emoji)}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <button onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 rounded-full hover:bg-polli-50 text-earth-400 hover:text-polli-600 transition-colors disabled:opacity-50"
                    title="Send image or GIF">
                    <Image size={20} />
                  </button>
                  <button onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 rounded-full hover:bg-polli-50 text-earth-400 hover:text-polli-600 transition-colors disabled:opacity-50 hidden sm:block"
                    title="Send file">
                    <Paperclip size={20} />
                  </button>
                </div>

                {/* Main Text Input */}
                <div className="flex-1 relative mx-2">
                  {/* AI Assistance Buttons floating above input when text exists */}
                  <div className="absolute -top-10 right-4 flex gap-2 z-20 animate-in slide-in-from-bottom-1">
                    <button onClick={handleAiSuggestReply} disabled={generatingAiChat} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50 border border-blue-200">
                      {generatingAiChat ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Suggest Reply
                    </button>
                    <button onClick={handleAiCorrectChat} disabled={generatingAiChat} className="flex items-center gap-1 text-[10px] font-bold text-polli-600 bg-polli-50 hover:bg-polli-100 px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50 border border-polli-200">
                      {generatingAiChat ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Fix Spelling/Grammar
                    </button>
                    <button onClick={handleAiImproveChat} disabled={generatingAiChat} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50 border border-emerald-200">
                      {generatingAiChat ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Make Professional
                    </button>
                  </div>
                  {uploading ? (
                    <div className="flex items-center gap-2 text-sm text-polli-600 font-medium px-4 py-2 bg-polli-50 rounded-full w-fit">
                      <Loader2 size={16} className="animate-spin" /> Uploading media...
                    </div>
                  ) : (
                    <input 
                      value={input} 
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      onFocus={() => socketRef.current?.emit('chat:typing', { userId: user?.user_id, conversationId: selectedConvo.conversation_id, isTyping: true })}
                      onBlur={() => socketRef.current?.emit('chat:typing', { userId: user?.user_id, conversationId: selectedConvo.conversation_id, isTyping: false })}
                      placeholder="Message..."
                      className="w-full bg-transparent px-2 py-2 text-[15px] focus:outline-none placeholder:text-earth-400" 
                    />
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1 pr-1">
                  {input.trim() ? (
                    <button onClick={sendMessage}
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-polli-600 to-emerald-600 text-white flex items-center justify-center hover:shadow-md hover:scale-105 transition-all">
                      <Send size={18} className="ml-1" />
                    </button>
                  ) : (
                    <button onClick={isRecording ? stopRecording : startRecording}
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-earth-100 text-earth-600 hover:bg-earth-200'}`}>
                      {isRecording ? <Square size={16} /> : <Mic size={18} />}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Recording Indicator Toast */}
              {isRecording && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                  <div className="flex gap-1">
                    <span className="h-2 w-1 bg-red-500 rounded-full animate-pulse" />
                    <span className="h-3 w-1 bg-red-500 rounded-full animate-pulse delay-75" />
                    <span className="h-2 w-1 bg-red-500 rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="text-xs font-bold tracking-wide uppercase">Recording... Tap Stop to send</span>
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

      {/* Image Preview Lightbox */}
      {imagePreview && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-earth-900/80 p-4 backdrop-blur-sm"
          onClick={() => setImagePreview(null)}>
          <button onClick={() => setImagePreview(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition z-10">
            <X size={20} />
          </button>
          <img src={imagePreview} alt="Preview"
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Complaint Form Modal */}
      {showComplaintForm && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
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

            {/* Subject — always show text input + suggestion chips */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-earth-500 mb-1 block">Subject *</label>
              {SUBJECT_SUGGESTIONS[complaintForm.category as keyof typeof SUBJECT_SUGGESTIONS] && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SUBJECT_SUGGESTIONS[complaintForm.category as keyof typeof SUBJECT_SUGGESTIONS].map((subj, i) => (
                    <button key={i} onClick={() => setComplaintForm(f => ({ ...f, subject: subj }))}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition ${
                        complaintForm.subject === subj ? 'border-polli-500 bg-polli-50 text-polli-700' : 'border-earth-200 text-earth-500 hover:border-polli-300'
                      }`}>
                      {subj}
                    </button>
                  ))}
                </div>
              )}
              <input value={complaintForm.subject} onChange={e => setComplaintForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Enter complaint subject" className="w-full border border-earth-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-polli-500" />
            </div>

            {/* Description — always show textarea + template chips */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-earth-500 mb-1 block">Description *</label>
              {DESCRIPTION_TEMPLATES[complaintForm.category as keyof typeof DESCRIPTION_TEMPLATES] && (
                <div className="space-y-1 mb-2">
                  {DESCRIPTION_TEMPLATES[complaintForm.category as keyof typeof DESCRIPTION_TEMPLATES].map((tpl, i) => (
                    <button key={i} onClick={() => setComplaintForm(f => ({ ...f, description: tpl }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[10px] border transition hover:bg-polli-50 ${
                        complaintForm.description === tpl ? 'border-polli-500 bg-polli-50 text-polli-700' : 'border-earth-200 text-earth-500'
                      }`}>
                      <span className="line-clamp-2">{tpl}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea value={complaintForm.description} onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue in detail" rows={4}
                className="w-full border border-earth-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-polli-500" />
            </div>

            {/* Evidence File Attachment */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-earth-500 mb-1 block">Evidence (optional)</label>
              <label className="flex items-center gap-2 w-full border border-dashed border-earth-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:border-polli-400 hover:bg-polli-50/50 transition">
                <Paperclip size={14} className="text-earth-400" />
                <span className="text-earth-500">{complaintFile ? complaintFile.name : 'Attach photo, video, or document'}</span>
                <input type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden"
                  onChange={e => setComplaintFile(e.target.files?.[0] || null)} />
              </label>
              {complaintFile && (
                <button onClick={() => setComplaintFile(null)} className="text-[10px] text-red-500 mt-1 hover:underline">Remove file</button>
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

            <Button onClick={fileComplaint} disabled={!complaintTarget || !complaintForm.subject || !complaintForm.description || complaintFileUploading} className="w-full">
              {complaintFileUploading ? (<><Loader2 size={14} className="animate-spin" /> Submitting...</>) : 'Submit Complaint'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
