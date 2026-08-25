import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sprout, Droplets, Bug, Thermometer, Calendar, MapPin, TrendingUp, TrendingDown, ChevronRight, AlertTriangle, CheckCircle, Leaf, Sparkles } from 'lucide-react';
import DiseaseDetectionAI from '@/components/ai/DiseaseDetectionAI';
import api from '@/utils/api';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { additionalCropDetails } from './cropData';

type Crop = {
  crop_id: number;
  name: string;
  name_bn?: string;
  season?: string;
  description: string;
};

type Price = {
  price_id: number;
  price: string;
  unit: string;
  change_pct: number;
  market_name: string;
};

const cropDetails: Record<string, {
  emoji: string;
  season: string;
  soilType: string;
  phRange: string;
  waterNeeds: string;
  temperature: string;
  growthPeriod: string;
  fertilizerSchedule: { stage: string; fertilizer: string; amount: string }[];
  pestControl: { name: string; symptoms: string; solution: string }[];
  irrigationTips: string[];
  harvestingTips: string[];
  storageTips: string[];
  keyAdvice: string[];
}> = {
  'Potato': {
    emoji: '🥔',
    season: 'Rabi (Oct–Feb)',
    soilType: 'Loamy, well-drained sandy loam',
    phRange: '5.0 – 5.5',
    waterNeeds: 'Moderate – 500–700mm total',
    temperature: '15–22°C',
    growthPeriod: '80–120 days',
    fertilizerSchedule: [
      { stage: 'Basal (at planting)', fertilizer: 'TSP (Di-ammonium Phosphate)', amount: '200 kg/ha' },
      { stage: '3 weeks after planting', fertilizer: 'Urea', amount: '150 kg/ha' },
      { stage: '6 weeks after planting', fertilizer: 'Urea + MoP', amount: '100 + 100 kg/ha' },
    ],
    pestControl: [
      { name: 'Late Blight', symptoms: 'Brown spots on leaves, white fuzzy growth underneath', solution: 'Spray Metalaxyl + Mancozeb. Remove affected plants immediately.' },
      { name: 'Colorado Potato Beetle', symptoms: 'Yellow-orange beetles eating leaves', solution: 'Hand-pick adults. Spray Neem oil or Imidacloprid.' },
      { name: 'Potato Cyst Nematode', symptoms: 'Stunted growth, yellowing leaves', solution: 'Crop rotation with cereals. Use resistant varieties.' },
    ],
    irrigationTips: [
      'Irrigate immediately after planting to ensure sprouting.',
      'Maintain consistent moisture during tuber formation (4–6 weeks).',
      'Stop irrigation 2 weeks before harvest to prevent rot.',
      'Avoid waterlogging — raised beds recommended.',
    ],
    harvestingTips: [
      'Harvest when foliage turns yellow and dies back.',
      'Dig carefully to avoid skin damage.',
      'Cure potatoes in shade for 1–2 days before storage.',
      'Grade by size before selling.',
    ],
    storageTips: [
      'Store in cool (4–8°C), dark, well-ventilated space.',
      'Keep away from onions — they accelerate sprouting.',
      'Use bamboo baskets with straw lining.',
    ],
    keyAdvice: [
      'Apply seed treatment (Thiram) before planting.',
      'Maintain proper plant spacing (20cm × 75cm).',
      'Earthing up at 20cm height improves yield.',
      'Use certified seed potatoes for best results.',
    ],
  },
  'Boro Paddy': {
    emoji: '🌾',
    season: 'Rabi/Boro (Dec–May)',
    soilType: 'Clay loam to clay, puddled field',
    phRange: '5.5 – 7.0',
    waterNeeds: 'High – 1200–1500mm (flooded)',
    temperature: '25–35°C',
    growthPeriod: '130–160 days',
    fertilizerSchedule: [
      { stage: 'Basal (transplanting)', fertilizer: 'TSP + Gypsum', amount: '130 + 100 kg/ha' },
      { stage: '2 weeks after transplanting', fertilizer: 'Urea (1st dose)', amount: '80 kg/ha' },
      { stage: '6 weeks after transplanting', fertilizer: 'Urea (2nd dose)', amount: '80 kg/ha' },
      { stage: 'Panicle initiation', fertilizer: 'Urea (3rd dose)', amount: '40 kg/ha' },
    ],
    pestControl: [
      { name: 'Stem Borer', symptoms: 'Dead heart (central shoot drying)', solution: 'Apply Cartap hydrochloride. Release Trichogramma eggs.' },
      { name: 'Brown Planthopper', symptoms: 'Hopper burn — patches of dried brown rice', solution: 'Avoid excess nitrogen. Spray Pymetrozine.' },
      { name: 'Bacterial Leaf Blight', symptoms: 'Yellow streaks on leaf tips, wilting', solution: 'Use resistant varieties. Ensure proper drainage.' },
    ],
    irrigationTips: [
      'Maintain 2–5cm standing water after transplanting.',
      'Drain field every 2–3 weeks for root aeration.',
      'Keep 5cm water during vegetative stage.',
      'Gradually drain 15 days before harvest.',
    ],
    harvestingTips: [
      'Harvest when 80% of panicles turn golden.',
      'Cut at 15–20cm above ground level.',
      'Thresh within 24 hours of cutting.',
    ],
    storageTips: [
      'Dry to 12–14% moisture content before storing.',
      'Store in jute or polypropylene bags.',
      'Keep in elevated, dry place with ventilation.',
    ],
    keyAdvice: [
      'Transplant 25–30 day old seedlings.',
      'Maintain 20cm × 15cm spacing.',
      'Use SRI method for water savings up to 40%.',
      'Monitor field daily during vegetative stage.',
    ],
  },
  'Aman Paddy': {
    emoji: '🌾',
    season: 'Kharif (Jun–Nov)',
    soilType: 'Clay loam, alluvial soil',
    phRange: '5.5 – 7.0',
    waterNeeds: 'High – 1000–1300mm',
    temperature: '25–32°C',
    growthPeriod: '140–160 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '100 + 60 kg/ha' },
      { stage: '3 weeks', fertilizer: 'Urea (1st)', amount: '60 kg/ha' },
      { stage: '8 weeks', fertilizer: 'Urea (2nd)', amount: '60 kg/ha' },
    ],
    pestControl: [
      { name: 'Rice Hispa', symptoms: 'White streaks on leaves, scraped surface', solution: 'Spray Phenthoate. Remove grassy weeds.' },
      { name: 'Sheath Blight', symptoms: 'Oval lesions on leaf sheaths', solution: 'Reduce planting density. Spray Validamycin.' },
    ],
    irrigationTips: [
      'Rainfed in most areas — supplemental irrigation in dry spells.',
      'Maintain shallow flooding during tillering.',
      'Drain 20 days before harvest.',
    ],
    harvestingTips: [
      'Harvest when 80% grains are mature (golden).',
      'Cut and stack inbundles for 3–4 days.',
    ],
    storageTips: [
      'Sun-dry thoroughly before bagging.',
      'Use hermetic bags for long-term storage.',
    ],
    keyAdvice: [
      'Transplant soon after first monsoon rain.',
      'Choose flood-tolerant varieties (e.g., BRRI dhan52).',
      'Weed within 20 days of transplanting.',
    ],
  },
  'Mustard': {
    emoji: '🌼',
    season: 'Rabi (Oct–Feb)',
    soilType: 'Sandy loam to loam',
    phRange: '6.0 – 7.5',
    waterNeeds: 'Low – 250–400mm',
    temperature: '10–25°C',
    growthPeriod: '100–130 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '100 + 50 kg/ha' },
      { stage: '25 days after sowing', fertilizer: 'Urea', amount: '80 kg/ha' },
    ],
    pestControl: [
      { name: 'Aphids', symptoms: 'Curled leaves, sticky honeydew on plant', solution: 'Spray Dimethoate or Neem oil. Yellow sticky traps.' },
      { name: 'Sawfly', symptoms: 'Larvae scraping leaf surface', solution: 'Sprate Quinalphos on affected plants.' },
    ],
    irrigationTips: [
      'Critical stage: flowering and siliqua formation.',
      'Light irrigation at bud stage and pod filling.',
      'Avoid irrigation during maturity.',
    ],
    harvestingTips: [
      'Harvest when 75% of siliquas turn brown.',
      'Cut whole plant and stack for 5–7 days.',
      'Thresh by beating bundles.',
    ],
    storageTips: [
      'Clean and dry seeds to 6% moisture.',
      'Store in gunny bags in cool dry place.',
    ],
    keyAdvice: [
      'Use increased row spacing (30cm) for better yield.',
      'Intercropping with lentil improves income.',
      'Avoid waterlogging at all stages.',
    ],
  },
  'Wheat': {
    emoji: '🌿',
    season: 'Rabi (Nov–Mar)',
    soilType: 'Loam to clay loam',
    phRange: '6.0 – 7.5',
    waterNeeds: 'Low to moderate – 300–500mm',
    temperature: '10–25°C',
    growthPeriod: '110–130 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '120 + 60 kg/ha' },
      { stage: '21 days after sowing', fertilizer: 'Urea (1st)', amount: '60 kg/ha' },
      { stage: '45 days (tillering)', fertilizer: 'Urea (2nd)', amount: '60 kg/ha' },
    ],
    pestControl: [
      { name: 'Rust', symptoms: 'Orange/brown pustules on leaves', solution: 'Use resistant varieties. Spray Propiconazole.' },
      { name: 'Termite', symptoms: 'Dead tillers, hollow stems', solution: 'Soil treatment with Chlorpyriphos before sowing.' },
    ],
    irrigationTips: [
      'First irrigation at Crown Root Initiation (20–25 days).',
      'Critical stages: Tillering, Jointing, Flowering, Grain filling.',
      'Last irrigation at milk stage.',
    ],
    harvestingTips: [
      'Harvest when grains are hard and moisture is 14%.',
      'Combine or manual cutting — thresh same day.',
    ],
    storageTips: [
      'Dry to < 12% moisture.',
      'Store in clean, dry bins or bags.',
    ],
    keyAdvice: [
      'Sow by mid-November for best yield.',
      'Zero tillage saves cost and time.',
      'Use certified seeds (40 kg/ha).',
    ],
  },
};

