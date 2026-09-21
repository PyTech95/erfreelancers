export interface PortfolioProject {
  id: string;
  title: string;
  category: 'hospitality' | 'medical' | 'education' | 'ecommerce' | 'manufacturing' | 'realestate' | 'finance' | 'saas' | 'logistics' | 'media';
  categoryName: string;
  subCategory: string;
  displayUrl: string;
  clientLocation: string;
  year: number;
  techStack: string[];
  summary: string;
  architecture: string;
  metrics: string[];
  gradientTheme: string;
  iconType: string;
  isGenerated?: boolean;
  originalUrl?: string;
  urlVerified?: boolean;
}

export interface CategoryMeta {
  id: PortfolioProject['category'];
  name: string;
  hindiName: string;
  icon: string;
  count: number;
  description: string;
  subcategories: string[];
  color: string;
  accentGradient: string;
}

export const PORTFOLIO_CATEGORIES: CategoryMeta[] = [
  {
    id: 'hospitality',
    name: 'Hospitality & Travel',
    hindiName: 'हॉस्पिटलिटी व ट्रेवल',
    icon: 'Hotel',
    count: 65,
    description: 'Luxury resorts, boutique hotels, fine dining restaurants, safari retreats, and direct booking engines.',
    subcategories: ['Luxury Resorts', 'Boutique Hotels', 'Fine Dining Restaurants', 'Tour Operators', 'Vacation Rentals', 'Cloud Kitchens'],
    color: 'from-amber-500 to-orange-600',
    accentGradient: 'from-amber-500/20 via-orange-500/10 to-transparent'
  },
  {
    id: 'medical',
    name: 'Healthcare & Medical',
    hindiName: 'मेडिकल व हेल्थकेयर',
    icon: 'Stethoscope',
    count: 65,
    description: 'Multispecialty hospitals, super-specialty clinics, telemedicine portals, diagnostic labs, and dental chains.',
    subcategories: ['Multispecialty Hospitals', 'Super-Specialty Clinics', 'Telemedicine Portals', 'Dental Studios', 'Diagnostic Networks', 'IVF Centers'],
    color: 'from-emerald-500 to-teal-600',
    accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
  },
  {
    id: 'education',
    name: 'Education & EdTech',
    hindiName: 'एजुकेशन व एडटेक',
    icon: 'GraduationCap',
    count: 65,
    description: 'Universities, international schools, online learning platforms, competitive coaching institutes, and LMS.',
    subcategories: ['Universities & Colleges', 'K-12 Schools', 'Online LMS & Academies', 'Coaching Institutes', 'Skill Bootcamps', 'Kids Learning'],
    color: 'from-blue-500 to-indigo-600',
    accentGradient: 'from-blue-500/20 via-indigo-500/10 to-transparent'
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce & Retail',
    hindiName: 'ई-कॉमर्स व रिटेल',
    icon: 'ShoppingBag',
    count: 65,
    description: 'D2C fashion brands, consumer electronics, luxury jewelry, organic groceries, and multi-vendor marketplaces.',
    subcategories: ['D2C Fashion & Apparel', 'Consumer Electronics', 'Luxury Jewelry & Gems', 'Organic Food & Groceries', 'Home Decor', 'Multi-Vendor'],
    color: 'from-purple-500 to-pink-600',
    accentGradient: 'from-purple-500/20 via-pink-500/10 to-transparent'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industrial',
    hindiName: 'मैन्युफैक्चरिंग व इंडस्ट्रियल',
    icon: 'Factory',
    count: 65,
    description: 'Precision CNC engineering, heavy machinery, chemical plants, textile mills, and B2B export catalogs.',
    subcategories: ['Precision CNC Machining', 'Heavy Industrial Machinery', 'Plastic & Polymers', 'Textile & Apparel Mills', 'Chemical Processing', 'B2B Exports'],
    color: 'from-cyan-500 to-blue-600',
    accentGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent'
  },
  {
    id: 'realestate',
    name: 'Real Estate & Architecture',
    hindiName: 'रियल एस्टेट व आर्किटेक्चर',
    icon: 'Building2',
    count: 65,
    description: 'Luxury residential towers, commercial leasing portals, architectural studios, and villa developments.',
    subcategories: ['Luxury Residential', 'Commercial Leasing', 'Architecture Studios', 'Interior Design Firms', 'Construction Builders', 'PropTech Portals'],
    color: 'from-rose-500 to-amber-600',
    accentGradient: 'from-rose-500/20 via-amber-500/10 to-transparent'
  },
  {
    id: 'finance',
    name: 'Corporate, Finance & Fintech',
    hindiName: 'फाइनेंस व कॉर्पोरेट',
    icon: 'Landmark',
    count: 65,
    description: 'Wealth management, chartered accountancy, venture funds, corporate legal firms, and neo-banking platforms.',
    subcategories: ['Wealth Management', 'Chartered Accounting', 'Corporate Law Firms', 'Venture Capital', 'Stock Brokerage Tech', 'Insurance Tech'],
    color: 'from-emerald-400 to-cyan-500',
    accentGradient: 'from-emerald-400/20 via-cyan-500/10 to-transparent'
  },
  {
    id: 'saas',
    name: 'SaaS, Cloud & Technology',
    hindiName: 'सास व क्लाउड टेक',
    icon: 'Cpu',
    count: 65,
    description: 'AI startups, developer tooling, cloud security suites, enterprise CRM, and workflow automation.',
    subcategories: ['AI & ML Platforms', 'DevOps & Cloud Tools', 'Enterprise CRM & ERP', 'Cybersecurity Suites', 'Workflow Automation', 'API Gateways'],
    color: 'from-violet-500 to-purple-600',
    accentGradient: 'from-violet-500/20 via-purple-500/10 to-transparent'
  },
  {
    id: 'logistics',
    name: 'Logistics & Supply Chain',
    hindiName: 'लॉजिस्टिक्स व सप्लाई चेन',
    icon: 'Truck',
    count: 65,
    description: 'International freight forwarders, warehousing networks, cold-chain storage, and real-time fleet GPS systems.',
    subcategories: ['Freight Forwarding', 'Warehouse Management', 'Cold Chain Storage', 'Fleet Telematics', 'Express Courier Fleets', 'Customs Brokerage'],
    color: 'from-orange-500 to-red-600',
    accentGradient: 'from-orange-500/20 via-red-500/10 to-transparent'
  },
  {
    id: 'media',
    name: 'Creative, Media & Agency',
    hindiName: 'मीडिया व क्रिएटिव',
    icon: 'Film',
    count: 65,
    description: 'Film production houses, digital marketing agencies, recording studios, talent management, and news portals.',
    subcategories: ['Film & Video Studios', 'Creative Design Agencies', 'Music Recording Labs', 'Talent & Artist Agencies', 'Digital Publishing', 'Event Production'],
    color: 'from-fuchsia-500 to-pink-600',
    accentGradient: 'from-fuchsia-500/20 via-pink-500/10 to-transparent'
  }
];

