import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, MessageCircle, Heart, Eye, Plus, X, Sparkles, TrendingUp, Clock, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/utils/api';
import { io, Socket } from 'socket.io-client';

interface Post {
  post_id: number;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  likes: number;
  replies: Reply[];
  views: number;
  created_at: string;
  author?: { full_name: string; role?: string; avatar_url?: string };
}

interface Reply {
  reply_id: number;
  content: string;
  created_at: string;
  author?: { full_name: string; avatar_url?: string };
}

// Dropdown options for post categories
const categoryOptions = [
  { value: 'Community', label: 'Community', emoji: '🏘️', desc: 'General village discussions' },
  { value: 'Agriculture', label: 'Agriculture', emoji: '🌾', desc: 'Farming, crops, irrigation' },
  { value: 'Citizen Services', label: 'Citizen Services', emoji: '🏛️', desc: 'Gov services, NID, certificates' },
  { value: 'Health', label: 'Health', emoji: '🏥', desc: 'Healthcare, vaccination, hygiene' },
  { value: 'Infrastructure', label: 'Infrastructure', emoji: '🏗️', desc: 'Roads, drainage, electricity' },
  { value: 'Education', label: 'Education', emoji: '🎓', desc: 'Schools, scholarships, courses' },
  { value: 'Marketplace', label: 'Marketplace', emoji: '🛒', desc: 'Buy/sell crops, equipment' },
  { value: 'Emergency', label: 'Emergency', emoji: '🚨', desc: 'Flood, fire, safety alerts' },
  { value: 'Official Notice', label: 'Official Notice', emoji: '📢', desc: 'Government announcements' },
];

// Title dropdown suggestions
const titleSuggestions: Record<string, string[]> = {
  Agriculture: [
    'Best time to plant [crop] this season?',
    'Disease affecting my [crop] — need help',
    'Fertilizer recommendation for [crop]',
    'Irrigation method comparison — which is best?',
    'Organic farming techniques that actually work',
    'Pest control without chemicals — share your methods',
  ],
  'Citizen Services': [
    'How to apply for [service] — step by step',
    'NID correction experience and tips',
    'Birth certificate online application guide',
    'Required documents for [service]',
    'Processing time for [service] — share your experience',
  ],
  Health: [
    'Vaccination schedule for children this month',
    'Health camp organized by [organization]',
    'Common monsoon diseases — prevention tips',
    'First aid basics everyone should know',
    'Maternal health awareness — important information',
  ],
  Infrastructure: [
    'Road repair needed in [area]',
    'Electricity outage — how to report',
    'Drainage cleaning before monsoon',
    'Water supply problem in [area]',
    'Street lights not working in [area]',
  ],
  Education: [
    'Scholarship opportunities for students',
    'Free online courses available',
    'School admission process for [year]',
    'Exam preparation tips for SSC/HSC',
    'Library resources available at [location]',
  ],
  Marketplace: [
    'Selling [item] — [quantity] available',
    'Looking for [item] — anyone selling?',
    'Fair price for [crop] in [area]?',
    'Equipment rental available — [type]',
    'Bulk order for [item] — best deals',
  ],
  Emergency: [
    'Flood warning — [area] affected',
    'Snake bite awareness — what to do',
    'Emergency contact numbers everyone should save',
    'Flood preparedness checklist',
    'Fire safety tips for villages',
  ],
  Community: [
    'Village meeting announcement',
    'Community event — everyone welcome',
    'Volunteers needed for [activity]',
    'New initiative for our village',
    'Sharing experience from [event]',
  ],
};

// Content AI suggestions
const contentSuggestions: Record<string, string[]> = {
  Agriculture: [
    'I have been facing issues with [problem] in my field. The symptoms are [describe]. I have tried [what you tried] but it did not help. Can anyone suggest effective solutions?',
    'With the upcoming season, I want to try [technique/crop]. Has anyone in our area done this before? What were the results?',
    'The market prices for [crop] have dropped significantly this month. I am looking for buyers who can offer fair prices.',
  ],
  'Citizen Services': [
    'I recently applied for [service] and wanted to share my experience. The process took [time] days. Required documents: [list]. Tips: [advice].',
    'Can someone guide me through the [service] application process? 1) What documents are required? 2) How long does it take? 3) Is there any fee?',
  ],
  Health: [
    'The local health center is organizing a free [type] camp on [date]. Please bring your health card and ID. Everyone is welcome.',
    'With the monsoon season approaching, here are some important health tips: [tips]. Please share this with your family.',
  ],
  Infrastructure: [
    'The [road/drain/building] in our [area] has been in bad condition for [time]. Multiple complaints have been filed but no action taken.',
    'Our area has been without [electricity/water] for [time]. Can anyone help escalate this to higher authorities?',
  ],
  Education: [
    'I found some great resources for [subject/exam]. Here is what helped me: [share resources].',
    'Important notice for students: [scholarship/exam/opportunity] details. Deadline: [date]. Apply at [location/website].',
  ],
  Marketplace: [
    'I have [quantity] of [item/crop] available for sale. Quality: [description]. Price: [price] per [unit]. Location: [area].',
    'Looking for [item] in good condition. Budget: [amount]. If anyone is selling, please share details.',
  ],
  Emergency: [
    '⚠️ URGENT: [emergency situation] in [area]. All residents please [action needed]. Emergency contact: [number].',
    'Important safety reminder: [season/event] is approaching. Please prepare: [checklist]. Keep emergency numbers handy.',
  ],
  Community: [
    '📢 Attention all residents: [event/meeting] will be held on [date] at [location] at [time]. Agenda: [topics].',
    'I am starting [initiative/project] in our village and looking for volunteers. If interested in [activity], please contact me.',
  ],
};

