import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, MapPin, Search, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import api from '@/utils/api';
import MarketPriceAI from '@/components/ai/MarketPriceAI';

type MarketPrice = { price_id: number; price: string; unit: string; change_pct: number; market_name: string; crop: { name: string; name_bn?: string } };
type LivePrice = { commodity: string; lowPrice: number; highPrice: number; changePct: number };

export default function Marketplace() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [livePrices, setLivePrices] = useState<LivePrice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [sortHigh, setSortHigh] = useState(false);
  const [activeTab, setActiveTab] = useState<'db' | 'live'>('db');

  useEffect(() => {
    api.get('/agriculture/market-prices').then(r => setPrices(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const fetchLivePrices = () => {
    setLiveLoading(true);
    api.get('/agriculture/live-prices')
      .then(r => setLivePrices(r.data.data?.prices || []))
      .catch(() => setLivePrices([]))
      .finally(() => setLiveLoading(false));
  };

  useEffect(() => {
    fetchLivePrices();
  }, []);

  const filtered = useMemo(() =>
    prices.filter(p => `${p.crop.name} ${p.market_name}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => sortHigh ? Number(b.price) - Number(a.price) : Number(a.price) - Number(b.price)),
    [prices, search, sortHigh]
  );

  const filteredLive = useMemo(() =>
    livePrices.filter(p => p.commodity.toLowerCase().includes(search.toLowerCase())),
    [livePrices, search]
  );

  const handleCommodityClick = (cropName: string) => {
    navigate(`/commodity/${encodeURIComponent(cropName)}`);
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-head">
        <p className="market-eyebrow">Live market board</p>
        <h1>Today's fair market prices</h1>
        <p>Compare current crop rates from local markets before you sell.</p>
      </div>

      {/* AI Price Analysis */}
      <div className="mt-6">
        <MarketPriceAI />
      </div>

      {/* Tab Switcher */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setActiveTab('db')}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${activeTab === 'db' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-earth-100 text-earth-600 hover:bg-earth-200'}`}
        >
          🌾 Our Markets
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${activeTab === 'live' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-earth-100 text-earth-600 hover:bg-earth-200'}`}
        >
          📡 Live DAM Prices
        </button>
      </div>

      <div className="market-controls">
        <label>
          <Search size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crop or market" />
        </label>
        <div className="flex gap-2">
          {activeTab === 'db' && (
            <button onClick={() => setSortHigh(!sortHigh)}>
              Price {sortHigh ? 'high to low' : 'low to high'} <TrendingUp size={16} />
            </button>
          )}
          {activeTab === 'live' && (
            <button onClick={fetchLivePrices} disabled={liveLoading}>
              <RefreshCw size={16} className={liveLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Database Market Prices */}
      {activeTab === 'db' && (
        <div className="market-table">
          <div className="market-table-head">
            <span>Crop & market</span>
            <span>Today's price</span>
            <span>Movement</span>
          </div>
          {loading ? (
            <p className="market-loading">Loading market prices…</p>
          ) : (
            filtered.map(item => (
              <div
                className="market-table-row cursor-pointer hover:bg-emerald-50/50 transition"
                key={item.price_id}
                onClick={() => handleCommodityClick(item.crop.name)}
              >
                <span className="crop-name">
                  <i /> <b>{item.crop.name}</b>
                  {item.crop.name_bn && <small className="text-earth-400">{item.crop.name_bn}</small>}
                  <small><MapPin size={13} />{item.market_name}</small>
                </span>
                <strong>৳{item.price}<small> / {item.unit}</small></strong>
                <em className={item.change_pct >= 0 ? 'up' : 'down'}>
                  {item.change_pct >= 0 ? <ArrowUp size={15} /> : <ArrowDown size={15} />} {Math.abs(item.change_pct)}%
                </em>
              </div>
            ))
          )}
          {!loading && !filtered.length && <p className="market-loading">No market prices match your search.</p>}
        </div>
      )}

      {/* Live DAM Prices */}
      {activeTab === 'live' && (
        <div className="market-table">
          <div className="market-table-head">
            <span>Commodity (DAM)</span>
            <span>Price Range</span>
            <span>Movement</span>
          </div>
          {liveLoading ? (
            <p className="market-loading">Fetching live prices from DAM…</p>
          ) : (
            filteredLive.map((item, idx) => (
              <div
                className="market-table-row cursor-pointer hover:bg-emerald-50/50 transition"
                key={idx}
                onClick={() => handleCommodityClick(item.commodity.split('-')[0])}
              >
                <span className="crop-name">
                  <i /> <b>{item.commodity}</b>
                  <small><MapPin size={13} />Dhaka DAM</small>
                </span>
                <strong>৳{item.lowPrice} - ৳{item.highPrice}<small> / kg</small></strong>
                <em className={item.changePct >= 0 ? 'up' : 'down'}>
                  {item.changePct >= 0 ? <ArrowUp size={15} /> : <ArrowDown size={15} />} {Math.abs(item.changePct)}%
                </em>
              </div>
            ))
          )}
          {!liveLoading && !filteredLive.length && <p className="market-loading">No live prices match your search.</p>}

          {/* Source attribution */}
          <div className="p-4 text-center border-t border-earth-100">
            <a
              href="https://market.dam.gov.bd/market_daily_price_report?L=E"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-earth-400 hover:text-emerald-600 transition"
            >
              <ExternalLink size={12} />
              Data from Department of Agricultural Marketing, Bangladesh
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
