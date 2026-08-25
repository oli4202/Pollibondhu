import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';

const departments = [
  {
    name: 'Union Parishad Office',
    phone: '+880-1700-000000',
    email: 'up@pollibondhu.gov.bd',
    address: 'Your local Union Parishad, Bangladesh',
  },
  {
    name: 'Upazila Council',
    phone: '+880-1700-000001',
    email: 'upazila@pollibondhu.gov.bd',
    address: 'Upazila Parishad Complex, Bangladesh',
  },
  {
    name: 'District Administration',
    phone: '+880-1700-000002',
    email: 'district@pollibondhu.gov.bd',
    address: 'Zila Parishad, District HQ, Bangladesh',
  },
  {
    name: 'Technical Support',
    phone: '+880-1700-000003',
    email: 'support@pollibondhu.gov.bd',
    address: 'PolliBondhu Help Desk, Online',
  },
];

export default function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-polli-100 rounded-lg">
          <Phone size={24} className="text-polli-600" />
        </div>
        <h1 className="text-3xl font-bold text-earth-900">Contact Us</h1>
      </div>

      <p className="text-earth-600 mb-8">
        Reach out to the relevant department or visit your local Union Digital Centre for in-person support.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div key={dept.name} className="border border-earth-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-earth-800 mb-4">{dept.name}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-earth-600">
                <Phone size={16} className="text-polli-500 mt-0.5 shrink-0" />
                <span>{dept.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-earth-600">
                <Mail size={16} className="text-polli-500 mt-0.5 shrink-0" />
                <span>{dept.email}</span>
              </div>
              <div className="flex items-start gap-3 text-earth-600">
                <MapPin size={16} className="text-polli-500 mt-0.5 shrink-0" />
                <span>{dept.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-earth-50 rounded-xl">
        <h2 className="text-lg font-semibold text-earth-800 mb-2">Visit in Person</h2>
        <p className="text-earth-600 text-sm leading-relaxed">
          PolliBondhu services are also available at your nearest <strong>Union Digital Centre (UDC)</strong>.
          Trained assistants can help you register, submit complaints, apply for services, and access
          all platform features — completely free of charge.
        </p>
      </div>
    </div>
  );
}
