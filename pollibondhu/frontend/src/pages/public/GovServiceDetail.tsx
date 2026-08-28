import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, ChevronRight, Shield, MapPin, Phone, Download, Sparkles } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

interface GovServiceData {
  title: string;
  titleBn: string;
  emoji: string;
  description: string;
  processingTime: string;
  fee: string;
  office: string;
  steps: { title: string; desc: string }[];
  documents: string[];
  eligibility: string[];
  contactInfo: string;
  formFields: { name: string; label: string; type: string; required: boolean; placeholder: string }[];
}

const govServices: Record<string, GovServiceData> = {
  'birth-registration': {
    title: 'Birth Registration',
    titleBn: 'জন্ম নিবন্ধন',
    emoji: '👶',
    description: 'Register a newborn child and obtain the official birth certificate from the Government of Bangladesh. This is mandatory for all children and is required for school admission, passport, and NID application.',
    processingTime: '5–7 working days',
    fee: 'Free',
    office: 'Union Parishad / City Corporation',
    steps: [
      { title: 'Gather Required Documents', desc: 'Collect hospital records, parent NID copies, and witnesses statements.' },
      { title: 'Visit Registration Office', desc: 'Go to your Union Parishad or City Corporation office with all documents.' },
      { title: 'Fill Application Form', desc: 'Complete the birth registration form with accurate information.' },
      { title: 'Verification', desc: 'The registrar verifies documents and may contact witnesses.' },
      { title: 'Receive Certificate', desc: 'Collect your birth certificate within 5-7 working days.' },
    ],
    documents: [
      'Hospital birth record / discharge summary',
      "Father's NID copy (জাতীয় পরিচয়পত্র)",
      "Mother's NID copy",
      'Witness statements (2 persons)',
      'Marriage certificate of parents (if available)',
      'Application form (provided at office)',
    ],
    eligibility: [
      'All children born in Bangladesh',
      'No age limit for registration',
      'Late registration possible (with late fee for adults)',
    ],
    contactInfo: 'Call 1000 for assistance or visit your nearest Union Parishad office.',
    formFields: [
      { name: 'childName', label: "Child's Name (বাংলা)", type: 'text', required: true, placeholder: 'শিশুর নাম' },
      { name: 'childNameEn', label: "Child's Name (English)", type: 'text', required: true, placeholder: "Child's full name" },
      { name: 'birthDate', label: 'Date of Birth (জন্ম তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'birthPlace', label: 'Place of Birth (জন্মস্থান)', type: 'text', required: true, placeholder: 'Hospital name or home address' },
      { name: 'fatherName', label: "Father's Name (পিতার নাম)", type: 'text', required: true, placeholder: "Father's full name" },
      { name: 'motherName', label: "Mother's Name (মাতার নাম)", type: 'text', required: true, placeholder: "Mother's full name" },
      { name: 'district', label: 'District (জেলা)', type: 'text', required: true, placeholder: 'e.g. Gazipur' },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'e.g. Tongi' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    ],
  },
  'trade-license': {
    title: 'Trade Licence',
    titleBn: 'ব্যবসায়িক লাইসেন্স',
    emoji: '🏬',
    description: 'Obtain or renew a trade licence to legally operate your business in Bangladesh. This is required for all commercial activities including shops, factories, and service businesses.',
    processingTime: '7–14 working days',
    fee: '৳ 500 – ৳ 5,000 (varies by business type)',
    office: 'Upazila / City Corporation Office',
    steps: [
      { title: 'Application Submission', desc: 'Submit application with business details and required documents.' },
      { title: 'Verification Visit', desc: 'An officer may visit your business location for verification.' },
      { title: 'Fee Payment', desc: 'Pay the applicable licence fee at the government treasury.' },
      { title: 'Approval', desc: 'The licence is approved by the Upazila Nirbahi Officer (UNO).' },
      { title: 'Collect Licence', desc: 'Pick up your trade licence from the office.' },
    ],
    documents: [
      'Completed application form',
      'Trade licence renewal form (for renewals)',
      'National ID (NID) of applicant',
      'Tax clearance certificate (previous year)',
      'Rent receipt / ownership proof of business premises',
      'Police verification report',
      'Recent passport-size photographs (2)',
    ],
    eligibility: [
      'Any Bangladeshi citizen aged 18+',
      'Must have a valid business premises',
      'Must comply with relevant tax regulations',
    ],
    contactInfo: 'Visit your nearest Upazila Nirbahi Officer (UNO) office or City Corporation office.',
    formFields: [
      { name: 'businessName', label: 'Business Name (ব্যবসার নাম)', type: 'text', required: true, placeholder: 'Shop or business name' },
      { name: 'businessType', label: 'Business Type (ধরন)', type: 'text', required: true, placeholder: 'e.g. Retail, Manufacturing, Service' },
      { name: 'ownerName', label: "Owner's Name (মালিকের নাম)", type: 'text', required: true, placeholder: 'Full name as on NID' },
      { name: 'address', label: 'Business Address (ঠিকানা)', type: 'text', required: true, placeholder: 'Full address' },
      { name: 'district', label: 'District (জেলা)', type: 'text', required: true, placeholder: 'e.g. Dhaka' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
      { name: 'estimatedAnnual', label: 'Estimated Annual Revenue (আনুমানিক আয়)', type: 'text', required: false, placeholder: '৳ amount' },
    ],
  },
  'health-card': {
    title: 'Health Card',
    titleBn: 'স্বাস্থ্য কার্ড',
    emoji: '🏥',
    description: 'Get a government health card for free or subsidized treatment at public hospitals and health complexes across Bangladesh. Available for all citizens.',
    processingTime: '3–5 working days',
    fee: 'Free',
    office: 'Upazila Health Complex / Union Health Center',
    steps: [
      { title: 'Collect Form', desc: 'Get the health card application form from your nearest health facility.' },
      { title: 'Fill & Submit', desc: 'Complete the form with personal details and attach required documents.' },
      { title: 'Photo & Biometrics', desc: 'Provide a recent photo and biometric data at the center.' },
      { title: 'Card Issuance', desc: 'Receive your health card within 3-5 working days.' },
    ],
    documents: [
      'National ID (NID) or birth certificate',
      'Recent passport-size photograph (2)',
      'Proof of address (utility bill / tax receipt)',
      'Income certificate (if applicable for BPL card)',
    ],
    eligibility: [
      'All Bangladeshi citizens',
      'Priority for BPL (Below Poverty Line) families',
      'Senior citizens and disabled persons get priority',
    ],
    contactInfo: 'Call 16263 (Health Helpline) or visit your nearest Upazila Health Complex.',
    formFields: [
      { name: 'fullName', label: 'Full Name (পুরো নাম)', type: 'text', required: true, placeholder: 'As on NID' },
      { name: 'nidNumber', label: 'NID Number (পরিচয়পত্র নং)', type: 'text', required: true, placeholder: '17-digit NID' },
      { name: 'dateOfBirth', label: 'Date of Birth (জন্ম তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'gender', label: 'Gender (লিঙ্গ)', type: 'text', required: true, placeholder: 'Male / Female / Other' },
      { name: 'bloodGroup', label: 'Blood Group (রক্তের গ্রুপ)', type: 'text', required: false, placeholder: 'e.g. A+, B+, O+' },
      { name: 'district', label: 'District (জেলা)', type: 'text', required: true, placeholder: 'e.g. Gazipur' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    ],
  },
  'school-admission': {
    title: 'School Admission',
    titleBn: 'বিদ্যালয়ে ভর্তি',
    emoji: '🏫',
    description: 'Apply for school admission for your child at government primary and secondary schools. Includes admission form, document checklist, and status tracking.',
    processingTime: '7–14 working days',
    fee: '৳ 100 (admission form)',
    office: 'Desired School Office',
    steps: [
      { title: 'Choose School', desc: 'Research and select the school based on location, medium, and curriculum.' },
      { title: 'Collect Admission Form', desc: 'Obtain the admission form from the school office during admission period.' },
      { title: 'Submit Documents', desc: 'Submit completed form with required documents and admission fee.' },
      { title: 'Entrance Test', desc: 'Student appears for the entrance exam (if applicable).' },
      { title: 'Admission', desc: 'Selected students complete admission with fee payment.' },
    ],
    documents: [
      "Student's birth certificate or NID",
      'Previous school transfer certificate (if applicable)',
      'Report card / mark sheet of previous class',
      "Parent's NID copy",
      'Passport-size photographs (2) of student',
      'Admission fee (cash or bank draft)',
    ],
    eligibility: [
      'Children aged 6+ for Class 1 (Primary)',
      'Children who passed previous class (for higher classes)',
      'Subject to school capacity and entrance test results',
    ],
    contactInfo: 'Contact the desired school office during admission period or call the Ministry of Education helpline.',
    formFields: [
      { name: 'studentName', label: "Student's Name (ছাত্র/ছাত্রীর নাম)", type: 'text', required: true, placeholder: 'Full name' },
      { name: 'studentNameBn', label: "Student's Name (বাংলা)", type: 'text', required: true, placeholder: 'বাংলায় নাম' },
      { name: 'dateOfBirth', label: 'Date of Birth (জন্ম তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'class', label: 'Class / Grade (শ্রেণি)', type: 'text', required: true, placeholder: 'e.g. Class 1, Class 6' },
      { name: 'schoolName', label: 'School Name (বিদ্যালয়ের নাম)', type: 'text', required: true, placeholder: 'Name of desired school' },
      { name: 'fatherName', label: "Father's Name (পিতার নাম)", type: 'text', required: true, placeholder: "Father's full name" },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX' },
    ],
  },
};

export default function GovServiceDetail() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = govServices[service || ''] || null;
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [trackingId, setTrackingId] = useState('');

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-lg text-earth-500">Service not found.</p>
        <Link to="/services" className="mt-4 inline-block text-polli-600 underline">Back to Services</Link>
      </div>
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    data.formFields.forEach(f => {
      if (f.required && !formData[f.name]?.trim()) {
        errs[f.name] = `${f.label.replace(/\(.*\)/, '').trim()} is required`;
      }
    });
    if (formData.phone && !/^01[3-9]\d{8}$/.test(formData.phone)) {
      errs.phone = 'Enter a valid Bangladeshi phone number (01XXXXXXXXX)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/applications', {
        service_id: null,
        category_id: null,
        applicant_name: formData.fullName || formData.ownerName || formData.studentName || '',
        applicant_data: JSON.stringify({ ...formData, module: `GOV_SERVICE_${service?.toUpperCase()}` }),
        notes: `Gov service request: ${data.title}`,
      });
      setTrackingId(res.data.data?.tracking_id || 'Pending');
      setSubmitted(true);
    } catch {
      alert('Failed to submit. Please log in and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: data.title },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-earth-100 hover:bg-earth-200 transition">
          <ArrowLeft size={20} className="text-earth-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{data.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold text-earth-900">{data.title}</h1>
              <p className="text-sm text-earth-500">{data.titleBn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardContent>
          <p className="text-sm text-earth-700 leading-relaxed">{data.description}</p>
        </CardContent>
      </Card>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl bg-blue-50 p-4">
          <Clock size={18} className="text-blue-600" />
          <p className="mt-2 text-xs font-bold text-earth-500">Processing Time</p>
          <p className="text-sm font-bold text-earth-900">{data.processingTime}</p>
        </div>
        <div className="rounded-xl bg-green-50 p-4">
          <FileText size={18} className="text-green-600" />
          <p className="mt-2 text-xs font-bold text-earth-500">Fee</p>
          <p className="text-sm font-bold text-earth-900">{data.fee}</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-4">
          <MapPin size={18} className="text-purple-600" />
          <p className="mt-2 text-xs font-bold text-earth-500">Office</p>
          <p className="text-sm font-bold text-earth-900">{data.office}</p>
        </div>
      </div>

      {/* How it Works */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" /> How It Works
          </h3>
          <div className="space-y-3">
            {data.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-polli-100 text-polli-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-earth-800">{step.title}</h4>
                  <p className="text-xs text-earth-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Documents */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <FileText size={16} className="text-blue-600" /> Required Documents
          </h3>
          <div className="space-y-2">
            {data.documents.map((doc, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <CheckCircle size={14} className="mt-1 shrink-0 text-emerald-500" />
                {doc}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Shield size={16} className="text-purple-600" /> Eligibility
          </h3>
          <div className="space-y-2">
            {data.eligibility.map((rule, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <ChevronRight size={14} className="mt-1 shrink-0 text-purple-500" />
                {rule}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="mb-8">
        <CardContent>
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
            <Phone size={16} className="text-polli-600" /> Contact Information
          </h3>
          <p className="text-sm text-earth-600">{data.contactInfo}</p>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <FileText size={18} className="text-polli-600" /> Application Form
          </h3>

          {!user && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              Please <Link to="/login" className="underline font-medium">log in</Link> to submit your application.
            </div>
          )}

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-earth-800 mb-2">Application Submitted!</h2>
              {trackingId && (
                <p className="text-earth-600 mb-1">
                  Tracking ID: <span className="font-mono font-bold text-polli-700">{trackingId}</span>
                </p>
              )}
              <p className="text-earth-600 mb-4">You'll be notified when your application is processed.</p>
              <div className="flex justify-center gap-3">
                <Link to="/dashboard" className="px-4 py-2 bg-polli-600 text-white text-sm font-medium rounded-lg hover:bg-polli-700">
                  Go to Dashboard
                </Link>
                <Link to="/services" className="px-4 py-2 border border-earth-300 text-earth-700 text-sm font-medium rounded-lg hover:bg-earth-50">
                  Back to Services
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {data.formFields.map(field => {
                // Dropdown fields
                const dropdownOptions: Record<string, string[]> = {
                  gender: ['Male', 'Female', 'Other'],
                  bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                  district: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj', 'Bogura', "Cox's Bazar", 'Jessore', 'Dinajpur'],
                  upazila: ['Boalia', 'Motihar', 'Rajshahi Sadar', 'Puthia', 'Godagari', 'Tanore', 'Charghat'],
                  class: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'HSC 1st Year', 'HSC 2nd Year'],
                  businessType: ['Retail Shop', 'Wholesale', 'Manufacturing', 'Service', 'Restaurant', 'Pharmacy', 'Agriculture', 'Transport', 'IT Services', 'Other'],
                };
                const options = dropdownOptions[field.name];

                return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {options ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={e => {
                        setFormData({ ...formData, [field.name]: e.target.value });
                        if (errors[field.name]) setErrors({ ...errors, [field.name]: '' });
                      }}
                      required={field.required}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${
                        errors[field.name]
                          ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                          : 'border-earth-200 focus:border-polli-500 focus:ring-2 focus:ring-polli-500'
                      }`}
                    >
                      <option value="">Select {field.label.replace(/\(.*\)/, '').trim()}</option>
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={e => {
                        setFormData({ ...formData, [field.name]: e.target.value });
                        if (errors[field.name]) setErrors({ ...errors, [field.name]: '' });
                      }}
                      placeholder={field.placeholder}
                      required={field.required}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${
                        errors[field.name]
                          ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                          : 'border-earth-200 focus:border-polli-500 focus:ring-2 focus:ring-polli-500'
                      }`}
                    />
                  )}
                  {errors[field.name] && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors[field.name]}
                    </p>
                  )}
                </div>
                );
              })}

              <button
                type="submit"
                disabled={loading || !user}
                className="w-full px-6 py-3 bg-polli-600 text-white font-bold rounded-xl hover:bg-polli-700 disabled:opacity-50 transition"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
