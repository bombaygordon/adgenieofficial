interface CacheData {
  timestamp: number;
  data: any;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface CacheStore {
  [accountId: string]: {
    [dataType: string]: CacheData;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache: CacheStore = {};

export function setCacheData(accountId: string, dataType: string, data: any, dateRange: { startDate: string; endDate: string }) {
  if (!cache[accountId]) {
    cache[accountId] = {};
  }
  
  cache[accountId][dataType] = {
    timestamp: Date.now(),
    data,
    dateRange
  };
}

export function getCacheData(accountId: string, dataType: string, dateRange: { startDate: string; endDate: string }) {
  const accountCache = cache[accountId];
  if (!accountCache) return null;

  const cachedData = accountCache[dataType];
  if (!cachedData) return null;

  // Check if cache has expired
  if (Date.now() - cachedData.timestamp > CACHE_DURATION) {
    delete accountCache[dataType];
    return null;
  }

  // Check if date range matches
  if (cachedData.dateRange.startDate !== dateRange.startDate || 
      cachedData.dateRange.endDate !== dateRange.endDate) {
    return null;
  }

  return cachedData.data;
}

export function clearCache(accountId?: string, dataType?: string) {
  if (accountId && dataType) {
    // Clear specific data type for account
    if (cache[accountId]) {
      delete cache[accountId][dataType];
    }
  } else if (accountId) {
    // Clear all data for account
    delete cache[accountId];
  } else {
    // Clear entire cache
    Object.keys(cache).forEach(key => delete cache[key]);
  }
} 