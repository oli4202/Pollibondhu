import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CloudSun, Droplets, MapPin, Sprout, TrendingDown, TrendingUp, Wind, X, CheckCircle, FileText, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import api from '@/utils/api';
import { useToast } from '@/components/feedback/ToastProvider';
import CropSuggestionAI from '@/components/ai/CropSuggestionAI';
import AiInstantHelp from '@/components/ai/AiInstantHelp';

type Crop = { crop_id: number; name: string; name_bn?: string; season?: string; description: string };
type Price = { price_id: number; price: string; unit: string; change_pct: number; market_name: string; crop?: { name: string } };
type Weather = { district: string; temperature: number; condition: string; humidity: number; rainfall: number; uv_index: number; wind_speed: number; evapotranspiration: number; surface_pressure: number; soil_temp: number; soil_moisture: number };
const cropEmoji: Record<string, string> = { Potato: '🥔', 'Boro Paddy': '🌾', Mustard: '🌼', 'Aman Paddy': '🌾', Wheat: '🌿', Jute: '🌿', Maize: '🌽', Lentil: '🫘', Onion: '🧅', Tomato: '🍅', Chili: '🌶️', Sugarcane: '🪴', Mango: '🥭', Banana: '🍌', Groundnut: '🥜', Cauliflower: '🥬', Cabbage: '🥗', Pumpkin: '🎃', Eggplant: '🍆' };

const TABS = [
  { id: 'advisory', label: 'Crop Advisory', emoji: '🌱' },
  { id: 'market', label: 'Market Prices', emoji: '💰' },
  { id: 'weather', label: 'Agri Weather', emoji: '🌦️' },
  { id: 'subsidies', label: 'Subsidies', emoji: '🏛️' },
  { id: 'soil', label: 'Soil Testing', emoji: '🧪' },
];