const fallbackDetail = {
  emoji: '🌱',
  season: 'Seasonal',
  soilType: 'Well-drained, fertile soil',
  phRange: '6.0 – 7.5',
  waterNeeds: 'Moderate',
  temperature: '20–30°C',
  growthPeriod: '90–120 days',
  fertilizerSchedule: [
    { stage: 'Basal', fertilizer: 'DAP / TSP', amount: '150 kg/ha' },
    { stage: '30 days', fertilizer: 'Urea', amount: '100 kg/ha' },
  ],
  pestControl: [
    { name: 'Common Pests', symptoms: 'Leaf damage, yellowing', solution: 'Monitor regularly. Use integrated pest management.' },
  ],
  irrigationTips: [
    'Water consistently during growth period.',
    'Avoid overwatering — ensure good drainage.',
  ],
  harvestingTips: [
    'Harvest at maturity for best quality.',
    'Handle carefully to avoid damage.',
  ],
  storageTips: [
    'Store in cool, dry, well-ventilated area.',
  ],
  keyAdvice: [
    'Use certified, quality seeds.',
    'Follow recommended spacing and timing.',
  ],
};

export default function CropDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [crop, setCrop] = useState<Crop | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);

  const decoded = name ? decodeURIComponent(name) : '';
  const detail = cropDetails[decoded] || additionalCropDetails[decoded] || fallbackDetail;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/agriculture/crops').catch(() => ({ data: { data: { data: [] } } })),
      api.get('/agriculture/market-prices').catch(() => ({ data: { data: [] } })),
    ]).then(([cropRes, priceRes]) => {
      const allCrops = cropRes.data.data?.data || [];
      const found = allCrops.find((c: Crop) => c.name.toLowerCase() === decoded.toLowerCase());
      setCrop(found || null);
      const allPrices = priceRes.data.data || [];
      setPrices(allPrices.filter((p: Price) => p.market_name && decoded.toLowerCase()));
    }).finally(() => setLoading(false));
  }, [decoded]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Agriculture', href: '/agriculture' },
          { label: decoded || 'Crop' },
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
            <span className="text-4xl">{detail.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold text-earth-900">{decoded} Advisory</h1>
              <p className="text-sm text-earth-500">
                {crop?.name_bn && <>{crop.name_bn} · </>}
                {detail.season}
              </p>
            </div>
          </div>
        </div>
        <Badge variant="success">{detail.season.split('(')[0].trim()}</Badge>
      </div>

      {/* Crop Description */}
      {crop?.description && (
        <Card className="mb-6 border-emerald-100 bg-emerald-50/50">
          <CardContent>
            <p className="text-sm text-earth-700 leading-relaxed">{crop.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Leaf, label: 'Soil Type', value: detail.soilType, color: 'text-green-600 bg-green-50' },
          { icon: Droplets, label: 'Water Needs', value: detail.waterNeeds, color: 'text-blue-600 bg-blue-50' },
          { icon: Thermometer, label: 'Temperature', value: detail.temperature, color: 'text-orange-600 bg-orange-50' },
          { icon: Calendar, label: 'Growth Period', value: detail.growthPeriod, color: 'text-purple-600 bg-purple-50' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl p-4 ${item.color.split(' ')[1]}`}>
            <item.icon size={18} className={item.color.split(' ')[0]} />
            <p className="mt-2 text-xs font-bold text-earth-500">{item.label}</p>
            <p className="text-sm font-bold text-earth-900 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Soil pH */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Sprout size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Soil pH Range</h3>
              <p className="text-lg font-bold text-emerald-700">{detail.phRange}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Disease Detection */}
      <div className="mb-6">
        <DiseaseDetectionAI />
      </div>

      {/* Key Advice */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Key Advice
          </h3>
          <div className="space-y-2">
            {detail.keyAdvice.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-emerald-50/50 p-3">
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-sm text-earth-700">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fertilizer Schedule */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Sprout size={16} className="text-emerald-600" /> Fertilizer Schedule
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-earth-200 text-left">
                  <th className="pb-2 font-semibold text-earth-500">Stage</th>
                  <th className="pb-2 font-semibold text-earth-500">Fertilizer</th>
                  <th className="pb-2 font-semibold text-earth-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {detail.fertilizerSchedule.map((f, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-medium text-earth-800">{f.stage}</td>
                    <td className="py-2.5 text-earth-600">{f.fertilizer}</td>
                    <td className="py-2.5 font-bold text-emerald-700">{f.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pest Control */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Bug size={16} className="text-red-500" /> Pest & Disease Control
          </h3>
          <div className="space-y-3">
            {detail.pestControl.map((pest, i) => (
              <div key={i} className="rounded-xl border border-earth-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500 font-bold text-sm">{pest.name}</span>
                </div>
                <p className="text-xs text-earth-600 mb-1"><b>Symptoms:</b> {pest.symptoms}</p>
                <p className="text-xs text-emerald-700"><b>Solution:</b> {pest.solution}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Irrigation Tips */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Droplets size={16} className="text-blue-500" /> Irrigation Tips
          </h3>
          <div className="space-y-2">
            {detail.irrigationTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <ChevronRight size={14} className="mt-1 shrink-0 text-blue-500" />
                {tip}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Harvesting */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-amber-600" /> Harvesting Tips
          </h3>
          <div className="space-y-2">
            {detail.harvestingTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <ChevronRight size={14} className="mt-1 shrink-0 text-amber-500" />
                {tip}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            📦 Storage Tips
          </h3>
          <div className="space-y-2">
            {detail.storageTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-earth-700">
                <ChevronRight size={14} className="mt-1 shrink-0 text-earth-400" />
                {tip}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Prices */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" /> Market Prices
          </h3>
          <div className="space-y-2">
            <Link
              to={`/commodity/${encodeURIComponent(decoded)}`}
              className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 hover:bg-emerald-50 transition"
            >
              <span className="text-sm font-bold text-emerald-800">View {decoded} price details →</span>
              <ChevronRight size={16} className="text-emerald-600" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Back button */}
      <div className="mt-8 text-center">
        <Link
          to="/agriculture"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition"
        >
          <ArrowLeft size={16} /> Back to Agriculture
        </Link>
      </div>
    </div>
  );
}
