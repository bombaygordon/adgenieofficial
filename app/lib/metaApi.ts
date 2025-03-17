import { PerformanceData, TopAd } from './mockData';
import { setCacheData, getCacheData } from './cache';

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaAdInsights {
  data?: Array<{
    spend: string;
    clicks: string;
    impressions: string;
    conversions: string;
    ctr: string;
    cpc: string;
    date_start: string;
    date_stop: string;
    actions?: MetaAction[];
    action_values?: MetaAction[];
    cost_per_action_type?: MetaAction[];
  }>;
  spend: string;
  clicks: string;
  impressions: string;
  conversions: string;
  ctr: string;
  cpc: string;
  date_start: string;
  date_stop: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  cost_per_action_type?: MetaAction[];
}

interface MetaAd {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  preview_shareable_link?: string;
  insights: MetaAdInsights;
}

interface MetaInsightData {
  date_start: string;
  spend: string;
  clicks: string;
  impressions: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  action_values?: Array<{
    action_type: string;
    value: string;
  }>;
  ctr: string;
  cost_per_action_type?: Array<{
    action_type: string;
    value: string;
  }>;
  cpm: string;
}

interface TopAdWithScore extends TopAd {
  performanceScore: number;
}

interface LandingPageData {
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

interface MetaAdCreative {
  id?: string;
  body?: string;
  title?: string;
  description?: string;
  caption?: string;
  link_url?: string;
  object_story_spec?: {
    link_data?: {
      message?: string;
      description?: string;
      caption?: string;
      title?: string;
    };
    page_id?: string;
  };
  asset_feed_spec?: {
    bodies?: string[];
    descriptions?: string[];
    titles?: string[];
    link_urls?: string[];
  };
  object_type?: string;
  effective_object_story_id?: string;
}

interface MetaAdData {
  id: string;
  status: string;
  creative?: MetaAdCreative;
  insights?: {
    data: Array<{
      impressions: string;
      clicks: string;
      spend: string;
      actions?: Array<{
        action_type: string;
        value: string;
      }>;
      ctr: string;
    }>;
  };
}

interface BatchResponse {
  code: number;
  body: string;
  headers: Record<string, string>;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

async function batchRequest(
  accessToken: string,
  requests: Array<{
    method: string;
    relative_url: string;
  }>
) {
  try {
    const response = await fetch('https://graph.facebook.com/v19.0/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        batch: requests,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Batch request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Batch request error:', error);
    throw error;
  }
}

export async function getMetaAdsPerformance(accessToken: string, accountId: string, dateRange: { startDate: string; endDate: string }) {
  try {
    // Ensure account ID is properly formatted with 'act_' prefix
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    
    // Parse dates and ensure they're at the start/end of their respective days
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(dateRange.startDate);
    startDate.setHours(0, 0, 0, 0);

    console.log('Fetching Meta insights with params:', {
      accountId: formattedAccountId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dateRange
    });

    // Fetch ads insights from Meta API with date breakdown
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${formattedAccountId}/insights?` +
      new URLSearchParams({
        fields: [
          'spend',
          'clicks',
          'impressions',
          'actions',
          'action_values',
          'ctr',
          'cost_per_action_type',
          'cpm',
          'date_start',
          'date_stop'
        ].join(','),
        time_range: JSON.stringify({
          since: startDate.toISOString().split('T')[0],
          until: endDate.toISOString().split('T')[0]
        }),
        time_increment: '1', // Get daily breakdown
        level: 'account',
        access_token: accessToken
      })
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Meta API Error:', errorData);
      throw new Error(`Failed to fetch Meta ads performance data: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Raw Meta insights response:', data);

    if (!data.data || !Array.isArray(data.data)) {
      console.error('Invalid Meta insights response format:', data);
      throw new Error('Invalid response format from Meta API');
    }
    
    // Transform Meta data to match our dashboard format
    const performanceData: PerformanceData[] = data.data
      .filter((insight: MetaInsightData) => {
        // Filter data points within the date range
        const insightDate = new Date(insight.date_start);
        return insightDate >= startDate && insightDate <= endDate;
      })
      .map((insight: MetaInsightData) => {
        // Find purchase/conversion actions if available
        const conversions = insight.actions?.find(action => 
          action.action_type === 'purchase' || 
          action.action_type === 'omni_purchase' ||
          action.action_type === 'onsite_conversion.purchase'
        )?.value || '0';

        // Find purchase values for ROAS calculation
        const conversionValue = insight.action_values?.find(action =>
          action.action_type === 'purchase' ||
          action.action_type === 'omni_purchase' ||
          action.action_type === 'onsite_conversion.purchase'
        )?.value || '0';

        // Find cost per link click
        const costPerLinkClick = insight.cost_per_action_type?.find(cost =>
          cost.action_type === 'link_click'
        )?.value || insight.cost_per_action_type?.find(cost =>
          cost.action_type === 'onsite_conversion.link_click'
        )?.value;

        // Find link clicks
        const linkClicks = insight.actions?.find(action =>
          action.action_type === 'link_click'
        )?.value || insight.actions?.find(action =>
          action.action_type === 'onsite_conversion.link_click'
        )?.value || '0';

        // Calculate ROAS for performance data
        const spend = parseFloat(insight.spend || '0');
        const dailyRoas = spend > 0 ? (parseFloat(conversionValue) / spend) : 0;

        // Calculate CPM
        const impressions = parseInt(insight.impressions || '0');
        const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

        // Calculate metrics
        const conversionCount = parseInt(conversions);
        const conversionValueNum = parseFloat(conversionValue);
        
        // Calculate derived metrics
        const ctr = parseFloat(insight.ctr || '0') / 100; // Convert percentage to decimal
        const costPerConversion = conversionCount > 0 ? spend / conversionCount : 0;

        return {
          platform: 'facebook',
          date: insight.date_start,
          adSpend: spend,
          clicks: parseInt(linkClicks), // Use actual link clicks
          impressions: impressions,
          conversions: conversionCount,
          ctr: ctr,
          cpc: costPerLinkClick ? parseFloat(costPerLinkClick) : (spend / parseInt(linkClicks) || 0),
          cpm: parseFloat(insight.cpm || cpm.toFixed(2)),
          costPerConversion: costPerConversion,
          roas: dailyRoas
        };
      });

    console.log('Transformed performance data:', {
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      dataPoints: performanceData.length,
      data: performanceData
    });
    
    return performanceData;
  } catch (error) {
    console.error('Error fetching Meta ads performance:', error);
    throw error;
  }
}

export async function getMetaTopAds(accessToken: string, accountId: string, dateRange: { startDate: string; endDate: string }) {
  try {
    // Ensure account ID is properly formatted with 'act_' prefix
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // Parse dates and ensure they're at the start/end of their respective days
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(dateRange.startDate);
    startDate.setHours(0, 0, 0, 0);

    console.log('Fetching Meta top ads with params:', {
      accountId: formattedAccountId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dateRange
    });

    // Fetch top performing ads from Meta API with all required fields
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${formattedAccountId}/ads?` +
      new URLSearchParams({
        fields: [
          'name',
          'status',
          'effective_status',
          'preview_shareable_link',
          `insights.time_range({"since":"${startDate.toISOString().split('T')[0]}","until":"${endDate.toISOString().split('T')[0]}"}).fields(spend,impressions,clicks,ctr,actions,action_values,cost_per_action_type)`,
        ].join(','),
        access_token: accessToken,
        limit: '10',
        status: ['ACTIVE'].join(',')
      })
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Meta API Error:', errorData);
      throw new Error(`Failed to fetch Meta top ads: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Raw Meta top ads response:', data);
    
    // Transform Meta data to match our dashboard format
    const topAds: TopAd[] = data.data
      .filter((ad: MetaAd) => ad.insights?.data?.[0] && ad.status === 'ACTIVE')
      .map((ad: MetaAd) => {
        const insights = ad.insights?.data?.[0] || {
          spend: '0',
          clicks: '0',
          impressions: '0',
          ctr: '0',
          actions: [],
          action_values: [],
          cost_per_action_type: []
        };

        // Find purchase/conversion actions if available
        const conversions = insights?.actions?.find(action => 
          action.action_type === 'purchase' || 
          action.action_type === 'omni_purchase' ||
          action.action_type === 'onsite_conversion.purchase'
        )?.value || '0';

        // Find purchase values for ROAS calculation
        const conversionValue = insights?.action_values?.find(action =>
          action.action_type === 'purchase' ||
          action.action_type === 'omni_purchase' ||
          action.action_type === 'onsite_conversion.purchase'
        )?.value || '0';

        // Calculate metrics for top ads
        const spend = parseFloat(insights?.spend || '0');
        const clicks = parseInt(insights?.clicks || '0');
        const impressions = parseInt(insights?.impressions || '0');
        const conversionCount = parseInt(conversions);
        const conversionValueNum = parseFloat(conversionValue);
        
        // Calculate derived metrics for top ads
        const ctr = parseFloat(insights?.ctr || '0') / 100; // Convert percentage to decimal
        const costPerConversion = conversionCount > 0 ? spend / conversionCount : 0;
        const topAdRoas = spend > 0 ? conversionValueNum / spend : 0;

        return {
          id: parseInt(ad.id),
          name: ad.name,
          platform: 'Facebook',
          image: ad.preview_shareable_link || '/images/ad-placeholder.jpg',
          spend,
          impressions,
          clicks,
          ctr,
          conversions: conversionCount,
          costPerConversion,
          roas: topAdRoas,
          performanceScore: (spend * 0.6) + (ctr * 0.4) // Weight spend more heavily than CTR
        } as TopAdWithScore;
      })
      // Sort by performance score in descending order
      .sort((a: TopAdWithScore, b: TopAdWithScore) => b.performanceScore - a.performanceScore)
      // Take only top 10 ads
      .slice(0, 10)
      // Remove the performance score from the final output
      .map(({ performanceScore, ...ad }: TopAdWithScore) => ad);

    console.log('Transformed top ads:', topAds);
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

export async function getMetaLandingPages(accessToken: string, accountId: string, dateRange: { startDate: string; endDate: string }) {
  try {
    if (!accessToken || !accountId) {
      throw new Error('Access token and account ID are required');
    }

    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const endDate = new Date(dateRange.endDate);
    const startDate = new Date(dateRange.startDate);

    console.log('Fetching Meta landing page data:', {
      accountId: formattedAccountId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Construct the URL and parameters with all possible URL fields
    const url = new URL(`https://graph.facebook.com/v19.0/${formattedAccountId}/ads`);
    const params = new URLSearchParams({
      fields: [
        'creative{link_url,object_story_spec{link_data{link}}}',
        `insights.time_range({"since":"${startDate.toISOString().split('T')[0]}","until":"${endDate.toISOString().split('T')[0]}"}).fields(spend,clicks,impressions,actions)`
      ].join(','),
      access_token: accessToken,
      limit: '25', // Further reduced to prevent data overload
      status: 'ACTIVE'
    });

    let allAds: any[] = [];
    let nextPage = `${url.toString()}?${params.toString()}`;

    // Fetch first page
    while (nextPage && allAds.length < 100) { // Reduced max ads to 100
      console.log(`Fetching page of ads. Current count: ${allAds.length}`);
      
      const response = await fetch(nextPage);
      const responseData = await response.json();

      if (!response.ok) {
        console.error('Meta API Error:', {
          status: response.status,
          error: responseData.error
        });
        throw new Error(responseData.error?.message || `HTTP ${response.status}`);
      }

      console.log('Page response data:', {
        hasData: !!responseData.data,
        dataLength: responseData.data?.length,
        hasNextPage: !!responseData.paging?.next
      });

      if (!responseData.data) {
        throw new Error('Invalid response format from Meta API');
      }

      allAds = allAds.concat(responseData.data);
      nextPage = responseData.paging?.next || null;
    }

    console.log(`Total ads fetched: ${allAds.length}`);

    // Process the aggregated data
    const urlStats = allAds.reduce((acc: { [key: string]: any }, ad: any) => {
      // Try multiple paths to get the URL
      let url = ad.creative?.link_url;
      if (!url && ad.creative?.object_story_spec?.link_data?.link) {
        url = ad.creative.object_story_spec.link_data.link;
      }

      // Log if we can't find a URL
      if (!url) {
        console.log('No URL found for ad:', {
          adId: ad.id,
          hasCreative: !!ad.creative,
          hasObjectStorySpec: !!ad.creative?.object_story_spec,
          hasLinkData: !!ad.creative?.object_story_spec?.link_data
        });
        return acc;
      }

      // Log if we don't have insights data
      if (!ad.insights?.data?.[0]) {
        console.log('No insights data for ad:', {
          adId: ad.id,
          url: url,
          hasInsights: !!ad.insights,
          hasInsightsData: !!ad.insights?.data
        });
        return acc;
      }
      
      const insights = ad.insights.data[0];
      
      if (!acc[url]) {
        acc[url] = {
          clicks: 0,
          impressions: 0,
          spend: 0,
          conversions: 0
        };
      }

      acc[url].clicks += parseInt(insights.clicks || '0');
      acc[url].impressions += parseInt(insights.impressions || '0');
      acc[url].spend += parseFloat(insights.spend || '0');
      
      const conversions = insights.actions?.find((action: any) => 
        action.action_type === 'purchase' || 
        action.action_type === 'omni_purchase' ||
        action.action_type === 'onsite_conversion.purchase'
      )?.value || '0';
      
      acc[url].conversions += parseInt(conversions);
      return acc;
    }, {});

    console.log('URL stats collected:', {
      totalUrls: Object.keys(urlStats).length,
      urls: Object.keys(urlStats)
    });

    const landingPages: LandingPageData[] = Object.entries(urlStats)
      .filter(([_, stats]: [string, any]) => stats.impressions > 0)
      .map(([url, stats]: [string, any]) => ({
        id: Buffer.from(url).toString('base64'),
        url,
        clicks: stats.clicks,
        impressions: stats.impressions,
        conversions: stats.conversions,
        spend: stats.spend,
        conversionRate: stats.impressions > 0 ? (stats.conversions / stats.impressions) * 100 : 0,
        ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
        costPerConversion: stats.conversions > 0 ? stats.spend / stats.conversions : 0
      }));

    landingPages.sort((a, b) => b.conversionRate - a.conversionRate);
    
    console.log('Landing pages processed:', {
      total: landingPages.length,
      firstPage: landingPages[0],
      hasData: landingPages.length > 0
    });

    return landingPages;

  } catch (error) {
    console.error('Error in getMetaLandingPages:', error);
    throw error;
  }
}

export async function getMetaAdCopy(
  accessToken: string,
  accountId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<AdCopy[]> {
  try {
    // Check cache first
    const cachedData = getCacheData(accountId, 'adCopy', dateRange);
    if (cachedData) {
      console.log('Using cached ad copy data');
      return cachedData;
    }

    console.log('Fetching Meta ad copy data:', { accountId, dateRange });

    if (!accessToken || !accountId) {
      console.error('Missing required parameters:', { hasToken: !!accessToken, hasAccountId: !!accountId });
      throw new Error('Access token and account ID are required');
    }

    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // Create batch request for ads list
    const adsListRequest = {
      method: 'GET',
      relative_url: `${formattedAccountId}/ads?fields=id,status,creative{id,body,title,description,caption,link_url,object_story_spec{link_data{message,description,caption,title},page_id},asset_feed_spec{bodies,descriptions,titles,link_urls},object_type,effective_object_story_id}&limit=25&status=["ACTIVE","PAUSED"]`,
    };

    console.log('Fetching ads list with request:', adsListRequest);

    // Execute batch request
    const [adsListResponse] = await batchRequest(accessToken, [adsListRequest]) as BatchResponse[];
    
    console.log('Ads list response:', {
      hasResponse: !!adsListResponse,
      hasError: !!adsListResponse?.error,
      errorMessage: adsListResponse?.error?.message,
      responseCode: adsListResponse?.code
    });

    if (!adsListResponse || adsListResponse.error) {
      throw new Error(adsListResponse?.error?.message || 'Failed to fetch ads list');
    }

    const adsData = JSON.parse(adsListResponse.body);
    
    console.log('Parsed ads data:', {
      hasData: !!adsData?.data,
      dataLength: adsData?.data?.length,
      firstAd: adsData?.data?.[0] ? {
        id: adsData.data[0].id,
        status: adsData.data[0].status,
        hasCreative: !!adsData.data[0].creative,
        hasBody: !!adsData.data[0].creative?.body,
        hasTitle: !!adsData.data[0].creative?.title,
        hasDescription: !!adsData.data[0].creative?.description,
        hasMessage: !!adsData.data[0].creative?.object_story_spec?.link_data?.message,
        hasLinkData: !!adsData.data[0].creative?.object_story_spec?.link_data,
        hasAssetFeed: !!adsData.data[0].creative?.asset_feed_spec,
        rawCreative: adsData.data[0].creative
      } : null,
      error: adsData.error
    });

    if (!adsData.data || !Array.isArray(adsData.data)) {
      console.error('Invalid ads data structure:', adsData);
      return [];
    }

    // Create batch request for insights
    const insightsRequests = adsData.data
      .slice(0, 25) // Limit to 25 ads
      .map((ad: MetaAdData) => ({
        method: 'GET',
        relative_url: `${ad.id}/insights?fields=impressions,clicks,spend,actions,ctr&time_range={"since":"${dateRange.startDate}","until":"${dateRange.endDate}"}`,
      }));

    console.log('Fetching insights for ads:', {
      totalRequests: insightsRequests.length,
      firstRequest: insightsRequests[0],
      dateRange
    });

    // Split insights requests into chunks of 10 to avoid rate limits
    const chunkSize = 10;
    const insightsChunks = [];
    for (let i = 0; i < insightsRequests.length; i += chunkSize) {
      insightsChunks.push(insightsRequests.slice(i, i + chunkSize));
    }

    // Execute batch requests for insights with delay between chunks
    const allInsightsResponses: BatchResponse[] = [];
    for (const chunk of insightsChunks) {
      console.log('Processing chunk:', { chunkSize: chunk.length });
      const responses = await batchRequest(accessToken, chunk) as BatchResponse[];
      console.log('Chunk responses:', {
        responseCount: responses.length,
        hasErrors: responses.some(r => r.error),
        errors: responses.filter(r => r.error).map(r => r.error)
      });
      allInsightsResponses.push(...responses);
      if (insightsChunks.indexOf(chunk) < insightsChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between chunks
      }
    }

    // Process the ads data
    const adCopyData = adsData.data
      .slice(0, 25)
      .map((ad: MetaAdData, index: number) => {
        const insightsResponse = allInsightsResponses[index];
        if (!insightsResponse || insightsResponse.error) {
          console.log('Skipping ad due to missing/error insights:', {
            adId: ad.id,
            hasResponse: !!insightsResponse,
            error: insightsResponse?.error,
            status: ad.status
          });
          return null;
        }

        const insights = JSON.parse(insightsResponse.body).data?.[0];
        if (!insights) {
          console.log('No insights data for ad:', { 
            adId: ad.id,
            status: ad.status,
            responseBody: insightsResponse.body
          });
          return null;
        }

        // Try to get ad copy text from all possible locations
        const adCopyText = ad.creative?.body || 
                          ad.creative?.title ||
                          ad.creative?.description ||
                          ad.creative?.caption ||
                          ad.creative?.object_story_spec?.link_data?.message ||
                          ad.creative?.object_story_spec?.link_data?.description ||
                          ad.creative?.object_story_spec?.link_data?.title ||
                          ad.creative?.object_story_spec?.link_data?.caption ||
                          ad.creative?.asset_feed_spec?.bodies?.[0] ||
                          ad.creative?.asset_feed_spec?.descriptions?.[0] ||
                          ad.creative?.asset_feed_spec?.titles?.[0] ||
                          '';

        if (!adCopyText) {
          console.log('No ad copy text found for ad:', { 
            adId: ad.id,
            status: ad.status,
            creative: ad.creative 
          });
          return null;
        }

        // Calculate metrics
        const impressions = parseInt(insights.impressions || '0', 10);
        const clicks = parseInt(insights.clicks || '0', 10);
        const spend = parseFloat(insights.spend || '0');
        const ctr = parseFloat(insights.ctr || '0') / 100;
        
        const conversionValue = insights.actions?.find((action: MetaAction) => 
          action.action_type === 'purchase' || 
          action.action_type === 'complete_registration' ||
          action.action_type === 'lead'
        )?.value;
        
        const conversions = parseInt(conversionValue || '0', 10);
        const conversionRate = impressions > 0 ? (conversions / impressions) : 0;
        const costPerConversion = conversions > 0 ? (spend / conversions) : 0;

        return {
          id: ad.id,
          text: adCopyText,
          impressions,
          clicks,
          spend,
          ctr,
          conversions,
          conversionRate,
          costPerConversion
        };
      })
      .filter((item: AdCopy | null): item is AdCopy => item !== null);

    console.log('Processed ad copy data:', {
      totalAds: adsData.data.length,
      processedAds: adCopyData.length,
      adsWithData: adCopyData.map((ad: AdCopy) => ({
        id: ad.id,
        textLength: ad.text.length,
        spend: ad.spend,
        impressions: ad.impressions
      }))
    });

    // Sort by spend (highest to lowest) and get top performing
    const sortedAdCopy = adCopyData
      .sort((a: AdCopy, b: AdCopy) => b.spend - a.spend)
      .slice(0, 10);

    // Cache the results
    setCacheData(accountId, 'adCopy', sortedAdCopy, dateRange);

    console.log('Final sorted ad copy:', {
      count: sortedAdCopy.length,
      topSpend: sortedAdCopy[0]?.spend,
      hasData: sortedAdCopy.length > 0
    });

    return sortedAdCopy;

  } catch (error: any) {
    console.error('Error in getMetaAdCopy:', error);
    throw new Error(`Failed to fetch Meta ad copy data: ${error.message}`);
  }
} 