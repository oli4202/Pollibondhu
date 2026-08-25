import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Clock, MapPin, CheckCircle, AlertCircle, Phone, Calendar, User, FileText, Sparkles } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/feedback/ToastProvider';
import api from '@/utils/api';

// Healthcare services data
const healthcareServices: Record<string, any> = {
  'vaccination': {
    title: 'Vaccination Services',
    titleBn: 'টিকাদান সেবা',
    emoji: '💉',
    description: 'Schedule and track vaccinations for children and adults. Available vaccines include Polio, Measles, Rubella, Tetanus, Hepatitis, and COVID-19.',
    processingTime: 'Same day',
    fee: 'Free',
    office: 'Union Health Center / Upazila Health Complex',
    steps: [
      { title: 'Book Appointment', desc: 'Select your preferred date and health center.' },
      { title: 'Visit Center', desc: 'Arrive at the health center with your health card and ID.' },
      { title: 'Vaccination', desc: 'Receive the vaccine from a qualified healthcare worker.' },
      { title: 'Follow-up', desc: 'Get your next vaccination schedule and health card update.' },
    ],
  },
  'health-card': {
    title: 'Health Card',
    titleBn: 'স্বাস্থ্য কার্ড',
    emoji: '🏥',
    description: 'Get a government health card for free or subsidized treatment at public hospitals and health complexes across Bangladesh.',
    processingTime: '3-5 working days',
    fee: 'Free',
    office: 'Upazila Health Complex',
    steps: [
      { title: 'Fill Application', desc: 'Complete the health card application form.' },
      { title: 'Submit Documents', desc: 'Provide NID, photos, and address proof.' },
      { title: 'Biometrics', desc: 'Photo and fingerprint capture at center.' },
      { title: 'Receive Card', desc: 'Collect your health card in 3-5 days.' },
    ],
  },
  'blood-donation': {
    title: 'Blood Donation',
    titleBn: 'রক্তদান',
    emoji: '🩸',
    description: 'Register as a blood donor or request blood from the community blood bank. Find compatible donors near you.',
    processingTime: 'Immediate matching',
    fee: 'Free',
    office: 'Blood Bank / Health Center',
    steps: [
      { title: 'Register', desc: 'Sign up as a blood donor with your details.' },
      { title: 'Get Matched', desc: 'When someone needs your blood type, you will be contacted.' },
      { title: 'Donate', desc: 'Visit the nearest blood bank for safe donation.' },
    ],
  },
  'ambulance': {
    title: 'Ambulance Service',
    titleBn: 'অ্যাম্বুলেন্স সেবা',
    emoji: '🚑',
    description: 'Request emergency ambulance service. Available 24/7 for medical emergencies.',
    processingTime: 'Immediate',
    fee: 'Emergency: Free / Non-emergency: ৳500-1000',
    office: 'Emergency Services',
    steps: [
      { title: 'Call Emergency', desc: 'Dial 999 or the local emergency number.' },
      { title: 'Provide Details', desc: 'Share patient location and condition.' },
      { title: 'Wait for Ambulance', desc: 'Stay on the line and follow instructions.' },
    ],
  },
  'maternal': {
    title: 'Maternal Health',
    titleBn: 'মাতৃ স্বাস্থ্য',
    emoji: '🤰',
    description: 'Prenatal and postnatal care services. Regular checkups, nutrition counseling, and safe delivery support.',
    processingTime: 'Ongoing care',
    fee: 'Free at government facilities',
    office: 'Union Health Center / Upazila Health Complex',
    steps: [
      { title: 'Register', desc: 'Register for maternal health services at your local health center.' },
      { title: 'Regular Checkups', desc: 'Monthly checkups with healthcare provider.' },
      { title: 'Nutrition Support', desc: 'Receive nutrition counseling and supplements.' },
      { title: 'Safe Delivery', desc: 'Access to skilled birth attendants and emergency care.' },
    ],
  },
  'mental-health': {
    title: 'Mental Health Support',
    titleBn: 'মানসিক স্বাস্থ্য',
    emoji: '🧠',
    description: 'Confidential mental health counseling and support services. Available for stress, anxiety, depression, and other concerns.',
    processingTime: 'By appointment',
    fee: 'Free at government facilities',
    office: 'District Hospital / Online',
    steps: [
      { title: 'Book Session', desc: 'Schedule a confidential counseling session.' },
      { title: 'Assessment', desc: 'Initial assessment by a qualified counselor.' },
      { title: 'Treatment Plan', desc: 'Personalized care plan and follow-up schedule.' },
    ],
  },
};

