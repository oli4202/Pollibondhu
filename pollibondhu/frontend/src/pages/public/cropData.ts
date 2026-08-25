// Additional crop details for common Bangladeshi crops
export const additionalCropDetails: Record<string, {
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
  'Jute': {
    emoji: '🌿',
    season: 'Kharif (Mar–Jul)',
    soilType: 'Alluvial loam to clay loam',
    phRange: '6.0 – 7.5',
    waterNeeds: 'Moderate – 600–800mm',
    temperature: '25–35°C',
    growthPeriod: '120–150 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '100 + 80 kg/ha' },
      { stage: '30 days', fertilizer: 'Urea (1st)', amount: '60 kg/ha' },
      { stage: '60 days', fertilizer: 'Urea (2nd)', amount: '60 kg/ha' },
    ],
    pestControl: [
      { name: 'Jute Semilooper', symptoms: 'Larvae eating leaves, defoliation', solution: 'Sprate Carbaryl 50 WP. Hand-pick caterpillars.' },
      { name: 'Jute Mallow', symptoms: 'Webbing and leaf rolling', solution: 'Spray Malathion 50 EC. Remove affected plants.' },
    ],
    irrigationTips: [
      'Rainfed crop — supplemental irrigation in dry spells.',
      'Critical period: first 30 days after sowing.',
      'Avoid waterlogging during growth.',
    ],
    harvestingTips: [
      'Harvest when lower leaves start shedding (120-150 days).',
      'Cut at ground level for maximum fiber length.',
      'Ret in standing water for 7-10 days for fiber extraction.',
    ],
    storageTips: [
      'Dry jute fibers in sun for 3-4 days.',
      'Pack in bales and store in dry warehouse.',
    ],
    keyAdvice: [
      'Sow seeds broadcast or in lines at 30cm spacing.',
      'Thin seedlings to 10-15cm apart at 15 days.',
      'Weed twice — at 20 and 40 days.',
      'Apply Gypsum for better fiber quality.',
    ],
  },
  'Maize': {
    emoji: '🌽',
    season: 'Rabi / Kharif (Nov–Apr or Jun–Sep)',
    soilType: 'Well-drained sandy loam to loam',
    phRange: '5.5 – 7.0',
    waterNeeds: 'Moderate – 500–800mm',
    temperature: '20–32°C',
    growthPeriod: '80–120 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '120 + 60 kg/ha' },
      { stage: '20 days (knee height)', fertilizer: 'Urea (1st)', amount: '100 kg/ha' },
      { stage: '45 days (tasseling)', fertilizer: 'Urea (2nd)', amount: '80 kg/ha' },
    ],
    pestControl: [
      { name: 'Fall Armyworm', symptoms: 'Larvae feeding on whorl and leaves', solution: 'Sprate Emamectin benzoate. Release Trichogramma eggs.' },
      { name: 'Stem Borer', symptoms: 'Dead heart, shot holes in leaves', solution: 'Apply Carbofuran granules at base. Remove dead hearts.' },
    ],
    irrigationTips: [
      'Critical stages: knee height, tasseling, grain filling.',
      'Irrigate immediately if no rain during these stages.',
      'Stop irrigation 2 weeks before harvest.',
    ],
    harvestingTips: [
      'Harvest when husks turn brown and kernels are hard.',
      'Dry cobs in sun for 5-7 days before shelling.',
      'Storage moisture should be below 13%.',
    ],
    storageTips: [
      'Store dried kernels in jute or polypropylene bags.',
      'Fumigate if storing long-term.',
    ],
    keyAdvice: [
      'Plant seeds at 60cm × 25cm spacing.',
      'Use hybrid seeds for 40% more yield.',
      'Intercrop with legumes for extra income.',
      'Earthing up at 30cm helps root stability.',
    ],
  },
  'Lentil': {
    emoji: '🫘',
    season: 'Rabi (Nov–Mar)',
    soilType: 'Well-drained loam to sandy loam',
    phRange: '6.0 – 7.5',
    waterNeeds: 'Low – 200–300mm',
    temperature: '15–25°C',
    growthPeriod: '100–120 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP', amount: '50 kg/ha' },
      { stage: '20 days', fertilizer: 'Urea', amount: '30 kg/ha' },
    ],
    pestControl: [
      { name: 'Pod Borer', symptoms: 'Larvae feeding inside pods', solution: 'Spray Chlorantraniliprole at pod formation stage.' },
      { name: 'Wilt Disease', symptoms: 'Yellowing and wilting of plants', solution: 'Use resistant varieties. Seed treatment with Trichoderma.' },
    ],
    irrigationTips: [
      'Rainfed in most areas.',
      'One irrigation at flowering if dry spell.',
      'Avoid irrigation near maturity.',
    ],
    harvestingTips: [
      'Harvest when 75% pods turn brown.',
      'Cut whole plant and stack for 3-4 days.',
      'Thresh by beating with sticks.',
    ],
    storageTips: [
      'Clean and dry to 10% moisture.',
      'Store in airtight containers to prevent weevil.',
    ],
    keyAdvice: [
      'Inoculate seeds with Rhizobium for nitrogen fixation.',
      'Do not apply excessive nitrogen — legumes fix their own.',
      'Intercrop with mustard or wheat for better land use.',
    ],
  },
  'Onion': {
    emoji: '🧅',
    season: 'Rabi (Oct–Mar)',
    soilType: 'Well-drained sandy loam',
    phRange: '6.0 – 7.0',
    waterNeeds: 'Moderate – 350–500mm',
    temperature: '15–25°C',
    growthPeriod: '120–150 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '100 + 50 kg/ha' },
      { stage: '30 days', fertilizer: 'Urea (1st)', amount: '60 kg/ha' },
      { stage: '60 days (bulbing)', fertilizer: 'Urea (2nd)', amount: '60 kg/ha' },
    ],
    pestControl: [
      { name: 'Thrips', symptoms: 'Silver streaks on leaves, distorted growth', solution: 'Spray Fipronil or Imidacloprid. Use drip irrigation.' },
      { name: 'Purple Blotch', symptoms: 'Purple lesions on leaves', solution: 'Spray Mancozeb. Remove infected leaves.' },
    ],
    irrigationTips: [
      'Regular irrigation during bulb formation.',
      'Stop irrigation 2 weeks before harvest.',
      'Raised beds essential for drainage.',
    ],
    harvestingTips: [
      'Harvest when 50% foliage falls over naturally.',
      'Lift bulbs carefully with fork.',
      'Cure in shade for 10-15 days before storage.',
    ],
    storageTips: [
      'Store in well-ventilated bamboo baskets.',
      'Keep in cool, dry place away from moisture.',
      'Properly cured onions store for 3-4 months.',
    ],
    keyAdvice: [
      'Use transplanted method for better bulb size.',
      'Spacing: 15cm × 10cm.',
      'Apply Sulphur for better pungency and bulb quality.',
      'Use drip irrigation to reduce leaf diseases.',
    ],
  },
  'Tomato': {
    emoji: '🍅',
    season: 'Rabi / Year-round',
    soilType: 'Well-drained loam, rich in organic matter',
    phRange: '6.0 – 7.0',
    waterNeeds: 'Moderate – 400–600mm',
    temperature: '20–30°C',
    growthPeriod: '60–90 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '150 + 100 kg/ha' },
      { stage: '15 days after transplanting', fertilizer: 'Urea (1st)', amount: '60 kg/ha' },
      { stage: 'Flowering', fertilizer: 'Urea (2nd)', amount: '60 kg/ha' },
      { stage: 'Fruit setting', fertilizer: 'Urea (3rd)', amount: '40 kg/ha' },
    ],
    pestControl: [
      { name: 'Fruit Borer', symptoms: 'Holes in fruits, frass visible', solution: 'Spray Indoxacarb. Use pheromone traps.' },
      { name: 'Late Blight', symptoms: 'Brown spots on leaves and stems', solution: 'Sprate Metalaxyl + Mancozeb. Improve air circulation.' },
      { name: 'Whitefly', symptoms: 'Yellowing leaves, sticky honeydew', solution: 'Yellow sticky traps. Spray Diafenthiuron.' },
    ],
    irrigationTips: [
      'Drip irrigation recommended for best results.',
      'Consistent moisture during flowering and fruiting.',
      'Avoid wetting leaves — water at base.',
    ],
    harvestingTips: [
      'Harvest at breaker to fully ripe stage depending on market distance.',
      'Pick in early morning for best shelf life.',
      'Handle carefully — avoid bruising.',
    ],
    storageTips: [
      'Store at 12-15°C for 1-2 weeks.',
      'Do not refrigerate below 10°C — damages texture.',
    ],
    keyAdvice: [
      'Stake or cage plants for support.',
      'Prune suckers for larger fruits.',
      'Mulch around base to retain moisture.',
      'Crop rotation with non-solanaceous crops essential.',
    ],
  },
  'Chili': {
    emoji: '🌶️',
    season: 'Rabi / Year-round',
    soilType: 'Well-drained sandy loam',
    phRange: '6.0 – 7.0',
    waterNeeds: 'Low to Moderate – 300–500mm',
    temperature: '20–30°C',
    growthPeriod: '90–120 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '120 + 60 kg/ha' },
      { stage: '20 days', fertilizer: 'Urea (1st)', amount: '50 kg/ha' },
      { stage: 'Flowering', fertilizer: 'Urea (2nd)', amount: '50 kg/ha' },
    ],
    pestControl: [
      { name: 'Aphids', symptoms: 'Curled leaves, stunted growth', solution: 'Spray Neem oil or Dimethoate.' },
      { name: 'Fruit Rot', symptoms: 'Soft spots on fruits, fungal growth', solution: 'Improve drainage. Spray Copper oxychloride.' },
    ],
    irrigationTips: [
      'Light, frequent irrigation during flowering.',
      'Avoid overhead watering.',
      'Reduce watering before harvest for higher pungency.',
    ],
    harvestingTips: [
      'Harvest green or red depending on market demand.',
      'Pick regularly to encourage more flowering.',
      'Use scissors — avoid pulling from plant.',
    ],
    storageTips: [
      'Sun-dry for making chili powder.',
      'Store dried chilies in airtight containers.',
      'Green chilies refrigerate for 1 week.',
    ],
    keyAdvice: [
      'Transplant 30-35 day old seedlings.',
      'Spacing: 45cm × 30cm.',
      'Mulch to keep roots cool and moist.',
      'Top-dress with Potash for better fruit quality.',
    ],
  },
  'Sugarcane': {
    emoji: '🪴',
    season: 'Year-round (planted Feb–Mar)',
    soilType: 'Deep, well-drained alluvial loam',
    phRange: '6.0 – 7.5',
    waterNeeds: 'High – 1500–2000mm',
    temperature: '25–35°C',
    growthPeriod: '12–18 months',
    fertilizerSchedule: [
      { stage: 'At planting', fertilizer: 'TSP + Gypsum + MoP', amount: '100 + 100 + 60 kg/ha' },
      { stage: '60 days (tillering)', fertilizer: 'Urea (1st)', amount: '100 kg/ha' },
      { stage: '120 days', fertilizer: 'Urea (2nd)', amount: '100 kg/ha' },
      { stage: '180 days (grand growth)', fertilizer: 'Urea (3rd)', amount: '80 kg/ha' },
    ],
    pestControl: [
      { name: 'Early Shoot Borer', symptoms: 'Dead central shoot', solution: 'Apply Carbofuran granules. Remove dead shoots.' },
      { name: 'Red Rot', symptoms: 'Red discoloration inside stem', solution: 'Use disease-free setts. Remove affected clumps.' },
    ],
    irrigationTips: [
      'Monthly irrigation during dry months.',
      'Critical: tillering and grand growth phases.',
      'Stop irrigation 2 months before harvest.',
    ],
    harvestingTips: [
      'Harvest at 12-18 months depending on variety.',
      'Cut at ground level.',
      'Process within 24 hours for best sugar recovery.',
    ],
    storageTips: [
      'Fresh consumption — store in cool place for 1 week.',
      'For sugar production — process immediately.',
    ],
    keyAdvice: [
      'Use 2-node setts for planting.',
      'Spacing: 75cm between rows.',
      'Ratoon cropping saves cost — 2-3 ratoons possible.',
      'Earthing up 2-3 times during growth.',
    ],
  },
  'Mango': {
    emoji: '🥭',
    season: 'Perennial (fruit Feb–Jul)',
    soilType: 'Deep, well-drained alluvial or laterite',
    phRange: '5.5 – 7.5',
    waterNeeds: 'Moderate – 750–1500mm annually',
    temperature: '24–35°C',
    growthPeriod: 'Perennial (fruit 4–5 months after flowering)',
    fertilizerSchedule: [
      { stage: 'Pre-flowering (Jan)', fertilizer: 'Urea', amount: '1.5 kg per tree' },
      { stage: 'After fruit set', fertilizer: 'TSP + MoP', amount: '0.5 kg + 0.5 kg per tree' },
      { stage: 'Post-harvest', fertilizer: 'FYM (Farm Yard Manure)', amount: '50 kg per tree' },
    ],
    pestControl: [
      { name: 'Mango Hopper', symptoms: 'Nymphs sucking sap from inflorescence', solution: 'Spray Dimethoate during flowering. Oil spray in dormant season.' },
      { name: 'Fruit Fly', symptoms: 'Larvae inside fruit, premature dropping', solution: 'Methyl eugenol traps. Bag individual fruits.' },
      { name: 'Powdery Mildew', symptoms: 'White powdery coating on flowers', solution: 'Spray Sulphur wettable powder at flowering.' },
    ],
    irrigationTips: [
      'Irrigate during dry season (Dec–Mar) for better flowering.',
      'Monthly deep watering for mature trees.',
      'Stop irrigation 2 months before expected flowering.',
    ],
    harvestingTips: [
      'Harvest when fruits change from green to yellow-green.',
      'Use pole with net for high branches.',
      'Handle gently — mango bruises easily.',
    ],
    storageTips: [
      'Ripen at room temperature.',
      'Store ripe fruits in refrigerator for up to 2 weeks.',
      'Process surplus into pickle, chutney, or dried mango.',
    ],
    keyAdvice: [
      'Prune annually after harvest for better air circulation.',
      'Grafting gives fruit in 3-4 years vs 7-8 from seed.',
      'Apply micronutrients (Zinc, Boron) for better fruit set.',
      'Protect from frost in northern Bangladesh.',
    ],
  },
  'Banana': {
    emoji: '🍌',
    season: 'Year-round',
    soilType: 'Deep, well-drained loamy soil',
    phRange: '6.0 – 7.5',
    waterNeeds: 'High – 1200–2200mm',
    temperature: '25–35°C',
    growthPeriod: '10–14 months (plant to harvest)',
    fertilizerSchedule: [
      { stage: 'At planting', fertilizer: 'TSP + Gypsum + MoP', amount: '100 + 80 + 60 kg/ha' },
      { stage: '2 months', fertilizer: 'Urea (1st)', amount: '120 kg/ha' },
      { stage: '4 months', fertilizer: 'Urea (2nd)', amount: '120 kg/ha' },
      { stage: '6 months (shooting)', fertilizer: 'Urea (3rd) + MoP', amount: '60 + 40 kg/ha' },
    ],
    pestControl: [
      { name: 'Panama Disease (Fusarium Wilt)', symptoms: 'Yellowing of lower leaves, wilting', solution: 'No cure — remove and destroy infected plants. Use resistant varieties.' },
      { name: 'Banana Weevil', symptoms: 'Larvae boring into corm', solution: 'Remove old pseudostems. Apply Metarhizium bioagent.' },
    ],
    irrigationTips: [
      'Regular irrigation — never let soil dry out completely.',
      'Mulch heavily to retain moisture.',
      'Drain waterlogged areas immediately.',
    ],
    harvestingTips: [
      'Harvest when fruits are full-sized but still green.',
      'Cut entire bunch and hang to ripen.',
      'Handle carefully — bananas bruise very easily.',
    ],
    storageTips: [
      'Ripen in ethylene chamber or with apple/ethylene gas.',
      'Store ripe bananas at 13-15°C.',
      'Do not store near other ripe fruits.',
    ],
    keyAdvice: [
      'Plant suckers from healthy mother plants.',
      'Desucker — keep only 1 main + 1 ratoon per mat.',
      'Propping needed when bunch develops.',
      'Remove dried leaves regularly for pest prevention.',
    ],
  },
  'Groundnut': {
    emoji: '🥜',
    season: 'Rabi (Oct–Feb)',
    soilType: 'Sandy loam, loose and well-drained',
    phRange: '5.5 – 7.0',
    waterNeeds: 'Low to Moderate – 300–500mm',
    temperature: '20–30°C',
    growthPeriod: '90–120 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '100 + 200 kg/ha' },
      { stage: '25 days', fertilizer: 'Urea', amount: '30 kg/ha' },
    ],
    pestControl: [
      { name: 'Leaf Miner', symptoms: 'White serpentine mines on leaves', solution: 'Spramectin emamectin benzoate.' },
      { name: 'Root Rot', symptoms: 'Plants wilting, brown roots', solution: 'Use Trichoderma seed treatment. Ensure drainage.' },
    ],
    irrigationTips: [
      'Critical: pegging and pod filling stage.',
      'Light irrigation at flowering.',
      'Stop irrigation 2 weeks before harvest.',
    ],
    harvestingTips: [
      'Harvest when leaves turn yellow and pods are mature.',
      'Uproot carefully to keep pods attached.',
      'Dry pods on tarpaulin for 3-4 days.',
    ],
    storageTips: [
      'Shell and dry kernels to 7% moisture.',
      'Store in jute bags in cool, dry place.',
    ],
    keyAdvice: [
      'Inoculate seeds with Rhizobium for better nodulation.',
      'Earthing up helps peg penetration.',
      'Intercrop with sorghum for additional income.',
    ],
  },
  'Cauliflower': {
    emoji: '🥬',
    season: 'Rabi (Oct–Feb)',
    soilType: 'Rich, well-drained loam',
    phRange: '6.0 – 7.0',
    waterNeeds: 'Moderate – 400–600mm',
    temperature: '15–20°C',
    growthPeriod: '80–120 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum + MoP', amount: '200 + 100 + 100 kg/ha' },
      { stage: '20 days after transplanting', fertilizer: 'Urea (1st)', amount: '100 kg/ha' },
      { stage: '40 days (curd initiation)', fertilizer: 'Urea (2nd)', amount: '100 kg/ha' },
    ],
    pestControl: [
      { name: 'Diamondback Moth', symptoms: 'Larvae skeletonizing leaves', solution: 'Spray Bacillus thuringiensis (Bt). Use pheromone traps.' },
      { name: 'Canker', symptoms: 'Necrotic spots on curd and leaves', solution: 'Use resistant varieties. Copper spray during wet weather.' },
    ],
    irrigationTips: [
      'Regular irrigation for uniform curd development.',
      'Mulch to keep soil cool.',
      'Avoid water stress during curd formation.',
    ],
    harvestingTips: [
      'Harvest when curd is firm and white.',
      'Cut with 2-3 leaves attached for protection.',
      'Harvest in morning for best quality.',
    ],
    storageTips: [
      'Refrigerate at 0-2°C for up to 4 weeks.',
      'Do not wash before storing.',
    ],
    keyAdvice: [
      'Transplant 25-30 day old seedlings.',
      'Spacing: 45cm × 45cm.',
      'Tie leaves over curd to prevent sun scald.',
      'Boron application prevents hollow stem.',
    ],
  },
  'Cabbage': {
    emoji: '🥗',
    season: 'Rabi (Nov–Mar)',
    soilType: 'Rich, well-drained loam',
    phRange: '6.0 – 7.5',
    waterNeeds: 'Moderate – 400–500mm',
    temperature: '15–20°C',
    growthPeriod: '80–110 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '150 + 80 kg/ha' },
      { stage: '20 days', fertilizer: 'Urea (1st)', amount: '80 kg/ha' },
      { stage: '40 days', fertilizer: 'Urea (2nd)', amount: '80 kg/ha' },
    ],
    pestControl: [
      { name: 'Diamondback Moth', symptoms: 'Larvae eating holes in leaves', solution: 'Spray Bt. Use yellow sticky traps.' },
      { name: 'Black Rot', symptoms: 'V-shaped yellow lesions on leaf edges', solution: 'Use disease-free seeds. Copper spray. Crop rotation.' },
    ],
    irrigationTips: [
      'Regular moisture — do not let soil dry out.',
      'Drip irrigation ideal.',
      'Reduce watering as heads mature.',
    ],
    harvestingTips: [
      'Harvest when heads are firm and compact.',
      'Cut with a sharp knife, leaving 2-3 outer leaves.',
    ],
    storageTips: [
      'Refrigerate at 0°C for up to 3 months.',
      'Wrap individually in newspaper for storage.',
    ],
    keyAdvice: [
      'Spacing: 45cm × 45cm.',
      'Transplant 25-30 day old seedlings.',
      'Side-dress with Nitrogen at 30 days.',
    ],
  },
  'Pumpkin': {
    emoji: '🎃',
    season: 'Kharif (Mar–Jun)',
    soilType: 'Rich, well-drained loam',
    phRange: '6.0 – 7.5',
    waterNeeds: 'Moderate – 400–600mm',
    temperature: '25–32°C',
    growthPeriod: '90–120 days',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '100 + 60 kg/ha' },
      { stage: '20 days', fertilizer: 'Urea (1st)', amount: '60 kg/ha' },
      { stage: '45 days (vine spread)', fertilizer: 'Urea (2nd)', amount: '60 kg/ha' },
    ],
    pestControl: [
      { name: 'Fruit Fly', symptoms: 'Larvae inside fruit, premature rotting', solution: 'Methyl eugenol traps. Bag developing fruits.' },
      { name: 'Powdery Mildew', symptoms: 'White powdery spots on leaves', solution: 'Spray Sulphur. Improve air circulation.' },
    ],
    irrigationTips: [
      'Regular watering during vine growth.',
      'Heavy irrigation during fruit development.',
      'Stop 1 week before harvest for better storage.',
    ],
    harvestingTips: [
      'Harvest when skin is hard and stem dries.',
      'Cut with a long stem attached for storage.',
    ],
    storageTips: [
      'Store in cool, dry place — lasts 2-3 months.',
      'Do not wash before storing.',
    ],
    keyAdvice: [
      'Provide trellis or ground space for vines.',
      'Hand-pollinate if bee activity is low.',
      'Mulch to keep fruit off wet ground.',
    ],
  },
  'Eggplant': {
    emoji: '🍆',
    season: 'Year-round (best Rabi)',
    soilType: 'Well-drained, fertile loam',
    phRange: '5.5 – 7.0',
    waterNeeds: 'Moderate – 400–600mm',
    temperature: '22–32°C',
    growthPeriod: '60–80 days (first harvest)',
    fertilizerSchedule: [
      { stage: 'Basal', fertilizer: 'TSP + Gypsum', amount: '150 + 80 kg/ha' },
      { stage: '20 days', fertilizer: 'Urea (1st)', amount: '60 kg/ha' },
      { stage: 'First harvest', fertilizer: 'Urea (2nd)', amount: '60 kg/ha' },
      { stage: 'Every 3 weeks after', fertilizer: 'Urea', amount: '30 kg/ha' },
    ],
    pestControl: [
      { name: 'Fruit and Shoot Borer', symptoms: 'Holes in fruits, wilted shoots', solution: 'Spray Indoxacarb. Use pheromone traps. Remove damaged fruits.' },
      { name: 'Wilt Disease', symptoms: 'Sudden wilting of branches', solution: 'Remove infected plants. Drench soil with Trichoderma.' },
    ],
    irrigationTips: [
      'Regular irrigation — sensitive to drought.',
      'Mulch to retain moisture.',
      'Drip irrigation reduces disease.',
    ],
    harvestingTips: [
      'Harvest when fruits are glossy and firm.',
      'Cut with secateurs — do not pull.',
      'Pick regularly to encourage more flowering.',
    ],
    storageTips: [
      'Use within 2-3 days for best quality.',
      'Refrigerate at 8-10°C for up to 1 week.',
    ],
    keyAdvice: [
      'Stake plants for support.',
      'Prune side shoots for larger fruits.',
      'Crop rotation essential — same family as tomato and chili.',
    ],
  },
};