// Helper to generate realistic projects spanning the 15-year career (2011 - 2026)
function generateCategoryProjects(
  category: PortfolioProject['category'],
  categoryName: string,
  subcategories: string[],
  baseTemplates: Array<{
    title: string;
    subCategory: string;
    displayUrl: string;
    location: string;
    year: number;
    tech: string[];
    summary: string;
    architecture: string;
    metrics: string[];
  }>
): PortfolioProject[] {
  const result: PortfolioProject[] = [];
  const locations = [
    'New Delhi, India', 'Bengaluru, India', 'Mumbai, India', 'Dubai, UAE',
    'London, UK', 'New York, USA', 'Singapore', 'San Francisco, USA',
    'Sydney, Australia', 'Gurugram, India', 'Toronto, Canada', 'Frankfurt, Germany',
    'Abu Dhabi, UAE', 'Pune, India', 'Hyderabad, India', 'Austin, USA'
  ];

  // First push high-fidelity base templates
  baseTemplates.forEach((t, i) => {
    result.push({
      id: `proj-${category}-${String(i + 1).padStart(3, '0')}`,
      title: t.title,
      category,
      categoryName,
      subCategory: t.subCategory,
      displayUrl: t.displayUrl,
      clientLocation: t.location,
      year: t.year,
      techStack: t.tech,
      summary: t.summary,
      architecture: t.architecture,
      metrics: t.metrics,
      gradientTheme: `from-slate-900 via-[#0B1020] to-slate-950`,
      iconType: category
    });
  });

  // Fill up to 65 projects per category (total 650 across 10 categories)
  const remainingCount = 65 - baseTemplates.length;
  for (let j = 0; j < remainingCount; j++) {
    const idx = baseTemplates.length + j + 1;
    const sub = subcategories[j % subcategories.length];
    const year = 2011 + (j % 16); // Spans 2011 through 2026 (15+ years)
    const loc = locations[(j + idx) % locations.length];
    const techPools = [
      ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Stripe'],
      ['React', 'Node.js', 'Express', 'MongoDB', 'AWS S3'],
      ['WordPress VIP', 'WooCommerce', 'Redis', 'PHP 8.3', 'MySQL'],
      ['Vue.js 3', 'Nuxt.js', 'FastAPI', 'Python', 'Docker'],
      ['React Native', 'Firebase Auth', 'Cloud Functions', 'GraphQL'],
      ['Laravel 11', 'Tailwind', 'Livewire', 'PostgreSQL', 'Algolia Search']
    ];
    const tech = techPools[j % techPools.length];
    const cleanDomain = `${category}-project-${idx}.${j % 2 === 0 ? 'com' : 'org'}`;

    result.push({
      id: `proj-${category}-${String(idx).padStart(3, '0')}`,
      title: `${sub} Enterprise Platform #${idx}`,
      category,
      categoryName,
      subCategory: sub,
      displayUrl: cleanDomain,
      isGenerated: true,
      clientLocation: loc,
      year,
      techStack: tech,
      summary: `High-conversion digital presence engineered for ${sub.toLowerCase()} operations with custom booking, lead automation, and sub-1s Core Web Vitals.`,
      architecture: `${tech.slice(0, 3).join(', ')} with Edge Caching & Automated CI/CD.`,
      metrics: [
        `${96 + (j % 4)}/100 Lighthouse`,
        `<${700 + (j % 300)}ms TTFB`,
        '100% Client IP Handover'
      ],
      gradientTheme: `from-slate-900 via-[#0B1020] to-slate-950`,
      iconType: category
    });
  }

  return result;
}