// Form field definitions per service
const formFields: Record<string, { name: string; label: string; type: string; required: boolean; placeholder: string; options?: string[] }[]> = {
  vaccination: [
    { name: 'patient_name', label: 'Patient Name', type: 'text', required: true, placeholder: 'Full name as on health card' },
    { name: 'age', label: 'Age', type: 'number', required: true, placeholder: 'Age in years' },
    { name: 'gender', label: 'Gender', type: 'select', required: true, placeholder: '', options: ['Male', 'Female', 'Other'] },
    { name: 'vaccine_type', label: 'Vaccine Type', type: 'select', required: true, placeholder: '', options: ['Polio', 'Measles', 'Rubella', 'Tetanus', 'Hepatitis B', 'COVID-19', 'Other'] },
    { name: 'health_center', label: 'Preferred Health Center', type: 'select', required: true, placeholder: '', options: ['Union Health Center', 'Upazila Health Complex', 'District Hospital', 'City Corporation Health Center'] },
    { name: 'preferred_date', label: 'Preferred Date', type: 'date', required: true, placeholder: '' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    { name: 'blood_group', label: 'Blood Group', type: 'select', required: false, placeholder: '', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { name: 'allergies', label: 'Known Allergies', type: 'text', required: false, placeholder: 'Any known allergies (optional)' },
    { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Any special requirements or medical conditions' },
  ],
  'health-card': [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'As on NID' },
    { name: 'nid_number', label: 'NID Number', type: 'text', required: true, placeholder: '17-digit NID number' },
    { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true, placeholder: '' },
    { name: 'gender', label: 'Gender', type: 'select', required: true, placeholder: '', options: ['Male', 'Female', 'Other'] },
    { name: 'blood_group', label: 'Blood Group', type: 'select', required: false, placeholder: '', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { name: 'district', label: 'District', type: 'select', required: true, placeholder: '', options: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'] },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    { name: 'emergency_contact', label: 'Emergency Contact', type: 'tel', required: false, placeholder: 'Emergency contact number' },
  ],
  'blood-donation': [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Full name' },
    { name: 'blood_group', label: 'Blood Group', type: 'select', required: true, placeholder: '', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { name: 'age', label: 'Age', type: 'number', required: true, placeholder: '18-65 years' },
    { name: 'weight', label: 'Weight (kg)', type: 'number', required: true, placeholder: 'Minimum 45kg' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    { name: 'last_donation', label: 'Last Donation Date', type: 'date', required: false, placeholder: '' },
    { name: 'medical_conditions', label: 'Medical Conditions', type: 'text', required: false, placeholder: 'Any ongoing conditions' },
    { name: 'is_available', label: 'Availability', type: 'select', required: true, placeholder: '', options: ['Available now', 'Available on weekends', 'Available on holidays', 'Not available currently'] },
  ],
  ambulance: [
    { name: 'patient_name', label: 'Patient Name', type: 'text', required: true, placeholder: 'Patient name' },
    { name: 'emergency_type', label: 'Emergency Type', type: 'select', required: true, placeholder: '', options: ['Heart Attack', 'Road Accident', 'Stroke', 'Breathing Difficulty', 'Severe Bleeding', 'Other'] },
    { name: 'location', label: 'Current Location', type: 'text', required: true, placeholder: 'Address or landmark' },
    { name: 'district', label: 'District', type: 'select', required: true, placeholder: '', options: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'] },
    { name: 'phone', label: 'Contact Phone', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    { name: 'patient_condition', label: 'Patient Condition', type: 'textarea', required: false, placeholder: 'Describe current condition' },
  ],
  maternal: [
    { name: 'mother_name', label: "Mother's Name", type: 'text', required: true, placeholder: 'Full name' },
    { name: 'husband_name', label: "Husband's Name", type: 'text', required: false, placeholder: 'Husband name' },
    { name: 'age', label: 'Age', type: 'number', required: true, placeholder: 'Age in years' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    { name: 'last_period', label: 'Last Menstrual Period', type: 'date', required: true, placeholder: '' },
    { name: 'pregnancy_number', label: 'Number of Pregnancies', type: 'select', required: true, placeholder: '', options: ['1st', '2nd', '3rd', '4th', '5th or more'] },
    { name: 'previous_complications', label: 'Previous Complications', type: 'text', required: false, placeholder: 'Any complications in previous pregnancies' },
    { name: 'blood_group', label: 'Blood Group', type: 'select', required: false, placeholder: '', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { name: 'health_center', label: 'Preferred Health Center', type: 'select', required: true, placeholder: '', options: ['Union Health Center', 'Upazila Health Complex', 'District Hospital'] },
    { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Any concerns or special needs' },
  ],
  'mental-health': [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name (confidential)' },
    { name: 'age', label: 'Age', type: 'number', required: true, placeholder: 'Age' },
    { name: 'gender', label: 'Gender', type: 'select', required: true, placeholder: '', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    { name: 'concern_type', label: 'Primary Concern', type: 'select', required: true, placeholder: '', options: ['Stress', 'Anxiety', 'Depression', 'Sleep Issues', 'Relationship Issues', 'Grief', 'Trauma', 'Other'] },
    { name: 'duration', label: 'How Long?', type: 'select', required: true, placeholder: '', options: ['Less than a week', '1-4 weeks', '1-3 months', '3-6 months', 'More than 6 months'] },
    { name: 'preferred_mode', label: 'Preferred Session Mode', type: 'select', required: true, placeholder: '', options: ['In-person at health center', 'Phone call', 'Video call', 'No preference'] },
    { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Anything you would like to share (all confidential)' },
  ],
};

const aiTips: Record<string, string[]> = {
  vaccination: [
    'Bring your health card and NID to the vaccination center',
    'Inform the healthcare worker about any allergies or current medications',
    'Children should be accompanied by a parent or guardian',
    'Keep the vaccination record safe for future reference',
  ],
  'health-card': [
    'Ensure your NID is valid and up-to-date',
    'Bring recent passport-size photographs (2)',
    'Health card gives you access to free treatment at government facilities',
    'Keep the card in a safe place and carry it when visiting health centers',
  ],
  'blood-donation': [
    'You must be between 18-65 years old and weigh at least 45kg',
    'Eat a healthy meal and drink plenty of water before donating',
    'Avoid heavy exercise for 24 hours after donation',
    'You can donate blood every 3 months (men) or 4 months (women)',
  ],
  ambulance: [
    'Dial 999 for emergency ambulance service',
    'Stay calm and provide clear location details',
    'Keep the patient comfortable while waiting',
    'Have the patient\'s ID and medical history ready',
  ],
  maternal: [
    'Register for maternal care as early as possible in pregnancy',
    'Attend all scheduled checkups for healthy mother and baby',
    'Take prescribed supplements (folic acid, iron, calcium)',
    'Eat nutritious food and stay hydrated',
  ],
  'mental-health': [
    'All sessions are completely confidential',
    'It is okay to seek help — mental health is as important as physical health',
    'Be honest with your counselor for the best support',
    'You can bring a trusted person for support if needed',
  ],
};

export default function HealthcareDetail() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const data = healthcareServices[service || ''] || null;
  const fields = formFields[service || ''] || [];
  const tips = aiTips[service || ''] || [];

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-lg text-earth-500">Service not found.</p>
        <Link to="/healthcare" className="mt-4 inline-block text-polli-600 underline">Back to Healthcare</Link>
      </div>
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
      if (f.required && !formData[f.name]?.trim()) errs[f.name] = `${f.label} is required`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/applications', {
        service_id: null,
        applicant_name: formData.patient_name || formData.full_name || formData.mother_name || '',
        applicant_data: JSON.stringify({ ...formData, module: `HEALTH_${service?.toUpperCase()}` }),
        notes: `Healthcare service request: ${data.title}`,
      });
      setSubmitted(true);
    } catch {
      addToast('Please log in to submit your application', 'error');
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Healthcare', href: '/healthcare' }, { label: data.title }]} className="mb-6" />

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-earth-100 hover:bg-earth-200 transition"><ArrowLeft size={20} /></button>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{data.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold">{data.title}</h1>
              <p className="text-sm text-earth-500">{data.titleBn}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-6"><CardContent><p className="text-sm text-earth-700 leading-relaxed">{data.description}</p></CardContent></Card>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl bg-green-50 p-4"><Clock size={18} className="text-green-600" /><p className="mt-2 text-xs font-bold text-earth-500">Processing</p><p className="text-sm font-bold">{data.processingTime}</p></div>
        <div className="rounded-xl bg-blue-50 p-4"><FileText size={18} className="text-blue-600" /><p className="mt-2 text-xs font-bold text-earth-500">Fee</p><p className="text-sm font-bold">{data.fee}</p></div>
        <div className="rounded-xl bg-purple-50 p-4"><MapPin size={18} className="text-purple-600" /><p className="mt-2 text-xs font-bold text-earth-500">Location</p><p className="text-sm font-bold">{data.office}</p></div>
      </div>

      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600" /> How It Works</h3>
          <div className="space-y-3">
            {data.steps.map((step: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-polli-100 text-polli-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                <div><h4 className="text-sm font-bold">{step.title}</h4><p className="text-xs text-earth-500 mt-0.5">{step.desc}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Heart size={18} className="text-red-500" /> {data.title} Form</h3>

          {!user && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              Please <Link to="/login" className="underline font-medium">log in</Link> to submit your application.
            </div>
          )}

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">✅</span></div>
              <h2 className="text-xl font-semibold mb-2">Application Submitted!</h2>
              <p className="text-earth-600 mb-4">You will be notified when your appointment is confirmed.</p>
              <Link to="/dashboard" className="px-4 py-2 bg-polli-600 text-white text-sm font-medium rounded-lg hover:bg-polli-700">Go to Dashboard</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' && field.options ? (
                    <select value={formData[field.name] || ''} onChange={e => { setFormData({ ...formData, [field.name]: e.target.value }); if (errors[field.name]) setErrors({ ...errors, [field.name]: '' }); }}
                      required={field.required}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${errors[field.name] ? 'border-red-300' : 'border-earth-200 focus:border-polli-500 focus:ring-2 focus:ring-polli-500'}`}>
                      <option value="">Select {field.label}</option>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea value={formData[field.name] || ''} onChange={e => { setFormData({ ...formData, [field.name]: e.target.value }); if (errors[field.name]) setErrors({ ...errors, [field.name]: '' }); }}
                      placeholder={field.placeholder} rows={3} required={field.required}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${errors[field.name] ? 'border-red-300' : 'border-earth-200 focus:border-polli-500 focus:ring-2 focus:ring-polli-500'}`} />
                  ) : (
                    <input type={field.type} value={formData[field.name] || ''} onChange={e => { setFormData({ ...formData, [field.name]: e.target.value }); if (errors[field.name]) setErrors({ ...errors, [field.name]: '' }); }}
                      placeholder={field.placeholder} required={field.required}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${errors[field.name] ? 'border-red-300' : 'border-earth-200 focus:border-polli-500 focus:ring-2 focus:ring-polli-500'}`} />
                  )}
                  {errors[field.name] && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors[field.name]}</p>}
                </div>
              ))}

              {tips.length > 0 && (
                <div className="p-3 bg-polli-50 rounded-xl border border-polli-100">
                  <p className="text-xs font-medium text-polli-700 mb-2 flex items-center gap-1"><Sparkles size={12} /> Tips for {data.title}:</p>
                  <ul className="space-y-1">{tips.map((t, i) => <li key={i} className="text-xs text-earth-600 flex items-start gap-2"><CheckCircle size={12} className="text-polli-500 mt-0.5 shrink-0" /> {t}</li>)}</ul>
                </div>
              )}

              <Button type="submit" loading={loading} disabled={!user} className="w-full">
                Submit Application
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
