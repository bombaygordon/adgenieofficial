import { Platform } from '../context/AccountsContext';

export interface MetaAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

function getRedirectUri(): string {
  // Use environment variable to determine the base URL
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : 'https://adgenieofficial-ahzm.vercel.app';

  const redirectUri = `${baseUrl}/api/auth/meta/callback`;
  
  console.log('Meta OAuth configuration:', {
    baseUrl,
    redirectUri,
    environment: process.env.NODE_ENV,
    hasClientId: !!process.env.NEXT_PUBLIC_META_APP_ID,
    hasClientSecret: !!process.env.META_APP_SECRET
  });

  return redirectUri;
}

export const META_CONFIG: MetaAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_META_APP_ID || '',
  clientSecret: process.env.META_APP_SECRET || '',
  redirectUri: getRedirectUri(),
  scopes: [
    'ads_read',
    'ads_management',
    'business_management',
    'instagram_basic',
    'instagram_manage_insights',
    'pages_read_engagement',
    'pages_show_list',
    'read_insights',
    'business_management'
  ]
};

export function getMetaAuthUrl(): string {
  console.log('Generating Meta OAuth URL:', {
    clientId: META_CONFIG.clientId,
    redirectUri: META_CONFIG.redirectUri,
    environment: process.env.NODE_ENV
  });

  if (!META_CONFIG.clientId) {
    throw new Error('Meta App ID is not configured. Please check your environment variables.');
  }

  // Generate state with timestamp to prevent replay attacks
  const state = Math.random().toString(36).substring(7) + Date.now();

  const params = new URLSearchParams({
    client_id: META_CONFIG.clientId,
    redirect_uri: META_CONFIG.redirectUri,
    scope: META_CONFIG.scopes.join(','),
    response_type: 'code',
    state,
    // Enable account selection dialog
    display: 'page',
    enable_account_selection: 'true',
    account_selection_mode: 'multiple',
    account_selection_type: 'business,ads_management'
  });

  const url = `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  console.log('Generated Meta OAuth URL:', url);
  return url;
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 5,
  baseDelay = 5000,
  maxDelay = 60000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        const delay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
        console.log(`Rate limit hit. Attempt ${i + 1}/${retries}, waiting ${delay}ms before retry...`);
        await wait(delay);
      }
      
      const result = await fn();
      
      await wait(2000);
      
      return result;
    } catch (error) {
      console.error(`Attempt ${i + 1}/${retries} failed:`, error);
      
      const isRateLimit = error instanceof Error && 
        (error.message.includes('request limit reached') || 
         error.message.includes('rate limit') ||
         error.message.includes('#17') ||
         error.message.includes('#4') ||
         error.message.includes('#80004') ||
         error.message.includes('too many calls'));
      
      if (!isRateLimit || i === retries - 1) {
        if (isRateLimit) {
          throw new Error('Rate limit reached. Please wait a few minutes before trying again.');
        }
        throw error;
      }
    }
  }
  throw new Error('Max retries reached. Please try again later.');
}

export async function getMetaAccessToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  if (!code) {
    throw new Error('Authorization code is required');
  }

  const params = new URLSearchParams({
    client_id: META_CONFIG.clientId,
    client_secret: META_CONFIG.clientSecret,
    redirect_uri: META_CONFIG.redirectUri,
    code,
    grant_type: 'authorization_code'
  });

  console.log('Requesting access token:', {
    hasCode: !!code,
    redirectUri: META_CONFIG.redirectUri,
    hasClientId: !!META_CONFIG.clientId,
    hasClientSecret: !!META_CONFIG.clientSecret
  });

  // Add longer delays for token exchange since it's more sensitive
  return retryWithBackoff(async () => {
    const response = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const data = await response.json();

  if (!response.ok) {
      console.error('Meta token error:', data);
      // Check for various rate limit error codes
      if (data.error?.code === 4 || 
          data.error?.code === 17 || 
          data.error?.code === 80004 || 
          data.error?.code === 80001 ||
          (data.error?.message && data.error.message.toLowerCase().includes('rate'))) {
        throw new Error('rate_limit_hit');
      }
      throw new Error(data.error?.message || 'Failed to get access token');
    }

    console.log('Access token received:', {
      hasToken: !!data.access_token,
      expiresIn: data.expires_in
    });

    // Add a longer delay after getting the token to avoid rate limits
    await wait(3000);

    return data;
  }, 5, 5000, 60000); // Increased delays for token exchange
}

export async function getMetaUserAccounts(accessToken: string) {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,currency,timezone_name&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Meta accounts error:', error);
    throw new Error(error.error?.message || 'Failed to fetch ad accounts');
  }

  const data = await response.json();
  console.log('Ad accounts fetched:', {
    count: data.data?.length || 0
  });

  return data;
}

export interface BusinessManager {
  id: string;
  name: string;
  permitted_tasks?: string[];
  ad_accounts: {
    id: string;
    name: string;
    account_id: string;
    currency: string;
    timezone_name: string;
    permitted_tasks?: string[];
  }[];
}

interface MetaBusiness {
  id: string;
  name: string;
  permitted_tasks?: string[];
}

interface BatchResponse {
  code: number;
  body: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export interface AdCopy {
  id: string;
  text: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  costPerConversion: number;
}

interface AdCopyWithScore extends AdCopy {
  performanceScore: number;
}

// Update request caching with longer TTL
const requestCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

const CACHE_TTL = 900000; // 15 minutes cache
const MIN_REQUEST_DELAY = 2000; // 2 seconds between requests
const MAX_REQUESTS_PER_WINDOW = 50; // Max 50 requests per 5 minutes
const WINDOW_SIZE = 300000; // 5 minute window

// Rate limiting helper
const requestTracker = {
  lastRequestTime: 0,
  requestCount: 0,
  resetTimeout: null as NodeJS.Timeout | null,
  windowStart: Date.now(),
  windowRequests: 0,
};

async function enforceRateLimit() {
  const now = Date.now();
  
  // Check if we need to reset the window
  if (now - requestTracker.windowStart > WINDOW_SIZE) {
    requestTracker.windowStart = now;
    requestTracker.windowRequests = 0;
  }
  
  // Check if we've exceeded the window limit
  if (requestTracker.windowRequests >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = WINDOW_SIZE - (now - requestTracker.windowStart);
    console.log(`Rate limiting: Window limit reached, waiting ${waitTime}ms for new window...`);
    await wait(waitTime);
    requestTracker.windowStart = Date.now();
    requestTracker.windowRequests = 0;
  }
  
  // Enforce minimum delay between requests
  const timeSinceLastRequest = now - requestTracker.lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_DELAY) {
    const waitTime = MIN_REQUEST_DELAY - timeSinceLastRequest;
    await wait(waitTime);
  }
  
  requestTracker.lastRequestTime = Date.now();
  requestTracker.windowRequests++;
}

async function executeBatchRequest(accessToken: string, batch: any[]): Promise<BatchResponse[]> {
  const params = new URLSearchParams({
    access_token: accessToken,
    batch: JSON.stringify(batch),
    include_headers: 'false'
  });

  console.log('Executing batch request:', {
    batchSize: batch.length,
    endpoints: batch.map(b => b.relative_url)
  });

  const response = await fetch('https://graph.facebook.com/v19.0/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Meta batch request error:', {
      status: response.status,
      statusText: response.statusText,
      error: data.error
    });
    
    if (data.error?.code === 1 || data.error?.code === 2) {
      throw new Error('rate_limit_hit');
    }
    
    throw new Error(data.error?.message || 'Failed to execute batch request');
  }

  // Log each response in the batch
  data.forEach((res: BatchResponse, index: number) => {
    if (res.code !== 200) {
      console.error(`Batch item ${index} failed:`, {
        endpoint: batch[index].relative_url,
        code: res.code,
        body: res.body
      });
    }
  });

  return data;
}

async function makeIndividualRequest(accessToken: string, endpoint: string) {
  const cacheKey = `${endpoint}:${accessToken}`;
  const cached = requestCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`Using cached response for: ${endpoint}`);
    return cached.data;
  }
  
  await enforceRateLimit();
  
  console.log(`Making individual request to: ${endpoint}`);
  
  try {
    // Properly construct URL with access token
    const baseUrl = 'https://graph.facebook.com/v19.0/';
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${baseUrl}${endpoint}${separator}access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('Individual request error:', {
        status: response.status,
        endpoint,
        error: data.error
      });
      
      // Check for rate limit errors
      if (data.error?.code === 4 || 
          data.error?.code === 17 || 
          data.error?.code === 80004 || 
          data.error?.code === 80001 ||
          (data.error?.message && (
            data.error.message.toLowerCase().includes('rate') ||
            data.error.message.toLowerCase().includes('too many calls')
          ))
      ) {
        throw new Error('rate_limit_hit');
      }
      
      throw new Error(data.error?.message || `Failed to fetch ${endpoint}`);
    }

    // Cache successful response
    requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'rate_limit_hit') {
      const cooldownTime = 300000; // 5 minutes
      console.log(`Rate limit hit, enforcing ${cooldownTime}ms cooldown...`);
      await wait(cooldownTime);
    }
    throw error;
  }
}

export async function getMetaBusinessManagers(accessToken: string): Promise<BusinessManager[]> {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  // Check cache first
  const cacheKey = `business_managers:${accessToken}`;
  const cached = requestCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('Using cached business managers');
    return cached.data;
  }

  console.log('Starting business managers fetch...');

  return retryWithBackoff(async () => {
    try {
      // Create batch request for initial data
      const batch = [
        {
          method: 'GET',
          relative_url: 'me?fields=id,name,permissions'
        },
        {
          method: 'GET',
          relative_url: 'me/adaccounts?fields=name,id,account_id,currency,timezone_name,permitted_tasks'
        },
        {
          method: 'GET',
          relative_url: 'me/businesses?fields=id,name,permitted_tasks'
        }
      ];

      console.log('Executing batch request for initial data...');
      const batchResponses = await executeBatchRequest(accessToken, batch);

      // Parse batch responses
      const userInfo = JSON.parse(batchResponses[0].body);
      const directAccounts = JSON.parse(batchResponses[1].body);
      const businesses = JSON.parse(batchResponses[2].body);

      console.log('Initial batch request complete:', {
        hasUserInfo: !!userInfo?.id,
        directAccountsCount: directAccounts?.data?.length || 0,
        businessesCount: businesses?.data?.length || 0
      });

      const businessManagers: BusinessManager[] = [];

      // Process businesses if we have any
      if (businesses?.data?.length > 0) {
        // Create batch request for all business ad accounts
        const adAccountsBatch = businesses.data.map((business: MetaBusiness) => ({
          method: 'GET',
          relative_url: `${business.id}/client_ad_accounts?fields=name,id,account_id,currency,timezone_name,permitted_tasks`
        }));

        console.log('Fetching ad accounts for businesses...');
        const adAccountsResponses = await executeBatchRequest(accessToken, adAccountsBatch);

        // Process each business with its ad accounts
        businesses.data.forEach((business: MetaBusiness, index: number) => {
          try {
            const adAccountsData = JSON.parse(adAccountsResponses[index].body);
            if (adAccountsData?.data?.length > 0) {
              businessManagers.push({
                id: business.id,
                name: business.name,
                permitted_tasks: business.permitted_tasks || [],
                ad_accounts: adAccountsData.data
              });
            }
          } catch (error) {
            console.error(`Failed to process ad accounts for business ${business.id}:`, error);
          }
        });
      }

      // Add direct ad accounts if any
      if (directAccounts?.data?.length > 0) {
        businessManagers.push({
          id: 'direct',
          name: 'Direct Ad Accounts',
          permitted_tasks: ['DIRECT_ACCESS'],
          ad_accounts: directAccounts.data
        });
      }

      // Validate results
      const validBusinessManagers = businessManagers.filter(bm => 
        bm.ad_accounts && Array.isArray(bm.ad_accounts) && bm.ad_accounts.length > 0
      );
      
      console.log('Business managers fetch complete:', {
        total: businessManagers.length,
        valid: validBusinessManagers.length,
        totalAdAccounts: validBusinessManagers.reduce((sum, bm) => sum + bm.ad_accounts.length, 0)
      });

      if (validBusinessManagers.length === 0) {
        throw new Error(
          'No business managers or ad accounts found. ' +
          'Please make sure you have access to at least one business manager with ad accounts.'
        );
      }

      // Cache the results
      requestCache.set(cacheKey, {
        data: validBusinessManagers,
        timestamp: Date.now()
      });

      return validBusinessManagers;
    } catch (error) {
      console.error('Error in getMetaBusinessManagers:', error);
      
      if (error instanceof Error && (
        error.message === 'rate_limit_hit' ||
        error.message.includes('#17') ||
        error.message.includes('#4') ||
        error.message.includes('#80004') ||
        error.message.includes('too many calls')
      )) {
        // Clear cache on rate limit errors
        requestCache.delete(cacheKey);
        throw new Error('rate_limit_hit');
      }
      
      throw error;
    }
  }, 3, 30000, 300000); // 3 retries, 30s base delay, 5m max delay
}

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaAdData {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  adcreative?: {
    id: string;
    body?: string;
    object_story_spec?: {
      link_data?: {
        message?: string;
      };
    };
  };
}

interface MetaAdInsights {
  impressions: string;
  clicks: string;
  spend: string;
  ctr: string;
  actions?: MetaAction[];
}

async function batchRequest(accessToken: string, requests: any[]): Promise<BatchResponse[]> {
  const params = new URLSearchParams({
    access_token: accessToken,
    batch: JSON.stringify(requests),
    include_headers: 'false'
  });

  const response = await fetch('https://graph.facebook.com/v19.0/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to execute batch request');
  }

  return response.json();
}

export async function getMetaAdCopy(
  accessToken: string,
  accountId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<AdCopy[]> {
  try {
    // Check cache first
    const cacheKey = `adCopy:${accountId}:${dateRange.startDate}:${dateRange.endDate}`;
    const cached = requestCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('Using cached ad copy data');
      return cached.data;
    }

    console.log('Fetching Meta ad copy data:', { accountId, dateRange });

    if (!accessToken || !accountId) {
      throw new Error('Access token and account ID are required');
    }

    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // Make direct request instead of batch request for better error handling
    const fields = [
      'id',
      'name',
      'status',
      'effective_status',
      'adcreative{id,body,object_story_spec{link_data{message}}}'
    ].join(',');

    const params = new URLSearchParams({
      access_token: accessToken,
      fields,
      limit: '50',
      status: JSON.stringify(['ACTIVE', 'PAUSED'])
    });

    const url = `https://graph.facebook.com/v19.0/${formattedAccountId}/ads?${params}`;
    
    console.log('Making ads list request:', {
      accountId: formattedAccountId,
      fields,
      fullUrl: url.replace(accessToken, 'REDACTED')
    });

    // First, try to get the ads list
    const response = await fetch(url);
    const adsData = await response.json();

    console.log('Raw API Response:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!adsData.data,
      dataLength: adsData.data?.length,
      error: adsData.error,
      firstItem: adsData.data?.[0]
    });

    if (!response.ok) {
      console.error('Failed to fetch ads list:', {
        status: response.status,
        statusText: response.statusText,
        error: adsData.error,
        url: url.replace(accessToken, 'REDACTED')
      });
      throw new Error(adsData.error?.message || 'Failed to fetch ads list');
    }

    if (!adsData.data || !Array.isArray(adsData.data)) {
      console.error('Invalid ads data structure:', adsData);
      return [];
    }

    // Process the ads data
    console.log('Starting to process ads data:', {
      totalAds: adsData.data.length
    });

    // Create batch request for insights
    const insightsRequests = adsData.data.map((ad: MetaAdData) => ({
      method: 'GET',
      relative_url: `${ad.id}/insights?fields=impressions,clicks,spend,actions,ctr&time_range={"since":"${dateRange.startDate}","until":"${dateRange.endDate}"}`
    }));

    // Split insights requests into chunks of 10
    const chunkSize = 10;
    const insightsChunks: any[][] = [];
    for (let i = 0; i < insightsRequests.length; i += chunkSize) {
      insightsChunks.push(insightsRequests.slice(i, i + chunkSize));
    }

    // Execute batch requests for insights
    const allInsightsResponses: BatchResponse[] = [];
    for (const chunk of insightsChunks) {
      try {
        const responses = await batchRequest(accessToken, chunk);
        allInsightsResponses.push(...responses);
        await wait(1000); // 1 second delay between chunks
      } catch (error) {
        console.error('Error fetching insights chunk:', error);
        // Continue with other chunks even if one fails
      }
    }

    const adCopyData = adsData.data
      .map((ad: MetaAdData, index: number) => {
        console.log(`Processing ad ${index + 1}/${adsData.data.length}:`, {
          adId: ad.id,
          hasCreative: !!ad.adcreative,
          status: ad.status,
          effectiveStatus: ad.effective_status
        });

        const insightsResponse = allInsightsResponses[index];
        if (!insightsResponse || insightsResponse.error) {
          console.log('Skipping ad due to missing/error insights:', {
            adId: ad.id,
            hasResponse: !!insightsResponse,
            error: insightsResponse?.error,
            responseCode: insightsResponse?.code
          });
          return null;
        }

        let insights: MetaAdInsights;
        try {
          const parsedBody = JSON.parse(insightsResponse.body);
          insights = parsedBody.data?.[0];
          if (!insights) {
            console.log('No insights data for ad:', { 
              adId: ad.id,
              responseBody: parsedBody
            });
            return null;
          }
        } catch (error) {
          console.error('Error parsing insights:', {
            adId: ad.id,
            error,
            responseBody: insightsResponse.body
          });
          return null;
        }

        // Get ad copy text from creative
        const adCopyText = ad.adcreative?.body || // Primary ad text/body
                          ad.adcreative?.object_story_spec?.link_data?.message || // Link message
                          '';

        if (!adCopyText) {
          console.log('No ad copy text found for ad:', { 
            adId: ad.id,
            hasCreative: !!ad.adcreative,
            hasBody: !!ad.adcreative?.body,
            hasMessage: !!ad.adcreative?.object_story_spec?.link_data?.message
          });
          return null;
        }

        // Calculate metrics
        const impressions = parseInt(insights.impressions || '0');
        const clicks = parseInt(insights.clicks || '0');
        const spend = parseFloat(insights.spend || '0');
        const ctr = parseFloat(insights.ctr || '0') / 100;

        const conversionAction = insights.actions?.find((action: MetaAction) => 
          action.action_type === 'purchase' || 
          action.action_type === 'complete_registration' ||
          action.action_type === 'lead'
        );
        
        const conversions = parseInt(conversionAction?.value || '0');
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
      .filter((item: unknown): item is AdCopy => {
        if (!item) {
          return false;
        }
        const isValid = item !== null && 
          typeof item === 'object' && 
          'impressions' in item &&
          'spend' in item &&
          (item as AdCopy).impressions > 0 && 
          (item as AdCopy).spend > 0;
        
        if (!isValid) {
          console.log('Ad copy filtered out:', {
            id: (item as any)?.id,
            hasImpressions: (item as any)?.impressions > 0,
            hasSpend: (item as any)?.spend > 0,
            item
          });
        }
        
        return isValid;
      });

    // Sort by performance (using CTR and conversion rate)
    const sortedAdCopy = adCopyData
      .sort((a: AdCopy, b: AdCopy) => {
        const aScore = (a.ctr * 0.4) + (a.conversionRate * 0.6);
        const bScore = (b.ctr * 0.4) + (b.conversionRate * 0.6);
        return bScore - aScore;
      })
      .slice(0, 10);

    // Cache the results
    requestCache.set(cacheKey, {
      data: sortedAdCopy,
      timestamp: Date.now()
    });

    console.log('Ad copy processing complete:', {
      totalProcessed: adsData.data.length,
      validAdCopyCount: adCopyData.length,
      sampleAdCopy: adCopyData[0] ? {
        id: adCopyData[0].id,
        textLength: adCopyData[0].text.length,
        metrics: {
          impressions: adCopyData[0].impressions,
          clicks: adCopyData[0].clicks,
          spend: adCopyData[0].spend,
          ctr: adCopyData[0].ctr
        }
      } : null
    });

    return sortedAdCopy;
  } catch (error) {
    console.error('Error in getMetaAdCopy:', error);
    throw error;
  }
} 