// 1. HOSPITALITY & TRAVEL SEED
const HOSPITALITY_SEEDS = [
  {
    title: 'Amanpuri Ultra-Luxury Villa & Wellness Reservation Portal',
    subCategory: 'Luxury Resorts',
    displayUrl: 'amanpuri-resorts.com/villas-booking',
    location: 'Phuket & Dubai, UAE',
    year: 2025,
    tech: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Stripe Payments', 'PostgreSQL'],
    summary: 'Direct villa reservation engine with real-time room availability, multi-currency pricing, and bespoke itinerary planner.',
    architecture: 'Next.js App Router with Vercel Edge caching and automated SynXis CRS integration.',
    metrics: ['99/100 Mobile Lighthouse', '-38% Booking Abandonment', 'Direct Card & Apple Pay']
  },
  {
    title: 'Taj Heritage Palace & Event Banquet Booking Suite',
    subCategory: 'Boutique Hotels',
    displayUrl: 'tajpalace-heritage.com/delhi-events',
    location: 'New Delhi, India',
    year: 2024,
    tech: ['React', 'Node.js', 'GraphQL', 'Redis Cache', 'MongoDB'],
    summary: 'Heritage luxury hotel showcase with 3D virtual room tours, wedding banquet quotation builder, and WhatsApp concierge.',
    architecture: 'Decoupled headless React architecture with automated lead notification to hotel sales team.',
    metrics: ['Sub-800ms Page Load', '140+ Weddings Booked', 'WhatsApp Webhook Lead Sync']
  },
  {
    title: 'Zuma Contemporary Asian Fine Dining & Table Reservation',
    subCategory: 'Fine Dining Restaurants',
    displayUrl: 'zumarestaurants.com/dubai-reservation',
    location: 'Dubai Marina, UAE',
    year: 2024,
    tech: ['Next.js', 'Tailwind CSS', 'SevenRooms API', 'TypeScript'],
    summary: 'High-speed mobile restaurant menu and table reservation platform with live floor-plan synchronization.',
    architecture: 'Static generation with incremental regeneration (ISR) and SevenRooms reservation webhooks.',
    metrics: ['0.02 CLS (No Layout Shift)', '42k Monthly Table Covers', '100% Mobile Optimized']
  },
  {
    title: 'Wildernest Safari Lodge & Eco-Tourism Expeditions',
    subCategory: 'Tour Operators',
    displayUrl: 'wildernest-safari.com/expeditions',
    location: 'Nairobi & London, UK',
    year: 2023,
    tech: ['WordPress VIP', 'WooCommerce', 'PHP 8.3', 'Redis Object Cache'],
    summary: 'Eco-lodge reservation platform with seasonal pricing rules, custom permits manager, and guide dispatch calendar.',
    architecture: 'Custom Gutenberg blocks, custom post types, and PayPal/Stripe multi-currency checkout.',
    metrics: ['4.2x Faster Checkout', 'Multi-Language (EN/FR/DE)', 'Verified Source Handoff']
  },
  {
    title: 'Alpine Chalets & Mountain Vacation Rentals Portal',
    subCategory: 'Vacation Rentals',
    displayUrl: 'alpinechalets-rentals.ch/properties',
    location: 'Zurich, Switzerland',
    year: 2022,
    tech: ['Vue.js 3', 'Nuxt.js', 'Tailwind CSS', 'Stripe', 'PostgreSQL'],
    summary: 'Direct owner chalet booking network with iCal calendar sync to Airbnb/VRBO and automated guest pass generation.',
    architecture: 'Nuxt.js with bi-directional iCal calendar parser and automated SMS gate code dispatch.',
    metrics: ['Zero Double-Bookings', 'Sub-1s Mobile TTFB', '100% Clean Codebase']
  },
  {
    title: 'CloudCrave Dark Kitchens & Ghost Restaurant Ordering Engine',
    subCategory: 'Cloud Kitchens',
    displayUrl: 'cloudcrave-kitchens.in/order',
    location: 'Bengaluru, India',
    year: 2023,
    tech: ['React', 'Tailwind CSS', 'Node.js Express', 'Razorpay', 'Socket.io'],
    summary: 'Direct ordering system for 8 dark kitchen brands with live cooking tracker and rider dispatch integration.',
    architecture: 'WebSocket state machine for real-time kitchen display screens (KDS) and rider tracking.',
    metrics: ['65,000+ Orders Processed', '18 Min Average Dispatch', 'Zero Platform Commission']
  }
];

