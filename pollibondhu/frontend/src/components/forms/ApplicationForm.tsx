import { useState, useEffect } from 'react';
import { FileText, ChevronRight, ChevronLeft, CheckCircle, X, Sparkles, Clock, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/utils/api';

interface ApplicationFormProps {
  serviceName: string;
  serviceId?: number;
  onClose: () => void;
}

interface DynamicField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

// Keep basic service info for the final step view (we could make this dynamic too later)
const serviceInfo: Record<string, { documents: string[]; processingTime: string; fee: string; tips: string[] }> = {
  'Birth Registration': { documents: ['Hospital birth record', 'Parents NID (both)'], processingTime: '5-7 working days', fee: 'Free', tips: [] },
  'Trade License': { documents: ['NID copy', 'Tax clearance certificate', 'Property documents'], processingTime: '7-14 working days', fee: '৳500', tips: [] },
};

export default function ApplicationForm({ serviceName, serviceId, onClose }: ApplicationFormProps) {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamic state
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(true);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [data, setData] = useState<Record<string, any>>({
    applicant_name: '',
    phone: '',
  });

  const info = serviceInfo[serviceName] || {
    documents: ['Valid ID', 'Supporting documents'],
    processingTime: '5-10 working days',
    fee: 'Varies',
    tips: ['Bring original documents', 'Keep copies of all submitted documents'],
  };

  // Fetch dynamic schema on mount
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setIsGeneratingSchema(true);
        const res = await api.post('/ai/dynamic-form', { serviceName });
        if (res.data.fields && Array.isArray(res.data.fields)) {
          setDynamicFields(res.data.fields);
          
          // Initialize data state
          const initialData = { ...data };
          res.data.fields.forEach((f: DynamicField) => {
            if (!(f.name in initialData)) initialData[f.name] = '';
          });
          setData(initialData);
        }
      } catch (err) {
        console.error("Failed to generate schema", err);
        // Fallback schema
        setDynamicFields([
          { name: 'purpose', label: 'Application Purpose', type: 'text', required: true, placeholder: 'Why do you need this?' },
          { name: 'additionalInfo', label: 'Additional Details', type: 'textarea', required: false, placeholder: 'Any extra information...' }
        ]);
      } finally {
        setIsGeneratingSchema(false);
      }
    };
    fetchSchema();
  }, [serviceName]);

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!data.applicant_name?.trim()) {
        setError('Full Name is required.');
        return;
      }
      if (data.phone && !/^01\d{9}$/.test(data.phone)) {
        setError('Please enter a valid 11-digit phone number (e.g., 017XXXXXXXX).');
        return;
      }
    }
    if (step === 2) {
      // Validate required dynamic fields
      for (const field of dynamicFields) {
        if (field.required && !data[field.name]?.trim()) {
          setError(`${field.label} is required.`);
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const handleMagicFill = async () => {
    if (step !== 2) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/ai/magic-fill', { serviceName, fields: dynamicFields });
      if (res.data.mockData) {
        setData(prev => ({ ...prev, ...res.data.mockData }));
        addToast('Magic Fill Applied! ✨', 'success');
      }
    } catch (err) {
      addToast('Failed to generate mock data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePolish = async (fieldName: string, text: string) => {
    if (!text.trim()) return;
    try {
      addToast('Polishing text...', 'info');
      const res = await api.post('/ai/improve', { text, type: 'description' });
      if (res.data.improved) {
        setData(prev => ({ ...prev, [fieldName]: res.data.improved }));
        addToast('Text polished! ✨', 'success');
      }
    } catch (err) {
      addToast('Failed to polish text', 'error');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const applicantData = { ...data };
      delete applicantData.applicant_name; // Kept at root level

      const res = await api.post('/applications', {
        service_id: serviceId,
        applicant_name: data.applicant_name,
        applicant_data: JSON.stringify(applicantData),
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
    <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/60 p-4 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden my-8 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-polli-600 to-emerald-600 px-6 py-5 shrink-0">
          <div className="flex items-center gap-4 relative z-10 text-white">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-sm">
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <p className="text-polli-100 text-xs font-bold uppercase tracking-wider mb-0.5">Application Form</p>
              <h2 className="text-lg font-bold leading-tight">{serviceName}</h2>
            </div>
            {step === 2 && !isGeneratingSchema && (
              <button onClick={handleMagicFill} disabled={loading} className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20 backdrop-blur-sm text-xs font-bold shadow-sm group disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="group-hover:text-amber-300 transition-colors" />} 
                <span className="hidden sm:inline">Magic Fill</span>
              </button>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20 backdrop-blur-sm shrink-0">
              <X size={18} />
            </button>
          </div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-center justify-between mb-4 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-earth-100 -z-10 rounded-full" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-polli-500 -z-10 rounded-full transition-all" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${step >= s ? 'bg-polli-600 text-white' : 'bg-earth-100 text-earth-400'}`}>
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
            ))}
          </div>
          {error && <div className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 animate-in fade-in slide-in-from-top-2 mb-2">{error}</div>}
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="mb-2">
                <h3 className="font-bold text-earth-900 text-lg">Personal Information</h3>
                <p className="text-xs text-earth-500">Please provide your details exactly as they appear on official documents.</p>
              </div>
              
              <div className="space-y-4 bg-earth-50/50 p-5 rounded-2xl border border-earth-100">
                <div>
                  <label className="block text-xs font-bold text-earth-700 mb-1.5 uppercase tracking-wide">Full Name *</label>
                  <input type="text" value={data.applicant_name} onChange={(e) => setData({ ...data, applicant_name: e.target.value })}
                    className="w-full border border-earth-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 focus:border-polli-500 bg-white shadow-sm transition-shadow"
                    placeholder="Enter your full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-earth-700 mb-1.5 uppercase tracking-wide">Phone Number</label>
                  <input type="text" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })}
                    className="w-full border border-earth-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 focus:border-polli-500 bg-white shadow-sm transition-shadow"
                    placeholder="01XXXXXXXXX" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="mb-2">
                <h3 className="font-bold text-earth-900 text-lg">Application Details</h3>
                <p className="text-xs text-earth-500">Provide specific information for this service request.</p>
              </div>

              {isGeneratingSchema ? (
                <div className="py-12 flex flex-col items-center justify-center text-center bg-earth-50/50 rounded-2xl border border-earth-100">
                  <div className="relative">
                    <Loader2 size={32} className="text-polli-500 animate-spin" />
                    <Sparkles size={16} className="text-amber-400 absolute -top-1 -right-1" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-earth-900">AI is analyzing the service...</p>
                  <p className="text-xs text-earth-500 mt-1">Generating custom requirements for {serviceName}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dynamicFields.map((field) => (
                    <div key={field.name}>
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="block text-xs font-bold text-earth-700 uppercase tracking-wide">
                          {field.label} {field.required && '*'}
                        </label>
                        {field.type === 'textarea' && data[field.name]?.trim() && (
                          <button 
                            onClick={() => handlePolish(field.name, data[field.name])}
                            className="text-[10px] flex items-center gap-1 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                          >
                            <Wand2 size={10} /> Polish
                          </button>
                        )}
                      </div>
                      
                      {field.type === 'select' ? (
                        <select 
                          value={data[field.name] || ''} 
                          onChange={(e) => setData({ ...data, [field.name]: e.target.value })}
                          className="w-full border border-earth-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 focus:border-polli-500 shadow-sm"
                        >
                          <option value="">Select an option</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea 
                          value={data[field.name] || ''} 
                          onChange={(e) => setData({ ...data, [field.name]: e.target.value })}
                          rows={3}
                          className="w-full border border-earth-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 focus:border-polli-500 shadow-sm resize-none"
                          placeholder={field.placeholder || ''} 
                        />
                      ) : (
                        <input 
                          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                          value={data[field.name] || ''} 
                          onChange={(e) => setData({ ...data, [field.name]: e.target.value })}
                          className="w-full border border-earth-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-polli-500 focus:border-polli-500 shadow-sm"
                          placeholder={field.placeholder || ''} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="text-center mb-6">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-3 shadow-sm border border-emerald-200">
                  <FileText size={32} />
                </div>
                <h3 className="font-bold text-2xl text-earth-900">Review & Submit</h3>
                <p className="text-sm text-earth-500 mt-1">Please verify your information before applying.</p>
              </div>

              {/* Processing Info */}
              <div className="bg-white rounded-2xl p-5 border border-earth-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-earth-100">
                  <span className="text-xs text-earth-500 font-bold uppercase">Service</span>
                  <span className="text-sm font-bold text-earth-900">{serviceName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-earth-100">
                  <span className="text-xs text-earth-500 font-bold uppercase">Applicant</span>
                  <span className="text-sm font-bold text-earth-900">{data.applicant_name || 'Not specified'}</span>
                </div>
                
                {/* Dynamically render the answers */}
                {dynamicFields.slice(0, 3).map(field => (
                  <div key={field.name} className="flex justify-between items-start pb-3 border-b border-earth-100 gap-4">
                    <span className="text-xs text-earth-500 font-bold uppercase shrink-0">{field.label}</span>
                    <span className="text-sm font-bold text-earth-900 text-right break-words line-clamp-2">
                      {data[field.name] || '-'}
                    </span>
                  </div>
                ))}
                
                {dynamicFields.length > 3 && (
                  <div className="text-center text-xs text-earth-400 font-bold">
                    + {dynamicFields.length - 3} more details provided
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-4 px-6 py-5 border-t border-earth-100 bg-white shrink-0">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)} 
              className="px-5 py-3 rounded-xl border border-earth-200 text-earth-700 font-bold hover:bg-earth-50 transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}
          {step < 3 ? (
            <button 
              onClick={handleNext} 
              disabled={step === 2 && isGeneratingSchema}
              className={`flex-1 px-5 py-3 rounded-xl bg-polli-600 text-white font-bold hover:bg-polli-700 transition-all duration-300 shadow-lg shadow-polli-600/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 ${(step === 2 && isGeneratingSchema) ? 'opacity-50 cursor-not-allowed hover:-translate-y-0 hover:bg-polli-600 shadow-none' : ''}`}
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className={`flex-1 px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-600/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Submitting...' : 'Submit Application'} {!loading && <CheckCircle size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
