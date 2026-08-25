import { Link } from 'react-router-dom';
import { Heart, Phone, MapPin, Clock, Shield, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import AiHealthAssistant from '@/components/ai/AiHealthAssistant';

const healthServiceLinks: Record<string, string> = {
  'Vaccination Records': '/health/vaccination',
  'Health Card': '/health/health-card',
  'Blood Donation': '/health/blood-donation',
  'Emergency Ambulance': '/health/ambulance',
};

const facilities = [
  { name: 'Union Health Center', type: 'Primary', distance: '2 km', phone: '01700000001', hours: '24/7', emoji: '🏥' },
  { name: 'Upazila Health Complex', type: 'Secondary', distance: '12 km', phone: '01700000002', hours: '8AM-10PM', emoji: '🏨' },
  { name: 'District Hospital', type: 'Tertiary', distance: '35 km', phone: '01700000003', hours: '24/7', emoji: '🏛️' },
];

const services = [
  { title: 'Vaccination Records', desc: 'Access or update vaccination records for children and adults.', icon: Shield, badge: 'Free', emoji: '💉' },
  { title: 'Health Card', desc: 'Get a government health card for free treatment at public hospitals.', icon: Heart, badge: 'Free', emoji: '🏥' },
  { title: 'Blood Donation', desc: 'Find blood donors in your area or register as a donor.', icon: Droplets, badge: 'Active', emoji: '🩸' },
  { title: 'Emergency Ambulance', desc: 'Request an emergency ambulance from the nearest health complex.', icon: Phone, badge: 'Emergency', emoji: '🚑' },
];

export default function HealthcarePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Healthcare' }]} className="mb-6" />
      
      <header className="mb-8">
        <h1 className="text-2xl font-bold">স্বাস্থ্য সেবা <span className="text-earth-400">— Healthcare</span></h1>
        <p className="mt-1 text-sm text-earth-500">Find health facilities, blood donors, vaccination records, and emergency services.</p>
      </header>

      {/* AI Health Assistant */}
      <section className="mb-8">
        <AiHealthAssistant />
      </section>

      {/* Quick Services */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {services.map((s) => (
          <Link key={s.title} to={healthServiceLinks[s.title] || '#'} className="block">
            <Card className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <Badge variant={s.badge === 'Emergency' ? 'danger' : s.badge === 'Free' ? 'success' : 'default'}>{s.badge}</Badge>
                </div>
                <h3 className="text-sm font-bold">{s.title}</h3>
                <p className="mt-2 text-xs text-earth-500 leading-5">{s.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* Health Facilities */}
      <section>
        <h2 className="text-lg font-bold mb-4">Nearby Health Facilities</h2>
        <div className="space-y-3">
          {facilities.map((f) => (
            <Card key={f.name}>
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-3xl">{f.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">{f.name}</h3>
                  <p className="text-xs text-earth-500 mt-0.5">{f.type} Health Facility</p>
                </div>
                <div className="text-right text-xs text-earth-500 space-y-1">
                  <p className="flex items-center gap-1 justify-end"><MapPin size={12} /> {f.distance}</p>
                  <p className="flex items-center gap-1 justify-end"><Clock size={12} /> {f.hours}</p>
                  <p className="flex items-center gap-1 justify-end"><Phone size={12} /> {f.phone}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
