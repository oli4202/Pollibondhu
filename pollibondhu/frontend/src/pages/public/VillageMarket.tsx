import { useEffect, useState } from 'react';
import {
  Search,
  MapPin,
  Phone,
  Plus,
  X,
  ShoppingCart,
  Tag,
  Tractor,
  Home,
  Truck,
  Package,
  Leaf,
  Clock,
  Filter,
  ChevronDown,
} from 'lucide-react';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/feedback/ToastProvider';

type Listing = {
  listing_id: number;
  title: string;
  description: string | null;
  type: string;
  category: string;
  price: string | null;
  price_type: string | null;
  location: string | null;
  district: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  user: {
    user_id: number;
    full_name: string;
    phone: string | null;
    district: string | null;
    upazila: string | null;
  };
};

const TABS = [
  { id: 'all', label: 'All', emoji: '🏪' },
  { id: 'SELL', label: 'For Sale', emoji: '💰' },
  { id: 'BUY', label: 'Wanted', emoji: '🔍' },
  { id: 'RENT', label: 'Rent', emoji: '🏠' },
];

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories', icon: Package },
  { id: 'CROP', label: 'Crops & Produce', icon: Leaf },
  { id: 'LIVESTOCK', label: 'Livestock', icon: Package },
  { id: 'EQUIPMENT', label: 'Equipment', icon: Tractor },
  { id: 'LAND', label: 'Land', icon: Home },
  { id: 'VEHICLE', label: 'Vehicles', icon: Truck },
  { id: 'HOUSEHOLD', label: 'Household', icon: Package },
  { id: 'OTHER', label: 'Other', icon: Tag },
];

const categoryEmojis: Record<string, string> = {
  CROP: '🌾',
  LIVESTOCK: '🐄',
  EQUIPMENT: '🚜',
  LAND: '🏞️',
  VEHICLE: '🚛',
  HOUSEHOLD: '🏠',
  OTHER: '📦',
};

const typeColors: Record<string, string> = {
  SELL: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  BUY: 'bg-blue-100 text-blue-700 border-blue-200',
  RENT: 'bg-amber-100 text-amber-700 border-amber-200',
};

const priceTypeLabels: Record<string, string> = {
  FIXED: '',
  NEGOTIABLE: '(Negotiable)',
  PER_DAY: '/day',
  PER_MONTH: '/month',
  PER_KG: '/kg',
};

