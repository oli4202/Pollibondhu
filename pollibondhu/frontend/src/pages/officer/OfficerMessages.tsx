import { Breadcrumb } from '@/components/ui/Breadcrumb';
import MyMessages from '@/pages/user/MyMessages';

export default function OfficerMessages() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Officer Dashboard', href: '/officer' }, { label: 'Messages' }]} />
      
      <div>
        <h1 className="text-2xl font-bold text-earth-900">Messages</h1>
        <p className="text-sm text-earth-500">Communicate with citizens and colleagues</p>
      </div>

      <MyMessages />
    </div>
  );
}
