import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CloudSun, Droplets, Sprout, TrendingDown, TrendingUp, Wind, X, CheckCircle, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '@/utils/api';
import { useToast } from '@/components/feedback/ToastProvider';

type Crop = { crop_id: number; name: string; name_bn?: string; season?: string; description: string };
type Price = { price_id: number; price: string; unit: string; change_pct: number; market_name: string; crop?: { name: string } };
type Weather = { district: string; temperature: number; condition: string; humidity: number; rainfall: number; uv_index: string };
const cropEmoji: Record<string, string> = { Potato: '🥔', 'Boro Paddy': '🌾', Mustard: '🌼', 'Aman Paddy': '🌾', Wheat: '🌿' };

const TABS = [
  { id: 'advisory', label: 'Crop Advisory', emoji: '🌱' },
  { id: 'market', label: 'Market Prices', emoji: '💰' },
  { id: 'weather', label: 'Agri Weather', emoji: '🌦️' },
  { id: 'subsidies', label: 'Subsidies', emoji: '🏛️' },
  { id: 'soil', label: 'Soil Testing', emoji: '🧪' },
];

export default function AgriculturePage() {
  const [activeTab, setActiveTab] = useState('advisory');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Advisory Tab State
  const [filter, setFilter] = useState('All crops');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  
  // Soil Test Modal State
  const [soilModalOpen, setSoilModalOpen] = useState(false);
  const [soilStep, setSoilStep] = useState(1);
  const [soilData, setSoilData] = useState({ plotSize: '', address: '', crop: '', history: '' });
  
  const { addToast } = useToast();

  useEffect(() => { 
    Promise.all([
      api.get('/agriculture/crops').catch(() => ({ data: { data: { data: [] } } })), 
      api.get('/agriculture/market-prices').catch(() => ({ data: { data: [] } })), 
      api.get('/agriculture/weather').catch(() => ({ data: { data: null } }))
    ]).then(([cropRes, priceRes, weatherRes]) => { 
      setCrops(cropRes.data.data?.data || []); 
      setPrices(priceRes.data.data || []); 
      setWeather(weatherRes.data.data || null); 
    }).finally(() => setLoading(false)); 
  }, []);

  const visibleCrops = useMemo(() => filter === 'All crops' ? crops : crops.filter(c => c.season === filter), [crops, filter]);

  const handleApplySubsidy = (name: string) => {
    addToast(`Application started for ${name}`);
  };

  const handleSoilSubmit = () => {
    addToast('Soil test request submitted successfully!', 'success');
    setSoilModalOpen(false);
    setSoilStep(1);
    setSoilData({ plotSize: '', address: '', crop: '', history: '' });
  };

  return <div className="mx-auto max-w-6xl px-5 py-10 text-earth-900">
    <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <h1 className="text-2xl font-bold">কৃষি সেবা <span className="text-earth-400">— Agriculture Services</span></h1>
        <p className="mt-1 text-sm text-earth-500">Crop guidance, local market prices, and weather information for your field.</p>
      </div>
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">🌾 Farmer support</span>
    </header>

    <div className="mt-8 flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-earth-200">
      {TABS.map(tab => (
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

    <div className="mt-6">
      {/* ADVISORY TAB */}
      {activeTab === 'advisory' && (
        <>
          <section className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600"/>
            <div>
              <b className="text-sm text-amber-800">Seasonal crop advisory</b>
              <p className="mt-1 text-xs leading-5 text-amber-700">Check your crop’s current guidance before applying fertilizer, pesticides, or irrigation.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold">Crop Advisory</h2>
              <div className="flex gap-2">
                {['All crops', 'Rabi', 'Kharif'].map(item => (
                  <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filter === item ? 'bg-emerald-700 text-white' : 'bg-earth-50 text-earth-500 hover:bg-emerald-50'}`}>
                    {item === 'All crops' ? '🌱 ' : item === 'Rabi' ? '❄️ ' : '☔ '}{item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {loading ? <p className="col-span-full py-8 text-center text-sm text-earth-400">Loading crop services…</p> : visibleCrops.map(crop => (
                <article key={crop.crop_id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{cropEmoji[crop.name] || '🌱'}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-emerald-700">{crop.season || 'Seasonal'}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-bold">{crop.name}</h3>
                  <p className="text-xs text-earth-500">{crop.name_bn}</p>
                  <p className="mt-3 min-h-[52px] text-xs leading-5 text-earth-600 line-clamp-3">{crop.description}</p>
                  <button onClick={() => setSelectedCrop(crop)} className="mt-4 w-full rounded-lg bg-emerald-700 py-2 text-xs font-bold text-white hover:bg-emerald-800">View full advisory</button>
                </article>
              ))}
            </div>
            {!loading && !visibleCrops.length && <p className="py-8 text-center text-sm text-earth-400">No crop services are available for this season.</p>}
          </section>
        </>
      )}

      {/* MARKET PRICES TAB */}
      {activeTab === 'market' && (
        <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-earth-100 bg-emerald-50/30">
            <h2 className="text-lg font-bold text-emerald-900">Live Market Prices</h2>
            <p className="text-sm text-earth-500 mt-1">Real-time mandi rates from your local markets.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-earth-50 text-earth-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Crop</th>
                  <th className="px-5 py-3 font-semibold">Market</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {prices.map(price => (
                  <tr key={price.price_id} className="hover:bg-earth-50/50">
                    <td className="px-5 py-4 font-semibold text-earth-900">{price.crop?.name || 'Crop'}</td>
                    <td className="px-5 py-4 text-earth-600">{price.market_name}</td>
                    <td className="px-5 py-4 font-bold">৳{price.price} <span className="text-xs font-normal text-earth-400">/ {price.unit}</span></td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${price.change_pct >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {price.change_pct >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {Math.abs(price.change_pct)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!prices.length && !loading && <div className="p-8 text-center text-earth-500">No market prices available.</div>}
          </div>
        </section>
      )}

      {/* WEATHER TAB */}
      {activeTab === 'weather' && (
        <section className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10">
            <p className="flex items-center gap-2 text-blue-100 font-medium"><MapPin size={16} /> {weather?.district || 'Your district'} — Today</p>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <strong className="text-6xl md:text-8xl font-bold tracking-tighter">{weather?.temperature ?? '--'}°</strong>
                <p className="mt-2 text-xl font-semibold text-blue-50">{weather?.condition || 'Loading weather'}</p>
              </div>
              <CloudSun size={120} className="text-amber-300 drop-shadow-lg" strokeWidth={1.5} />
            </div>
            
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-8 text-center">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <Droplets className="mx-auto mb-2 text-blue-200" size={24}/>
                <p className="text-2xl font-bold">{weather?.humidity ?? '--'}%</p>
                <p className="text-xs text-blue-100 mt-1 uppercase tracking-wider">Humidity</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <Wind className="mx-auto mb-2 text-blue-200" size={24}/>
                <p className="text-2xl font-bold">{weather?.rainfall ?? '--'}mm</p>
                <p className="text-xs text-blue-100 mt-1 uppercase tracking-wider">Rainfall</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <CloudSun className="mx-auto mb-2 text-blue-200" size={24}/>
                <p className="text-2xl font-bold">{weather?.uv_index ?? '--'}</p>
                <p className="text-xs text-blue-100 mt-1 uppercase tracking-wider">UV Index</p>
              </div>
            </div>

            <div className="mt-6 bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/20">
              <h3 className="font-bold flex items-center gap-2"><Sprout size={18} /> Farming Recommendation</h3>
              <p className="mt-2 text-sm text-blue-50 leading-relaxed">
                {weather?.rainfall && weather.rainfall > 5 
                  ? 'High rainfall expected. Ensure proper drainage for crops and avoid spraying pesticides today.' 
                  : 'Good weather for outdoor field activities. Monitor soil moisture levels for irrigation.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SUBSIDIES TAB */}
      {activeTab === 'subsidies' && (
        <div className="space-y-6">
          <p className="text-sm text-earth-500">Apply for government agricultural support and financial aid.</p>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { title: 'Fertilizer Subsidy Card', desc: 'Apply for subsidized rates on Urea, TSP, and MoP fertilizers.', badge: 'Active' },
              { title: 'Agricultural Rehabilitation', desc: 'Financial support for farmers affected by recent floods or natural disasters.', badge: 'New' },
              { title: 'Crop Insurance Scheme', desc: 'Protect your harvest against unexpected weather damage.', badge: 'Active' },
              { title: 'Irrigation Support', desc: 'Subsidies for solar-powered irrigation pumps and electricity bills.', badge: 'Closing Soon' },
            ].map(subsidy => (
              <div key={subsidy.title} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <FileText size={24} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${subsidy.badge === 'Closing Soon' ? 'bg-rose-100 text-rose-700' : subsidy.badge === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {subsidy.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-earth-900 mb-2">{subsidy.title}</h3>
                <p className="text-sm text-earth-500 leading-relaxed mb-6 flex-grow">{subsidy.desc}</p>
                <button onClick={() => handleApplySubsidy(subsidy.title)} className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOIL TESTING TAB */}
      {activeTab === 'soil' && (
        <div className="max-w-3xl mx-auto text-center space-y-6 py-10">
          <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sprout size={48} />
          </div>
          <h2 className="text-3xl font-bold text-earth-900">Professional Soil Analysis</h2>
          <p className="text-earth-600 max-w-lg mx-auto leading-relaxed">
            Understand your soil's health to maximize crop yield. Request a test from our certified local agricultural officers. They will visit your plot to collect samples.
          </p>
          <div className="pt-6">
            <button onClick={() => setSoilModalOpen(true)} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1">
              Start New Request
            </button>
          </div>
        </div>
      )}
    </div>

    {/* ADVISORY MODAL */}
    {selectedCrop && (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex justify-between">
            <div>
              <span className="text-3xl">{cropEmoji[selectedCrop.name] || '🌱'}</span>
              <h2 className="mt-3 text-lg font-bold">{selectedCrop.name} advisory</h2>
              <p className="text-xs text-earth-400">{selectedCrop.name_bn} · {selectedCrop.season} season</p>
            </div>
            <button onClick={() => setSelectedCrop(null)} className="text-earth-400 hover:text-earth-700"><X size={19}/></button>
          </div>
          <div className="mt-5 rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-800">Recommended action</p>
            <p className="mt-2 text-sm leading-6 text-earth-700">{selectedCrop.description}</p>
          </div>
          <button onClick={() => { addToast(`Advisory saved for ${selectedCrop.name}`); setSelectedCrop(null); }} className="mt-5 w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
            Save this advisory
          </button>
        </div>
      </div>
    )}

    {/* SOIL TESTING MODAL */}
    {soilModalOpen && (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-earth-900/60 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl my-8">
          
          <div className="px-6 py-5 border-b border-earth-100 flex justify-between items-center bg-earth-50/50 rounded-t-3xl">
            <h2 className="text-lg font-bold text-earth-900">Request Soil Test</h2>
            <button onClick={() => setSoilModalOpen(false)} className="text-earth-400 hover:text-earth-700 bg-white rounded-full p-1 shadow-sm border border-earth-100">
              <X size={20}/>
            </button>
          </div>

          <div className="p-6">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-earth-100 -z-10 rounded-full"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 -z-10 rounded-full transition-all duration-300" style={{ width: soilStep === 1 ? '0%' : soilStep === 2 ? '50%' : '100%' }}></div>
              
              {[1, 2, 3].map(step => (
                <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${soilStep >= step ? 'bg-emerald-600 text-white' : 'bg-earth-100 text-earth-400'}`}>
                  {soilStep > step ? <CheckCircle size={14} /> : step}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[250px]">
              {soilStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="font-bold text-earth-900 mb-4">Plot Information</h3>
                  <label className="block">
                    <span className="text-xs font-bold text-earth-600">Plot Size (in Decimals or Acres)</span>
                    <input 
                      type="text" 
                      value={soilData.plotSize} 
                      onChange={e => setSoilData({...soilData, plotSize: e.target.value})}
                      className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. 50 Decimals"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-earth-600">Plot Address / Location Details</span>
                    <textarea 
                      value={soilData.address} 
                      onChange={e => setSoilData({...soilData, address: e.target.value})}
                      className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none min-h-[100px]"
                      placeholder="Provide specific details so the officer can locate the plot easily"
                    />
                  </label>
                </div>
              )}

              {soilStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="font-bold text-earth-900 mb-4">Crop Details</h3>
                  <label className="block">
                    <span className="text-xs font-bold text-earth-600">Intended Crop for Next Season</span>
                    <input 
                      type="text" 
                      value={soilData.crop} 
                      onChange={e => setSoilData({...soilData, crop: e.target.value})}
                      className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Boro Paddy"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-earth-600">Previous Crop Grown (History)</span>
                    <input 
                      type="text" 
                      value={soilData.history} 
                      onChange={e => setSoilData({...soilData, history: e.target.value})}
                      className="mt-1.5 w-full rounded-xl border border-earth-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Potato"
                    />
                  </label>
                </div>
              )}

              {soilStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mt-4">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-earth-900">Review Request</h3>
                    <p className="text-sm text-earth-500 mt-2">Almost done! Submit your request and an officer will contact you within 48 hours to schedule the visit.</p>
                  </div>
                  
                  <div className="bg-earth-50 rounded-xl p-4 text-left space-y-3 text-sm">
                    <div className="flex justify-between border-b border-earth-200 pb-2">
                      <span className="text-earth-500 font-medium">Plot Size:</span>
                      <span className="font-bold">{soilData.plotSize || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between border-b border-earth-200 pb-2">
                      <span className="text-earth-500 font-medium">Intended Crop:</span>
                      <span className="font-bold">{soilData.crop || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-earth-500 font-medium">Fee:</span>
                      <span className="font-bold text-emerald-700">Free (Govt. Subsidized)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 flex gap-3 pt-5 border-t border-earth-100">
              {soilStep > 1 && (
                <button 
                  onClick={() => setSoilStep(s => s - 1)}
                  className="px-6 py-3 rounded-xl border border-earth-200 text-earth-700 font-bold hover:bg-earth-50 flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft size={18} /> Back
                </button>
              )}
              
              {soilStep < 3 ? (
                <button 
                  onClick={() => setSoilStep(s => s + 1)}
                  className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors ml-auto"
                >
                  Continue <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handleSoilSubmit}
                  className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Submit Request <CheckCircle size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>;
}
