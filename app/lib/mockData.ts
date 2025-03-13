// Types
export interface PerformanceData {
  platform: string;
  date: string;
  adSpend: number;
  conversions: number;
  ctr: number;
  cpc: number;
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
  ctr: number;
  conversions: number;
  roi: number;
}

export interface LandingPage {
  id: number;
  url: string;
  visitors: number;
  convRate: number;
}

export interface AdCopy {
  id: number;
  text: string;
  ctr: number;
  eng: number;
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
    conversions: 2800,
    ctr: 4.2,
    cpc: 1.8,
    roas: 3.2,
  },
  {
    platform: 'google',
    date: '2024-03-01',
    adSpend: 35000,
    conversions: 2100,
    ctr: 3.8,
    cpc: 2.1,
    roas: 2.8,
  },
  {
    platform: 'tiktok',
    date: '2024-03-01',
    adSpend: 20000,
    conversions: 1500,
    ctr: 3.2,
    cpc: 1.5,
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
  { id: 1, name: 'Summer Sale Promo', platform: 'Facebook', ctr: 4.8, conversions: 1240, roi: 320 },
  { id: 2, name: 'New Collection Video', platform: 'TikTok', ctr: 3.9, conversions: 980, roi: 280 },
  { id: 3, name: 'Limited Offer Banner', platform: 'Google', ctr: 4.2, conversions: 860, roi: 240 }
];

export const landingPages: LandingPage[] = [
  { id: 1, url: '/summer-collection', visitors: 45200, convRate: 4.8 },
  { id: 2, url: '/special-offer', visitors: 38700, convRate: 5.2 },
  { id: 3, url: '/new-arrivals', visitors: 32400, convRate: 4.6 }
];

export const adCopy: AdCopy[] = [
  { id: 1, text: "Limited time offer! Shop now and save 30%", ctr: 5.2, eng: 8.7 },
  { id: 2, text: "Discover the collection everyone's talking about", ctr: 4.8, eng: 8.1 },
  { id: 3, text: "New arrivals just landed. Be the first to shop", ctr: 4.5, eng: 7.9 }
];

export const headlines: Headline[] = [
  { id: 1, text: "SUMMER SALE: 30% OFF EVERYTHING", ctr: 6.2 },
  { id: 2, text: "The Collection You've Been Waiting For", ctr: 5.8 },
  { id: 3, text: "Last Chance: Final Clearance Items", ctr: 5.3 }
]; 