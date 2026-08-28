import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, ChevronRight, Shield, MapPin, Phone, LogIn, Sparkles } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

// Title-to-slug mapping — we look up the real service_id from the backend at runtime
const SERVICE_TITLES: Record<string, string> = {
  'nid-application':       'NID Application',
  'birth-registration':    'Birth Registration',
  'nid-correction':        'NID Correction',
  'nid-duplicate':         'NID Duplicate',
  'death-certificate':     'Death Certificate',
  'marriage-registration': 'Marriage Registration',
  'trade-license':         'Trade License',
  'land-khatian':          'Land Record / Khatian',
  'income-certificate':    'Income Certificate',
  'character-certificate': 'Character Certificate',
  'health-card':           'Health Card',
  'mobile-health-camp':    'Mobile Health Camp',
  'seed-supply':           'Seed Supply',
  'power-tiller-rental':   'Power Tiller Rental',
  'school-admission':      'School Admission',
};

type FieldType = 'text' | 'tel' | 'date' | 'number' | 'select' | 'textarea';

interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string;
  options?: string[];
  validate?: (val: string) => string | undefined;
}

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
  formFields: FormField[];
}

const DISTRICTS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur',
  'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj', 'Bogura', "Cox's Bazar", 'Jessore', 'Dinajpur',
  'Faridpur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narsingdi',
  'Rajbari', 'Shariatpur', 'Tangail', 'Habiganj', 'Moulvibazar', 'Sunamganj', 'Jhalokathi',
  'Patuakhali', 'Pirojpur', 'Bagerhat', 'Chuadanga', 'Jashore', 'Kushtia', 'Magura', 'Meherpur',
  'Narail', 'Satkhira', 'Joypurhat', 'Naogaon', 'Natore', 'Chapainawabganj', 'Pabna', 'Sirajganj',
  'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon',
  'Jamalpur', 'Netrokona', 'Sherpur'];

const phoneValidate = (v: string) =>
  v && !/^01[3-9]\d{8}$/.test(v) ? 'Enter valid Bangladeshi phone (01XXXXXXXXX)' : undefined;

const nidValidate = (v: string) =>
  v && !/^\d{10}$|^\d{13}$|^\d{17}$/.test(v) ? 'NID must be 10, 13, or 17 digits' : undefined;

