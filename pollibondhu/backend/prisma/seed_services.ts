import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const lifeCycleData = [
  {
    category: 'Birth & Childhood',
    services: [
      'Birth registration', 'Birth certificate', 'Birth certificate correction',
      'Vaccination / EPI', 'Child health check-up', 'Child nutrition services',
      'Child medical records', 'Primary education', 'School stipend',
      'Free textbooks', 'Child protection', 'Disability registration/support'
    ]
  },
  {
    category: 'Education',
    services: [
      'School admission', 'SSC registration', 'SSC examination', 'SSC certificate',
      'SSC marksheet', 'HSC registration', 'HSC examination', 'HSC certificate',
      'HSC marksheet', 'Madrasa education', 'Dakhil certificate', 'Alim certificate',
      'Diploma/polytechnic', 'Vocational training', 'University admission',
      'University certificate', 'Transcript', 'Scholarship', 'Student stipend',
      'Student ID', 'Education certificate verification'
    ]
  },
  {
    category: 'Identity & Documents',
    services: [
      'NID registration', 'NID card', 'NID correction', 'NID reissue',
      'Voter registration', 'Citizenship certificate', 'Nationality certificate',
      'Permanent residence certificate', 'Character certificate', 'Family certificate',
      'Digital birth/death records', 'Passport', 'Passport renewal', 'Police clearance certificate'
    ]
  },
  {
    category: 'Driving & Transportation',
    services: [
      'Learner driving licence', 'Driving licence', 'Driving licence renewal',
      'Motorcycle licence', 'Vehicle registration', 'Vehicle ownership transfer',
      'Vehicle fitness', 'Vehicle tax token', 'Route permit', 'Vehicle insurance',
      'Bus tickets', 'Truck rental', 'Pickup rental', 'Moving services'
    ]
  },
  {
    category: 'Job & Career',
    services: [
      'Job search', 'Government job', 'Private job', 'Internship', 'Apprenticeship',
      'Skills training', 'Technical training', 'Freelancing', 'Self-employment',
      'CV preparation', 'Job application', 'Interview preparation', 'Employment certificate',
      'Salary/payroll services', 'Overseas employment', 'Recruitment agency', 'Work permit'
    ]
  },
  {
    category: 'Banking & Financial Life',
    services: [
      'Bank account opening', 'Savings account', 'Student account', 'Mobile banking',
      'bKash services', 'Nagad services', 'Rocket services', 'Debit card', 'Credit card',
      'ATM/card services', 'DPS', 'FDR', 'Personal loan', 'Education loan',
      'Agricultural loan', 'SME loan', 'Microfinance', 'Remittance', 'Insurance',
      'Taxpayer Identification Number (TIN)', 'Income tax return', 'Bill payment'
    ]
  },
  {
    category: 'Marriage & Family',
    services: [
      'Marriage', 'Kazi service', 'Marriage registration', 'Marriage certificate',
      'Spouse information update', 'Child registration', 'Divorce registration',
      'Family legal services', 'Child custody/legal support', 'Family counselling'
    ]
  },
  {
    category: 'Home & Property',
    services: [
      'House rental', 'House purchase', 'Land purchase', 'Land sale', 'Land registration',
      'Mutation/Namjari', 'Khatian/Porcha', 'Land tax', 'Property tax', 'Land measurement',
      'Property ownership verification', 'Building permission', 'House construction',
      'Home repair', 'Electricity connection', 'Water connection', 'Gas/LPG',
      'Internet connection', 'Plumber', 'Electrician', 'Carpenter', 'Mason'
    ]
  },
  {
    category: 'Agriculture & Rural Life',
    services: [
      'Farmer registration', 'Agricultural advice', 'Soil testing', 'Seed suppliers',
      'Fertiliser suppliers', 'Pesticide dealers', 'Irrigation services', 'Tractor rental',
      'Harvesting', 'Crop selling', 'Agricultural subsidy', 'Livestock registration',
      'Cow/goat services', 'Veterinary services', 'Poultry services', 'Fish farming',
      'Fisheries support'
    ]
  },
  {
    category: 'Healthcare',
    services: [
      'Community clinic', 'Government hospital', 'Private hospital', 'Doctor appointment',
      'Specialist consultation', 'Medicine', 'Pharmacy', 'Diagnostic tests',
      'Blood donation', 'Ambulance', 'Dental care', 'Eye care', 'Maternal care',
      'Emergency healthcare', 'Health insurance', 'Disability services', 'Telemedicine'
    ]
  },
  {
    category: 'Business & Entrepreneurship',
    services: [
      'Trade licence', 'Business registration', 'BIN/VAT', 'Business bank account',
      'SME support', 'Shop registration', 'Online business', 'E-commerce',
      'Accounting', 'Tax services', 'Business consultancy', 'Import/export',
      'Business insurance'
    ]
  },
  {
    category: 'Social Welfare',
    services: [
      'Old-age allowance', 'Widow allowance', 'Disability allowance', 'Maternity support',
      'Food assistance', 'Disaster assistance', 'Housing support', 'NGO support',
      'Zakat/charity', 'Rehabilitation support'
    ]
  },
  {
    category: 'Legal & Police',
    services: [
      'General Diary (GD)', 'Police complaint', 'Lost document report',
      'Legal consultation', 'Lawyer', 'Notary', 'Affidavit', 'Court services',
      'Land dispute', 'Family dispute', 'Inheritance dispute', 'Legal aid',
      'Consumer complaint'
    ]
  },
  {
    category: 'Travel & Migration',
    services: [
      'Visa assistance', 'Medical test for migration', 'BMET-related services',
      'Air ticket', 'Immigration', 'Expatriate services'
    ]
  },
  {
    category: 'Old Age & Retirement',
    services: [
      'Pension', 'Retirement benefits', 'Senior healthcare', 'Caregiver',
      'Family pension', 'Property/inheritance planning'
    ]
  },
  {
    category: 'Death & After Death',
    services: [
      'Death registration', 'Death certificate', 'Funeral service', 'Burial',
      'Graveyard', 'Inheritance certificate', 'Legal-heir certificate',
      'Succession-related services', 'Property inheritance', 'Bank account settlement',
      'Insurance claim', 'Pension/family pension claim', 'Transfer of inherited land/property'
    ]
  },
  {
    category: 'NGO & Development Services',
    services: [
      'BRAC services', 'ASA services', 'Grameen services', 'NGO microfinance',
      'Women empowerment programmes', 'Youth development', 'Livelihood support',
      'Poverty reduction programmes'
    ]
  },
  {
    category: 'Shops & Local Businesses',
    services: [
      'Grocery shops', 'Clothing shops', 'Electronics shops', 'Mobile shops',
      'Furniture shops', 'Restaurants', 'Hotels', 'Bakeries', 'Tailors',
      'Barber/salon', 'Beauty parlour', 'Photocopy/printing'
    ]
  },
  {
    category: 'Technology & Digital Services',
    services: [
      'Computer repair', 'Mobile repair', 'CCTV installation', 'Website development',
      'Graphic design', 'Digital marketing', 'Online application assistance'
    ]
  },
  {
    category: 'Women & Family Services',
    services: [
      'Childcare', 'Daycare', 'Women-focused training', 'Tailoring',
      'Home-based business support', 'Women\'s employment'
    ]
  },
  {
    category: 'Emergency & Community Services',
    services: [
      'Disaster volunteers', 'Fire/emergency contacts', 'Missing-person assistance',
      'Community volunteers', 'Local charity'
    ]
  },
  {
    category: 'Religious & Social Services',
    services: [
      'Mosque services', 'Madrasa services', 'Imam/Kazi services',
      'Community organisations'
    ]
  },
  {
    category: 'Event & Personal Services',
    services: [
      'Wedding planner', 'Catering', 'Photography', 'Videography',
      'Decoration', 'Sound system', 'Tent/chair rental', 'Makeup artist',
      'Event venue', 'Transport for events'
    ]
  }
];

