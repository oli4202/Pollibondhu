import { Phone, AlertTriangle, Shield, Flame, Ambulance, Droplets, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

const contacts = [
  { name: 'Police', number: '999', type: 'Law Enforcement', emoji: '🚔', color: 'bg-blue-50 border-blue-200' },
  { name: 'Fire Service', number: '199', type: 'Fire Emergency', emoji: '🚒', color: 'bg-red-50 border-red-200' },
  { name: 'Ambulance', number: '199999', type: 'Medical Emergency', emoji: '🚑', color: 'bg-rose-50 border-rose-200' },
  { name: 'Civil Defence', number: '10921', type: 'Disaster Response', emoji: '🛡️', color: 'bg-amber-50 border-amber-200' },
  { name: 'Coast Guard', number: '10921', type: 'Maritime Emergency', emoji: '🚢', color: 'bg-cyan-50 border-cyan-200' },
];

const alerts = [
  { title: 'Flood Warning — Harinathpur Union', severity: 'Critical', time: '2 hours ago', emoji: '🌊' },
  { title: 'Dengue Awareness — Ward 3', severity: 'High', time: '5 hours ago', emoji: '🦟' },
];

export default function EmergencyPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Emergency' }]} className="mb-6" />
      
      <header className="mb-8">
        <h1 className="text-2xl font-bold">জরুরি সেবা <span className="text-earth-400">— Emergency Services</span></h1>
        <p className="mt-1 text-sm text-earth-500">Emergency contacts, disaster alerts, and safety information.</p>
      </header>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <section className="mb-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-600" />
              <h2 className="text-sm font-bold text-red-800">Active Alerts</h2>
            </div>
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.title} className="flex items-center gap-3 text-sm">
                  <span>{a.emoji}</span>
                  <span className="flex-1 text-red-800 font-medium">{a.title}</span>
                  <Badge variant={a.severity === 'Critical' ? 'danger' : 'warning'}>{a.severity}</Badge>
                  <span className="text-xs text-red-400">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Emergency Contacts */}
      <section>
        <h2 className="text-lg font-bold mb-4">Emergency Contacts</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => (
            <Card key={c.name} className={`border ${c.color}`}>
              <CardContent className="p-5 text-center">
                <span className="text-3xl">{c.emoji}</span>
                <h3 className="mt-3 text-sm font-bold">{c.name}</h3>
                <p className="text-xs text-earth-500 mt-1">{c.type}</p>
                <div className="mt-4">
                  <a href={`tel:${c.number}`}>
                    <Button size="sm" className="w-full">
                      <Phone size={14} /> {c.number}
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