export default function VillageMarket() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Listing | null>(null);

  // Create form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'SELL',
    category: 'CROP',
    price: '',
    price_type: 'FIXED',
    location: '',
    district: '',
    phone: '',
  });

  const fetchListings = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (activeTab !== 'all') params.type = activeTab;
    if (activeCategory !== 'ALL') params.category = activeCategory;
    if (search) params.search = search;

    api.get('/listings', { params })
      .then((r) => setListings(r.data.data?.data || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, [activeTab, activeCategory]);

  const handleSearch = () => fetchListings();

  const handleCreate = () => {
    if (!form.title) {
      addToast('Please enter a title', 'error');
      return;
    }
    api.post('/listings', {
      ...form,
      price: form.price ? parseFloat(form.price) : null,
    })
      .then(() => {
        addToast('Listing posted successfully!', 'success');
        setShowCreateModal(false);
        setForm({
          title: '', description: '', type: 'SELL', category: 'CROP',
          price: '', price_type: 'FIXED', location: '', district: '', phone: '',
        });
        fetchListings();
      })
      .catch(() => addToast('Failed to post listing', 'error'));
  };

  const formatPrice = (listing: Listing) => {
    if (!listing.price) return 'Contact';
    const pt = priceTypeLabels[listing.price_type || ''] || '';
    return `৳${Number(listing.price).toLocaleString()} ${pt}`.trim();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 text-earth-900">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold">
            🏪 গ্রামীণ বাজার <span className="text-earth-400">— Village Market</span>
          </h1>
          <p className="mt-1 text-sm text-earth-500">
            Buy, sell, and rent within your community. Direct from villagers.
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
          >
            <Plus size={18} /> Post Listing
          </button>
        )}
      </div>

      {/* Type Tabs */}
      <div className="mt-8 flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-earth-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-earth-500 hover:text-earth-700 hover:bg-earth-50'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Category Filters + Search */}
      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeCategory === cat.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-earth-100 text-earth-600 hover:bg-emerald-50'
                }`}
              >
                {cat.id !== 'ALL' && cat.id !== 'HOUSEHOLD' && cat.id !== 'OTHER' ? (
                  <span>{categoryEmojis[cat.id]}</span>
                ) : (
                  <Icon size={14} />
                )}{' '}
                {cat.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search listings..."
              className="w-full rounded-xl border border-earth-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          listings.map((listing) => (
            <article
              key={listing.listing_id}
              onClick={() => setShowDetail(listing)}
              className="group cursor-pointer rounded-2xl border border-earth-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
            >
              {/* Top row: badge + category */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                    typeColors[listing.type] || 'bg-earth-100 text-earth-600'
                  }`}
                >
                  {listing.type === 'SELL' ? '💰 For Sale' : listing.type === 'BUY' ? '🔍 Wanted' : '🏠 Rent'}
                </span>
                <span className="text-lg">{categoryEmojis[listing.category] || '📦'}</span>
              </div>

              {/* Title */}
              <h3 className="mt-3 text-base font-bold leading-snug group-hover:text-emerald-700 transition line-clamp-2">
                {listing.title}
              </h3>

              {/* Description */}
              {listing.description && (
                <p className="mt-2 text-xs leading-5 text-earth-500 line-clamp-2">
                  {listing.description}
                </p>
              )}

              {/* Price */}
              <div className="mt-3 text-lg font-bold text-emerald-700">
                {formatPrice(listing)}
              </div>

              {/* Footer: seller + location */}
              <div className="mt-4 flex items-center justify-between border-t border-earth-100 pt-3">
                <div className="flex items-center gap-2 text-xs text-earth-500">
                  <MapPin size={12} />
                  <span>{listing.location || listing.district || 'Bangladesh'}</span>
                </div>
                <span className="flex items-center gap-1 text-xs text-earth-400">
                  <Clock size={12} /> {timeAgo(listing.created_at)}
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      {!loading && listings.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <p className="text-earth-500">No listings found. Be the first to post!</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                  typeColors[showDetail.type] || ''
                }`}
              >
                {showDetail.type === 'SELL' ? '💰 For Sale' : showDetail.type === 'BUY' ? '🔍 Wanted' : '🏠 Rent'}
              </span>
              <button
                onClick={() => setShowDetail(null)}
                className="text-earth-400 hover:text-earth-700"
              >
                <X size={19} />
              </button>
            </div>

            <h2 className="mt-4 text-xl font-bold">{showDetail.title}</h2>

            <div className="mt-1 text-2xl font-bold text-emerald-700">
              {formatPrice(showDetail)}
            </div>

            {showDetail.description && (
              <p className="mt-4 text-sm leading-6 text-earth-600">{showDetail.description}</p>
            )}

            {/* Seller Info */}
            <div className="mt-6 rounded-xl bg-earth-50 p-4">
              <p className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-2">Seller</p>
              <p className="text-sm font-bold">{showDetail.user.full_name}</p>
              <div className="mt-2 space-y-1">
                {showDetail.location && (
                  <p className="flex items-center gap-2 text-xs text-earth-500">
                    <MapPin size={13} /> {showDetail.location}, {showDetail.district || ''}
                  </p>
                )}
                {showDetail.phone && (
                  <p className="flex items-center gap-2 text-xs text-earth-500">
                    <Phone size={13} /> {showDetail.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Action */}
            {showDetail.phone && (
              <a
                href={`tel:${showDetail.phone}`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition"
              >
                <Phone size={16} /> Call Now
              </a>
            )}

            <p className="mt-3 text-center text-xs text-earth-400">
              Posted {timeAgo(showDetail.created_at)}
            </p>
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl my-8">
            <div className="px-6 py-5 border-b border-earth-100 flex justify-between items-center bg-earth-50/50 rounded-t-3xl">
              <h2 className="text-lg font-bold text-earth-900">📦 Post a Listing</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-earth-400 hover:text-earth-700 bg-white rounded-full p-1 shadow-sm border border-earth-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="text-xs font-bold text-earth-600">Listing Type *</label>
                <div className="mt-1.5 flex gap-2">
                  {['SELL', 'BUY', 'RENT'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-bold border-2 transition ${
                        form.type === t
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-earth-200 text-earth-500 hover:border-emerald-300'
                      }`}
                    >
                      {t === 'SELL' ? '💰 Sell' : t === 'BUY' ? '🔍 Buy' : '🏠 Rent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-earth-600">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <label className="block">
                <span className="text-xs font-bold text-earth-600">Title *</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Fresh Boro Rice - 50kg bags"
                />
              </label>

              {/* Description */}
              <label className="block">
                <span className="text-xs font-bold text-earth-600">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none min-h-[80px]"
                  placeholder="Describe your item, condition, etc."
                />
              </label>

              {/* Price + Price Type */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-earth-600">Price (৳)</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="0"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-earth-600">Price Type</span>
                  <select
                    value={form.price_type}
                    onChange={(e) => setForm({ ...form, price_type: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="NEGOTIABLE">Negotiable</option>
                    <option value="PER_DAY">Per Day</option>
                    <option value="PER_MONTH">Per Month</option>
                    <option value="PER_KG">Per Kg</option>
                  </select>
                </label>
              </div>

              {/* Location + District */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-earth-600">Location</span>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Rajshahi Sadar"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-earth-600">District</span>
                  <input
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Rajshahi"
                  />
                </label>
              </div>

              {/* Phone */}
              <label className="block">
                <span className="text-xs font-bold text-earth-600">Contact Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="01XXXXXXXXX"
                />
              </label>
            </div>

            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-xl border border-earth-200 py-3 text-sm font-bold text-earth-700 hover:bg-earth-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
              >
                Post Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
