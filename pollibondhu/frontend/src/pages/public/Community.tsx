import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, MessageCircle, Heart, Eye, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/feedback/ToastProvider';

const mockPosts = [
  { id: 1, author: 'Abdul Karim', avatar: 'A', category: 'Agriculture', verified: false, title: 'Boro paddy blast disease — how to control it organically?', content: 'I am seeing brownish spots on my paddy leaves after the fog last week. What organic treatments can I use?', tags: ['Paddy', 'Disease', 'Organic Farming'], likes: 24, replies: 8, views: 347, time: '2 hours ago' },
  { id: 2, author: 'Upazila Agriculture Officer', avatar: 'U', category: 'Official Notice', verified: true, title: 'Fertilizer subsidy distribution schedule — December 2024', content: 'Dear farmers, subsidy fertilizer will be distributed at your local UP complex from Dec 22-28. Bring your farmer card and NID.', tags: ['Subsidy', 'Fertilizer', 'Official'], likes: 89, replies: 31, views: 892, time: '5 hours ago' },
  { id: 3, author: 'Rahela Begum', avatar: 'R', category: 'Citizen Services', verified: false, title: 'NID correction — experience and tips', content: 'I just got my NID name corrected online through PolliBondhu. Took 8 days. Tips: upload crystal clear document photos.', tags: ['NID', 'Experience', 'Tips'], likes: 56, replies: 19, views: 438, time: '1 day ago' },
  { id: 4, author: 'Sujan Mia', avatar: 'S', category: 'Community', verified: false, title: 'Water logging problem in Harinathpur village road', content: 'The road from Harinathpur bazaar to the school gets flooded every rain. Children cannot reach school safely.', tags: ['Infrastructure', 'Flood', 'Community Issue'], likes: 43, replies: 12, views: 265, time: '2 days ago' },
];

export default function CommunityPage() {
  const [tab, setTab] = useState('feed');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState(mockPosts);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', content: '', category: 'Community' });
  const { user } = useAuth();
  const { addToast } = useToast();
  const visiblePosts = posts.filter(post => {
    if (tab === 'my-posts' && post.author !== (user?.full_name || 'Abdul Karim')) return false;
    return `${post.title} ${post.content} ${post.category}`.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => tab === 'trending' ? (b.likes + b.replies) - (a.likes + a.replies) : 0);
  function publish() {
    if (!draft.title.trim() || !draft.content.trim()) { addToast('Add a title and your message first.', 'error'); return; }
    setPosts([{ id: Date.now(), author: user?.full_name || 'Abdul Karim', avatar: (user?.full_name || 'A').slice(0, 1), category: draft.category, verified: false, title: draft.title, content: draft.content, tags: ['Community'], likes: 0, replies: 0, views: 0, time: 'Just now' }, ...posts]);
    setDraft({ title: '', content: '', category: 'Community' }); setComposerOpen(false); setTab('my-posts'); addToast('Your community post is published');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">কমিউনিটি ফোরাম — Community Forum</h1>
          <p className="text-sm text-earth-500">Discuss issues, share knowledge, connect with experts</p>
        </div>
        <Button onClick={() => setComposerOpen(true)}><Plus size={16} className="mr-1" /> New Post</Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-earth-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search discussions..." className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-polli-500" />
        </div>
      </div>

      <div className="flex gap-2">
        {['feed', 'trending', 'my-posts'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-polli-600 text-white' : 'bg-white border text-earth-600 hover:bg-polli-50'}`}>
            {t === 'feed' ? 'Feed' : t === 'trending' ? 'Trending' : 'My Posts'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visiblePosts.map((post) => (
          <Card key={post.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-polli-100 flex items-center justify-center text-polli-700 font-bold text-sm">{post.avatar}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-earth-800">{post.author}</span>
                    {post.verified && <Badge variant="default" className="text-[10px] px-1.5 py-0">Verified</Badge>}
                    <Badge variant={post.category === 'Official Notice' ? 'warning' : 'default'} className="text-[10px]">{post.category}</Badge>
                  </div>
                  <div className="text-xs text-earth-400">{post.time}</div>
                </div>
              </div>
              <h3 className="font-semibold text-earth-900 mb-1">{post.title}</h3>
              <p className="text-sm text-earth-500 line-clamp-2 mb-3">{post.content}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tag) => <span key={tag} className="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full">#{tag}</span>)}
              </div>
              <div className="flex items-center gap-4 text-xs text-earth-400">
                <span className="flex items-center gap-1"><Heart size={14} /> {post.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.replies} replies</span>
                <span className="flex items-center gap-1"><Eye size={14} /> {post.views}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {!visiblePosts.length && <div className="rounded-xl border border-dashed border-earth-200 bg-white py-10 text-center text-sm text-earth-400">No posts found in this view.</div>}
      </div>
      {composerOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-earth-900">Create a community post</h2><button onClick={() => setComposerOpen(false)} className="text-earth-400"><X size={20}/></button></div><label className="mt-5 block text-xs font-bold text-earth-600">Topic<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} className="mt-2 w-full rounded-lg border border-earth-200 p-2 text-sm"><option>Community</option><option>Agriculture</option><option>Citizen Services</option></select></label><label className="mt-4 block text-xs font-bold text-earth-600">Title<input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="mt-2 w-full rounded-lg border border-earth-200 p-2 text-sm" placeholder="What would you like to discuss?"/></label><label className="mt-4 block text-xs font-bold text-earth-600">Message<textarea value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} className="mt-2 min-h-28 w-full rounded-lg border border-earth-200 p-2 text-sm" placeholder="Share details with your community"/></label><Button onClick={publish} className="mt-5 w-full">Publish post</Button></div></div>}
    </div>
  );
}