async function main() {
  console.log('Seeding massive service catalog...');

  // 1. Get or create a generic provider user (System Admin or generic provider)
  let provider = await prisma.user.findFirst({ where: { role: 'PROVIDER' } });
  if (!provider) {
    provider = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  }

  const providerId = provider?.user_id || 1; // Fallback to 1

  // Set to keep track of added services to avoid duplicates globally if desired, 
  // but since they are namespaced by category we can just rely on the sets defined above.

  for (const group of lifeCycleData) {
    // Upsert Category
    const category = await prisma.category.upsert({
      where: { name: group.category },
      update: {},
      create: {
        name: group.category,
        type: 'SERVICE',
        is_active: true
      }
    });

    // Add services
    for (const serviceName of group.services) {
      // Check if service already exists for this provider to prevent duplicates
      const exists = await prisma.service.findFirst({
        where: { title: serviceName, category_id: category.category_id }
      });

      if (!exists) {
        await prisma.service.create({
          data: {
            title: serviceName,
            category_id: category.category_id,
            provider_id: providerId,
            description: `Official ${serviceName} service.`,
            status: 'APPROVED',
            is_available: true,
            price: 0, // 0 signifies standard/free or negotiable
            district: 'All Districts'
          }
        });
      }
    }
  }

  console.log('Successfully seeded service catalog.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
