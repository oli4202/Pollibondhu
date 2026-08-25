import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Sprout,
  Info,
  ExternalLink,
  Bell,
  BellOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/feedback/ToastProvider';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/utils/api';

type MarketPrice = {
  price_id: number;
  price: string;
  unit: string;
  change_pct: number;
  market_name: string;
  recorded_at: string;
  crop?: { name: string; name_bn?: string };
};

type CropAdvice = {
  advice_id: number;
  title: string;
  content: string;
  created_at: string;
  expert?: { user?: { full_name: string } };
};

type Seed = {
  seed_id: number;
  name: string;
  variety?: string;
  price?: number;
  crop?: { name: string };
};

type CommodityData = {
  crop_id: number;
  name: string;
  name_bn?: string;
  season?: string;
  description?: string;
  image_url?: string;
  market_prices: MarketPrice[];
  crop_advices: CropAdvice[];
  seeds: Seed[];
};

const cropEmoji: Record<string, string> = {
  Potato: '🥔',
  'Boro Paddy': '🌾',
  Mustard: '🌼',
  'Aman Paddy': '🌾',
  Wheat: '🌿',
  Onion: '🧅',
  Garlic: '🧄',
  'Green Chili': '🌶️',
  Mung: '🫘',
  Soybean: '🫛',
  Rice: '🍚',
 default: '🌱',
};