export default function AgriculturePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('advisory');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Advisory Tab State
  const [filter, setFilter] = useState('All crops');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  
  const { addToast } = useToast();

  useEffect(() => { 
    Promise.all([
      api.get('/agriculture/crops').catch(() => ({ data: { data: { data: [] } } })), 
      api.get('/agriculture/market-prices').catch(() => ({ data: { data: [] } })), 
      fetch('https://api.open-meteo.com/v1/forecast?latitude=23.8103&longitude=90.4125&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,surface_pressure&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm&daily=uv_index_max,et0_fao_evapotranspiration&timezone=Asia%2FDhaka').then(r => r.json()).catch(() => null)
    ]).then(([cropRes, priceRes, weatherRes]) => { 
      setCrops(cropRes.data.data?.data || []); 
      setPrices(priceRes.data.data || []); 
      
      if (weatherRes && weatherRes.current) {
        const code = weatherRes.current.weather_code;
        let cond = 'Clear Sky';
        if (code > 0 && code <= 3) cond = 'Partly Cloudy';
        else if (code <= 48) cond = 'Foggy';
        else if (code <= 55) cond = 'Drizzle';
        else if (code <= 65) cond = 'Rain';
        else if (code >= 95) cond = 'Thunderstorm';
        
        const currentHour = new Date().getHours();
        
        setWeather({
          district: 'Dhaka',
          temperature: Math.round(weatherRes.current.temperature_2m),
          condition: cond,
          humidity: weatherRes.current.relative_humidity_2m,
          rainfall: weatherRes.current.precipitation,
          wind_speed: weatherRes.current.wind_speed_10m,
          surface_pressure: weatherRes.current.surface_pressure,
          uv_index: weatherRes.daily?.uv_index_max?.[0] || 0,
          evapotranspiration: weatherRes.daily?.et0_fao_evapotranspiration?.[0] || 0,
          soil_temp: weatherRes.hourly?.soil_temperature_0cm?.[currentHour] || 0,
          soil_moisture: Math.round((weatherRes.hourly?.soil_moisture_0_to_1cm?.[currentHour] || 0) * 100) // Convert to percentage
        });
      }
    }).finally(() => setLoading(false)); 
  }, []);

  const visibleCrops = useMemo(() => filter === 'All crops' ? crops : crops.filter(c => c.season === filter), [crops, filter]);

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
      {/* AI Crop Suggestion */}
      <div className="mt-6">
        <CropSuggestionAI />
      </div>

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
              <h2 className="text-sm font-bold text-earth-900">🌱 Crop Advisory</h2>
              <div className="flex gap-2">
                {['All crops', 'Rabi', 'Kharif'].map(item => (
                  <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${filter === item ? 'bg-emerald-700 text-white shadow-md shadow-emerald-200' : 'bg-earth-100 text-earth-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                    {item === 'All crops' ? '🌱 ' : item === 'Rabi' ? '❄️ ' : '☔ '}{item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {loading ? <p className="col-span-full py-8 text-center text-sm text-earth-400">Loading crop services…</p> : visibleCrops.map(crop => (
                <article
                  key={crop.crop_id}
                  onClick={() => navigate(`/crop/${encodeURIComponent(crop.name)}`)}
                  className="group relative rounded-2xl border border-emerald-100 bg-white p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/50 hover:border-emerald-300 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 via-emerald-50/0 to-emerald-100/0 group-hover:from-emerald-50/40 group-hover:via-emerald-50/20 group-hover:to-emerald-100/60 transition-all duration-300 rounded-2xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <span className="text-4xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6 drop-shadow-sm">{cropEmoji[crop.name] || '🌱'}</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 group-hover:bg-emerald-200 transition-colors">{crop.season || 'Seasonal'}</span>
                    </div>
                    
                    <h3 className="mt-4 text-base font-bold text-earth-900 group-hover:text-emerald-700 transition-colors">{crop.name}</h3>
                    <p className="text-xs text-earth-400 mt-0.5">{crop.name_bn}</p>
                    
                    <p className="mt-3 min-h-[48px] text-xs leading-5 text-earth-600 line-clamp-2">{crop.description}</p>
                    
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 group-hover:bg-emerald-100 transition-colors">
                      <span className="text-xs font-bold text-emerald-700">View full advisory</span>
                      <span className="text-emerald-600 transition-transform duration-300 group-hover:translate-x-1">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                  </div>
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
                  <tr key={price.price_id} className="hover:bg-earth-50/50 cursor-pointer" onClick={() => price.crop?.name && navigate(`/commodity/${encodeURIComponent(price.crop.name)}`)}>
                    <td className="px-5 py-4 font-semibold text-earth-900 hover:text-emerald-700 transition">{price.crop?.name || 'Crop'}</td>
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
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10">
              <p className="flex items-center gap-2 text-blue-100 font-medium"><MapPin size={16} /> {weather?.district || 'Your district'} — Today</p>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <strong className="text-6xl lg:text-8xl font-bold tracking-tighter">{weather?.temperature ?? '--'}°</strong>
                  <p className="mt-2 text-xl font-semibold text-blue-50">{weather?.condition || 'Loading weather'}</p>
                </div>
                <CloudSun size={120} className="text-amber-300 drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="relative z-10 mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/20 pt-8 text-center">
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
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <Sprout className="mx-auto mb-2 text-blue-200" size={24}/>
                <p className="text-2xl font-bold">{weather?.evapotranspiration ?? '--'}mm</p>
                <p className="text-xs text-blue-100 mt-1 uppercase tracking-wider">Water Loss</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-900"><Sprout size={100} /></div>
              <h3 className="font-bold text-lg text-amber-900 flex items-center gap-2 mb-4 relative z-10"><MapPin size={18} /> Surface Soil Conditions</h3>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-white/60 rounded-2xl p-4 backdrop-blur-sm border border-amber-100/50">
                  <p className="text-3xl font-bold text-amber-700">{weather?.soil_moisture ?? '--'}%</p>
                  <p className="text-xs text-amber-900/60 font-bold uppercase tracking-wider mt-1">Moisture</p>
                </div>
                <div className="bg-white/60 rounded-2xl p-4 backdrop-blur-sm border border-amber-100/50">
                  <p className="text-3xl font-bold text-amber-700">{weather?.soil_temp ?? '--'}°</p>
                  <p className="text-xs text-amber-900/60 font-bold uppercase tracking-wider mt-1">Temperature</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 shadow-sm flex-grow flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-900"><AlertTriangle size={120} /></div>
              <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2 mb-3 relative z-10"><Sparkles size={20} className="text-blue-600" /> AI Farming Recommendation</h3>
              <p className="text-blue-800 leading-relaxed relative z-10">
                {weather?.rainfall && weather.rainfall > 5 
                  ? 'High rainfall expected. Ensure proper drainage for crops. Avoid spraying any foliar fertilizers or pesticides today as they may wash away.' 
                  : (weather?.evapotranspiration && weather.evapotranspiration > 4) || (weather?.soil_moisture && weather.soil_moisture < 20)
                    ? 'High water loss and dry soil expected today. Ensure your crops receive adequate irrigation to prevent heat stress.'
                    : 'Favorable weather for outdoor field activities. Monitor soil moisture levels for irrigation. Good time for weeding and pesticide application if needed.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2 relative z-10">
                <span className="px-3 py-1.5 bg-white text-blue-800 rounded-full text-xs font-bold shadow-sm border border-blue-100">Wind: {weather?.wind_speed ?? '--'} km/h</span>
                <span className="px-3 py-1.5 bg-white text-blue-800 rounded-full text-xs font-bold shadow-sm border border-blue-100">Pressure: {weather?.surface_pressure ?? '--'} hPa</span>
              </div>
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
              { id: 'fertilizer-subsidy', title: 'Fertilizer Subsidy Card', desc: 'Apply for subsidized rates on Urea, TSP, and MoP fertilizers.', badge: 'Active' },
              { id: 'agricultural-rehabilitation', title: 'Agricultural Rehabilitation', desc: 'Financial support for farmers affected by recent floods or natural disasters.', badge: 'New' },
              { id: 'crop-insurance', title: 'Crop Insurance Scheme', desc: 'Protect your harvest against unexpected weather damage.', badge: 'Active' },
              { id: 'irrigation-support', title: 'Irrigation Support', desc: 'Subsidies for solar-powered irrigation pumps and electricity bills.', badge: 'Closing Soon' },
            ].map(subsidy => (
              <div key={subsidy.id} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm flex flex-col h-full group hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${subsidy.badge === 'Closing Soon' ? 'bg-rose-100 text-rose-700' : subsidy.badge === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {subsidy.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-earth-900 mb-2 group-hover:text-emerald-700 transition">{subsidy.title}</h3>
                <p className="text-sm text-earth-500 leading-relaxed mb-6 flex-grow">{subsidy.desc}</p>
                <button onClick={() => navigate(`/gov-service/${subsidy.id}`)} className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition shadow-lg shadow-emerald-700/20">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOIL TESTING TAB */}
      {activeTab === 'soil' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <Sprout size={32} className="text-amber-600 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-amber-900">Professional Soil Analysis</h2>
              <p className="text-sm text-amber-700 mt-1">Request a test from our certified local agricultural officers. They will visit your plot to collect samples.</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { id: 'soil-test-standard', title: 'Standard Soil Test', emoji: '🧪', desc: 'Basic NPK and pH analysis for everyday farming needs.', price: '৳ 150' },
              { id: 'soil-test-micronutrient', title: 'Micronutrient Analysis', emoji: '🔬', desc: 'Detailed test for trace minerals like Zinc and Boron.', price: '৳ 300' },
              { id: 'soil-test-salinity', title: 'Salinity & pH Test', emoji: '🌊', desc: 'Crucial for coastal areas to pick salt-tolerant crops.', price: '৳ 100' },
            ].map(test => (
              <div key={test.id} className="rounded-2xl border border-earth-100 bg-white p-6 shadow-sm flex flex-col h-full group hover:border-emerald-300 hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/gov-service/${test.id}`)}>
                <div className="text-4xl mb-4 group-hover:scale-110 origin-left transition-transform">{test.emoji}</div>
                <h3 className="text-lg font-bold text-earth-900 mb-2 group-hover:text-emerald-700 transition-colors">{test.title}</h3>
                <p className="text-sm text-earth-500 leading-relaxed mb-4 flex-grow">{test.desc}</p>
                <div className="flex items-center justify-between mt-auto border-t border-earth-100 pt-4">
                  <span className="text-sm font-bold text-emerald-700">{test.price}</span>
                  <span className="text-sm font-bold text-earth-400 group-hover:text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
                    Request <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            ))}
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


  </div>;
}

// AI Instant Help is rendered at the bottom of the page
// via the PublicLayout component
