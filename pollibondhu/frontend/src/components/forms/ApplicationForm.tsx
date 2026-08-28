import { useState } from 'react';
import { FileText, ChevronRight, ChevronLeft, CheckCircle, X, Sparkles, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/utils/api';

interface ApplicationFormProps {
  serviceName: string;
  serviceId?: number;
  onClose: () => void;
}

// Service-specific document requirements and processing info
const serviceInfo: Record<string, { documents: string[]; processingTime: string; fee: string; tips: string[] }> = {
  'Birth Registration': {
    documents: ['Hospital birth record', 'Parents NID (both)', 'Parents marriage certificate', '2 passport photos'],
    processingTime: '5-7 working days',
    fee: 'Free',
    tips: ['Bring original documents', 'Both parents should be present if possible', 'Apply within 45 days of birth for faster processing'],
  },
  'NID Application': {
    documents: ['Birth certificate', 'Parents NID', '2 passport photos', 'School certificate (if available)'],
    processingTime: '5-7 working days',
    fee: 'Free',
    tips: ['Ensure name matches birth certificate', 'Bring attested copies of documents', 'Biometric data will be collected at office'],
  },
  'NID Correction': {
    documents: ['Original NID', 'Supporting documents for correction', 'Court affidavit (if name change)', '2 passport photos'],
    processingTime: '10-15 working days',
    fee: '৳50',
    tips: ['Bring proof of the correct information', 'Name corrections require affidavit', 'Address changes need utility bill proof'],
  },
  'NID Duplicate': {
    documents: ['FIR copy (if lost)', 'Old NID copy (if available)', '2 passport photos', 'Address proof'],
    processingTime: '10-15 working days',
    fee: '৳100',
    tips: ['File FIR at nearest police station first', 'Bring the FIR receipt', 'Processing may take longer for lost NID'],
  },
  'Death Certificate': {
    documents: ['Hospital death report', 'Informant NID', '2 passport photos', 'Witness statements'],
    processingTime: '3-5 working days',
    fee: 'Free',
    tips: ['Apply within 21 days for faster processing', 'Any family member can apply', 'Bring hospital records if available'],
  },
  'Trade License': {
    documents: ['NID copy', 'Tax clearance certificate', 'Property documents (if owned)', '2 passport photos', 'Trade plan/description'],
    processingTime: '7-14 working days',
    fee: '৳500',
    tips: ['Ensure all taxes are cleared', 'Bring building ownership proof or rental agreement', 'New businesses need fire safety clearance'],
  },
};

const purposeOptions = [
  { value: 'new', label: 'New Application', emoji: '📝', desc: 'First-time application' },
  { value: 'correction', label: 'Correction', emoji: '✏️', desc: 'Fix errors in existing document' },
  { value: 'duplicate', label: 'Duplicate Copy', emoji: '📋', desc: 'Replace lost/damaged document' },
  { value: 'renewal', label: 'Renewal', emoji: '🔄', desc: 'Renew expired document' },
];

const aiApplicationTips: Record<string, string[]> = {
  'NID Application': [
    'Ensure your name exactly matches your birth certificate',
    'Bring both original and photocopies of all documents',
    'Biometric data (fingerprints, photo) will be taken at the office',
  ],
  'Birth Registration': [
    'Apply within 45 days of birth for fastest processing',
    'Hospital records must be original or officially certified',
    'Both parents NIDs are required for verification',
  ],
};

export default function ApplicationForm({ serviceName, serviceId, onClose }: ApplicationFormProps) {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    applicant_name: '',
    phone: '',
    purpose: 'new',
    notes: '',
  });

  const info = serviceInfo[serviceName] || {
    documents: ['Valid ID', 'Supporting documents', '2 passport photos'],
    processingTime: '5-10 working days',
    fee: 'Varies',
    tips: ['Bring original documents', 'Arrive early for faster service', 'Keep copies of all submitted documents'],
  };

  const tips = aiApplicationTips[serviceName] || info.tips;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/applications', {
        service_id: serviceId,
        applicant_name: data.applicant_name,
        applicant_data: JSON.stringify({
          purpose: purposeOptions.find(p => p.value === data.purpose)?.label || data.purpose,
          notes: data.notes,
          phone: data.phone,
        }),
      });
      addToast(`Application submitted! Tracking ID: ${res.data.data.tracking_id}`, 'success');
      onClose();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to submit application', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-slide-up max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-earth-200 px-6 py-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-polli-50 text-polli-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold">{serviceName}</h2>
              <p className="text-xs text-earth-400">Application Form</p>
            </div>
          </div>
          <button onClick={onClose} className="text-earth-400 hover:text-earth-600 p-1"><X size={18} /></button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-6 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-earth-100 -z-10 rounded-full" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-polli-500 -z-10 rounded-full transition-all" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-polli-600 text-white' : 'bg-earth-100 text-earth-400'}`}>
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 min-h-[280px]">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-earth-900">Personal Information</h3>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Full Name *</label>
                <input type="text" value={data.applicant_name} onChange={(e) => setData({ ...data, applicant_name: e.target.value })}
                  className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                  placeholder="Enter your full name as on NID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Phone Number</label>
                <input type="text" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })}
                  className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                  placeholder="01XXXXXXXXX" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-earth-900">Application Details</h3>

              {/* Purpose Dropdown */}
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-2">Purpose *</label>
                <div className="grid grid-cols-2 gap-2">
                  {purposeOptions.map(p => (
                    <button key={p.value} onClick={() => setData({ ...data, purpose: p.value })}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-colors ${
                        data.purpose === p.value ? 'border-polli-500 bg-polli-50 ring-2 ring-polli-200' : 'border-earth-200 hover:border-polli-300'
                      }`}>
                      <span className="text-lg">{p.emoji}</span>
                      <div>
                        <p className="font-medium text-earth-800">{p.label}</p>
                        <p className="text-[10px] text-earth-400">{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Additional Notes</label>
                <textarea value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} rows={3}
                  className="w-full border border-earth-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500"
                  placeholder="Any additional information..." />
              </div>

              {/* AI Tips */}
              <div className="p-3 bg-polli-50 rounded-xl border border-polli-100">
                <p className="text-xs font-medium text-polli-700 mb-2 flex items-center gap-1"><Sparkles size={12} /> AI Tips for {serviceName}:</p>
                <ul className="space-y-1.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-xs text-earth-600 flex items-start gap-2">
                      <CheckCircle size={12} className="text-polli-500 mt-0.5 shrink-0" /> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-polli-100 text-polli-600 mx-auto">
                <FileText size={32} />
              </div>
              <h3 className="font-bold text-xl">Review & Submit</h3>

              {/* Required Documents */}
              <div className="bg-earth-50 rounded-xl p-4 text-left">
                <p className="text-xs font-bold text-earth-700 mb-2">📄 Required Documents:</p>
                <ul className="space-y-1.5">
                  {info.documents.map((doc, i) => (
                    <li key={i} className="text-xs text-earth-600 flex items-center gap-2">
                      <CheckCircle size={12} className="text-green-500 shrink-0" /> {doc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Processing Info */}
              <div className="bg-earth-50 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between border-b border-earth-200 pb-2">
                  <span className="text-earth-500">Service:</span>
                  <span className="font-bold">{serviceName}</span>
                </div>
                <div className="flex justify-between border-b border-earth-200 pb-2">
                  <span className="text-earth-500">Name:</span>
                  <span className="font-bold">{data.applicant_name || 'Not specified'}</span>
                </div>
                <div className="flex justify-between border-b border-earth-200 pb-2">
                  <span className="text-earth-500">Purpose:</span>
                  <span className="font-bold">{purposeOptions.find(p => p.value === data.purpose)?.label || data.purpose}</span>
                </div>
                <div className="flex justify-between border-b border-earth-200 pb-2">
                  <span className="text-earth-500">Fee:</span>
                  <span className="font-bold">{info.fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-earth-500">Processing Time:</span>
                  <span className="font-bold flex items-center gap-1"><Clock size={12} /> {info.processingTime}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-earth-200 sticky bottom-0 bg-white">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex items-center gap-1">
              <ChevronLeft size={16} /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1 flex items-center justify-center gap-1">
              Continue <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading} className="flex-1 flex items-center justify-center gap-1">
              Submit Application <CheckCircle size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