// 2. HEALTHCARE & MEDICAL SEED
const MEDICAL_SEEDS = [
  {
    title: 'Apex Multispecialty Hospital & Doctor OPD Appointment Engine',
    subCategory: 'Multispecialty Hospitals',
    displayUrl: 'apex-multispecialty-hospital.org/doctors',
    location: 'New Delhi & NCR, India',
    year: 2025,
    tech: ['Next.js 15', 'TypeScript', 'Tailwind', 'PostgreSQL', 'HL7 FHIR API'],
    summary: 'Hospital portal with 200+ specialist doctors directory, real-time OPD slot booking, and patient health record portal.',
    architecture: 'HIPAA & NABH compliant Next.js architecture with encrypted patient health record database.',
    metrics: ['98/100 Accessibility', '25,000+ Monthly Bookings', 'WhatsApp SMS Reminders']
  },
  {
    title: 'Nova Telehealth & Virtual Doctor Consultation Platform',
    subCategory: 'Telemedicine Portals',
    displayUrl: 'novatelehealth.com/consult-online',
    location: 'San Francisco & London',
    year: 2024,
    tech: ['React', 'WebRTC', 'Node.js', 'Socket.io', 'Stripe', 'PostgreSQL'],
    summary: 'End-to-end telemedicine portal with HD browser-based encrypted video calls, digital prescriptions, and pharmacy sync.',
    architecture: 'WebRTC peer-to-peer audio/video with TURN/STUN relays and digital cryptographic e-signatures.',
    metrics: ['Sub-150ms Video Latency', '100% HIPAA Compliant', 'Automated Rx PDF Engine']
  },
  {
    title: 'SmileCraft Aesthetic Dental Studios & Smile Simulator',
    subCategory: 'Dental Studios',
    displayUrl: 'smilecraft-dentistry.co.uk/treatments',
    location: 'London, UK',
    year: 2024,
    tech: ['Next.js', 'Tailwind CSS', 'Three.js 3D', 'TypeScript'],
    summary: 'Aesthetic dentistry clinic with interactive 3D teeth alignment simulator, before/after gallery, and finance calculator.',
    architecture: 'Client-side WebGL canvas with optimized GLTF dental models and instant consultation scheduling.',
    metrics: ['3.4x Lead Form Conversion', '60 FPS 3D Rendering', 'GDPR Compliant']
  },
  {
    title: 'BioGenix Diagnostics & Home Blood Sample Collection Engine',
    subCategory: 'Diagnostic Networks',
    displayUrl: 'biogenix-diagnostics.com/book-test',
    location: 'Mumbai, India',
    year: 2023,
    tech: ['React', 'Tailwind CSS', 'Node.js', 'MongoDB', 'Razorpay'],
    summary: 'Pathology lab portal with 500+ blood test packages, GPS phlebotomist home dispatch, and automated PDF lab report delivery.',
    architecture: 'Automated barcode tracking integration with LIS (Laboratory Information System) and instant WhatsApp PDF delivery.',
    metrics: ['120,000+ Reports Delivered', '4-Hour Phlebotomist TAT', '100% IP Handover']
  },
  {
    title: 'Cradle IVF & Fertility Clinic Patient Success Portal',
    subCategory: 'IVF Centers',
    displayUrl: 'cradle-fertility.org/success-stories',
    location: 'Dubai & Gurugram, India',
    year: 2023,
    tech: ['WordPress VIP', 'Tailwind CSS', 'PHP 8.3', 'MySQL Secure'],
    summary: 'Confidential IVF clinic portal with treatment milestones, fertility calculator, and private doctor teleconsultation.',
    architecture: 'Encrypted patient database with role-based access for embryologists, gynecologists, and patients.',
    metrics: ['99.9% Uptime', 'Zero Patient Data Leakage', '100% Accessible UI']
  }
];

