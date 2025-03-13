import { PerformanceData, TopAd } from './mockData';

interface MetaAdInsights {
  spend: string;
  clicks: string;
  impressions: string;
  conversions: string;
  ctr: string;
  cpc: string;
  date_start: string;
  date_stop: string;
}

interface MetaAd {
  id: string;
  name: string;
  status: string;
  insights: MetaAdInsights;
}

export async function getMetaAdsPerformance(accessToken: string, accountId: string, dateRange: { startDate: string; endDate: string }) {
  try {
    // Fetch ads insights from Meta API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/insights?` +
      new URLSearchParams({
        fields: 'spend,clicks,impressions,actions,ctr,cpc,date_start,date_stop',
        time_range: JSON.stringify({
          since: new Date(dateRange.startDate).toISOString().split('T')[0],
          until: new Date(dateRange.endDate).toISOString().split('T')[0]
        }),
        level: 'account',
        access_token: accessToken
      })
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Meta ads performance data');
    }

    const data = await response.json();
    
    // Transform Meta data to match our dashboard format
    const performanceData: PerformanceData[] = data.data.map((insight: MetaAdInsights) => ({
      platform: 'facebook',
      date: insight.date_start,
      adSpend: parseFloat(insight.spend),
      conversions: parseInt(insight.conversions || '0'),
      ctr: parseFloat(insight.ctr),
      cpc: parseFloat(insight.cpc),
      roas: 0, // Calculate ROAS if conversion value data is available
    }));

    return performanceData;
  } catch (error) {
    console.error('Error fetching Meta ads performance:', error);
    throw error;
  }
}

export async function getMetaTopAds(accessToken: string, accountId: string) {
  try {
    // Fetch top performing ads from Meta API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/ads?` +
      new URLSearchParams({
        fields: 'name,status,insights.fields(spend,clicks,impressions,actions,ctr)',
        access_token: accessToken,
        limit: '10',
        status: ['ACTIVE'].join(',')
      })
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Meta top ads');
    }

    const data = await response.json();
    
    // Transform Meta data to match our dashboard format
    const topAds: TopAd[] = data.data
      .filter((ad: MetaAd) => ad.insights && ad.status === 'ACTIVE')
      .map((ad: MetaAd, index: number) => ({
        id: parseInt(ad.id),
        name: ad.name,
        platform: 'Facebook',
        ctr: parseFloat(ad.insights.ctr),
        conversions: parseInt(ad.insights.conversions || '0'),
        roi: 0, // Calculate ROI if conversion value data is available
      }));

    return topAds;
  } catch (error) {
    console.error('Error fetching Meta top ads:', error);
    throw error;
  }
}

export async function getMetaAdAccountDetails(accessToken: string, accountId: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}?` +
      new URLSearchParams({
        fields: 'name,currency,timezone_name,account_status',
        access_token: accessToken
      })
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Meta ad account details');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching Meta ad account details:', error);
    throw error;
  }
} 