// Tag suggestions
const tagSuggestions: Record<string, string[]> = {
  Agriculture: ['Farming', 'Crop', 'Irrigation', 'Fertilizer', 'Pest Control', 'Organic', 'Market Price', 'Subsidy'],
  'Citizen Services': ['NID', 'Birth Certificate', 'Trade License', 'Land Records', 'Online Application'],
  Health: ['Vaccination', 'Health Camp', 'Disease Prevention', 'First Aid', 'Maternal Health'],
  Infrastructure: ['Roads', 'Drainage', 'Electricity', 'Water Supply', 'Construction'],
  Education: ['Scholarship', 'Exam', 'School', 'Online Course', 'Admission'],
  Marketplace: ['Buy', 'Sell', 'Rent', 'Equipment', 'Seeds'],
  Emergency: ['Flood', 'Fire', 'Safety', 'First Aid', 'Warning'],
  Community: ['Meeting', 'Event', 'Volunteer', 'Development', 'Announcement'],
  'Official Notice': ['Government', 'Tax', 'Registration', 'Deadline', 'Policy'],
};

export default function CommunityPage() {
  const [tab, setTab] = useState('feed');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', content: '', category: 'Community' });
  const [showAiTitle, setShowAiTitle] = useState(false);
  const [showAiContent, setShowAiContent] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [correcting, setCorrecting] = useState<'title' | 'content' | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [likingPost, setLikingPost] = useState<number | null>(null);
  const viewedPosts = useRef<Set<number>>(new Set());
  const { user } = useAuth();
  const { addToast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch posts
  useEffect(() => {
    setLoading(true);
    const url = tab === 'my-posts' ? '/community/posts/mine' : '/community/posts';
    api.get(url, { params: tab !== 'my-posts' ? { category: tab === 'feed' ? undefined : tab, tab } : {} })
      .then(res => {
        const loadedPosts = Array.isArray(res.data) ? res.data : res.data.data || [];
        setPosts(loadedPosts.map((post: Post) => ({
          ...post,
          replies: Array.isArray(post.replies) ? post.replies : [],
        })));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [tab]);

  // Count each post once for this visitor during the current page visit.
  useEffect(() => {
    posts.forEach(post => {
      if (viewedPosts.current.has(post.post_id)) return;
      viewedPosts.current.add(post.post_id);
      api.post(`/community/posts/${post.post_id}/view`)
        .then(res => {
          const updatedViews = res.data.data?.views;
          setPosts(prev => prev.map(item => item.post_id === post.post_id
            ? { ...item, views: typeof updatedViews === 'number' ? updatedViews : item.views + 1 }
            : item));
        })
        .catch(() => viewedPosts.current.delete(post.post_id));
    });
  }, [posts]);

  // Socket.io for real-time posts
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(api.defaults.baseURL?.replace('/api', '') || 'http://localhost:4000', {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('community:join');
    });

    socket.on('community:post', (post: Post) => {
      setPosts(prev => {
        // Avoid duplicates
        if (prev.some(p => p.post_id === post.post_id)) return prev;
        return [post, ...prev];
      });
    });

    return () => { socket.disconnect(); };
  }, []);


  const visiblePosts = posts.filter(post =>
    `${post.title} ${post.content} ${post.category}`.toLowerCase().includes(search.toLowerCase())
  );

  async function publish() {
    if (!draft.title.trim() || !draft.content.trim()) {
      addToast('Add a title and your message first.', 'error');
      return;
    }
    setPublishing(true);
    try {
      const res = await api.post('/community/posts', { ...draft, tags: selectedTags });
      const newPost = res.data.data || res.data;
      setPosts(prev => [{ ...newPost, replies: Array.isArray(newPost.replies) ? newPost.replies : [] }, ...prev]);
      setDraft({ title: '', content: '', category: 'Community' });
      setSelectedTags([]);
      setComposerOpen(false);
      addToast('Your community post is published!');
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        addToast('Your session expired. Please log in again.', 'error');
      } else {
        addToast(err.response?.data?.error || 'Failed to publish. Please try again.', 'error');
      }
    } finally {
      setPublishing(false);
    }
  }

  async function replyToPost(postId: number) {
    const content = (replyDrafts[postId] || '').trim();
    if (!content || replyingTo !== null) return;
    setReplyingTo(postId);
    try {
      const res = await api.post(`/community/posts/${postId}/replies`, { content });
      const reply = res.data.data || res.data;
      setPosts(prev => prev.map(post => post.post_id === postId
        ? { ...post, replies: [...post.replies, reply] }
        : post));
      setReplyDrafts(prev => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to send reply. Please try again.', 'error');
    } finally {
      setReplyingTo(null);
    }
  }

  async function likePost(postId: number) {
    if (!user) {
      addToast('Please log in to react to a post.', 'error');
      return;
    }
    if (likedPosts.has(postId) || likingPost !== null) return;
    setLikingPost(postId);
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
      const likes = res.data.data?.likes;
      setLikedPosts(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(post => post.post_id === postId
        ? { ...post, likes: typeof likes === 'number' ? likes : post.likes + 1 }
        : post));
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to add reaction. Please try again.', 'error');
    } finally {
      setLikingPost(null);
    }
  }

  async function aiCorrect(field: 'title' | 'content') {
    const text = field === 'title' ? draft.title : draft.content;
    if (!text.trim()) return;
    setCorrecting(field);
    try {
      const res = await api.post('/ai/correct', { text, language: 'English' });
      const corrected = res.data.corrected;
      if (corrected) {
        setDraft(f => field === 'title' ? { ...f, title: corrected } : { ...f, content: corrected });
        addToast('Text corrected!', 'success');
      }
    } catch {
      addToast('AI correction unavailable. Please check manually.', 'error');
    } finally {
      setCorrecting(null);
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  const currentTitleSuggestions = titleSuggestions[draft.category] || titleSuggestions.Community;
  const currentContentSuggestions = contentSuggestions[draft.category] || contentSuggestions.Community;
  const currentTagSuggestions = tagSuggestions[draft.category] || tagSuggestions.Community;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Community Forum</h1>
          <p className="text-sm text-earth-500">Discuss issues, share knowledge, connect with experts</p>
        </div>
        {user && (
          <Button onClick={() => { setComposerOpen(true); setSelectedTags([]); }}><Plus size={16} className="mr-1" /> New Post</Button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-earth-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search discussions..." className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-polli-500" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['feed', 'trending', 'my-posts'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-polli-600 text-white' : 'bg-white border text-earth-600 hover:bg-polli-50'}`}>
            {t === 'feed' ? '📡 Feed' : t === 'trending' ? '🔥 Trending' : '📝 My Posts'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : visiblePosts.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={40} />}
            title="No posts yet"
            description="Be the first to start a discussion"
            action={user ? <Button onClick={() => setComposerOpen(true)}>Create Post</Button> : undefined}
          />
        ) : (
          visiblePosts.map((post) => (
            <Card key={post.post_id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full bg-polli-100 flex items-center justify-center text-polli-700 font-bold text-sm">
                    {(post.author?.full_name || 'U').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-earth-800">{post.author?.full_name || 'User'}</span>
                      {post.author?.role && post.author.role !== 'CITIZEN' && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">{post.author.role}</Badge>
                      )}
                      <Badge variant={post.category === 'Official Notice' ? 'warning' : 'default'} className="text-[10px]">{post.category}</Badge>
                    </div>
                    <div className="text-xs text-earth-400">{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <h3 className="font-semibold text-earth-900 mb-1">{post.title}</h3>
                <p className="text-sm text-earth-500 line-clamp-2 mb-3">{post.content}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((tag) => <span key={tag} className="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full">#{tag}</span>)}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-earth-400">
                  <button
                    type="button"
                    onClick={() => likePost(post.post_id)}
                    disabled={likingPost === post.post_id || likedPosts.has(post.post_id)}
                    className={`flex items-center gap-1 transition-colors ${likedPosts.has(post.post_id) ? 'text-red-500' : 'hover:text-red-500'} disabled:cursor-not-allowed`}
                    title={likedPosts.has(post.post_id) ? 'You reacted to this post' : 'Love this post'}
                    aria-label={likedPosts.has(post.post_id) ? 'You reacted to this post' : 'Love this post'}
                  >
                    <Heart size={14} fill={likedPosts.has(post.post_id) ? 'currentColor' : 'none'} /> {post.likes}
                  </button>
                  <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.replies.length} replies</span>
                  <span className="flex items-center gap-1"><Eye size={14} /> {post.views}</span>
                </div>
                {post.replies.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-earth-100 pt-3">
                    {post.replies.map(reply => (
                      <div key={reply.reply_id} className="rounded-lg bg-earth-50 px-3 py-2">
                        <div className="text-xs font-semibold text-earth-700">{reply.author?.full_name || 'User'}</div>
                        <p className="text-sm text-earth-600">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                {user && (
                  <form onSubmit={e => { e.preventDefault(); replyToPost(post.post_id); }} className="mt-4 flex gap-2">
                    <input
                      value={replyDrafts[post.post_id] || ''}
                      onChange={e => setReplyDrafts(prev => ({ ...prev, [post.post_id]: e.target.value }))}
                      placeholder="Write a reply..."
                      className="min-w-0 flex-1 rounded-lg border border-earth-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                    />
                    <Button type="submit" disabled={replyingTo === post.post_id || !(replyDrafts[post.post_id] || '').trim()}>
                      {replyingTo === post.post_id ? <Loader2 size={15} className="animate-spin" /> : 'Send'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Enhanced Composer Modal */}
      {composerOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-earth-900">Create a community post</h2>
              <button onClick={() => setComposerOpen(false)} className="text-earth-400"><X size={20}/></button>
            </div>

            {/* Category Dropdown */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-earth-600 mb-2">Topic *</label>
              <div className="grid grid-cols-3 gap-2">
                {categoryOptions.map(c => (
                  <button key={c.value} onClick={() => setDraft({ ...draft, category: c.value })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-colors ${
                      draft.category === c.value ? 'border-polli-500 bg-polli-50 ring-2 ring-polli-200' : 'border-earth-200 hover:border-polli-300'
                    }`}>
                    <span className="text-lg">{c.emoji}</span>
                    <span className="text-[10px] font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title with AI suggestions + grammar correction */}
            <div className="mt-4 relative">
              <label className="block text-xs font-bold text-earth-600 mb-1">Title *</label>
              <div className="relative">
                <input ref={titleInputRef} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
                  className="w-full rounded-lg border border-earth-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 pr-20"
                  placeholder="What would you like to discuss?" />
                <div className="absolute right-2 top-1.5 flex items-center gap-1">
                  <button onClick={() => aiCorrect('title')} disabled={correcting === 'title' || !draft.title.trim()}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                    title="Fix grammar & spelling">
                    {correcting === 'title' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Fix
                  </button>
                  <button onClick={() => setShowAiTitle(!showAiTitle)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-polli-600 hover:bg-polli-50 rounded-md">
                    <Sparkles size={12} /> AI
                  </button>
                </div>
              </div>
              {showAiTitle && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-earth-200 shadow-xl max-h-48 overflow-auto">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-polli-600 bg-polli-50">💡 AI Title Suggestions</p>
                  {currentTitleSuggestions.map((s, i) => (
                    <button key={i} onClick={() => { setDraft({ ...draft, title: s }); setShowAiTitle(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-earth-700 hover:bg-polli-50 transition-colors border-b border-earth-50 last:border-0">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content with AI suggestions + grammar correction */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-earth-600 mb-1">Message *</label>
              <div className="relative">
                <textarea value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })}
                  className="w-full min-h-28 rounded-lg border border-earth-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                  placeholder="Share details with your community" />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <button onClick={() => aiCorrect('content')} disabled={correcting === 'content' || !draft.content.trim()}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                    title="Fix grammar & spelling">
                    {correcting === 'content' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Fix
                  </button>
                  <button onClick={() => setShowAiContent(!showAiContent)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-polli-600 hover:bg-polli-50 rounded-md">
                    <Sparkles size={12} /> AI Suggest
                  </button>
                </div>
              </div>
              {showAiContent && (
                <div className="mt-2 p-3 bg-polli-50 rounded-xl border border-polli-100">
                  <p className="text-xs font-medium text-polli-700 mb-2 flex items-center gap-1"><Sparkles size={12} /> AI Content Suggestions:</p>
                  <div className="space-y-1.5 max-h-40 overflow-auto">
                    {currentContentSuggestions.map((s, i) => (
                      <button key={i} onClick={() => { setDraft({ ...draft, content: s }); setShowAiContent(false); }}
                        className="w-full text-left p-2 text-xs text-earth-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-polli-200">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-earth-600 mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {currentTagSuggestions.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.includes(tag) ? 'bg-polli-600 text-white' : 'border border-earth-200 text-earth-600 hover:bg-polli-50'
                    }`}>
                    #{tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="info" className="text-[10px]">#{tag} <button onClick={() => toggleTag(tag)} className="ml-1">×</button></Badge>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={publish} disabled={publishing} className="mt-5 w-full">
              {publishing ? <><Loader2 size={16} className="animate-spin mr-2" /> Publishing...</> : 'Publish post'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