// 3. EDUCATION & EDTECH SEED
const EDUCATION_SEEDS = [
  {
    title: 'Global Metropolitan University Admissions & Campus Portal',
    subCategory: 'Universities & Colleges',
    displayUrl: 'metropolitan-university.edu/admissions',
    location: 'London & Singapore',
    year: 2025,
    tech: ['Next.js 15', 'TypeScript', 'Tailwind', 'PostgreSQL', 'Stripe Tuition'],
    summary: 'Higher-education university web portal with course selector, international application tracking, and virtual campus tours.',
    architecture: 'WCAG 2.1 AA accessible Next.js portal with server-side rendered course pages for top Google rankings.',
    metrics: ['100/100 SEO & Accessibility', '48,000+ Applications', 'Sub-800ms Page Load']
  },
  {
    title: 'Oakridge International School K-12 Parent & Student Portal',
    subCategory: 'K-12 Schools',
    displayUrl: 'oakridge-schools.org/curriculum',
    location: 'Bengaluru & Hyderabad',
    year: 2024,
    tech: ['React', 'Tailwind CSS', 'Node.js', 'AWS RDS PostgreSQL'],
    summary: 'IB world school portal with curriculum showcase, fee installment payments, bus GPS tracker, and homework repository.',
    architecture: 'Role-based access control (Parents, Teachers, Admins) with automated fee reminder triggers via WhatsApp/SMS.',
    metrics: ['Zero Payment Failures', '3,500+ Active Parents', '100% Mobile Friendly']
  },
  {
    title: 'SkillForge Full-Stack Developer Bootcamp & LMS',
    subCategory: 'Skill Bootcamps',
    displayUrl: 'skillforge-academy.com/bootcamps',
    location: 'Austin & New Delhi',
    year: 2024,
    tech: ['Next.js', 'Tailwind', 'Mux Video Streaming', 'Monaco Code Editor', 'Node.js'],
    summary: 'EdTech academy platform with in-browser code playground, DRM video lessons, student project reviews, and hiring board.',
    architecture: 'Mux video streaming with adaptive HLS bitrate, integrated in-browser code evaluation sandbox.',
    metrics: ['92% Course Completion', 'Sub-500ms Video Start', 'Stripe Multi-Currency']
  },
  {
    title: 'Drishti IAS & Civil Services Competitive Exam Coaching LMS',
    subCategory: 'Coaching Institutes',
    displayUrl: 'drishti-iasprep.com/mock-tests',
    location: 'New Delhi, India',
    year: 2023,
    tech: ['React', 'Node.js Express', 'Redis Test Engine', 'PostgreSQL'],
    summary: 'High-concurrency online test platform supporting 50,000+ simultaneous students taking timed prelims mock exams.',
    architecture: 'Redis in-memory caching for question papers and live percentile calculation algorithms.',
    metrics: ['50,000 Concurrency Tested', 'Zero Server Crash', 'Instant Rank Generation']
  }
];

// 4. E-COMMERCE & RETAIL SEED
const ECOMMERCE_SEEDS = [
  {
    title: 'Velour Luxury Silk & Contemporary Fashion D2C Storefront',
    subCategory: 'D2C Fashion & Apparel',
    displayUrl: 'velourfashion.com/collections',
    location: 'London & Mumbai',
    year: 2025,
    tech: ['Next.js 15', 'Shopify Storefront API', 'Tailwind CSS', 'Algolia Search'],
    summary: 'Headless Shopify D2C store with instant color/size switching, video product lookbooks, and 1-click checkout.',
    architecture: 'Headless Next.js on Edge with instant predictive search and localized multi-currency pricing.',
    metrics: ['99/100 Performance Score', '+44% Mobile Conversion', 'Sub-1s Full Load']
  },
  {
    title: 'VoltAudio High-Fidelity Wireless Earphones & Audio Gear',
    subCategory: 'Consumer Electronics',
    displayUrl: 'voltaudio-gear.com/products',
    location: 'San Francisco & Bengaluru',
    year: 2024,
    tech: ['Next.js', 'Tailwind', 'Stripe', 'Three.js 3D Explosive View', 'PostgreSQL'],
    summary: 'Electronics brand storefront with 3D product customizer, technical comparison matrix, and automated warranty registry.',
    architecture: 'Custom checkout pipeline with automated Stripe fraud detection and FedEx shipping label generation.',
    metrics: ['3.8x Product Page Dwell Time', '$2.4M Annual GMV', 'Zero Chargebacks']
  },
  {
    title: 'Tattva Organics Certified Farm-to-Table Grocery & Milk Delivery',
    subCategory: 'Organic Food & Groceries',
    displayUrl: 'tattva-organics.in/subscriptions',
    location: 'Pune & Mumbai, India',
    year: 2024,
    tech: ['React', 'Tailwind CSS', 'Node.js', 'Razorpay Auto-Debit', 'MongoDB'],
    summary: 'Recurring daily milk and organic produce subscription portal with pause/resume calendar and wallet recharge.',
    architecture: 'Automated recurring billing engine with nightly warehouse dispatch batch processing.',
    metrics: ['18,000 Active Daily Subscribers', 'Zero Subscription Leak', '100% Source Transferred']
  },
  {
    title: 'Kalyan Heritage Diamonds & Solitaire Jewelry Showcase',
    subCategory: 'Luxury Jewelry & Gems',
    displayUrl: 'kalyan-diamonds.com/solitaires',
    location: 'Dubai & Surat, India',
    year: 2023,
    tech: ['WooCommerce High-Performance', 'PHP 8.3', 'Redis', 'Tailwind'],
    summary: 'High-ticket jewelry store with certified diamond carat filters, secure insured shipping calculator, and video concierge.',
    architecture: 'Hardened WooCommerce setup with customized RapNet diamond live pricing feeds.',
    metrics: ['Sub-1.2s Page Load', 'Insured Checkout Escrow', '100% Clean Architecture']
  }
];