const govServices: Record<string, GovServiceData> = {
  'nid-application': {
    title: 'NID Application', titleBn: 'জাতীয় পরিচয়পত্র আবেদন', emoji: '🪪',
    description: 'Apply for a new National Identity Card (NID). This is mandatory for all Bangladeshi citizens aged 18+ and is required for voting, banking, passport, and all government services.',
    processingTime: '5–7 working days', fee: 'Free', office: 'Upazila Election Office',
    steps: [
      { title: 'Fill Application Form', desc: 'Complete the NID application with accurate personal details.' },
      { title: 'Submit Documents', desc: 'Submit birth certificate, parent NID copies, and photographs.' },
      { title: 'Biometric Registration', desc: 'Fingerprints and photo will be taken at the office.' },
      { title: 'Verification', desc: 'The election office verifies submitted information.' },
      { title: 'Card Issuance', desc: 'Collect NID card within 5-7 working days.' },
    ],
    documents: ["Birth certificate", "Parent's NID copies (both)", "2 passport-size photos", "Proof of address", "School certificate (if available)"],
    eligibility: ['Bangladeshi citizens aged 18+', 'Must have valid birth certificate', 'First-time applicants only (for new NID)'],
    contactInfo: 'Call 105 (NID Helpline) or visit your Upazila Election Office.',
    formFields: [
      { name: 'fullName', label: 'Full Name (পুরো নাম)', type: 'text', required: true, placeholder: 'As on birth certificate' },
      { name: 'fullNameBn', label: 'Name in Bangla (বাংলায় নাম)', type: 'text', required: true, placeholder: 'বাংলায় নাম লিখুন' },
      { name: 'dateOfBirth', label: 'Date of Birth (জন্ম তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'birthCertNo', label: 'Birth Certificate Number', type: 'text', required: true, placeholder: '17-digit birth reg number' },
      { name: 'fatherName', label: "Father's Name", type: 'text', required: true, placeholder: "Father's full name" },
      { name: 'motherName', label: "Mother's Name", type: 'text', required: true, placeholder: "Mother's full name" },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'Your Upazila' },
      { name: 'village', label: 'Village / Ward (গ্রাম / ওয়ার্ড)', type: 'text', required: true, placeholder: 'Village name' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'birth-registration': {
    title: 'Birth Registration', titleBn: 'জন্ম নিবন্ধন', emoji: '👶',
    description: 'Register a newborn child and obtain the official birth certificate from the Government of Bangladesh. Mandatory for school admission, passport, and NID application.',
    processingTime: '5–7 working days', fee: 'Free', office: 'Union Parishad / City Corporation',
    steps: [
      { title: 'Gather Documents', desc: 'Collect hospital records, parent NID copies, and witness statements.' },
      { title: 'Visit Registration Office', desc: 'Go to your Union Parishad or City Corporation.' },
      { title: 'Fill Application', desc: 'Complete the birth registration form with accurate information.' },
      { title: 'Verification', desc: 'The registrar verifies documents and may contact witnesses.' },
      { title: 'Receive Certificate', desc: 'Collect your birth certificate within 5-7 working days.' },
    ],
    documents: ["Hospital birth record / discharge summary", "Father's NID copy", "Mother's NID copy", "Witness statements (2 persons)", "Marriage certificate of parents", "Application form"],
    eligibility: ['All children born in Bangladesh', 'No age limit for registration', 'Late registration possible with late fee for adults'],
    contactInfo: 'Call 1000 for assistance or visit your nearest Union Parishad office.',
    formFields: [
      { name: 'childName', label: "Child's Name (বাংলা)", type: 'text', required: true, placeholder: 'শিশুর নাম' },
      { name: 'childNameEn', label: "Child's Name (English)", type: 'text', required: true, placeholder: "Child's full name" },
      { name: 'birthDate', label: 'Date of Birth (জন্ম তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'birthPlace', label: 'Place of Birth (জন্মস্থান)', type: 'text', required: true, placeholder: 'Hospital name or home address' },
      { name: 'fatherName', label: "Father's Name", type: 'text', required: true, placeholder: "Father's full name" },
      { name: 'fatherNid', label: "Father's NID Number", type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'motherName', label: "Mother's Name", type: 'text', required: true, placeholder: "Mother's full name" },
      { name: 'motherNid', label: "Mother's NID Number", type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'e.g. Tongi' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'nid-correction': {
    title: 'NID Correction', titleBn: 'জাতীয় পরিচয়পত্র সংশোধন', emoji: '✏️',
    description: 'Correct errors in your National ID card such as name spelling, date of birth, or address. Supporting proof documents are mandatory.',
    processingTime: '10–15 working days', fee: '৳ 50', office: 'Upazila Election Office',
    steps: [
      { title: 'Identify Error', desc: 'Determine what information needs to be corrected.' },
      { title: 'Gather Proof Documents', desc: 'Collect official documents supporting the correct information.' },
      { title: 'Submit Application', desc: 'Submit correction form with original NID and proof.' },
      { title: 'Verification', desc: 'Election office verifies the claim with supporting documents.' },
      { title: 'Corrected Card', desc: 'Receive the corrected NID card within 10-15 working days.' },
    ],
    documents: ["Original NID card", "Birth certificate showing correct info", "Supporting documents for correction", "Court affidavit (if name change)", "2 passport-size photos"],
    eligibility: ['Must have existing NID', 'Must have proof of correct information', 'Name changes require court affidavit'],
    contactInfo: 'Call 105 (NID Helpline) or visit your Upazila Election Office.',
    formFields: [
      { name: 'fullName', label: 'Your Full Name (পুরো নাম)', type: 'text', required: true, placeholder: 'Current name on NID' },
      { name: 'nidNumber', label: 'NID Number (পরিচয়পত্র নং)', type: 'text', required: true, placeholder: '10 or 17-digit NID number', validate: nidValidate },
      { name: 'dateOfBirth', label: 'Date of Birth on NID', type: 'date', required: true, placeholder: '' },
      { name: 'correctionType', label: 'What to Correct?', type: 'select', required: true, placeholder: '', options: ['Name / Spelling', 'Date of Birth', 'Father Name', 'Mother Name', 'Address', 'Blood Group', 'Other'] },
      { name: 'currentValue', label: 'Current Incorrect Value on NID', type: 'text', required: true, placeholder: 'What is currently shown (incorrect)' },
      { name: 'correctValue', label: 'Correct Value (সঠিক তথ্য)', type: 'text', required: true, placeholder: 'The correct information' },
      { name: 'reason', label: 'Reason for Correction', type: 'textarea', required: true, placeholder: 'Explain briefly why this correction is needed' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'nid-duplicate': {
    title: 'NID Duplicate', titleBn: 'পরিচয়পত্রের ডুপ্লিকেট', emoji: '📋',
    description: 'Apply for a duplicate NID card if your original is lost, stolen, or damaged. An FIR (First Information Report) from the police is required if the card was lost or stolen.',
    processingTime: '10–15 working days', fee: '৳ 100', office: 'Upazila Election Office',
    steps: [
      { title: 'File FIR (if lost/stolen)', desc: 'Visit your nearest police station and file an FIR. Keep the receipt.' },
      { title: 'Fill Duplicate Form', desc: 'Complete the NID duplicate application form.' },
      { title: 'Submit Documents', desc: 'Submit FIR copy, old NID copy if available, and photos.' },
      { title: 'Pay Fee', desc: 'Pay ৳ 100 fee at government treasury or online.' },
      { title: 'Receive Duplicate', desc: 'Collect duplicate NID within 10-15 working days.' },
    ],
    documents: ["FIR copy from police (if lost/stolen)", "Old NID copy (if damaged)", "2 passport-size photos", "Proof of address (utility bill)"],
    eligibility: ['Must have existing NID number', 'FIR required for lost or stolen cards', 'Damaged cards: bring the damaged card'],
    contactInfo: 'Call 105 (NID Helpline) or visit your Upazila Election Office.',
    formFields: [
      { name: 'fullName', label: 'Full Name (পুরো নাম)', type: 'text', required: true, placeholder: 'Name as on original NID' },
      { name: 'nidNumber', label: 'NID Number (পরিচয়পত্র নং)', type: 'text', required: true, placeholder: '10 or 17-digit NID number', validate: nidValidate },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, placeholder: '' },
      { name: 'reason', label: 'Reason for Duplicate', type: 'select', required: true, placeholder: '', options: ['Lost', 'Stolen', 'Damaged', 'Destroyed in natural disaster'] },
      { name: 'firNumber', label: 'FIR Number (if lost/stolen)', type: 'text', required: false, placeholder: 'Police station FIR number' },
      { name: 'policeStation', label: 'Police Station Name', type: 'text', required: false, placeholder: 'Where FIR was filed' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'death-certificate': {
    title: 'Death Certificate', titleBn: 'মৃত্যু সনদ', emoji: '📄',
    description: 'Register a death and obtain an official death certificate from the local government authority. Required for inheritance, property transfer, and pension claims.',
    processingTime: '3–5 working days', fee: 'Free', office: 'Union Parishad / City Corporation',
    steps: [
      { title: 'Collect Death Report', desc: 'Get the hospital death report or medical certificate of death.' },
      { title: 'Visit Registration Office', desc: 'Go to the Union Parishad or City Corporation.' },
      { title: 'Fill Application', desc: 'Complete the death registration form.' },
      { title: 'Verification', desc: 'Registrar verifies with hospital records and witnesses.' },
      { title: 'Receive Certificate', desc: 'Collect death certificate within 3-5 working days.' },
    ],
    documents: ["Hospital death report or medical certificate", "Deceased's NID copy", "Informant's NID copy", "2 witness statements", "2 passport-size photos of informant"],
    eligibility: ['Any family member can apply', 'Apply within 21 days for fastest processing', 'Late registration allowed with documentation'],
    contactInfo: 'Visit your nearest Union Parishad or City Corporation office.',
    formFields: [
      { name: 'deceasedName', label: "Deceased's Full Name", type: 'text', required: true, placeholder: 'Name of the deceased' },
      { name: 'deceasedNameBn', label: "Deceased's Name (বাংলা)", type: 'text', required: true, placeholder: 'বাংলায় নাম' },
      { name: 'dateOfDeath', label: 'Date of Death (মৃত্যুর তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'placeOfDeath', label: 'Place of Death (মৃত্যুস্থান)', type: 'text', required: true, placeholder: 'Hospital or home address' },
      { name: 'causeOfDeath', label: 'Cause of Death', type: 'text', required: true, placeholder: 'As stated in medical certificate' },
      { name: 'deceasedNid', label: "Deceased's NID Number", type: 'text', required: false, placeholder: 'If available', validate: nidValidate },
      { name: 'informantName', label: "Informant's Name (Applicant)", type: 'text', required: true, placeholder: 'Your full name' },
      { name: 'relation', label: 'Relation to Deceased', type: 'select', required: true, placeholder: '', options: ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'] },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
      { name: 'additionalInfo', label: 'Additional Information (অতিরিক্ত তথ্য)', type: 'textarea', required: false, placeholder: 'Any other relevant details' },
    ],
  },
  'marriage-registration': {
    title: 'Marriage Registration', titleBn: 'বিবাহ নিবন্ধন', emoji: '💍',
    description: 'Register a marriage and obtain an official marriage certificate. Both parties must be present with valid National ID cards and 2 witnesses.',
    processingTime: '3–7 working days', fee: '৳ 200–1000 (varies)', office: 'Union Parishad / Kazi Office',
    steps: [
      { title: 'Contact Kazi Office', desc: 'Both parties visit the local Kazi office or Union Parishad.' },
      { title: 'Submit Documents', desc: 'Provide NID copies of both parties and 2 witnesses.' },
      { title: 'Sign Registration', desc: 'Both parties and witnesses sign the marriage register.' },
      { title: 'Pay Fee', desc: 'Pay the applicable marriage registration fee.' },
      { title: 'Receive Certificate', desc: 'Collect official marriage certificate (Kabinnama).' },
    ],
    documents: ["NID copy of groom", "NID copy of bride", "NID copies of 2 witnesses", "Divorce certificate (if previously married)", "Death certificate of previous spouse (if widowed)", "2 passport-size photos each"],
    eligibility: ['Groom must be 21+, Bride must be 18+', 'Both parties must be unmarried or legally free to marry', 'Foreign nationals need embassy NOC'],
    contactInfo: 'Visit your nearest Kazi office or Union Parishad for registration.',
    formFields: [
      { name: 'groomName', label: "Groom's Full Name (বরের নাম)", type: 'text', required: true, placeholder: "Groom's full name as on NID" },
      { name: 'groomNid', label: "Groom's NID Number", type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'groomAge', label: "Groom's Age", type: 'number', required: true, placeholder: 'Must be 21+',
        validate: (v) => v && parseInt(v) < 21 ? 'Groom must be at least 21 years old' : undefined },
      { name: 'brideName', label: "Bride's Full Name (কনের নাম)", type: 'text', required: true, placeholder: "Bride's full name as on NID" },
      { name: 'brideNid', label: "Bride's NID Number", type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'brideAge', label: "Bride's Age", type: 'number', required: true, placeholder: 'Must be 18+',
        validate: (v) => v && parseInt(v) < 18 ? 'Bride must be at least 18 years old' : undefined },
      { name: 'marriageDate', label: 'Date of Marriage (বিবাহের তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'witness1', label: 'Witness 1 Name (সাক্ষী ১)', type: 'text', required: true, placeholder: 'First witness full name' },
      { name: 'witness2', label: 'Witness 2 Name (সাক্ষী ২)', type: 'text', required: true, placeholder: 'Second witness full name' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'trade-license': {
    title: 'Trade License', titleBn: 'ট্রেড লাইসেন্স', emoji: '🏬',
    description: 'Obtain or renew a trade license to legally operate your business. Required for all commercial activities including shops, factories, and service businesses.',
    processingTime: '7–14 working days', fee: '৳ 500–5,000 (varies)', office: 'Upazila / City Corporation Office',
    steps: [
      { title: 'Submit Application', desc: 'Submit application with business details and required documents.' },
      { title: 'Verification Visit', desc: 'An officer may visit your business location.' },
      { title: 'Pay Fee', desc: 'Pay the applicable fee at the government treasury.' },
      { title: 'Approval', desc: 'Approved by the Upazila Nirbahi Officer (UNO).' },
      { title: 'Collect License', desc: 'Pick up your trade license from the office.' },
    ],
    documents: ["Completed application form", "NID copy of owner", "Tax clearance certificate", "Rent/ownership proof of premises", "Police verification report", "2 passport-size photos"],
    eligibility: ['Any Bangladeshi citizen aged 18+', 'Must have a valid business premises', 'Must comply with tax regulations'],
    contactInfo: 'Visit your nearest Upazila Nirbahi Officer (UNO) or City Corporation office.',
    formFields: [
      { name: 'businessName', label: 'Business Name (ব্যবসার নাম)', type: 'text', required: true, placeholder: 'Shop or business name' },
      { name: 'businessType', label: 'Business Type (ধরন)', type: 'select', required: true, placeholder: '', options: ['Retail Shop', 'Wholesale', 'Manufacturing', 'Service', 'Restaurant', 'Pharmacy', 'Agriculture', 'Transport', 'IT Services', 'Other'] },
      { name: 'ownerName', label: "Owner's Name (মালিকের নাম)", type: 'text', required: true, placeholder: 'Full name as on NID' },
      { name: 'ownerNid', label: "Owner's NID Number", type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'address', label: 'Business Address (ঠিকানা)', type: 'text', required: true, placeholder: 'Full business address' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'estimatedRevenue', label: 'Estimated Annual Revenue', type: 'text', required: false, placeholder: '৳ amount (e.g. 500000)' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'land-khatian': {
    title: 'Land Record / Khatian', titleBn: 'ভূমি রেকর্ড / খতিয়ান', emoji: '📜',
    description: 'Access and verify land ownership records (RS/BS Khatian). Request corrections or certified copies of khatian records from the land registry office.',
    processingTime: '7–15 working days', fee: '৳ 100 per page', office: 'AC Land / Upazila Land Office',
    steps: [
      { title: 'Identify Record', desc: 'Know your Mouza name, JL number, and Khatian number.' },
      { title: 'Submit Request', desc: 'Apply at the Upazila land office with land details.' },
      { title: 'Verification', desc: 'Land office verifies ownership and records.' },
      { title: 'Pay Fee', desc: 'Pay the certified copy fee.' },
      { title: 'Receive Khatian', desc: 'Collect certified copy of your khatian.' },
    ],
    documents: ["NID copy of applicant", "Previous khatian copy (if available)", "Tax receipt (Dakhila)", "Inheritance documents (if applicable)", "Sales deed (if purchased)"],
    eligibility: ['Registered land owners', 'Legal heirs of landowners', 'Authorized representatives with power of attorney'],
    contactInfo: 'Visit your Upazila Land Office (AC Land) or call 16122.',
    formFields: [
      { name: 'applicantName', label: "Applicant's Name (আবেদনকারীর নাম)", type: 'text', required: true, placeholder: 'Full name as on NID' },
      { name: 'applicantNid', label: "Applicant's NID Number", type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'mouzaName', label: 'Mouza Name (মৌজার নাম)', type: 'text', required: true, placeholder: 'Name of the Mouza' },
      { name: 'jlNumber', label: 'JL Number (জে এল নং)', type: 'text', required: true, placeholder: 'JL number' },
      { name: 'khatianNumber', label: 'Khatian Number (খতিয়ান নং)', type: 'text', required: true, placeholder: 'Khatian / RS / BS number' },
      { name: 'khatianType', label: 'Khatian Type', type: 'select', required: true, placeholder: '', options: ['RS Khatian', 'SA Khatian', 'BS Khatian', 'City Khatian'] },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'Upazila name' },
      { name: 'purpose', label: 'Purpose of Request', type: 'select', required: true, placeholder: '', options: ['Certified Copy', 'Mutation / Name Transfer', 'Ownership Verification', 'Court Case', 'Bank Loan', 'Other'] },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'income-certificate': {
    title: 'Income Certificate', titleBn: 'আয়ের সনদপত্র', emoji: '💰',
    description: 'Obtain an official income certificate from your Union Parishad or local government authority. Required for school admissions, government jobs, and welfare programs.',
    processingTime: '3–5 working days', fee: '৳ 50', office: 'Union Parishad / City Corporation',
    steps: [
      { title: 'Fill Application', desc: 'Complete income certificate application form.' },
      { title: 'Declare Income', desc: 'Provide accurate information about all sources of income.' },
      { title: 'Verification', desc: 'Chairman or ward member verifies the income claim.' },
      { title: 'Pay Fee', desc: 'Pay the nominal certificate fee.' },
      { title: 'Receive Certificate', desc: 'Collect signed and sealed income certificate.' },
    ],
    documents: ["NID copy", "2 passport-size photos", "Tax receipt or salary slip (if applicable)", "Business license (if self-employed)"],
    eligibility: ['All Bangladeshi citizens', 'Must declare honest income information', 'Self-employed must provide business proof'],
    contactInfo: 'Visit your nearest Union Parishad office or Ward office.',
    formFields: [
      { name: 'fullName', label: 'Full Name (পুরো নাম)', type: 'text', required: true, placeholder: 'As on NID' },
      { name: 'nidNumber', label: 'NID Number (পরিচয়পত্র নং)', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, placeholder: '' },
      { name: 'occupation', label: 'Occupation (পেশা)', type: 'select', required: true, placeholder: '', options: ['Farmer', 'Day Laborer', 'Business', 'Service/Job', 'Fisherman', 'Artisan', 'Teacher', 'Driver', 'Unemployed', 'Other'] },
      { name: 'monthlyIncome', label: 'Monthly Income (মাসিক আয়) in ৳', type: 'number', required: true, placeholder: 'Enter amount in BDT',
        validate: (v) => v && (isNaN(Number(v)) || Number(v) < 0) ? 'Enter a valid income amount' : undefined },
      { name: 'annualIncome', label: 'Annual Income (বার্ষিক আয়) in ৳', type: 'number', required: true, placeholder: 'Total yearly income in BDT',
        validate: (v) => v && (isNaN(Number(v)) || Number(v) < 0) ? 'Enter a valid income amount' : undefined },
      { name: 'incomeSource', label: 'Source of Income (আয়ের উৎস)', type: 'text', required: true, placeholder: 'e.g. Agriculture, Business, Job' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'purpose', label: 'Purpose of Certificate', type: 'select', required: true, placeholder: '', options: ['School Admission', 'Govt. Job Application', 'Bank Loan', 'Welfare Scheme', 'Legal Purposes', 'Other'] },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
      { name: 'additionalInfo', label: 'Additional Information (অতিরিক্ত তথ্য)', type: 'textarea', required: false, placeholder: 'Any other relevant details' },
    ],
  },
  'character-certificate': {
    title: 'Character Certificate', titleBn: 'চারিত্রিক সনদপত্র', emoji: '🎖️',
    description: 'Get an official character certificate from your local Union Parishad or Ward Commissioner. Required for job applications, school admissions, and visa processing.',
    processingTime: '2–3 working days', fee: '৳ 20', office: 'Union Parishad / City Corporation Ward',
    steps: [
      { title: 'Visit UP Office', desc: 'Go to your Union Parishad or Ward Commissioner office.' },
      { title: 'Submit Application', desc: 'Fill the application and provide NID and photos.' },
      { title: 'Verification', desc: 'Chairman or commissioner verifies your character and residency.' },
      { title: 'Issuance', desc: 'Certificate issued within 2-3 working days.' },
    ],
    documents: ["NID copy", "2 passport-size photos", "Proof of residency (utility bill)", "Police clearance (for some purposes)"],
    eligibility: ['All permanent residents of the Union/Ward', 'Must be a law-abiding citizen', 'No criminal record required for standard certificate'],
    contactInfo: 'Visit your nearest Union Parishad Chairman or Ward Commissioner office.',
    formFields: [
      { name: 'fullName', label: 'Full Name (পুরো নাম)', type: 'text', required: true, placeholder: 'As on NID' },
      { name: 'nidNumber', label: 'NID Number (পরিচয়পত্র নং)', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, placeholder: '' },
      { name: 'fatherName', label: "Father's Name", type: 'text', required: true, placeholder: "Father's full name" },
      { name: 'permanentAddress', label: 'Permanent Address (স্থায়ী ঠিকানা)', type: 'text', required: true, placeholder: 'Village, Upazila, District' },
      { name: 'yearsOfResidence', label: 'Years Living in This Area', type: 'number', required: true, placeholder: 'Number of years',
        validate: (v) => v && (isNaN(Number(v)) || Number(v) < 1) ? 'Must be at least 1 year' : undefined },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'purpose', label: 'Purpose of Certificate', type: 'select', required: true, placeholder: '', options: ['Job Application', 'School / University Admission', 'Passport / Visa', 'Business License', 'Legal Purposes', 'Other'] },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'health-card': {
    title: 'Health Card', titleBn: 'স্বাস্থ্য কার্ড', emoji: '🏥',
    description: 'Get a government health card for free or subsidized treatment at public hospitals and health complexes across Bangladesh.',
    processingTime: '3–5 working days', fee: 'Free', office: 'Upazila Health Complex',
    steps: [
      { title: 'Collect Form', desc: 'Get the application form from your nearest health facility.' },
      { title: 'Fill & Submit', desc: 'Complete with personal details and attach documents.' },
      { title: 'Photo & Biometrics', desc: 'Provide a recent photo and biometric data.' },
      { title: 'Card Issuance', desc: 'Receive your health card within 3-5 working days.' },
    ],
    documents: ["NID or birth certificate", "2 passport-size photos", "Proof of address", "Income certificate (for BPL card)"],
    eligibility: ['All Bangladeshi citizens', 'Priority for BPL families', 'Senior citizens and disabled persons get priority'],
    contactInfo: 'Call 16263 (Health Helpline) or visit your nearest Upazila Health Complex.',
    formFields: [
      { name: 'fullName', label: 'Full Name (পুরো নাম)', type: 'text', required: true, placeholder: 'As on NID' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, placeholder: '' },
      { name: 'gender', label: 'Gender (লিঙ্গ)', type: 'select', required: true, placeholder: '', options: ['Male', 'Female', 'Other'] },
      { name: 'bloodGroup', label: 'Blood Group (রক্তের গ্রুপ)', type: 'select', required: false, placeholder: '', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
      { name: 'cardType', label: 'Card Type', type: 'select', required: true, placeholder: '', options: ['Standard Health Card', 'BPL (Below Poverty Line) Card', 'Senior Citizen Card', 'Disability Card'] },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'mobile-health-camp': {
    title: 'Mobile Health Camp', titleBn: 'মোবাইল স্বাস্থ্য ক্যাম্প', emoji: '🚑',
    description: 'Register for a government-organized free mobile health camp in your area. General checkups, blood tests, and basic treatment are provided by government doctors.',
    processingTime: 'Camp date (1–2 weeks)', fee: 'Free', office: 'Upazila Health Complex / NGO Partners',
    steps: [
      { title: 'Register Online', desc: 'Submit this form with your details and preferred location.' },
      { title: 'Confirmation', desc: 'You will be notified of the confirmed camp date and location.' },
      { title: 'Attend Camp', desc: 'Bring NID and any previous medical reports.' },
      { title: 'Receive Treatment', desc: 'Get free checkup and basic medicines at the camp.' },
    ],
    documents: ["NID or birth certificate", "Previous medical reports (if any)"],
    eligibility: ['All residents of the area', 'Priority for elderly and children', 'No prior appointment needed for walk-ins'],
    contactInfo: 'Call 16263 (Health Helpline) for camp schedules in your area.',
    formFields: [
      { name: 'fullName', label: 'Full Name (পুরো নাম)', type: 'text', required: true, placeholder: 'As on NID' },
      { name: 'age', label: 'Age (বয়স)', type: 'number', required: true, placeholder: 'Your age',
        validate: (v) => v && (isNaN(Number(v)) || Number(v) < 1 || Number(v) > 120) ? 'Enter a valid age between 1 and 120' : undefined },
      { name: 'gender', label: 'Gender (লিঙ্গ)', type: 'select', required: true, placeholder: '', options: ['Male', 'Female', 'Other'] },
      { name: 'medicalIssue', label: 'Primary Medical Concern', type: 'select', required: true, placeholder: '', options: ['General Checkup', 'Diabetes', 'Blood Pressure', 'Eye Problem', 'Skin Disease', 'Joint Pain', 'Child Health', 'Pregnancy Care', 'Other'] },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila / Area Preference (উপজেলা)', type: 'text', required: true, placeholder: 'Preferred camp location' },
      { name: 'preferredDate', label: 'Preferred Camp Date', type: 'date', required: false, placeholder: '' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'seed-supply': {
    title: 'Seed Supply', titleBn: 'সরকারি বীজ সরবরাহ', emoji: '🌱',
    description: 'Apply to receive government-subsidized certified seeds for farming. Available for Boro, Aman paddy, wheat, mustard, potato, and vegetable seeds.',
    processingTime: '3–7 working days', fee: 'Subsidized rate', office: 'Upazila Agriculture Office',
    steps: [
      { title: 'Fill Application', desc: 'Submit your seed requirement with land size and crop type.' },
      { title: 'Agricultural Officer Review', desc: 'Local officer verifies your land and farming details.' },
      { title: 'Allocation', desc: 'Seeds are allocated based on land size and availability.' },
      { title: 'Collect Seeds', desc: 'Collect seeds from the designated distribution point.' },
    ],
    documents: ["NID copy", "Farmer card (if available)", "Land ownership document or lease paper", "Previous crop record"],
    eligibility: ['Registered farmers with agricultural land', 'Small and marginal farmers get priority', 'Maximum 5 acres coverage per application'],
    contactInfo: 'Contact your Upazila Agriculture Officer (UAO) or call 16123.',
    formFields: [
      { name: 'farmerName', label: 'Farmer Name (কৃষকের নাম)', type: 'text', required: true, placeholder: 'Full name as on NID' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'seedType', label: 'Seed Type Required (বীজের ধরন)', type: 'select', required: true, placeholder: '', options: ['Boro Paddy (BRRI dhan28)', 'Boro Paddy (BRRI dhan29)', 'Aman Paddy (BRRI dhan49)', 'Wheat (BARI Gom-28)', 'Mustard', 'Potato', 'Onion', 'Vegetable Mix', 'Other'] },
      { name: 'quantityKg', label: 'Quantity Required (কেজি)', type: 'number', required: true, placeholder: 'Amount in kg',
        validate: (v) => v && (isNaN(Number(v)) || Number(v) <= 0) ? 'Enter a valid quantity' : undefined },
      { name: 'landSizeAcres', label: 'Total Land Size (একর)', type: 'number', required: true, placeholder: 'Land area in acres',
        validate: (v) => v && (isNaN(Number(v)) || Number(v) <= 0 || Number(v) > 50) ? 'Enter valid land size (max 50 acres)' : undefined },
      { name: 'season', label: 'Season (মৌসুম)', type: 'select', required: true, placeholder: '', options: ['Rabi (Winter)', 'Kharif-1 (Pre-monsoon)', 'Kharif-2 (Monsoon)'] },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'Your Upazila' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'power-tiller-rental': {
    title: 'Power Tiller Rental', titleBn: 'পাওয়ার টিলার ভাড়া', emoji: '🚜',
    description: 'Book a government-subsidized power tiller for field preparation. Available for registered farmers at subsidized hourly/daily rates through the Upazila Agriculture Office.',
    processingTime: 'Booking confirmed within 2–3 days', fee: '৳ 300–500/hour', office: 'Upazila Agriculture Office',
    steps: [
      { title: 'Submit Booking', desc: 'Provide land details, required date, and duration.' },
      { title: 'Availability Check', desc: 'Agriculture office confirms tiller availability.' },
      { title: 'Booking Confirmation', desc: 'Receive booking confirmation with schedule.' },
      { title: 'Pay Fee', desc: 'Pay subsidized rate at the agriculture office.' },
      { title: 'Service Delivery', desc: 'Tiller arrives at your field on the booked date.' },
    ],
    documents: ["NID copy", "Farmer card (if available)", "Land document or lease paper"],
    eligibility: ['Registered farmers only', 'Land must be within the Upazila service area', 'Minimum booking: 2 hours'],
    contactInfo: 'Contact your Upazila Agriculture Officer (UAO) or call 16123.',
    formFields: [
      { name: 'farmerName', label: 'Farmer Name (কৃষকের নাম)', type: 'text', required: true, placeholder: 'Full name as on NID' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'landLocation', label: 'Field Location / Address', type: 'text', required: true, placeholder: 'Village and Mouza name' },
      { name: 'landSizeAcres', label: 'Field Size (একর)', type: 'number', required: true, placeholder: 'Area in acres',
        validate: (v) => v && (isNaN(Number(v)) || Number(v) <= 0) ? 'Enter a valid field size' : undefined },
      { name: 'bookingDate', label: 'Preferred Date (পছন্দের তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'duration', label: 'Duration Required (সময়কাল)', type: 'select', required: true, placeholder: '', options: ['2 hours', '4 hours', 'Full Day (8 hours)', '2 Days', '3 Days', '1 Week'] },
      { name: 'cropType', label: 'Crop to Plant After Tilling', type: 'select', required: true, placeholder: '', options: ['Boro Paddy', 'Aman Paddy', 'Wheat', 'Mustard', 'Potato', 'Vegetables', 'Other'] },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'Your Upazila' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'school-admission': {
    title: 'School Admission', titleBn: 'বিদ্যালয়ে ভর্তি', emoji: '🏫',
    description: 'Apply for school admission for your child at government primary and secondary schools. Includes document checklist and status tracking.',
    processingTime: '7–14 working days', fee: '৳ 100 (admission form)', office: 'Desired School Office',
    steps: [
      { title: 'Choose School', desc: 'Research and select the school based on location and curriculum.' },
      { title: 'Collect Admission Form', desc: 'Obtain the form from the school office during admission period.' },
      { title: 'Submit Documents', desc: 'Submit completed form with required documents and fee.' },
      { title: 'Entrance Test', desc: 'Student appears for entrance exam (if applicable).' },
      { title: 'Admission', desc: 'Selected students complete admission with fee payment.' },
    ],
    documents: ["Student's birth certificate or NID", "Previous school transfer certificate", "Report card of previous class", "Parent's NID copy", "2 passport-size photos of student"],
    eligibility: ['Children aged 6+ for Class 1', 'Children who passed previous class', 'Subject to school capacity and entrance test'],
    contactInfo: 'Contact the school office during admission period or call Ministry of Education helpline.',
    formFields: [
      { name: 'studentName', label: "Student's Name (ছাত্র/ছাত্রীর নাম)", type: 'text', required: true, placeholder: 'Full name' },
      { name: 'studentNameBn', label: "Student's Name (বাংলা)", type: 'text', required: true, placeholder: 'বাংলায় নাম' },
      { name: 'dateOfBirth', label: 'Date of Birth (জন্ম তারিখ)', type: 'date', required: true, placeholder: '' },
      { name: 'gender', label: 'Gender (লিঙ্গ)', type: 'select', required: true, placeholder: '', options: ['Male', 'Female', 'Other'] },
      { name: 'class', label: 'Class / Grade (শ্রেণি)', type: 'select', required: true, placeholder: '', options: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'HSC 1st Year', 'HSC 2nd Year'] },
      { name: 'schoolName', label: 'School Name (বিদ্যালয়ের নাম)', type: 'text', required: true, placeholder: 'Name of desired school' },
      { name: 'medium', label: 'School Medium', type: 'select', required: true, placeholder: '', options: ['Bangla Medium', 'English Medium', 'Madrasa'] },
      { name: 'fatherName', label: "Father's Name (পিতার নাম)", type: 'text', required: true, placeholder: "Father's full name" },
      { name: 'fatherNid', label: "Father's NID Number", type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'fertilizer-subsidy': {
    title: 'Fertilizer Subsidy Card', titleBn: 'সার ভর্তুকি কার্ড', emoji: '🌾',
    description: 'Apply for a government fertilizer subsidy card to purchase Urea, TSP, MoP, and DAP at discounted rates from registered dealers.',
    processingTime: '7–10 working days', fee: 'Free', office: 'Upazila Agriculture Office',
    steps: [
      { title: 'Submit Details', desc: 'Provide your farmer details and land size.' },
      { title: 'Field Verification', desc: 'An officer verifies your active farming status.' },
      { title: 'Card Issuance', desc: 'Collect your subsidy card from the local UP office.' }
    ],
    documents: ["NID copy", "Land ownership proof or lease paper", "Recent passport size photo"],
    eligibility: ['Must be an active farmer', 'Land size must be verifiable', 'Priority to small and marginal farmers'],
    contactInfo: 'Contact your local Sub-Assistant Agriculture Officer (SAAO).',
    formFields: [
      { name: 'farmerName', label: 'Farmer Name (কৃষকের নাম)', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'landSizeAcres', label: 'Land Size (একর)', type: 'number', required: true, placeholder: 'Area in acres' },
      { name: 'fertilizerType', label: 'Primary Fertilizer Required', type: 'select', required: true, placeholder: '', options: ['Urea', 'TSP', 'MoP', 'DAP', 'Mixed'] },
      { name: 'quantityKg', label: 'Requested Quantity (KG)', type: 'number', required: true, placeholder: 'e.g. 50' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'Your Upazila' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'agricultural-rehabilitation': {
    title: 'Agricultural Rehabilitation', titleBn: 'কৃষি পুনর্বাসন', emoji: '🤝',
    description: 'Apply for government financial support or free inputs (seeds/fertilizers) if your crops were damaged by natural disasters like floods, cyclones, or droughts.',
    processingTime: '15–30 working days', fee: 'Free', office: 'Upazila Agriculture Office',
    steps: [
      { title: 'Report Damage', desc: 'Submit application detailing the extent of crop damage.' },
      { title: 'Damage Assessment', desc: 'Agriculture officers visit affected fields.' },
      { title: 'Aid Disbursement', desc: 'Receive seeds, fertilizers, or cash support.' }
    ],
    documents: ["NID copy", "Farmer card", "Photos of damaged field (optional)"],
    eligibility: ['Affected by recognized natural disaster', 'Registered farmer'],
    contactInfo: 'Call 16123 or visit Upazila Agriculture Office.',
    formFields: [
      { name: 'farmerName', label: 'Farmer Name', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'disasterType', label: 'Disaster Type', type: 'select', required: true, placeholder: '', options: ['Flood', 'Cyclone', 'Drought', 'Pest Attack', 'Other'] },
      { name: 'cropType', label: 'Affected Crop', type: 'text', required: true, placeholder: 'e.g. Aman Paddy' },
      { name: 'damagedLandAcres', label: 'Damaged Land Area (Acres)', type: 'number', required: true, placeholder: 'Area in acres' },
      { name: 'estimatedLoss', label: 'Estimated Loss (৳)', type: 'number', required: true, placeholder: 'Estimated financial loss' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'Your Upazila' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'crop-insurance': {
    title: 'Crop Insurance Scheme', titleBn: 'শস্য বীমা', emoji: '🛡️',
    description: 'Enroll in the government-backed crop insurance scheme to protect your harvest against unpredictable weather and severe damage.',
    processingTime: '7 working days', fee: 'Subsidized Premium', office: 'Govt. Insurance Partners',
    steps: [
      { title: 'Enrollment', desc: 'Submit crop and land details before the sowing season.' },
      { title: 'Premium Payment', desc: 'Pay your subsidized premium share.' },
      { title: 'Policy Issuance', desc: 'Receive your crop insurance policy.' }
    ],
    documents: ["NID copy", "Farmer card", "Land lease or ownership document"],
    eligibility: ['Must enroll before sowing season ends', 'Minimum 0.5 acres land'],
    contactInfo: 'Contact Sadharan Bima Corporation local agents or Agriculture Office.',
    formFields: [
      { name: 'farmerName', label: 'Farmer Name', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'cropType', label: 'Crop to Insure', type: 'select', required: true, placeholder: '', options: ['Boro Paddy', 'Aman Paddy', 'Wheat', 'Maize', 'Potato'] },
      { name: 'landSizeAcres', label: 'Land Area to Insure (Acres)', type: 'number', required: true, placeholder: 'Area in acres' },
      { name: 'coverageAmount', label: 'Requested Coverage (৳)', type: 'number', required: true, placeholder: 'Total coverage amount' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'irrigation-support': {
    title: 'Irrigation Support', titleBn: 'সেচ সহায়তা', emoji: '💧',
    description: 'Apply for subsidies on solar-powered irrigation pumps or special discounts on agricultural electricity bills.',
    processingTime: '20–30 working days', fee: 'Free Application', office: 'BADC / Upazila Office',
    steps: [
      { title: 'Submit Application', desc: 'Provide land and water source details.' },
      { title: 'Technical Survey', desc: 'Engineers survey the feasibility of the pump.' },
      { title: 'Approval', desc: 'Subsidy approved based on budget allocation.' }
    ],
    documents: ["NID copy", "Land ownership proof", "Existing electricity bill (if applying for rebate)"],
    eligibility: ['Group of farmers preferred', 'Water source must be viable'],
    contactInfo: 'Contact BADC local office.',
    formFields: [
      { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'supportType', label: 'Support Type', type: 'select', required: true, placeholder: '', options: ['Solar Pump Subsidy', 'Electric Pump Subsidy', 'Electricity Bill Rebate'] },
      { name: 'waterSource', label: 'Water Source', type: 'select', required: true, placeholder: '', options: ['Deep Tube Well', 'Shallow Tube Well', 'Surface Water / River', 'Pond'] },
      { name: 'landSizeAcres', label: 'Command Area (Acres)', type: 'number', required: true, placeholder: 'Total land to be irrigated' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'upazila', label: 'Upazila (উপজেলা)', type: 'text', required: true, placeholder: 'Your Upazila' },
      { name: 'phone', label: 'Contact Phone (মোবাইল)', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'soil-test-standard': {
    title: 'Standard Soil Test (NPK)', titleBn: 'সাধারণ মাটি পরীক্ষা', emoji: '🧪',
    description: 'Basic soil analysis for pH, Nitrogen, Phosphorus, and Potassium. Essential for determining baseline fertilizer requirements.',
    processingTime: '7–10 working days', fee: '৳ 150', office: 'SRDI Local Lab',
    steps: [
      { title: 'Request Test', desc: 'Submit plot details and crop history.' },
      { title: 'Sample Collection', desc: 'An officer collects soil samples from your field.' },
      { title: 'Lab Analysis', desc: 'Soil is tested at the regional SRDI lab.' },
      { title: 'Receive Report', desc: 'Get a detailed report with fertilizer recommendations.' }
    ],
    documents: ["NID copy", "Farmer card"],
    eligibility: ['Any farmer can apply', 'Sample must be collected before fertilizing'],
    contactInfo: 'Contact Soil Resource Development Institute (SRDI).',
    formFields: [
      { name: 'farmerName', label: 'Farmer Name', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'plotSize', label: 'Plot Size (Decimals)', type: 'number', required: true, placeholder: 'Size of plot' },
      { name: 'address', label: 'Plot Location', type: 'textarea', required: true, placeholder: 'Specific address for sample collection' },
      { name: 'cropHistory', label: 'Previous Crop', type: 'text', required: true, placeholder: 'What was grown last season?' },
      { name: 'intendedCrop', label: 'Intended Crop', type: 'text', required: true, placeholder: 'What will you grow next?' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'phone', label: 'Contact Phone', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'soil-test-micronutrient': {
    title: 'Micronutrient Analysis', titleBn: 'মাইক্রোনিউট্রিয়েন্ট বিশ্লেষণ', emoji: '🔬',
    description: 'Advanced soil testing for essential micronutrients like Zinc, Boron, Sulfur, and Iron. Recommended for high-yield farming.',
    processingTime: '10–14 working days', fee: '৳ 300', office: 'SRDI Regional Lab',
    steps: [
      { title: 'Request Test', desc: 'Submit plot details.' },
      { title: 'Sample Collection', desc: 'Officer collects specialized samples.' },
      { title: 'Advanced Analysis', desc: 'Tested for trace minerals.' },
      { title: 'Receive Report', desc: 'Detailed mineral deficiency report.' }
    ],
    documents: ["NID copy", "Farmer card"],
    eligibility: ['Any farmer can apply'],
    contactInfo: 'Contact Soil Resource Development Institute (SRDI).',
    formFields: [
      { name: 'farmerName', label: 'Farmer Name', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'plotSize', label: 'Plot Size (Decimals)', type: 'number', required: true, placeholder: 'Size of plot' },
      { name: 'address', label: 'Plot Location', type: 'textarea', required: true, placeholder: 'Specific address' },
      { name: 'suspectedDeficiency', label: 'Suspected Issues (Optional)', type: 'text', required: false, placeholder: 'e.g. Yellow leaves, stunted growth' },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'phone', label: 'Contact Phone', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
    ],
  },
  'soil-test-salinity': {
    title: 'Salinity & pH Test', titleBn: 'লবণাক্ততা পরীক্ষা', emoji: '🌊',
    description: 'Crucial for coastal regions to test electrical conductivity (EC) and soil pH to select the right salt-tolerant crop varieties.',
    processingTime: '5–7 working days', fee: '৳ 100', office: 'SRDI Local Lab',
    steps: [
      { title: 'Request Test', desc: 'Submit plot details.' },
      { title: 'Sample Collection', desc: 'Officer collects soil samples.' },
      { title: 'Rapid Analysis', desc: 'Tested specifically for salinity levels.' },
      { title: 'Receive Report', desc: 'Recommendations for salt-tolerant crops.' }
    ],
    documents: ["NID copy"],
    eligibility: ['Priority for coastal and southern districts'],
    contactInfo: 'Contact Soil Resource Development Institute (SRDI).',
    formFields: [
      { name: 'farmerName', label: 'Farmer Name', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true, placeholder: '10 or 17-digit NID', validate: nidValidate },
      { name: 'plotSize', label: 'Plot Size (Decimals)', type: 'number', required: true, placeholder: 'Size of plot' },
      { name: 'address', label: 'Plot Location', type: 'textarea', required: true, placeholder: 'Specific address' },
      { name: 'waterSource', label: 'Primary Irrigation Source', type: 'select', required: true, placeholder: '', options: ['Rain Fed', 'River/Canal', 'Deep Tube Well', 'Pond'] },
      { name: 'district', label: 'District (জেলা)', type: 'select', required: true, placeholder: '', options: DISTRICTS },
      { name: 'phone', label: 'Contact Phone', type: 'tel', required: true, placeholder: '01XXXXXXXXX', validate: phoneValidate },
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
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const handleAiSuggest = (fieldName: string) => {
    let suggestion = '';
    const name = fieldName.toLowerCase();
    
    if (name.includes('reason') || name.includes('purpose')) suggestion = 'Due to urgent personal requirements, I am requesting this service.';
    else if (name.includes('address') || name.includes('village') || name.includes('location') || name.includes('place')) suggestion = 'House 15, Road 7, Block B, Dhaka';
    else if (name.includes('school')) suggestion = 'Dhaka Zilla School';
    else if (name.includes('business')) suggestion = 'M/S Rahim Traders';
    else if (name.includes('police')) suggestion = 'Tongi Model Thana';
    else if (name.includes('mouza')) suggestion = 'Harinathpur';
    else if (name.includes('cause')) suggestion = 'Natural Causes';
    else if (name.includes('currentvalue')) suggestion = 'Rohim';
    else if (name.includes('correctvalue')) suggestion = 'Rahim';
    else if (name.includes('source') || name.includes('occupation')) suggestion = 'Agriculture';
    else if (name.includes('father') || name === 'witness1') suggestion = 'Abdul Karim';
    else if (name.includes('mother')) suggestion = 'Fatema Begum';
    else if (name.includes('bride')) suggestion = 'Ayesha Siddiqua';
    else if (name.includes('groom') || name === 'witness2') suggestion = 'Kamrul Hasan';
    else if (name.includes('child')) suggestion = 'Arif Hossain';
    else if (name.includes('deceased')) suggestion = 'Abdul Jalil';
    else if (name.includes('namebn') || name.includes('bangla')) suggestion = 'রহিম উদ্দিন';
    else if (name.includes('name') || name.includes('farmername') || name === 'applicantname') suggestion = user?.full_name || 'Rahim Uddin';
    else if (name.includes('phone')) suggestion = user?.phone || '01712345678';
    else if (name.includes('crophistory') || name.includes('intendedcrop') || name.includes('croptype')) suggestion = 'Boro Paddy';
    else if (name.includes('deficiency') || name.includes('suspected')) suggestion = 'Yellowing of leaves and stunted growth';
    else suggestion = 'Details generated by AI Assistant.';
    
    setFormData(prev => ({ ...prev, [fieldName]: suggestion }));
    if (errors[fieldName]) setErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleBlur = (fieldName: string, value: string) => {
    if (!value) return;
    let corrected = value.trim();
    const name = fieldName.toLowerCase();
    
    // Auto-correct names to Title Case (if it's not Bangla or a specific ID field)
    if (name.includes('name') && !name.includes('bn') && !name.includes('bangla') && /^[a-zA-Z\s]+$/.test(corrected)) {
      corrected = corrected.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    // Auto-correct phone or NID by removing any accidental spaces or dashes
    if (name.includes('phone') || name.includes('nid') || name.includes('jl')) {
      corrected = corrected.replace(/[\s-]/g, '');
    }

    if (corrected !== value) {
      setFormData(prev => ({ ...prev, [fieldName]: corrected }));
    }
  };

  const handleAutoFill = async () => {
    if (!data || isMagicFilling) return;
    setIsMagicFilling(true);
    
    const fieldsToFill = data.formFields.map(f => {
      const name = f.name.toLowerCase();
      let val = '';
      
      if (name.includes('phone')) val = user?.phone || '01712345678';
      else if (name.includes('nid') || name === 'birthcertno') val = name.includes('mother') ? '5566778899' : name.includes('father') ? '1122334455' : '1234567890';
      else if (name.includes('quantity')) val = '50';
      else if (name.includes('land') || name.includes('size')) val = name.includes('plot') ? '50' : '2.5';
      else if (name.includes('age')) val = name.includes('bride') ? '21' : name.includes('groom') ? '25' : '30';
      else if (name.includes('year')) val = '5';
      else if (name.includes('income') || name.includes('revenue')) val = '25000';
      else if (name.includes('loss')) val = '15000';
      else if (name.includes('coverage')) val = '50000';
      else if (name.includes('jlnumber') || name.includes('khatian')) val = '104';
      else if (name.includes('fir')) val = 'FIR-9901';
      else if (name.includes('school')) val = 'Dhaka Zilla School';
      else if (name.includes('business')) val = 'M/S Rahim Traders';
      else if (name.includes('police')) val = 'Tongi Model Thana';
      else if (name.includes('mouza')) val = 'Harinathpur';
      else if (name.includes('cause')) val = 'Natural Causes';
      else if (name.includes('reason')) val = 'Spelling Mistake in Original';
      else if (name.includes('currentvalue')) val = 'Rohim';
      else if (name.includes('correctvalue')) val = 'Rahim';
      else if (name.includes('source') || name.includes('occupation')) val = 'Agriculture';
      else if (name.includes('father') || name === 'witness1') val = 'Abdul Karim';
      else if (name.includes('mother')) val = 'Fatema Begum';
      else if (name.includes('bride')) val = 'Ayesha Siddiqua';
      else if (name.includes('groom') || name === 'witness2') val = 'Kamrul Hasan';
      else if (name.includes('child')) val = 'Arif Hossain';
      else if (name.includes('deceased')) val = 'Abdul Jalil';
      else if (name.includes('namebn') || name.includes('bangla')) val = 'রহিম উদ্দিন';
      else if (name.includes('name') || name === 'informantname' || name.includes('farmername') || name === 'applicantname') val = user?.full_name || 'Rahim Uddin';
      else if (name.includes('village') || name.includes('address') || name.includes('location') || name.includes('place')) val = 'House 12, Road 5, Block C';
      else if (name.includes('upazila') || name.includes('station')) val = 'Tongi';
      else if (name.includes('crophistory') || name.includes('intendedcrop') || name.includes('croptype')) val = 'Boro Paddy';
      else if (name.includes('deficiency') || name.includes('suspected')) val = 'Yellowing of leaves and stunted growth';
      else if (f.type === 'date') val = name.includes('birth') || name.includes('dob') ? '2015-05-15' : name.includes('death') ? '2023-11-20' : '2024-01-10';
      else if (f.type === 'select' && f.options && f.options.length > 0) val = f.options[0]; // Take first option for consistency instead of random
      else if (f.type === 'number') val = '5';
      else val = 'Generated by AI Assistant';
      
      return { name: f.name, val, isSelect: f.type === 'select' || f.type === 'date' };
    });

    setErrors({});
    
    for (const field of fieldsToFill) {
      if (field.isSelect) {
        setFormData(prev => ({ ...prev, [field.name]: field.val }));
      } else {
        // AI Typing animation effect
        let current = '';
        for (let i = 0; i < field.val.length; i++) {
          current += field.val[i];
          setFormData(prev => ({ ...prev, [field.name]: current }));
          await new Promise(r => setTimeout(r, 15)); // typing speed
        }
      }
      await new Promise(r => setTimeout(r, 50)); // pause between fields
    }
    setIsMagicFilling(false);
  };
  // Look up the real service_id from the backend by title
  useEffect(() => {
    const title = SERVICE_TITLES[service || ''];
    if (!title) return;
    api.get('/services', { params: { limit: 50 } })
      .then(res => {
        const list: any[] = res.data.data?.data || res.data.data || [];
        const found = list.find((s: any) => s.title === title);
        if (found) setServiceId(found.service_id);
      })
      .catch(() => {}); // silently fail — submission still works with null service_id
  }, [service]);

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
      const val = formData[f.name]?.trim() || '';
      if (f.required && !val) {
        errs[f.name] = `${f.label.replace(/\(.*\)/, '').trim()} is required`;
      } else if (val && f.validate) {
        const err = f.validate(val);
        if (err) errs[f.name] = err;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleNext = () => {
    setSubmitError(null);
    if (!user) {
      setSubmitError('You must be logged in to proceed. Please log in and try again.');
      return;
    }
    if (validate()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSubmitError(null);
    if (!user) {
      setSubmitError('You must be logged in to submit an application. Please log in and try again.');
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/applications', {
        service_id: serviceId || null,
        applicant_name: formData.fullName || formData.farmerName || formData.applicantName || formData.studentName
          || formData.ownerName || formData.groomName || formData.informantName || user.full_name || '',
        applicant_data: JSON.stringify({ ...formData, service: data.title }),
      });
      setTrackingId(res.data.data?.tracking_id || 'Pending');
      setSubmitted(true);
      setCurrentStep(3);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed. Please try again.';
      if (err?.response?.status === 401) {
        setSubmitError('Session expired. Please log in again to submit your application.');
      } else {
        setSubmitError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: data.title }]} className="mb-6" />

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
        <CardContent><p className="text-sm text-earth-700 leading-relaxed">{data.description}</p></CardContent>
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

      {/* Steps */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600" /> How It Works</h3>
          <div className="space-y-3">
            {data.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-polli-100 text-polli-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                <div>
                  <h4 className="text-sm font-bold text-earth-800">{step.title}</h4>
                  <p className="text-xs text-earth-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-600" /> Required Documents</h3>
          <div className="space-y-2">
            {data.documents.map((doc, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <CheckCircle size={14} className="mt-1 shrink-0 text-emerald-500" /> {doc}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Shield size={16} className="text-purple-600" /> Eligibility</h3>
          <div className="space-y-2">
            {data.eligibility.map((rule, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <ChevronRight size={14} className="mt-1 shrink-0 text-purple-500" /> {rule}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="mb-8">
        <CardContent>
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Phone size={16} className="text-polli-600" /> Contact Information</h3>
          <p className="text-sm text-earth-600">{data.contactInfo}</p>
        </CardContent>
      </Card>

      {/* Application Wizard */}
      <Card className="mb-6">
        <CardContent>
          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b">
            <div className={`flex flex-col items-center flex-1 ${currentStep >= 1 ? 'text-polli-600' : 'text-earth-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${currentStep >= 1 ? 'bg-polli-100 text-polli-700' : 'bg-earth-100 text-earth-500'}`}>1</div>
              <span className="text-xs font-bold text-center">Application<br/>Information</span>
            </div>
            <div className={`flex-1 h-1 rounded-full mx-2 ${currentStep >= 2 ? 'bg-polli-500' : 'bg-earth-200'}`}></div>
            <div className={`flex flex-col items-center flex-1 ${currentStep >= 2 ? 'text-polli-600' : 'text-earth-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${currentStep >= 2 ? 'bg-polli-100 text-polli-700' : 'bg-earth-100 text-earth-500'}`}>2</div>
              <span className="text-xs font-bold text-center">Review<br/>Application</span>
            </div>
            <div className={`flex-1 h-1 rounded-full mx-2 ${currentStep >= 3 ? 'bg-polli-500' : 'bg-earth-200'}`}></div>
            <div className={`flex flex-col items-center flex-1 ${currentStep >= 3 ? 'text-polli-600' : 'text-earth-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${currentStep >= 3 ? 'bg-polli-100 text-polli-700' : 'bg-earth-100 text-earth-500'}`}>3</div>
              <span className="text-xs font-bold text-center">Submit<br/>& Track</span>
            </div>
          </div>

          {currentStep === 1 && !submitted && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText size={18} className="text-polli-600" /> Form Details
                </h3>
                <button 
                  type="button" 
                  onClick={handleAutoFill}
                  disabled={isMagicFilling}
                  className={`text-xs px-3 py-1.5 border rounded-lg font-bold transition flex items-center gap-1 shadow-sm ${
                    isMagicFilling 
                    ? 'bg-purple-100 text-purple-500 border-purple-200 cursor-not-allowed' 
                    : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                  }`}
                  title="Click here to auto-fill realistic demo data with AI for your presentation"
                >
                  {isMagicFilling ? (
                    <><Sparkles size={14} className="animate-spin" /> AI is typing...</>
                  ) : (
                    <><Sparkles size={14} /> AI Magic Fill</>
                  )}
                </button>
              </div>

              {!user && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  Please <Link to="/login" className="underline font-medium">log in</Link> to proceed.
                </div>
              )}

              <div className="space-y-5">
                {data.formFields.map(field => {
                  const value = formData[field.name] || '';
                  const error = errors[field.name];
                  const inputCls = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${
                    error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-earth-200 focus:border-polli-500 focus:ring-2 focus:ring-polli-200'
                  }`;

                  return (
                    <div key={field.name} className="relative group">
                      <label className="flex justify-between items-end text-sm font-semibold text-earth-700 mb-1.5 h-6">
                        <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                        {(field.type === 'text' || field.type === 'textarea' || field.type === 'tel') && (
                          <button 
                            type="button" 
                            onClick={() => handleAiSuggest(field.name)} 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold shadow-sm"
                            title="Get AI Suggestion"
                          >
                            <Sparkles size={10} /> Suggest
                          </button>
                        )}
                      </label>
                      {field.type === 'select' && field.options ? (
                        <select value={value} onBlur={() => handleBlur(field.name, value)} onChange={e => { setFormData({ ...formData, [field.name]: e.target.value }); if (errors[field.name]) setErrors({ ...errors, [field.name]: '' }); }} className={inputCls}>
                          <option value="">Select {field.label.replace(/\(.*\)/, '').trim()}...</option>
                          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea value={value} onBlur={() => handleBlur(field.name, value)} onChange={e => { setFormData({ ...formData, [field.name]: e.target.value }); if (errors[field.name]) setErrors({ ...errors, [field.name]: '' }); }} rows={3} placeholder={field.placeholder} className={inputCls} />
                      ) : (
                        <input type={field.type} onBlur={() => handleBlur(field.name, value)} value={value} onChange={e => { setFormData({ ...formData, [field.name]: e.target.value }); if (errors[field.name]) setErrors({ ...errors, [field.name]: '' }); }} placeholder={field.placeholder} className={inputCls} />
                      )}
                      {error && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} /> {error}
                        </p>
                      )}
                    </div>
                  );
                })}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!user}
                    className="w-full px-6 py-3.5 bg-earth-900 text-white font-bold rounded-xl hover:bg-black transition shadow-md flex items-center justify-center gap-2"
                  >
                    Next: Review Application <ChevronRight size={18} />
                  </button>
                  {submitError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{submitError}</p>
                        {(!user || submitError.includes('log in')) && (
                          <Link to="/login" className="mt-1 inline-flex items-center gap-1 font-bold text-red-700 underline">
                            <LogIn size={13} /> Go to Login
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && !submitted && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                  <CheckCircle size={18} className="text-polli-600" /> Review Your Details
                </h3>
                <p className="text-sm text-earth-500">Please verify that all information is correct before submitting.</p>
              </div>

              <div className="bg-earth-50 border rounded-xl overflow-hidden mb-6">
                <table className="w-full text-sm text-left">
                  <tbody>
                    {data.formFields.map((field, i) => (
                      <tr key={field.name} className={`border-b last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-earth-50/50'}`}>
                        <th className="py-3 px-4 font-semibold text-earth-700 w-1/3 align-top">{field.label.replace(/\(.*\)/, '').trim()}</th>
                        <td className="py-3 px-4 text-earth-900 font-medium">
                          {formData[field.name] || <span className="text-earth-400 italic">Not provided</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 bg-white border-2 border-earth-200 text-earth-700 font-bold rounded-xl hover:bg-earth-50 hover:border-earth-300 transition"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-polli-600 to-green-600 text-white font-bold rounded-xl hover:from-polli-700 hover:to-green-700 disabled:opacity-50 transition shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                      Submitting...
                    </span>
                  ) : `Confirm & Submit`}
                </button>
              </div>
              
              {submitError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>{submitError}</p>
                </div>
              )}
            </div>
          )}

          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-earth-800 mb-2">Application Submitted Successfully!</h2>
              {trackingId && (
                <p className="text-earth-600 mb-1">
                  Tracking ID: <span className="font-mono font-bold text-polli-700 bg-polli-50 px-2 py-1 rounded">{trackingId}</span>
                </p>
              )}
              <p className="text-earth-500 text-sm mb-6 mt-2">
                Your application has been sent to the government service office. You will be notified when it is reviewed.
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link to="/dashboard/applications" className="px-5 py-2.5 bg-polli-600 text-white text-sm font-bold rounded-xl hover:bg-polli-700 transition shadow-sm">
                  Track Application
                </Link>
                <Link to="/services" className="px-5 py-2.5 border border-earth-300 bg-white text-earth-700 text-sm font-bold rounded-xl hover:bg-earth-50 transition">
                  Back to Services
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
