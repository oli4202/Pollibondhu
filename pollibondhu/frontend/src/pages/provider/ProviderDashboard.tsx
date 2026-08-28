import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Wrench, Plus, Eye, Clock, TrendingUp, ArrowRight, Building2, FileText, Users, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/utils/api';

interface Service {
  service_id: number;
  title: string;
  status: string;
  price?: number;
  is_available: boolean;
  created_at: string;
}

const govServiceTypes = [
  { name: 'NID Application', emoji: '🪪', desc: 'National Identity Card' },
  { name: 'Birth Registration', emoji: '👶', desc: 'Birth certificate registration' },
  { name: 'NID Correction', emoji: '✏️', desc: 'Correct NID information' },
  { name: 'NID Duplicate', emoji: '📋', desc: 'Duplicate NID card' },
  { name: 'Death Certificate', emoji: '📄', desc: 'Death certificate' },
  { name: 'Marriage Registration', emoji: '💍', desc: 'Marriage certificate' },
  { name: 'Trade License', emoji: '🏬', desc: 'Business trade license' },
  { name: 'Land Khatian', emoji: '📜', desc: 'Land records & khatian' },
  { name: 'Income Certificate', emoji: '💰', desc: 'Income certificate' },
  { name: 'Character Certificate', emoji: '🎖️', desc: 'Character certificate' },
];

export default function ProviderDashboard() {
  const { user, hasRole } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingApps, setPendingApps] = useState(0);

  const isGovProvider = hasRole('GOV_SERVICE_PROVIDER');

  useEffect(() => {
    api.get('/services', { params: { provider_id: user?.user_id } })
      .then(res => {
        const data = res.data;
        setServices(data.data?.services || data.services || (Array.isArray(data.data) ? data.data : []) || []);
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
    // Count pending apps for badge
    api.get('/applications', { params: { status: 'SUBMITTED', limit: '1' } })
      .then(res => setPendingApps(res.data.data?.total || 0))
      .catch(() => {});
  }, [user?.user_id]);

  const stats = {
    total: services.length,
    approved: services.filter(s => s.status === 'APPROVED').length,
    pending: services.filter(s => s.status === 'PENDING').length,
    unavailable: services.filter(s => !s.is_available).length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`rounded-2xl bg-gradient-to-r ${isGovProvider ? 'from-blue-600 via-blue-700 to-indigo-700' : 'from-purple-600 via-purple-700 to-indigo-700'} text-white p-6 md:p-8`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`${isGovProvider ? 'text-blue-100' : 'text-purple-100'} text-sm font-medium`}>
              {isGovProvider ? '🏛️ Government Service Portal' : 'Provider Portal'}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">Welcome, {user?.full_name}</h1>
            <p className={`${isGovProvider ? 'text-blue-200' : 'text-purple-200'} text-sm mt-1`}>
              {isGovProvider ? 'Manage government services for citizens — NID, birth cert, trade license & more' : 'Manage your services and grow your business'}
            </p>
          </div>
          <Link to="/provider/services">
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Plus size={16} /> {isGovProvider ? 'New Gov Service' : 'New Service'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Services', value: stats.total, icon: Wrench, color: 'bg-purple-50 text-purple-600' },
          { label: 'Approved & Live', value: stats.approved, icon: Eye, color: 'bg-green-50 text-green-600' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-600' },
          { label: 'New Applications', value: pendingApps, icon: FileText, color: 'bg-blue-50 text-blue-600', link: '/provider/applications' },
        ].map((s) => (
          s.link ? (
            <Link key={s.label} to={s.link}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-earth-500 font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-earth-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${s.color} relative`}>
                    <s.icon size={20} />
                    {(s.value as number) > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{s.value}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-earth-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-earth-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${s.color}`}>
                <s.icon size={20} />
              </div>
            </CardContent>
          </Card>
          )
        ))}
      </div>

      {/* Government Service Types (for Gov Providers) */}
      {isGovProvider && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-earth-800 mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" /> Government Service Types
            </h3>
            <p className="text-xs text-earth-500 mb-4">These are the government services you can offer to citizens. Click "New Gov Service" to create one.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {govServiceTypes.map(s => (
                <div key={s.name} className="flex items-center gap-3 rounded-lg border border-earth-100 p-3 hover:bg-blue-50 transition-colors">
                  <span className="text-xl">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-earth-800">{s.name}</p>
                    <p className="text-[10px] text-earth-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow border-blue-200 bg-blue-50/30">
          <CardContent className="p-5">
            <h3 className="font-semibold text-earth-800 mb-2">📨 Manage Applications</h3>
            <p className="text-sm text-earth-500 mb-4">
              Review, approve, or reject citizen service applications submitted through the portal.
            </p>
            <Link to="/provider/applications">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <FileText size={14} /> View Applications
                {pendingApps > 0 && <span className="ml-1 bg-white text-blue-600 text-[10px] font-bold px-1.5 rounded-full">{pendingApps} new</span>}
                <ArrowRight size={14} />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <h3 className="font-semibold text-earth-800 mb-2">🗣️ Complaints &amp; Issues</h3>
            <p className="text-sm text-earth-500 mb-4">
              Respond to and resolve all citizen complaints and issues submitted to this office.
            </p>
            <Link to="/provider/complaints">
              <Button size="sm" variant="outline">
                View Complaints <ArrowRight size={14} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-earth-800">
            {isGovProvider ? 'Your Government Services' : 'Recent Services'}
          </h2>
          <Link to="/provider/services" className="text-sm text-polli-600 hover:text-polli-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Wrench size={40} className="mx-auto text-earth-300 mb-3" />
                <h3 className="font-semibold text-earth-700 mb-1">No services yet</h3>
                <p className="text-sm text-earth-400 mb-4">
                  {isGovProvider ? 'Create your first government service to start receiving citizen applications.' : 'Create your first service to start getting requests.'}
                </p>
                <Link to="/provider/services">
                  <Button><Plus size={16} /> {isGovProvider ? 'Create Government Service' : 'Create Your First Service'}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            services.slice(0, 5).map(s => (
              <Card key={s.service_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-earth-800">{s.title}</h3>
                      <Badge variant={s.status === 'APPROVED' ? 'success' : s.status === 'PENDING' ? 'warning' : 'danger'}>
                        {s.status}
                      </Badge>
                      {!s.is_available && <Badge variant="danger">Hidden</Badge>}
                    </div>
                    <p className="text-xs text-earth-400 mt-1">
                      {s.price ? `৳${s.price}` : 'Free'} • Added {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
