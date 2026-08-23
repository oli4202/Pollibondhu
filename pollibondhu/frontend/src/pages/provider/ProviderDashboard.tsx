import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Wrench, TrendingUp, Eye, Bookmark } from 'lucide-react';
import { useState } from 'react';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [services] = useState([
    { id: 1, title: 'Power Tiller Rental', status: 'APPROVED', views: 245, saves: 18, price: 500 },
    { id: 2, title: 'Seed Supply - BRRI Dhan28', status: 'APPROVED', views: 189, saves: 12, price: 85 },
    { id: 3, title: 'Land Survey Service', status: 'PENDING', views: 0, saves: 0, price: 1500 },
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 md:p-8">
        <p className="text-purple-100 text-sm font-medium">Provider Portal</p>
        <h1 className="text-2xl md:text-3xl font-bold mt-1">{user?.full_name}</h1>
        <p className="text-purple-200 text-sm mt-1">Manage your services and track performance</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[{ label: 'Total Services', value: '3', icon: Wrench }, { label: 'Total Views', value: '434', icon: Eye }, { label: 'Saved by Users', value: '30', icon: Bookmark }].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-sm text-earth-500 font-medium">{s.label}</p><p className="text-2xl font-bold text-earth-900 mt-1">{s.value}</p></div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600"><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-earth-800">My Services</h2>
        <Button>Add New Service</Button>
      </div>

      <div className="space-y-3">
        {services.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-earth-800">{s.title}</h3>
                  <Badge variant={s.status === 'APPROVED' ? 'success' : 'warning'}>{s.status}</Badge>
                </div>
                <p className="text-sm text-earth-500">৳{s.price} • {s.views} views • {s.saves} saves</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
