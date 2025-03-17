// Types
export interface PerformanceData {
  platform: string;
  date: string;
  adSpend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  costPerConversion: number;
  roas: number;
}

export interface PlatformData {
  id: string;
  name: string;
  icon: string;
  value: number;
  status: 'connected' | 'disconnected';
}

export interface TopAd {
  id: number;
  name: string;
  platform: string;
  image: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
}

export interface LandingPage {
  id: string;
  url: string;
  clicks: number;
  impressions: number;
  conversions: number;
  spend: number;
  conversionRate: number;
  ctr: number;
  costPerConversion: number;
}

export interface AdCopy {
  id: string;
  text: string;
  ctr: number;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversionRate: number;
  costPerConversion: number;
}

export interface Headline {
  id: number;
  text: string;
  ctr: number;
}

// Mock Data
export const performanceData: PerformanceData[] = [
  {
    platform: 'facebook',
    date: '2024-03-01',
    adSpend: 45000,
    clicks: 10000,
    impressions: 500000,
    conversions: 2800,
    ctr: 0.39,
    cpc: 1.8,
    cpm: 90,
    costPerConversion: 16.07,
    roas: 3.2,
  },
  {
    platform: 'google',
    date: '2024-03-01',
    adSpend: 35000,
    clicks: 8000,
    impressions: 400000,
    conversions: 2100,
    ctr: 0.42,
    cpc: 2.1,
    cpm: 87.5,
    costPerConversion: 16.67,
    roas: 2.8,
  },
  {
    platform: 'tiktok',
    date: '2024-03-01',
    adSpend: 20000,
    clicks: 5000,
    impressions: 300000,
    conversions: 1500,
    ctr: 0.35,
    cpc: 1.5,
    cpm: 66.67,
    costPerConversion: 13.33,
    roas: 2.4,
  },
];

export const platformData: PlatformData[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '/icons/facebook.svg',
    value: 35,
    status: 'connected',
  },
  {
    id: 'google',
    name: 'Google',
    icon: '/icons/google.svg',
    value: 45,
    status: 'connected',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '/icons/tiktok.svg',
    value: 20,
    status: 'connected',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '/icons/instagram.svg',
    value: 0,
    status: 'disconnected',
  },
];

export const topAds: TopAd[] = [
  { 
    id: 1, 
    name: 'Summer Sale Promo', 
    platform: 'Facebook', 
    image: '/images/ad1.jpg',
    spend: 12500,
    impressions: 450000,
    clicks: 15000,
    ctr: 3.33,
    conversions: 1240,
    costPerConversion: 10.08,
    roas: 3.2
  },
  { 
    id: 2, 
    name: 'New Collection Video', 
    platform: 'TikTok', 
    image: '/images/ad2.jpg',
    spend: 8900,
    impressions: 380000,
    clicks: 12000,
    ctr: 3.16,
    conversions: 980,
    costPerConversion: 9.08,
    roas: 2.8
  },
  { 
    id: 3, 
    name: 'Limited Offer Banner', 
    platform: 'Google', 
    image: '/images/ad3.jpg',
    spend: 7500,
    impressions: 320000,
    clicks: 9500,
    ctr: 2.97,
    conversions: 860,
    costPerConversion: 8.72,
    roas: 2.4
  }
];

export const landingPages: LandingPage[] = [
  { 
    id: '1',
    url: '/summer-collection',
    clicks: 1200,
    impressions: 25000,
    conversions: 45,
    spend: 2500,
    conversionRate: 4.8,
    ctr: 4.8,
    costPerConversion: 55.56
  },
  { 
    id: '2',
    url: '/special-offer',
    clicks: 980,
    impressions: 18900,
    conversions: 38,
    spend: 1800,
    conversionRate: 5.2,
    ctr: 5.2,
    costPerConversion: 47.37
  },
  { 
    id: '3',
    url: '/new-arrivals',
    clicks: 850,
    impressions: 18500,
    conversions: 32,
    spend: 1600,
    conversionRate: 4.6,
    ctr: 4.6,
    costPerConversion: 50.00
  }
];

export const adCopy: AdCopy[] = [
  {
    id: '1',
    text: 'Limited time offer! Shop now and save 30%',
    impressions: 10000,
    clicks: 520,
    ctr: 0.052,
    spend: 1500,
    conversions: 45,
    conversionRate: 0.045,
    costPerConversion: 33.33
  },
  {
    id: '2',
    text: 'Discover the collection everyone\'s talking about',
    impressions: 8500,
    clicks: 408,
    ctr: 0.048,
    spend: 1200,
    conversions: 38,
    conversionRate: 0.0447,
    costPerConversion: 31.58
  },
  {
    id: '3',
    text: 'New arrivals just landed. Be the first to shop',
    impressions: 9000,
    clicks: 405,
    ctr: 0.045,
    spend: 1300,
    conversions: 42,
    conversionRate: 0.0467,
    costPerConversion: 30.95
  }
];

export const headlines: Headline[] = [
  { id: 1, text: "SUMMER SALE: 30% OFF EVERYTHING", ctr: 6.2 },
  { id: 2, text: "The Collection You've Been Waiting For", ctr: 5.8 },
  { id: 3, text: "Last Chance: Final Clearance Items", ctr: 5.3 }
]; 