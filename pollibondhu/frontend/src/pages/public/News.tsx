import { Newspaper, Calendar, MapPin, Clock, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

const news = [
  { title: 'Boro paddy subsidy applications are open until Dec 31', category: 'Agriculture', date: 'Jan 15, 2026', emoji: '🌾' },
  { title: 'New smart NID card distribution available locally', category: 'Government', date: 'Jan 12, 2026', emoji: '🪪' },
  { title: 'Community clean-up campaign this Saturday', category: 'Community', date: 'Jan 10, 2026', emoji: '🧹' },
];

const events = [
  { title: 'Weekly Village Market (Hat)', date: 'Every Saturday', location: 'Harinathpur Bazaar', emoji: '🛒' },
  { title: 'Agriculture Training Programme', date: 'Jan 20, 2026', location: 'Union Complex', emoji: '📚' },
  { title: 'Blood Donation Camp', date: 'Jan 25, 2026', location: 'Health Center', emoji: '🩸' },
];

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'News & Events' }]} className="mb-6" />
      
      <header className="mb-8">
        <h1 className="text-2xl font-bold">স্থানীয় খবর <span className="text-earth-400">— Local News & Events</span></h1>
        <p className="mt-1 text-sm text-earth-500">Stay updated with local news, announcements, and community events.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* News */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Newspaper size={20} className="text-polli-600" /> Latest News
          </h2>
          <div className="space-y-3">
            {news.map((n) => (
              <Card key={n.title} className="card-hover">
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">{n.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{n.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>{n.category}</Badge>
                      <span className="text-xs text-earth-400 flex items-center gap-1">
                        <Clock size={12} /> {n.date}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Events */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-polli-600" /> Upcoming Events
          </h2>
          <div className="space-y-3">
            {events.map((e) => (
              <Card key={e.title} className="card-hover">
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">{e.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{e.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-earth-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {e.date}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {e.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
