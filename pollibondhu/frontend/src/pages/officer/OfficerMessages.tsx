import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { MessageSquare, Send, Users, Lock } from 'lucide-react';

export default function OfficerMessages() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Officer Dashboard', href: '/officer' }, { label: 'Messages' }]} />
      
      <div>
        <h1 className="text-2xl font-bold text-earth-900">Messages</h1>
        <p className="text-sm text-earth-500">Communicate with citizens and colleagues</p>
      </div>

      <Card>
        <CardContent className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-lg font-bold text-earth-900">Messaging Coming Soon</h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-earth-500 leading-relaxed">
            Real-time messaging is under development. You will be able to communicate with 
            citizens, colleagues, and other officers once it launches.
          </p>
          
          <div className="mt-6 grid gap-3 max-w-sm mx-auto">
            <div className="flex items-center gap-3 rounded-lg border border-earth-100 p-3 text-left">
              <Send size={16} className="text-blue-500 shrink-0" />
              <span className="text-xs text-earth-600">Reply to citizen messages</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-earth-100 p-3 text-left">
              <Users size={16} className="text-blue-500 shrink-0" />
              <span className="text-xs text-earth-600">Department group chats</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-earth-100 p-3 text-left">
              <Lock size={16} className="text-blue-500 shrink-0" />
              <span className="text-xs text-earth-600">Secure internal messaging</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