export default function CommodityDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [commodity, setCommodity] = useState<CommodityData | null>(null);
  const [livePrices, setLivePrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(5);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    setError(null);

    const decodedName = decodeURIComponent(name);

    // Fetch commodity detail + live prices in parallel
    Promise.all([
      api.get(`/agriculture/commodity/${encodeURIComponent(decodedName)}`).catch(() => ({ data: { data: null } })),
      api.get('/agriculture/live-prices').catch(() => ({ data: { data: { prices: [] } } })),
    ])
      .then(([detailRes, liveRes]) => {
        setCommodity(detailRes.data.data);
        // Filter live prices to match this commodity
        const allLive = liveRes.data.data?.prices || [];
        const filtered = allLive.filter((p: any) => {
          const pc = (p.commodity || '').toLowerCase();
          return pc.includes(decodedName.toLowerCase()) || decodedName.toLowerCase().includes(pc);
        });
        setLivePrices(filtered.length > 0 ? filtered : allLive.slice(0, 10));
      })
      .catch(() => setError('Failed to load commodity details'))
      .finally(() => setLoading(false));

    // Check subscription status
    if (user) {
      api.get(`/price-alerts/check?commodity=${encodeURIComponent(decodedName)}`)
        .then(r => setIsSubscribed(r.data.data?.subscribed ?? false))
        .catch(() => {});
    }
  }, [name, user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !commodity) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16 text-center">
        <div className="text-6xl mb-4">🌾</div>
        <h1 className="text-2xl font-bold text-earth-900">Commodity Not Found</h1>
        <p className="mt-2 text-earth-500">
          The commodity "{decodeURIComponent(name || '')}" could not be found.
        </p>
        <Link
          to="/marketplace"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition"
        >
          <ArrowLeft size={16} /> Back to Market
        </Link>
      </div>
    );
  }

  const latestPrice = commodity.market_prices[0];
  const previousPrice = commodity.market_prices[1];
  const priceTrend =
    latestPrice && previousPrice
      ? Number(latestPrice.price) - Number(previousPrice.price)
      : 0;

  // Prepare chart data
  const chartData = [...commodity.market_prices]
    .reverse()
    .map((p) => ({
      date: new Date(p.recorded_at).toLocaleDateString('en-BD', {
        month: 'short',
        day: 'numeric',
      }),
      price: Number(p.price),
      market: p.market_name,
    }));

  const emoji = cropEmoji[commodity.name] || cropEmoji.default;

  const toggleSubscription = async () => {
    if (!user) {
      addToast('Please log in to set price alerts', 'error');
      return;
    }
    try {
      if (isSubscribed) {
        await api.post('/price-alerts/unsubscribe', { commodity: commodity.name });
        setIsSubscribed(false);
        addToast(`Unsubscribed from ${commodity.name} price alerts`);
      } else {
        await api.post('/price-alerts/subscribe', { commodity: commodity.name, threshold_pct: alertThreshold });
        setIsSubscribed(true);
        addToast(`Subscribed to ${commodity.name} price alerts (≥${alertThreshold}% change)`, 'success');
      }
    } catch {
      addToast('Failed to update subscription', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 text-earth-900">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-earth-500 hover:text-emerald-700 transition"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-4xl">
              {emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{commodity.name}</h1>
              {commodity.name_bn && (
                <p className="text-sm text-earth-500">{commodity.name_bn}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {commodity.season && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    {commodity.season} Season
                  </span>
                )}
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  📡 Live Prices
                </span>
              </div>
            </div>
          </div>

          {/* Current Price Card */}
          {latestPrice && (
            <div className="ml-auto rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg md:min-w-[240px]">
              <p className="text-xs font-medium text-emerald-100">Current Price</p>
              <p className="mt-1 text-3xl font-bold">
                ৳{latestPrice.price}
                <span className="ml-1 text-sm font-normal text-emerald-200">
                  / {latestPrice.unit}
                </span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                    priceTrend >= 0
                      ? 'bg-white/20 text-emerald-100'
                      : 'bg-white/20 text-rose-200'
                  }`}
                >
                  {priceTrend >= 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}{' '}
                  {latestPrice.change_pct >= 0 ? '+' : ''}
                  {latestPrice.change_pct}%
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-200">
                  <MapPin size={12} /> {latestPrice.market_name}
                </span>
              </div>

              {/* Subscribe to alerts button */}
              <div className="mt-4 border-t border-white/20 pt-3">
                <div className="flex items-center gap-2">
                  <select
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="rounded-lg bg-white/20 px-2 py-1 text-xs text-white outline-none border-none"
                  >
                    <option value={3}>≥3%</option>
                    <option value={5}>≥5%</option>
                    <option value={10}>≥10%</option>
                    <option value={15}>≥15%</option>
                  </select>
                  <button
                    onClick={toggleSubscription}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isSubscribed
                        ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {isSubscribed ? <BellOff size={13} /> : <Bell size={13} />} 
                    {isSubscribed ? 'Unsubscribe' : 'Get Alerts'}
                  </button>
                </div>
                {isSubscribed && (
                  <p className="mt-1.5 text-[10px] text-emerald-200">You'll be notified when price changes ≥{alertThreshold}%</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {commodity.description && (
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-2">
              <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-amber-800">Crop Advisory</p>
                <p className="mt-1 text-sm leading-6 text-earth-700">
                  {commodity.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price History Chart */}
      {chartData.length > 1 && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">📈 Price History</h2>
          <p className="mt-1 text-sm text-earth-500">
            Price trend over the last {chartData.length} recorded periods
          </p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`৳${value}`, 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#047857' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Live Market Prices Table */}
      {livePrices.length > 0 && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-earth-100 bg-emerald-50/30">
            <h2 className="text-lg font-bold text-emerald-900">
              📡 Live Market Prices (DAM)
            </h2>
            <p className="text-sm text-earth-500 mt-1">
              Real-time prices from the Department of Agricultural Marketing
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-earth-50 text-earth-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Commodity</th>
                  <th className="px-5 py-3 font-semibold">Low Price</th>
                  <th className="px-5 py-3 font-semibold">High Price</th>
                  <th className="px-5 py-3 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {livePrices.map((lp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-earth-50/50">
                    <td className="px-5 py-4 font-semibold text-earth-900">
                      {lp.commodity}
                    </td>
                    <td className="px-5 py-4 text-earth-600">৳{lp.lowPrice}</td>
                    <td className="px-5 py-4 font-bold">৳{lp.highPrice}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                          lp.changePct >= 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {lp.changePct >= 0 ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}{' '}
                        {Math.abs(lp.changePct)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seeds Section */}
      {commodity.seeds.length > 0 && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">🌱 Available Seeds</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {commodity.seeds.map((seed) => (
              <div
                key={seed.seed_id}
                className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"
              >
                <div className="flex items-start justify-between">
                  <Sprout size={20} className="text-emerald-600" />
                  {seed.price && (
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-emerald-700">
                      ৳{seed.price}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-bold">{seed.name}</h3>
                {seed.variety && (
                  <p className="text-xs text-earth-500">{seed.variety}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Crop Advice */}
      {commodity.crop_advices.length > 0 && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">📋 Expert Advice</h2>
          <div className="mt-4 space-y-4">
            {commodity.crop_advices.map((advice) => (
              <div
                key={advice.advice_id}
                className="rounded-xl border border-earth-100 bg-earth-50 p-4"
              >
                <h3 className="text-sm font-bold">{advice.title}</h3>
                <p className="mt-2 text-sm leading-6 text-earth-600">
                  {advice.content}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-earth-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(advice.created_at).toLocaleDateString('en-BD')}
                  </span>
                  {advice.expert?.user?.full_name && (
                    <span>By {advice.expert.user.full_name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Data Source Link */}
      <div className="mt-8 text-center">
        <a
          href="https://market.dam.gov.bd/market_daily_price_report?L=E"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-earth-400 hover:text-emerald-600 transition"
        >
          <ExternalLink size={14} />
          Data sourced from Department of Agricultural Marketing, Bangladesh
        </a>
      </div>
    </div>
  );
}
