import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PolliBondhu database...');

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pollibondhu.test',
      password_hash: await hashPassword('admin123'),
      full_name: 'System Administrator',
      phone: '01710000000',
      nid: '1234567890',
      role: 'ADMIN',
      district: 'Dhaka',
      division: 'Dhaka',
      is_active: true,
    },
  });

  // Provider
  const provider = await prisma.user.create({
    data: {
      email: 'provider@pollibondhu.test',
      password_hash: await hashPassword('provider123'),
      full_name: 'Karim Agro Services',
      phone: '01711111111',
      nid: '9876543210',
      role: 'PROVIDER',
      district: 'Rajshahi',
      division: 'Rajshahi',
      is_active: true,
    },
  });

  // Users
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'rahim@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Rahim Uddin', phone: '01722222222', role: 'USER', district: 'Dinajpur', division: 'Rangpur', is_active: true } }),
    prisma.user.create({ data: { email: 'sultana@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Sultana Begum', phone: '01733333333', role: 'USER', district: 'Jhalokati', division: 'Barisal', is_active: true } }),
    prisma.user.create({ data: { email: 'abdur@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Abdur Rahman', phone: '01744444444', role: 'USER', district: "Cox's Bazar", division: 'Chittagong', is_active: true } }),
    prisma.user.create({ data: { email: 'fatema@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Fatema Khatun', phone: '01755555555', role: 'USER', district: 'Khulna', division: 'Khulna', is_active: true } }),
    prisma.user.create({ data: { email: 'hasan@pollibondhu.test', password_hash: await hashPassword('user123'), full_name: 'Hasan Ali', phone: '01766666666', role: 'USER', district: 'Sylhet', division: 'Sylhet', is_active: true } }),
  ]);

  // Categories
  const [agriCat, citizenCat, forumCat, healthCat] = await Promise.all([
    prisma.category.create({ data: { name: 'Agriculture', type: 'SERVICE', is_active: true } }),
    prisma.category.create({ data: { name: 'Citizen', type: 'SERVICE', is_active: true } }),
    prisma.category.create({ data: { name: 'General', type: 'FORUM', is_active: true } }),
    prisma.category.create({ data: { name: 'Health', type: 'SERVICE', is_active: true } }),
  ]);

  // Crops
  const crops = await Promise.all([
    prisma.crop.create({ data: { name: 'Boro Paddy', name_bn: 'বোরো ধান', season: 'Rabi', description: 'Ideal sowing time mid-November to December. Use BRRI dhan28 or BRRI dhan29.', category_id: agriCat.category_id } }),
    prisma.crop.create({ data: { name: 'Mustard', name_bn: 'সরিষা', season: 'Rabi', description: 'Apply 100kg urea per hectare at 20-25 days after sowing.', category_id: agriCat.category_id } }),
    prisma.crop.create({ data: { name: 'Potato', name_bn: 'আলু', season: 'Rabi', description: 'Late blight disease risk is high due to foggy weather. Apply Mancozeb.', category_id: agriCat.category_id } }),
    prisma.crop.create({ data: { name: 'Aman Paddy', name_bn: 'আমন ধান', season: 'Kharif', description: 'Transplant seedlings in July-August. Use BRRI dhan49 for flood-prone areas.', category_id: agriCat.category_id } }),
    prisma.crop.create({ data: { name: 'Wheat', name_bn: 'গম', season: 'Rabi', description: 'Sow by mid-November. Use BARI Gom-28 for higher yield.', category_id: agriCat.category_id } }),
  ]);

  // Services
  const services = await Promise.all([
    prisma.service.create({ data: { provider_id: provider.user_id, category_id: agriCat.category_id, title: 'Power Tiller Rental', description: 'Rent power tiller for your field. 500 BDT per hour.', price: 500.00, district: 'Rajshahi', status: 'APPROVED', is_available: true } }),
    prisma.service.create({ data: { provider_id: provider.user_id, category_id: agriCat.category_id, title: 'Seed Supply - BRRI Dhan28', description: 'High quality Boro paddy seeds available.', price: 85.00, district: 'Rajshahi', status: 'APPROVED', is_available: true } }),
    prisma.service.create({ data: { provider_id: provider.user_id, category_id: citizenCat.category_id, title: 'Land Survey Service', description: 'Professional land measurement and khatian correction.', price: 1500.00, district: 'Rajshahi', status: 'PENDING', is_available: true } }),
    prisma.service.create({ data: { provider_id: users[0].user_id, category_id: healthCat.category_id, title: 'Mobile Health Camp', description: 'Free health checkup camp in rural areas.', district: 'Dinajpur', status: 'APPROVED', is_available: true } }),
  ]);

  // Market Prices
  await Promise.all([
    prisma.marketPrice.create({ data: { crop_id: crops[0].crop_id, market_name: 'Dhaka Central Market', price: 2100.00, unit: '50kg', change_pct: 2.3 } }),
    prisma.marketPrice.create({ data: { crop_id: crops[2].crop_id, market_name: 'Dhaka Central Market', price: 28.00, unit: 'kg', change_pct: 5.2 } }),
    prisma.marketPrice.create({ data: { crop_id: crops[1].crop_id, market_name: 'Rajshahi Market', price: 82.00, unit: 'kg', change_pct: -1.1 } }),
    prisma.marketPrice.create({ data: { crop_id: crops[4].crop_id, market_name: 'Dhaka Central Market', price: 1850.00, unit: '50kg', change_pct: -0.8 } }),
  ]);

  // Forum Posts
  await Promise.all([
    prisma.forumPost.create({ data: { user_id: users[0].user_id, category_id: forumCat.category_id, title: 'Boro paddy blast disease — how to control it organically?', content: 'I am seeing brownish spots on my paddy leaves after the fog last week. What organic treatments can I use?', tags: JSON.stringify(['Paddy', 'Disease', 'Organic Farming']), status: 'APPROVED', likes: 24, views: 347 } }),
    prisma.forumPost.create({ data: { user_id: users[1].user_id, category_id: forumCat.category_id, title: 'Fertilizer subsidy distribution schedule — December 2024', content: 'Dear farmers, subsidy fertilizer will be distributed at your local UP complex from Dec 22-28.', tags: JSON.stringify(['Subsidy', 'Fertilizer', 'Official']), status: 'APPROVED', likes: 89, views: 892 } }),
    prisma.forumPost.create({ data: { user_id: users[2].user_id, category_id: forumCat.category_id, title: 'Water logging problem in Harinathpur village road', content: 'The road from Harinathpur bazaar to the school gets flooded every rain. Children cannot reach school safely.', tags: JSON.stringify(['Infrastructure', 'Flood', 'Community Issue']), status: 'APPROVED', likes: 43, views: 265 } }),
  ]);

  // Complaints
  await Promise.all([
    prisma.complaint.create({ data: { user_id: users[0].user_id, category: 'Infrastructure', subject: 'Road damage in Naichity', description: 'The main road to the bazaar is severely damaged.', status: 'PENDING', priority: 'HIGH' } }),
    prisma.complaint.create({ data: { user_id: users[1].user_id, category: 'Agriculture', subject: 'Fertilizer shortage', description: 'Local dealers are not getting enough urea supply.', status: 'REVIEWING', priority: 'MEDIUM' } }),
    prisma.complaint.create({ data: { user_id: users[2].user_id, category: 'Health', subject: 'Doctor absent at Union Health Center', description: 'The assigned doctor has been absent for 3 days.', status: 'RESOLVED', priority: 'HIGH', reviewed_by: admin.user_id, resolution_notes: 'Replacement doctor appointed.', resolved_at: new Date() } }),
  ]);

  // Expert
  const expert = await prisma.expert.create({
    data: { user_id: users[0].user_id, specialization: 'Rice Cultivation', bio: '20 years experience in Boro and Aman paddy cultivation.', rating: 4.8, is_verified: true },
  });

  // Weather
  await Promise.all([
    prisma.weather.create({ data: { district: 'Dhaka', temperature: 28, condition: 'Partly Cloudy', humidity: 78, rainfall: 12, uv_index: 'High', updated_by: admin.user_id } }),
    prisma.weather.create({ data: { district: 'Rajshahi', temperature: 26, condition: 'Sunny', humidity: 65, rainfall: 0, uv_index: 'Very High', updated_by: admin.user_id } }),
    prisma.weather.create({ data: { district: 'Dinajpur', temperature: 24, condition: 'Foggy', humidity: 85, rainfall: 5, uv_index: 'Low', updated_by: admin.user_id } }),
  ]);

  // Crop Advice
  await Promise.all([
    prisma.cropAdvice.create({ data: { expert_id: expert.expert_id, crop_id: crops[0].crop_id, title: 'Boro Paddy Sowing Guide', content: 'Sow seeds in seedbed by mid-November. Use 40kg seeds per hectare.' } }),
    prisma.cropAdvice.create({ data: { expert_id: expert.expert_id, crop_id: crops[2].crop_id, title: 'Potato Disease Alert', content: 'Apply Mancozeb or Ridomil at 7-day intervals. Remove infected plants immediately.' } }),
  ]);

  // Certificates
  await Promise.all([
    prisma.certificate.create({ data: { user_id: users[0].user_id, cert_type: 'TRAINING', status: 'APPROVED', approved_by: admin.user_id, approved_at: new Date() } }),
    prisma.certificate.create({ data: { user_id: users[1].user_id, cert_type: 'BIRTH', status: 'PENDING' } }),
  ]);

  // Polls
  const poll = await prisma.poll.create({
    data: { question: 'Best irrigation method for Boro paddy?', options: JSON.stringify(['Flood Irrigation', 'Drip Irrigation', 'Sprinkler', 'Alternate Wetting & Drying']), is_active: true, created_by: admin.user_id },
  });

  // Votes
  await prisma.vote.create({ data: { user_id: users[0].user_id, poll_id: poll.poll_id, choice: 'Alternate Wetting & Drying' } });
  await prisma.vote.create({ data: { user_id: users[1].user_id, poll_id: poll.poll_id, choice: 'Drip Irrigation' } });

  // Notifications
  await Promise.all([
    prisma.notification.create({ data: { user_id: users[0].user_id, type: 'IN_APP', title: 'Welcome to PolliBondhu', message: 'Your account has been created successfully.' } }),
    prisma.notification.create({ data: { user_id: provider.user_id, type: 'IN_APP', title: 'Service Approved', message: 'Your Power Tiller Rental service is now live.' } }),
  ]);

  // Audit Logs
  await Promise.all([
    prisma.auditLog.create({ data: { admin_id: admin.user_id, action: 'USER_CREATED', entity_type: 'USER', entity_id: users[0].user_id, details: JSON.stringify({ email: users[0].email }) } }),
    prisma.auditLog.create({ data: { admin_id: admin.user_id, action: 'SERVICE_APPROVED', entity_type: 'SERVICE', entity_id: services[0].service_id, details: JSON.stringify({ title: services[0].title }) } }),
  ]);

  console.log('✅ Seed completed successfully!');
  console.log(`   Admin: ${admin.email} / admin123`);
  console.log(`   Provider: ${provider.email} / provider123`);
  console.log(`   Users: ${users.map(u => u.email + ' / user123').join(', ')}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
