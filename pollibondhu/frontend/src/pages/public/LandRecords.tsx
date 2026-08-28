import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft, FileText, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

const serviceTypes = [
  'Mutation (হকদখল) — Transfer of land ownership',
  'Khatian (খতিয়ান) — Land record copy',
  'Mouza Map (মৌজা ম্যাপ) — Village boundary map',
  'Land Tax (ভূমি কর) — Tax payment info',
  'Land dispute reference',
  'Plot information',
  'Other',
];

const steps = [
  { icon: FileText, title: 'Submit Request', desc: 'Fill in the form with your details and select the service type.' },
  { icon: Clock, title: 'Processing', desc: 'Your request is forwarded to the Land Office (ভূমি অফিস) for verification.' },
  { icon: CheckCircle, title: 'Receive Documents', desc: 'Collect your documents from the Land Office or Union Digital Centre.' },
];

export default function LandRecords() {
  const { user } = useAuth();
  const [serviceType, setServiceType] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [dagNo, setDagNo] = useState('');
  const [jLNo, setJLNo] = useState('');
  const [plotDetails, setPlotDetails] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [union, setUnion] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  const handleAutoFill = () => {
    setServiceType(serviceTypes[0]);
    setOwnerName('Jane Doe');
    setDagNo('1234');
    setJLNo('567');
    setPlotDetails('Residential plot, 5 katha, near the main road.');
    setDistrict('Dhaka');
    setUpazila('Savar');
    setUnion('Aminbazar');
    setPhone('01712345678');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceType || !ownerName || !phone) return;
    setLoading(true);
    try {
      const res = await api.post('/applications', {
        service_id: null,
        category_id: null,
        applicant_name: ownerName,
        applicant_data: JSON.stringify({
          serviceType,
          dagNo,
          jLNo,
          plotDetails,
          district,
          upazila,
          union,
          phone,
          module: 'LAND_RECORDS',
        }),
        notes: `Land Records request: ${serviceType}`,
      });
      setTrackingId(res.data.data?.tracking_id || 'Pending');
      setSubmitted(true);
    } catch {
      alert('Failed to submit request. Please log in and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-polli-600 hover:text-polli-700 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <MapPin size={24} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-earth-900">Land Records (ভূমি রেকর্ড)</h1>
      </div>
      <p className="text-earth-600 mb-8">
        Request land documents, mutation, khatian copies, and more through PolliBondhu.
        Your request is forwarded to the local Land Office for processing.
      </p>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {steps.map((step, i) => (
          <div key={i} className="border border-earth-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-polli-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <step.icon size={20} className="text-polli-600" />
            </div>
            <div className="text-xs font-bold text-polli-500 mb-1">Step {i + 1}</div>
            <h3 className="font-semibold text-earth-800 mb-1">{step.title}</h3>
            <p className="text-xs text-earth-500">{step.desc}</p>
          </div>
        ))}
      </div>

      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-xl font-semibold text-earth-800 mb-2">Request Submitted Successfully</h2>
          {trackingId && (
            <p className="text-earth-600 mb-1">
              Tracking ID: <span className="font-mono font-bold text-polli-700">{trackingId}</span>
            </p>
          )}
          <p className="text-earth-600 mb-4">
            You will be notified when your request is processed. You can also check status from your dashboard.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/dashboard" className="px-4 py-2 bg-polli-600 text-white text-sm font-medium rounded-lg hover:bg-polli-700 transition-colors">
              Go to Dashboard
            </Link>
            <Link to="/" className="px-4 py-2 border border-earth-300 text-earth-700 text-sm font-medium rounded-lg hover:bg-earth-50 transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {!user && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              Please{' '}
              <Link to="/login" className="underline font-medium">log in</Link>{' '}
              to submit a request and track its status.
            </div>
          )}

          {/* Service Type */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-earth-700">Service Type *</label>
              <button 
                type="button" 
                onClick={handleAutoFill}
                className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 rounded-lg font-medium transition flex items-center gap-1 shadow-sm"
              >
                <Sparkles size={12} /> Auto-Fill Demo
              </button>
            </div>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
              className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
            >
              <option value="">Select a land service</option>
              {serviceTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">Land Owner Name (মালিকের নাম) *</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              placeholder="Name as it appears on land records"
              className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
            />
          </div>

          {/* DAG & JL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">DAG Number (দাগ নং)</label>
              <input
                type="text"
                value={dagNo}
                onChange={(e) => setDagNo(e.target.value)}
                placeholder="e.g. 1234"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">J.L. Number (জে.এল. নং)</label>
              <input
                type="text"
                value={jLNo}
                onChange={(e) => setJLNo(e.target.value)}
                placeholder="e.g. 567"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">District (জেলা) *</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                placeholder="e.g. Gazipur"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Upazila (উপজেলা) *</label>
              <input
                type="text"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                required
                placeholder="e.g. Tongi"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Union (ইউনিয়ন)</label>
              <input
                type="text"
                value={union}
                onChange={(e) => setUnion(e.target.value)}
                placeholder="e.g. Board Bazar"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
          </div>

          {/* Plot Details */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">Plot / Land Details</label>
            <textarea
              value={plotDetails}
              onChange={(e) => setPlotDetails(e.target.value)}
              rows={3}
              placeholder="Describe the land: area, boundaries, current usage, etc."
              className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">Contact Phone (মোবাইল নং) *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="01XXXXXXXXX"
              className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !serviceType || !ownerName || !phone}
            className="px-6 py-2.5 bg-polli-600 text-white text-sm font-medium rounded-lg hover:bg-polli-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      )}
    </div>
  );
}
