import { Link } from 'react-router-dom';
import { CreditCard, ArrowLeft, FileText, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

const serviceTypes = [
  'NID Copy (জাতীয় পরিচয়পত্র কপি) — Duplicate NID card',
  'NID Correction (সংশোধন) — Fix name, DOB, photo, or address',
  'NID Update (হালনাগাদ) — Update info after marriage, etc.',
  'NID Status Check (অবস্থা যাচাই) — Check application status',
  'Birth Registration Link — Link birth cert to NID',
  'Other',
];

const steps = [
  { icon: FileText, title: 'Submit Request', desc: 'Fill in your details and select the NID service you need.' },
  { icon: Clock, title: 'Verification', desc: 'Your request is forwarded to the local Election Commission office.' },
  { icon: CheckCircle, title: 'Collect NID', desc: 'Pick up your NID or corrected copy from the designated office.' },
];

export default function NIDServices() {
  const { user } = useAuth();
  const [serviceType, setServiceType] = useState('');
  const [fullName, setFullName] = useState('');
  const [fullNameBn, setFullNameBn] = useState('');
  const [nidNo, setNidNo] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [corrections, setCorrections] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceType || !fullName || !phone) return;
    setLoading(true);
    try {
      const res = await api.post('/applications', {
        service_id: null,
        category_id: null,
        applicant_name: fullName,
        applicant_data: JSON.stringify({
          serviceType,
          fullNameBn,
          nidNo,
          birthDate,
          fatherName,
          motherName,
          district,
          upazila,
          address,
          phone,
          corrections,
          module: 'NID_SERVICES',
        }),
        notes: `NID Services request: ${serviceType}`,
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
        <div className="p-2 bg-blue-100 rounded-lg">
          <CreditCard size={24} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-earth-900">NID Services (জাতীয় পরিচয়পত্র)</h1>
      </div>
      <p className="text-earth-600 mb-8">
        Request NID corrections, duplicates, updates, and more through PolliBondhu.
        Your request is forwarded to the local Election Commission office for processing.
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
            You will be notified when your request is processed. Check your dashboard for status updates.
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
            <label className="block text-sm font-medium text-earth-700 mb-2">Service Type *</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
              className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
            >
              <option value="">Select an NID service</option>
              {serviceTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Full Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Full Name (English) *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="As on NID"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Full Name (বাংলা)</label>
              <input
                type="text"
                value={fullNameBn}
                onChange={(e) => setFullNameBn(e.target.value)}
                placeholder="নাম (বাংলা)"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
          </div>

          {/* NID & DOB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">NID Number (পরিচয়পত্র নং)</label>
              <input
                type="text"
                value={nidNo}
                onChange={(e) => setNidNo(e.target.value)}
                placeholder="17-digit NID number"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Date of Birth (জন্ম তারিখ)</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
          </div>

          {/* Parents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Father's Name (পিতার নাম)</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father's full name"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Mother's Name (মাতার নাম)</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Mother's full name"
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">Current Address (ঠিকানা)</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Full address as per NID"
              className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
            />
          </div>

          {/* Corrections (for correction/update requests) */}
          {(serviceType.includes('Correction') || serviceType.includes('Update')) && (
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Details of Corrections Needed *</label>
              <textarea
                value={corrections}
                onChange={(e) => setCorrections(e.target.value)}
                rows={3}
                required
                placeholder="Specify what needs to be corrected: name spelling, date of birth, photo, address, etc."
                className="w-full border border-earth-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
              />
            </div>
          )}

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
            disabled={loading || !serviceType || !fullName || !phone}
            className="px-6 py-2.5 bg-polli-600 text-white text-sm font-medium rounded-lg hover:bg-polli-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      )}
    </div>
  );
}