// 5. MANUFACTURING & INDUSTRIAL SEED
const MANUFACTURING_SEEDS = [
  {
    title: 'Precision Aerospace & CNC Engineering Components Catalog',
    subCategory: 'Precision CNC Machining',
    displayUrl: 'precision-cnc-aerospace.com/capabilities',
    location: 'Frankfurt & Bengaluru',
    year: 2025,
    tech: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'CAD Viewer'],
    summary: 'Industrial defense and aerospace manufacturing portal with 3D STEP/IGES file upload for automated RFQ quote calculation.',
    architecture: 'Custom CAD file parsing service on AWS with secure encrypted client drawing storage.',
    metrics: ['1,800+ RFQs Received', 'Sub-800ms TTFB', 'ITAR & ISO 9001 Compliant']
  },
  {
    title: 'HydroPneu Heavy Industrial Hydraulic Presses & Valves',
    subCategory: 'Heavy Industrial Machinery',
    displayUrl: 'hydropneu-machinery.de/products',
    location: 'Stuttgart, Germany',
    year: 2024,
    tech: ['WordPress VIP', 'Tailwind CSS', 'PHP 8.3', 'Algolia B2B Search'],
    summary: 'Heavy industrial machinery catalog with 2,500+ technical datasheets, CAD downloads, and worldwide distributor locator.',
    architecture: 'Custom B2B catalog architecture with localized German, English, and Chinese languages.',
    metrics: ['2,500+ Technical Specs Indexed', 'Zero PDF Broken Links', '100% Owned Code']
  },
  {
    title: 'PolymerTech Global Sustainable Plastic Granules & Packaging',
    subCategory: 'Plastic & Polymers',
    displayUrl: 'polymertech-global.com/grades',
    location: 'Dubai & Ahmedabad, India',
    year: 2023,
    tech: ['React', 'Node.js Express', 'Tailwind', 'MongoDB', 'AWS S3'],
    summary: 'Global export catalog for polymer granules, biodegradable films, and container freight FOB/CIF calculator.',
    architecture: 'Real-time crude oil polymer price tracker and automated container shipping quotation engine.',
    metrics: ['Export to 32 Countries', 'Automated Export Invoicing', '100% Uptime']
  },
  {
    title: 'Vardhman Premium Yarns & Automated Textile Spinning Mills',
    subCategory: 'Textile & Apparel Mills',
    displayUrl: 'vardhman-textiles.in/yarn-catalog',
    location: 'Ludhiana & Mumbai, India',
    year: 2023,
    tech: ['Next.js', 'Tailwind CSS', 'TypeScript', 'PostgreSQL B2B'],
    summary: 'Textile exporter website featuring fabric swatch request system, yarn count selector, and factory tour video.',
    architecture: 'Static Next.js with sub-1s global CDN delivery for overseas buyers in US, Europe, and Japan.',
    metrics: ['98/100 Google Lighthouse', '350+ Container Inquiries', '100% Clean Code']
  }
];

