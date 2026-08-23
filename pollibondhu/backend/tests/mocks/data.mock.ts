export const mockUser = {
  user_id: 1,
  email: 'rahim@pollibondhu.test',
  password_hash: '$2a$12$hashedpassword',
  full_name: 'Rahim Uddin',
  phone: '01711111111',
  role: 'USER',
  is_active: true,
  district: 'Dinajpur',
  created_at: new Date(),
  updated_at: new Date(),
};

export const mockAdmin = {
  user_id: 2,
  email: 'admin@pollibondhu.test',
  password_hash: '$2a$12$hashedpassword',
  full_name: 'Admin User',
  phone: '01722222222',
  role: 'ADMIN',
  is_active: true,
  district: 'Dhaka',
  created_at: new Date(),
  updated_at: new Date(),
};

export const mockProvider = {
  user_id: 3,
  email: 'karim@pollibondhu.test',
  password_hash: '$2a$12$hashedpassword',
  full_name: 'Karim Agro',
  phone: '01733333333',
  role: 'PROVIDER',
  is_active: true,
  district: 'Rajshahi',
  created_at: new Date(),
  updated_at: new Date(),
};

export const mockService = {
  service_id: 1,
  provider_id: 3,
  title: 'Power Tiller Rental',
  description: 'Rent power tiller for your field',
  price: 500.00,
  district: 'Rajshahi',
  status: 'PENDING',
  is_available: true,
  created_at: new Date(),
  updated_at: new Date(),
};

export const mockComplaint = {
  complaint_id: 1,
  user_id: 1,
  category: 'Infrastructure',
  subject: 'Road damage',
  description: 'The main road to the bazaar is damaged.',
  status: 'PENDING',
  priority: 'HIGH',
  submitted_at: new Date(),
  reviewed_by: null,
  resolution_notes: null,
  resolved_at: null,
};