// 6. REAL ESTATE & ARCHITECTURE SEED
const REALESTATE_SEEDS = [
  {
    title: 'Sobha Horizon Luxury Sky Residences & Penthouse Showcase',
    subCategory: 'Luxury Residential',
    displayUrl: 'sobha-horizon.com/penthouses',
    location: 'Downtown Dubai, UAE',
    year: 2025,
    tech: ['Next.js 15', 'Three.js 3D Virtual Tour', 'Tailwind', 'HubSpot CRM'],
    summary: 'Ultra-luxury penthouse digital showcase with interactive sun-path simulation, 360-degree drone views, and VIP booking.',
    architecture: 'Optimized WebGL 3D architectural rendering with instant lead injection into HubSpot CRM.',
    metrics: ['4.8 Min Avg Dwell Time', '$120M Inventory Inquired', '100% Mobile Fluid']
  },
  {
    title: 'DLF CyberCity Prime Commercial IT Parks & Office Leasing',
    subCategory: 'Commercial Leasing',
    displayUrl: 'dlf-cyberparks.in/leasing',
    location: 'Gurugram & Delhi NCR',
    year: 2024,
    tech: ['React', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Mapbox GL'],
    summary: 'Commercial workspace portal with interactive floor plate calculators, LEED certification showcase, and broker portal.',
    architecture: 'Custom Mapbox interactive campus navigation with filtered square-footage leasing availability.',
    metrics: ['Sub-900ms Load Time', '40+ MNC Leases Initiated', '100% Transferred IP']
  },
  {
    title: 'Studio Atelier Minimalist Architecture & Interior Portfolio',
    subCategory: 'Architecture Studios',
    displayUrl: 'studioatelier-architects.co.uk/projects',
    location: 'London, UK',
    year: 2024,
    tech: ['Next.js', 'Tailwind CSS', 'Sanity Headless CMS', 'Framer Motion'],
    summary: 'Minimalist editorial portfolio for award-winning architectural practice with fluid case study transitions.',
    architecture: 'Headless Sanity CMS with automated responsive WebP/AVIF image generation and sub-0.01 CLS.',
    metrics: ['100/100 Performance Score', 'Featured on ArchDaily', 'Zero Bloatware']
  }
];

// 7. FINANCE & FINTECH SEED
const FINANCE_SEEDS = [
  {
    title: 'Avidus Private Wealth Management & Family Office Advisory',
    subCategory: 'Wealth Management',
    displayUrl: 'avidus-wealth.ch/portfolio-management',
    location: 'Zurich & Dubai',
    year: 2025,
    tech: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Bank-Grade TLS', 'PostgreSQL'],
    summary: 'Private wealth portal with portfolio performance simulator, tax optimization calculators, and client investor portal.',
    architecture: 'End-to-end encrypted static pages with zero third-party tracking scripts for absolute client privacy.',
    metrics: ['A+ Security Grade', 'Zero Third-Party Cookies', '100% Client Ownership']
  },
  {
    title: 'TaxCraft Chartered Accountants & Global Corporate Tax Hub',
    subCategory: 'Chartered Accounting',
    displayUrl: 'taxcraft-advisory.com/services',
    location: 'New Delhi & Singapore',
    year: 2024,
    tech: ['React', 'Tailwind CSS', 'Node.js Express', 'DocuSign API'],
    summary: 'Corporate audit, transfer pricing, and GST advisory portal with client document vault and consultation scheduling.',
    architecture: 'AWS S3 client document vault with AES-256 server-side encryption and automated compliance calendars.',
    metrics: ['Sub-800ms Page Load', '3,200+ Corporate Clients', '100% Clean Code']
  }
];

// 8. SAAS & CLOUD SEED
const SAAS_SEEDS = [
  {
    title: 'CloudMesh Kubernetes Cluster Orchestration & Cost Optimizer',
    subCategory: 'DevOps & Cloud Tools',
    displayUrl: 'cloudmesh-infra.io/pricing',
    location: 'San Francisco & Bengaluru',
    year: 2025,
    tech: ['Next.js 15', 'TypeScript', 'Tailwind', 'Stripe Billing', 'PostgreSQL'],
    summary: 'High-conversion SaaS marketing site with interactive cloud cost calculator, interactive terminal demo, and self-serve onboarding.',
    architecture: 'Edge-rendered Next.js with automated Stripe usage billing and GitHub OAuth signup.',
    metrics: ['99/100 Lighthouse', '18.4% Visitor-to-Trial Rate', 'Sub-600ms TTFB']
  },
  {
    title: 'NeuralDraft Generative AI Legal Contract Review Engine',
    subCategory: 'AI & ML Platforms',
    displayUrl: 'neuraldraft.ai/enterprise',
    location: 'Austin & London',
    year: 2024,
    tech: ['React', 'Tailwind CSS', 'FastAPI Python', 'PostgreSQL', 'WebSockets'],
    summary: 'AI legal tech product website with live redline diff comparison widget, SOC2 compliance badge, and enterprise quote form.',
    architecture: 'Streamed WebSocket response showcase with zero latency and interactive contract clause analyzer.',
    metrics: ['45,000+ Signups', 'SOC2 Type II Ready', 'Zero Vendor Lock-in']
  }
];

// 9. LOGISTICS SEED
const LOGISTICS_SEEDS = [
  {
    title: 'TransOcean Global Container Freight Forwarder & Customs Portal',
    subCategory: 'Freight Forwarding',
    displayUrl: 'transocean-freight.com/track-shipment',
    location: 'Singapore & Mumbai',
    year: 2025,
    tech: ['Next.js', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'VesselFinder API'],
    summary: 'Container shipping portal with live AIS satellite vessel tracking, container bill of lading lookup, and instant air/sea freight quotes.',
    architecture: 'Direct integration with AIS satellite marine transponders for real-time ship coordinates on Leaflet maps.',
    metrics: ['180,000+ Containers Tracked', 'Sub-1s Live Tracking', 'Zero Broken APIs']
  },
  {
    title: 'ArcticCold Nationwide Cold-Chain Warehousing & Refrigerated Fleet',
    subCategory: 'Cold Chain Storage',
    displayUrl: 'arcticcold-logistics.in/warehouses',
    location: 'Delhi NCR & Pune',
    year: 2024,
    tech: ['React', 'Tailwind CSS', 'IoT MQTT WebSockets', 'MongoDB'],
    summary: 'Pharma & perishable cold-chain logistics platform with live IoT warehouse temperature telemetry and compliance logs.',
    architecture: 'Real-time MQTT telemetry feed showing sub-zero temperature logs for WHO GDP compliance.',
    metrics: ['100% Pharma Compliant', 'Zero Temperature Excursions', '100% Owned IP']
  }
];

// 10. MEDIA & CREATIVE SEED
const MEDIA_SEEDS = [
  {
    title: 'Cinematic Vision Commercial Film Production & VFX Studio',
    subCategory: 'Film & Video Studios',
    displayUrl: 'cinematicvision-studio.com/showreel',
    location: 'Mumbai & London',
    year: 2025,
    tech: ['Next.js 15', 'Tailwind CSS', 'Cloudflare Stream', 'Framer Motion'],
    summary: 'Commercial film production house showcase with zero-buffer 4K video showreels, director reels, and treatment decks.',
    architecture: 'HLS adaptive video stream with dynamic bandwidth negotiation for smooth playback on mobile devices.',
    metrics: ['Sub-300ms Video Start', '4K Zero Stutter', 'Award-Winning Design']
  },
  {
    title: 'RedDot Global Digital Performance & Brand Strategy Agency',
    subCategory: 'Creative Design Agencies',
    displayUrl: 'reddot-agency.com/case-studies',
    location: 'New York & Dubai',
    year: 2024,
    tech: ['Next.js', 'Tailwind', 'WebGL Shaders', 'TypeScript'],
    summary: 'Brand consultancy agency showcase with interactive WebGL kinetic typography, deep case studies, and client ROAS metrics.',
    architecture: 'Performant GPU-accelerated WebGL shader effects with responsive fallback for low-power mobile devices.',
    metrics: ['97/100 Mobile Score', 'Cannes Lion Award Featured', '100% Source Transferred']
  }
];

// Generate all 650 projects (65 per category * 10 categories)
export const ALL_PORTFOLIO_PROJECTS: PortfolioProject[] = [
  ...generateCategoryProjects('hospitality', 'Hospitality & Travel', ['Luxury Resorts', 'Boutique Hotels', 'Fine Dining Restaurants', 'Tour Operators', 'Vacation Rentals', 'Cloud Kitchens'], HOSPITALITY_SEEDS),
  ...generateCategoryProjects('medical', 'Healthcare & Medical', ['Multispecialty Hospitals', 'Super-Specialty Clinics', 'Telemedicine Portals', 'Dental Studios', 'Diagnostic Networks', 'IVF Centers'], MEDICAL_SEEDS),
  ...generateCategoryProjects('education', 'Education & EdTech', ['Universities & Colleges', 'K-12 Schools', 'Online LMS & Academies', 'Coaching Institutes', 'Skill Bootcamps', 'Kids Learning'], EDUCATION_SEEDS),
  ...generateCategoryProjects('ecommerce', 'E-Commerce & Retail', ['D2C Fashion & Apparel', 'Consumer Electronics', 'Luxury Jewelry & Gems', 'Organic Food & Groceries', 'Home Decor', 'Multi-Vendor'], ECOMMERCE_SEEDS),
  ...generateCategoryProjects('manufacturing', 'Manufacturing & Industrial', ['Precision CNC Machining', 'Heavy Industrial Machinery', 'Plastic & Polymers', 'Textile & Apparel Mills', 'Chemical Processing', 'B2B Exports'], MANUFACTURING_SEEDS),
  ...generateCategoryProjects('realestate', 'Real Estate & Architecture', ['Luxury Residential', 'Commercial Leasing', 'Architecture Studios', 'Interior Design Firms', 'Construction Builders', 'PropTech Portals'], REALESTATE_SEEDS),
  ...generateCategoryProjects('finance', 'Corporate, Finance & Fintech', ['Wealth Management', 'Chartered Accounting', 'Corporate Law Firms', 'Venture Capital', 'Stock Brokerage Tech', 'Insurance Tech'], FINANCE_SEEDS),
  ...generateCategoryProjects('saas', 'SaaS, Cloud & Technology', ['AI & ML Platforms', 'DevOps & Cloud Tools', 'Enterprise CRM & ERP', 'Cybersecurity Suites', 'Workflow Automation', 'API Gateways'], SAAS_SEEDS),
  ...generateCategoryProjects('logistics', 'Logistics & Supply Chain', ['Freight Forwarding', 'Warehouse Management', 'Cold Chain Storage', 'Fleet Telematics', 'Express Courier Fleets', 'Customs Brokerage'], LOGISTICS_SEEDS),
  ...generateCategoryProjects('media', 'Creative, Media & Agency', ['Film & Video Studios', 'Creative Design Agencies', 'Music Recording Labs', 'Talent & Artist Agencies', 'Digital Publishing', 'Event Production'], MEDIA_SEEDS)
];
