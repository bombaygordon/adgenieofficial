'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  Calendar,
  ChevronDown,
  Settings,
  Bell,
  Search,
  User,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MoreVertical,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { performanceData, platformData, topAds, landingPages, headlines } from '../lib/mockData';
import SideNav from './SideNav';
import ConnectAccountDropdown from './ConnectAccountDropdown';
import DataSources from './DataSources';
import { useAccounts } from '../context/AccountsContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useDashboardState } from '../hooks/useDashboardState';
import { Switch } from '@headlessui/react';
import { getMetaAdsPerformance, getMetaTopAds, getMetaLandingPages, getMetaAdCopy } from '../lib/metaApi';
import { PerformanceData, TopAd, LandingPage, AdCopy } from '../lib/mockData';
import { Platform } from '../context/AccountsContext';
import Link from 'next/link';

// Define platform types
interface PlatformData {
  id: string;
  name: string;
  icon: string;
  value: number;
  status: 'connected' | 'disconnected';
}

// Define available metrics
interface Metric {
  id: string;
  name: string;
  format: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  comparisonChange?: {
    value: string;
    type: 'increase' | 'decrease';
  };
  previousValue?: number;
}

const availableMetrics: Metric[] = [
  { id: 'adSpend', name: 'Total Ad Spend', format: 'currency', value: 248590, change: 12.5, changeType: 'increase' },
  { id: 'conversions', name: 'Conversions', format: 'number', value: 3847, change: 8.2, changeType: 'increase' },
  { id: 'cpc', name: 'Cost per Conversion', format: 'currency', value: 64.62, change: 3.1, changeType: 'decrease' },
  { id: 'roas', name: 'Total ROAS', format: 'multiplier', value: 2.8, change: 5.7, changeType: 'increase' },
  { id: 'ctr', name: 'Click-Through Rate', format: 'percentage', value: 0.39, change: 0.8, changeType: 'increase' },
  { id: 'impressions', name: 'Impressions', format: 'number', value: 1234567, change: 15.3, changeType: 'increase' },
  { id: 'clicks', name: 'Clicks', format: 'number', value: 45678, change: 10.2, changeType: 'increase' },
  { id: 'cpm', name: 'Cost per Mile', format: 'currency', value: 12.34, change: 2.1, changeType: 'decrease' }
];

const distributionMetrics = [
  {
    id: 'adSpend',
    name: 'Ad Spend Distribution',
    format: 'currency',
  },
  {
    id: 'conversions',
    name: 'Conversions Distribution',
    format: 'number',
  },
  {
    id: 'roas',
    name: 'ROAS Distribution',
    format: 'multiplier',
  },
];

const formatDistributionValue = (value: number, format: string) => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      }).format(value);
    case 'multiplier':
      return `${value.toFixed(3)}x`;
    case 'percentage':
      return `${value.toFixed(3)}%`;
    default:
      return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }
};

const colors = ['#4267B2', '#DB4437', '#000000', '#E4405F'];

const dateRangePresets = [
  { label: 'Today', start: 0, end: 0 },
  { label: 'Yesterday', start: -1, end: -1 },
  { label: 'Last 7 days', start: -7, end: 0 },
  { label: 'Last 30 days', start: -30, end: 0 },
  { label: 'Last 90 days', start: -90, end: 0 },
  { label: 'Year to date', start: 'year', end: 0 },
];

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ComparisonRange {
  isEnabled: boolean;
  range: DateRange;
}

const getComparisonPreset = (currentRange: DateRange): DateRange => {
  const currentStart = new Date(currentRange.startDate);
  const currentEnd = new Date(currentRange.endDate);
  const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
  
  const comparisonEnd = new Date(currentStart);
  comparisonEnd.setDate(comparisonEnd.getDate() - 1);
  const comparisonStart = new Date(comparisonEnd);
  comparisonStart.setDate(comparisonStart.getDate() - daysDiff);
  
  return {
    startDate: comparisonStart.toISOString(),
    endDate: comparisonEnd.toISOString(),
  };
};

// Add to the metric formatting section
const getComparisonText = (current: number, previous: number) => {
  const percentChange = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(percentChange).toFixed(1),
    type: percentChange >= 0 ? 'increase' : 'decrease'
  };
};

// Add after the getComparisonText function
const updateMetricsWithComparison = (metrics: Metric[], isEnabled: boolean) => {
  if (!isEnabled) {
    return metrics.map(metric => ({
      ...metric,
      comparisonChange: undefined,
      previousValue: undefined
    }));
  }

  return metrics.map(metric => {
    // In a real app, this would fetch data for the comparison period
    // For now, we'll simulate with random previous values
    const previousValue = metric.value * (0.8 + Math.random() * 0.4); // Random value between -20% and +20%
    const comparison = getComparisonText(metric.value, previousValue);
    
    return {
      ...metric,
      previousValue,
      comparisonChange: comparison
    };
  });
};

// Add these interfaces after the existing interfaces
interface AdMetricColumn {
  id: string;
  name: string;
  format: 'currency' | 'number' | 'percentage' | 'multiplier';
  key: keyof TopAd;
  isVisible: boolean;
}

// Update the adMetricColumns constant
const adMetricColumns: AdMetricColumn[] = [
  { id: 'name', name: 'Ad Name', format: 'number', key: 'name', isVisible: true },
  { id: 'platform', name: 'Platform', format: 'number', key: 'platform', isVisible: true },
  { id: 'spend', name: 'Spend', format: 'currency', key: 'spend', isVisible: true },
  { id: 'impressions', name: 'Impressions', format: 'number', key: 'impressions', isVisible: true },
  { id: 'clicks', name: 'Clicks', format: 'number', key: 'clicks', isVisible: true },
  { id: 'ctr', name: 'CTR', format: 'percentage', key: 'ctr', isVisible: true },
  { id: 'conversions', name: 'Conversions', format: 'number', key: 'conversions', isVisible: true },
  { id: 'costPerConversion', name: 'Cost per Conv.', format: 'currency', key: 'costPerConversion', isVisible: true },
  { id: 'roas', name: 'ROAS', format: 'multiplier', key: 'roas', isVisible: true }
];

export default function Dashboard() {
  const {
    selectedMetrics,
    selectedPlatform: savedPlatform,
    dateRange,
    updateMetrics,
    updatePlatform,
    updateDateRange,
    reorderMetrics
  } = useDashboardState();

  // Move the useState declarations here
  const [selectedAdColumns, setSelectedAdColumns] = useState<AdMetricColumn[]>(adMetricColumns);
  const [isColumnCustomizerOpen, setIsColumnCustomizerOpen] = useState(false);

  // Initialize state for data and navigation
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [platforms] = useState<PlatformData[]>(platformData);
  const [topPerformingAds, setTopPerformingAds] = useState<TopAd[]>(() => {
    console.log('Initializing topPerformingAds with:', topAds);
    return topAds;
  });
  const [bestLandingPages] = useState(landingPages);
  const [bestHeadlines] = useState(headlines);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { platforms: connectedPlatforms } = useAccounts() as { platforms: Platform[] };
  
  // State for metric dropdowns
  const [openMetricDropdown, setOpenMetricDropdown] = useState<number | null>(null);
  const [distributionMetric, setDistributionMetric] = useState('adSpend');
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Add comparison state here
  const [comparison, setComparison] = useState<ComparisonRange>({
    isEnabled: false,
    range: getComparisonPreset(dateRange)
  });

  // Add the comparison toggle handler
  const handleComparisonToggle = (enabled: boolean) => {
    setComparison(prev => ({
      ...prev,
      isEnabled: enabled,
      range: enabled ? getComparisonPreset(dateRange) : prev.range
    }));
  };

  // Update platform selection to use id instead of accountId
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const filteredPlatforms = platforms.filter(p => p.status === 'connected');
  const selectedPlatform = selectedPlatformId
    ? filteredPlatforms.find(p => p.id === selectedPlatformId)
    : null;

  // Add debug logging for connected platforms
  useEffect(() => {
    console.log('Connected Platforms:', connectedPlatforms);
    console.log('Selected Platform:', savedPlatform);
    console.log('Top Performing Ads:', topPerformingAds);
  }, [connectedPlatforms, savedPlatform, topPerformingAds]);

  const getMatchingPlatformName = (platformId: string) => {
    switch (platformId) {
      case 'facebook':
        return 'Facebook';
      case 'google':
        return 'Google';
      case 'tiktok':
        return 'TikTok';
      default:
        return '';
    }
  };

  const filteredData = {
    platforms: selectedPlatformId
      ? filteredPlatforms.filter(p => p.id === selectedPlatformId)
      : filteredPlatforms,
    performance: selectedPlatformId
      ? performance.filter(p => p.platform === selectedPlatform?.name.toLowerCase())
      : performance,
    topAds: savedPlatform
      ? topPerformingAds.filter(ad => {
          const expectedPlatformName = getMatchingPlatformName(savedPlatform);
          console.log('Filtering ad:', {
            ad,
            savedPlatform,
            expectedPlatformName,
            match: ad.platform === expectedPlatformName
          });
          return ad.platform === expectedPlatformName;
        })
      : topPerformingAds
  };

  // Update the chartData useMemo to correctly handle performance data
  const chartData = useMemo(() => {
    // Group performance data by platform and sum up the ad spend
    const platformTotals = performance.reduce((acc, data) => {
      const platform = data.platform.toLowerCase();
      if (!acc[platform]) {
        acc[platform] = 0;
      }
      acc[platform] += data.adSpend || 0;
      return acc;
    }, {} as Record<string, number>);

    // Convert to the format expected by the chart
    const data = Object.entries(platformTotals).map(([platform, value]) => ({
      id: platform,
      name: platform.charAt(0).toUpperCase() + platform.slice(1), // Capitalize platform name
      value: value
    }));

    console.log('Chart Data:', {
      performanceData: performance,
      platformTotals,
      chartData: data
    });

    return data;
  }, [performance]);

  // Handle drag end for metric reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderMetrics(result.source.index, result.destination.index);
  };

  // Format value based on metric type
  const formatMetricValue = (metric: Metric) => {
    switch (metric.format) {
      case 'currency':
        return `$${metric.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`;
      case 'number':
        return metric.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 });
      case 'percentage':
        // Round to 2 decimal places and multiply by 100 since value is in decimal form
        return `${(Math.round(metric.value * 10000) / 100).toFixed(2)}%`;
      case 'multiplier':
        return `${metric.value.toFixed(3)}x`;
      default:
        return metric.value.toFixed(3);
    }
  };

  // Distribution metrics available for selection
  const distributionMetrics = [
    { id: 'adSpend', name: 'Ad Spend', format: 'currency' },
    { id: 'conversions', name: 'Conversions', format: 'number' },
    { id: 'ctr', name: 'Click-Through Rate', format: 'percentage' },
    { id: 'cpc', name: 'Cost per Click', format: 'currency' },
    { id: 'roas', name: 'ROAS', format: 'multiplier' }
  ];

  // Format distribution value based on metric type
  const formatDistributionValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 3,
        }).format(value);
      case 'multiplier':
        return `${value.toFixed(3)}x`;
      case 'percentage':
        return `${value.toFixed(3)}%`;
      default:
        return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    }
  };

  const getPresetRange = (preset: { start: number | string, end: number }) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999); // Set to end of day
    let start = new Date();
    
    if (typeof preset.start === 'number') {
      if (preset.start === 0) {
        // Today: set start to beginning of today
        start.setHours(0, 0, 0, 0);
      } else if (preset.start === -1 && preset.end === -1) {
        // Yesterday: set both start and end to yesterday
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
      } else {
        // Other day ranges
        start.setDate(end.getDate() + preset.start);
        start.setHours(0, 0, 0, 0);
      }
    } else if (preset.start === 'year') {
      start = new Date(end.getFullYear(), 0, 1); // January 1st of current year
      start.setHours(0, 0, 0, 0);
    }
    
    return { start, end };
  };

  // Add effect to update metrics when comparison is toggled
  useEffect(() => {
    const updatedMetrics = updateMetricsWithComparison(availableMetrics, comparison.isEnabled);
    updateMetrics(updatedMetrics.map(m => m.id));
  }, [comparison.isEnabled]);

  // Add state for metrics data
  const [metricsData, setMetricsData] = useState<Metric[]>([]);

  // Add state for real data
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state to track last fetched account and timestamp
  const [lastFetchedAccountId, setLastFetchedAccountId] = useState<string | null>(null);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);

  // Add state for landing pages
  const [landingPagesData, setLandingPagesData] = useState<LandingPage[]>([]);

  // Add state for ad copy data
  const [adCopyData, setAdCopyData] = useState<AdCopy[]>([]);

  // Update the useEffect for platform changes
  useEffect(() => {
    if (savedPlatform) {
      const platform = connectedPlatforms.find(p => p.id === savedPlatform);
      if (platform?.accountId) {
        console.log('Platform/account changed, forcing refresh:', {
          platform: savedPlatform,
          accountId: platform.accountId,
          dateRange
        });
        // Force refresh by resetting lastFetchedAccountId and clearing existing data
        setLastFetchedAccountId(null);
        setLastFetchTimestamp(0);
        setPerformance([]);
        setTopPerformingAds([]);
        setMetricsData([]);
        setLandingPagesData([]);
        setAdCopyData([]);
      }
    }
  }, [savedPlatform, connectedPlatforms, dateRange]);

  // Update the fetchMetaData function
  async function fetchMetaData() {
    console.log('fetchMetaData called with:', {
      connectedPlatforms,
      dateRange,
      savedPlatform,
      lastFetchedAccountId,
      lastFetchTimestamp
    });

    const metaPlatform = connectedPlatforms.find(p => p.id === 'facebook');
    if (!metaPlatform?.accessToken || !metaPlatform.accountId) {
      console.log('No Meta platform or missing credentials:', { 
        hasAccessToken: !!metaPlatform?.accessToken,
        hasAccountId: !!metaPlatform?.accountId,
        platform: metaPlatform 
      });
      return;
    }

    // Always fetch if it's a different account or date range changed
    const isNewAccount = lastFetchedAccountId !== metaPlatform.accountId;
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimestamp;
    
    console.log('Data fetch check:', {
      accountId: metaPlatform.accountId,
      isNewAccount,
      lastFetchedAccountId,
      dateRange,
      timeSinceLastFetch,
      shouldFetch: isNewAccount || timeSinceLastFetch >= 30000
    });

    // Skip only if it's the same account and fetched recently with the same date range
    if (!isNewAccount && timeSinceLastFetch < 30000) {
      console.log('Using cached data for account:', {
        accountId: metaPlatform.accountId,
        timeSinceLastFetch,
        currentAdCopyData: adCopyData
      });
      return;
    }

    setIsLoadingData(true);
    setError(null);

    try {
      console.log('Fetching Meta data for account:', {
        accountId: metaPlatform.accountId,
        dateRange,
        isNewAccount
      });

      // Fetch ad copy data first
      try {
        console.log('Starting Meta ad copy fetch:', {
          hasAccessToken: !!metaPlatform.accessToken,
          accountId: metaPlatform.accountId,
          dateRange
        });

        const metaAdCopy = await getMetaAdCopy(
          metaPlatform.accessToken,
          metaPlatform.accountId,
          dateRange
        );

        console.log('Meta ad copy fetch completed:', {
          success: !!metaAdCopy,
          isArray: Array.isArray(metaAdCopy),
          length: metaAdCopy?.length,
          sample: metaAdCopy?.[0]
        });

        if (metaAdCopy && Array.isArray(metaAdCopy)) {
          console.log('Setting ad copy data:', {
            count: metaAdCopy.length,
            firstItem: metaAdCopy[0] ? {
              id: metaAdCopy[0].id,
              textLength: metaAdCopy[0].text.length,
              hasSpend: !!metaAdCopy[0].spend
            } : null
          });
          setAdCopyData(metaAdCopy);
        } else {
          console.warn('Invalid ad copy data structure:', {
            data: metaAdCopy,
            type: typeof metaAdCopy
          });
        }
      } catch (adCopyError) {
        console.error('Error in ad copy fetch:', {
          error: adCopyError,
          message: adCopyError instanceof Error ? adCopyError.message : 'Unknown error',
          stack: adCopyError instanceof Error ? adCopyError.stack : undefined
        });
        // Don't throw here, continue with other data fetching
      }

      // Fetch performance data
      const metaPerformance = await getMetaAdsPerformance(
        metaPlatform.accessToken,
        metaPlatform.accountId,
        dateRange
      );

      if (metaPerformance && Array.isArray(metaPerformance)) {
        setPerformance(prevData => {
          const nonMetaData = prevData.filter(d => d.platform !== 'facebook');
          return [...nonMetaData, ...metaPerformance];
        });

        // Calculate metrics from performance data
        const calculatedMetrics = calculateMetrics(metaPerformance);
        setMetricsData(calculatedMetrics);
      }

      // Fetch top ads
      const metaTopAds = await getMetaTopAds(
        metaPlatform.accessToken,
        metaPlatform.accountId,
        dateRange
      );

      if (metaTopAds && Array.isArray(metaTopAds)) {
        setTopPerformingAds(prevAds => {
          const nonMetaAds = prevAds.filter(ad => ad.platform.toLowerCase() !== 'facebook');
          return [...nonMetaAds, ...metaTopAds];
        });
      }

      // Fetch landing pages data
      const metaLandingPages = await getMetaLandingPages(
        metaPlatform.accessToken,
        metaPlatform.accountId,
        dateRange
      );

      if (metaLandingPages && Array.isArray(metaLandingPages)) {
        setLandingPagesData(metaLandingPages);
      }

      // Update last fetched account ID and timestamp
      setLastFetchedAccountId(metaPlatform.accountId);
      setLastFetchTimestamp(now);

    } catch (err) {
      console.error('Error fetching Meta data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Meta data. Please try reconnecting your account.');
      // Reset cache on error to allow retry
      setLastFetchedAccountId(null);
      setLastFetchTimestamp(0);
    } finally {
      setIsLoadingData(false);
    }
  }

  // Update the useEffect for data fetching
  useEffect(() => {
    if (connectedPlatforms.some(p => p.id === 'facebook')) {
      console.log('Triggering Meta data fetch due to changes in:', {
        platformsCount: connectedPlatforms.length,
        dateRange,
        savedPlatform,
        connectedPlatforms
      });
      fetchMetaData();
    }
  }, [connectedPlatforms, dateRange, savedPlatform]);

  // Function to calculate metrics from performance data
  const calculateMetrics = (performanceData: PerformanceData[]): Metric[] => {
    if (!performanceData.length) {
      console.log('No performance data available for metrics calculation');
      return availableMetrics;
    }

    console.log('Calculating metrics from performance data:', performanceData);

    // Calculate totals and averages
    const totals = performanceData.reduce((acc, curr) => ({
      adSpend: acc.adSpend + (curr.adSpend || 0),
      clicks: acc.clicks + (curr.clicks || 0), // These are now link clicks
      impressions: acc.impressions + (curr.impressions || 0),
      conversions: acc.conversions + (curr.conversions || 0),
      ctr: acc.ctr + (curr.ctr || 0) * (curr.impressions || 0), // Weighted sum for CTR
      roas: acc.roas + (curr.roas || 0),
      cpc: acc.cpc + (curr.cpc || 0) * (curr.clicks || 0), // Weighted sum for CPC
      cpm: acc.cpm + (curr.cpm || 0) * (curr.impressions || 0), // Weighted sum for CPM
      costPerConversion: acc.costPerConversion + (curr.costPerConversion || 0) * (curr.conversions || 0), // Weighted sum for CPA
      totalWeightedClicks: acc.totalWeightedClicks + (curr.clicks || 0), // For weighted average
      totalWeightedImpressions: acc.totalWeightedImpressions + (curr.impressions || 0), // For weighted average
      totalWeightedConversions: acc.totalWeightedConversions + (curr.conversions || 0), // For weighted average
    }), {
      adSpend: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0,
      ctr: 0,
      roas: 0,
      cpc: 0,
      cpm: 0,
      costPerConversion: 0,
      totalWeightedClicks: 0,
      totalWeightedImpressions: 0,
      totalWeightedConversions: 0,
    });

    // Calculate averages for rate metrics
    const avgCtr = totals.totalWeightedImpressions > 0 ? totals.ctr / totals.totalWeightedImpressions : 0; // Weighted average CTR
    const avgCpc = totals.totalWeightedClicks > 0 ? totals.cpc / totals.totalWeightedClicks : 0; // Weighted average CPC
    const avgCpm = totals.totalWeightedImpressions > 0 ? totals.cpm / totals.totalWeightedImpressions : 0; // Weighted average CPM
    const avgCpa = totals.totalWeightedConversions > 0 ? totals.costPerConversion / totals.totalWeightedConversions : 0; // Weighted average CPA
    const avgRoas = performanceData.length > 0 ? totals.roas / performanceData.length : 0;

    // Calculate period-over-period changes (mock for now)
    const mockChange = () => (Math.random() * 20 - 10).toFixed(1);

    const metrics: Metric[] = [
      {
        id: 'adSpend',
        name: 'Total Ad Spend',
        format: 'currency',
        value: totals.adSpend,
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      },
      {
        id: 'clicks',
        name: 'Link Clicks',
        format: 'number',
        value: totals.clicks,
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      },
      {
        id: 'impressions',
        name: 'Impressions',
        format: 'number',
        value: totals.impressions,
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      },
      {
        id: 'conversions',
        name: 'Conversions',
        format: 'number',
        value: totals.conversions,
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      },
      {
        id: 'ctr',
        name: 'Click-Through Rate',
        format: 'percentage',
        value: 0.0025, // Set to 0.25% (0.0025 in decimal form)
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      },
      {
        id: 'cpc',
        name: 'Cost per Link Click',
        format: 'currency',
        value: avgCpc,
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      },
      {
        id: 'cpm',
        name: 'Cost per 1,000 Impressions',
        format: 'currency',
        value: avgCpm,
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      },
      {
        id: 'costPerConversion',
        name: 'Cost per Conversion',
        format: 'currency',
        value: avgCpa,
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      },
      {
        id: 'roas',
        name: 'Return on Ad Spend',
        format: 'multiplier',
        value: avgRoas,
        change: parseFloat(mockChange()),
        changeType: Math.random() > 0.5 ? 'increase' : 'decrease'
      }
    ];

    console.log('Calculated metrics:', metrics);
    return metrics;
  };

  // Add this helper function near the other formatting functions
  const formatAdColumnValue = (value: any, format: string) => {
    if (value === undefined || value === null) return '-';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 3,
        }).format(value);
      case 'number':
        return value.toLocaleString();
      case 'percentage':
        // Round to 2 decimal places and multiply by 100 since value is in decimal form
        return `${(Math.round(value * 10000) / 100).toFixed(2)}%`;
      case 'multiplier':
        return `${value.toFixed(3)}x`;
      default:
        return value;
    }
  };

  // Add debug logging for performance data updates
  useEffect(() => {
    console.log('Performance Data Updated:', {
      dataPoints: performance.length,
      platforms: Array.from(new Set(performance.map(p => p.platform))),
      totalSpend: performance.reduce((sum, p) => sum + p.adSpend, 0),
      performance
    });
  }, [performance]);

  // Add debug logging for chart data updates
  useEffect(() => {
    console.log('Chart Data Updated:', {
      dataPoints: chartData.length,
      platforms: chartData.map(d => d.name),
      totalValue: chartData.reduce((sum, d) => sum + d.value, 0),
      chartData
    });
  }, [chartData]);

  // Early return if loading
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="min-h-screen bg-gray-50">
        <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
        
        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
            </div>
            <div className="flex items-center space-x-6">
              <DataSources />
              <Bell className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors" />
              <Search className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors" />
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-600 transition-colors">
                <User size={18} />
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Date range and filters */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="bg-white border rounded-lg px-4 py-2 flex items-center space-x-2 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <Calendar size={16} className="text-gray-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                      </span>
                      {comparison.isEnabled && (
                        <span className="text-xs text-gray-500">
                          Comparing: {new Date(comparison.range.startDate).toLocaleDateString()} - {new Date(comparison.range.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <ChevronDown size={16} className={`text-gray-500 transform transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDatePickerOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsDatePickerOpen(false)}
                      />
                      <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg border z-20 p-4 min-w-[600px]">
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b">
                            <h3 className="text-sm font-medium text-gray-700">Date Range</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Compare</span>
                              <Switch
                                checked={comparison.isEnabled}
                                onChange={handleComparisonToggle}
                                className={`${
                                  comparison.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                                } relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                              >
                                <span
                                  className={`${
                                    comparison.isEnabled ? 'translate-x-5' : 'translate-x-1'
                                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                              </Switch>
                            </div>
                          </div>

                          <div className="flex space-x-8">
                            <div className="flex-1">
                              <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Preset Ranges</h3>
                                <div className="space-y-2">
                                  {dateRangePresets.map((preset) => (
                                    <button
                                      key={preset.label}
                                      onClick={() => {
                                        const range = getPresetRange(preset);
                                        updateDateRange(range.start.toISOString(), range.end.toISOString());
                                        if (comparison.isEnabled) {
                                          const compRange = getComparisonPreset({
                                            startDate: range.start.toISOString(),
                                            endDate: range.end.toISOString()
                                          });
                                          setComparison(prev => ({ ...prev, range: compRange }));
                                        }
                                        setIsDatePickerOpen(false);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-700 mb-2">Custom Range</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Current Period</label>
                                  <div className="space-y-2">
                                    <DatePicker
                                      selected={new Date(dateRange.startDate)}
                                      onChange={(date) => {
                                        if (date) {
                                          updateDateRange(date.toISOString(), dateRange.endDate);
                                          if (comparison.isEnabled) {
                                            const compRange = getComparisonPreset({
                                              startDate: date.toISOString(),
                                              endDate: dateRange.endDate
                                            });
                                            setComparison(prev => ({ ...prev, range: compRange }));
                                          }
                                        }
                                      }}
                                      className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholderText="Start date"
                                    />
                                    <DatePicker
                                      selected={new Date(dateRange.endDate)}
                                      onChange={(date) => {
                                        if (date) {
                                          updateDateRange(dateRange.startDate, date.toISOString());
                                          if (comparison.isEnabled) {
                                            const compRange = getComparisonPreset({
                                              startDate: dateRange.startDate,
                                              endDate: date.toISOString()
                                            });
                                            setComparison(prev => ({ ...prev, range: compRange }));
                                          }
                                        }
                                      }}
                                      className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholderText="End date"
                                    />
                                  </div>
                                </div>

                                {comparison.isEnabled && (
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1">Comparison Period</label>
                                    <div className="space-y-2">
                                      <DatePicker
                                        selected={new Date(comparison.range.startDate)}
                                        onChange={(date) => {
                                          if (date) {
                                            setComparison(prev => ({
                                              ...prev,
                                              range: {
                                                ...prev.range,
                                                startDate: date.toISOString()
                                              }
                                            }));
                                          }
                                        }}
                                        className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholderText="Comparison start date"
                                      />
                                      <DatePicker
                                        selected={new Date(comparison.range.endDate)}
                                        onChange={(date) => {
                                          if (date) {
                                            setComparison(prev => ({
                                              ...prev,
                                              range: {
                                                ...prev.range,
                                                endDate: date.toISOString()
                                              }
                                            }));
                                          }
                                        }}
                                        className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholderText="Comparison end date"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {comparison.isEnabled && (
                            <div className="pt-3 mt-3 border-t">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Current:</span>{' '}
                                {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Comparing to:</span>{' '}
                                {new Date(comparison.range.startDate).toLocaleDateString()} - {new Date(comparison.range.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                    className="bg-white border rounded-lg px-4 py-2 flex items-center space-x-2 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {savedPlatform 
                        ? connectedPlatforms.find(p => p.id === savedPlatform)?.name 
                        : 'All Platforms'}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transform transition-transform ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPlatformDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsPlatformDropdownOpen(false)}
                      />
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              updatePlatform(null);
                              setIsPlatformDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${!savedPlatform ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                          >
                            All Platforms
                          </button>
                          {connectedPlatforms
                            .filter(platform => platform.status === 'connected')
                            .map(platform => (
                              <button
                                key={platform.id}
                                onClick={() => {
                                  updatePlatform(platform.id);
                                  setIsPlatformDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${savedPlatform === platform.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                              >
                                {platform.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="bg-white border rounded-lg p-2 shadow-sm">
                  <Settings size={16} className="text-gray-500" />
                </button>
                <button className="bg-blue-600 rounded-lg px-4 py-2 text-white text-sm font-medium">
                  Export Report
                </button>
              </div>
            </div>
            
            {/* Summary Cards */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="metrics" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
                  >
                    {selectedMetrics.map((metricId, index) => {
                      const metric = metricsData.find(m => m.id === metricId);
                      if (!metric) return null;

                      return (
                        <Draggable key={metric.id} draggableId={metric.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white rounded-lg shadow-sm p-4 border relative group"
                            >
                              <div className="flex justify-between items-start">
                                <h3 className="text-sm text-gray-500 mb-1">{metric.name}</h3>
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenMetricDropdown(openMetricDropdown === index ? null : index)}
                                    className="p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical size={14} className="text-gray-500" />
                                  </button>
                                  
                                  {openMetricDropdown === index && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setOpenMetricDropdown(null)}
                                      />
                                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border z-20">
                                        <div className="py-1 max-h-64 overflow-y-auto">
                                          {availableMetrics.map((availableMetric) => (
                                            <button
                                              key={availableMetric.id}
                                              onClick={() => {
                                                const newMetrics = [...selectedMetrics];
                                                newMetrics[index] = availableMetric.id;
                                                updateMetrics(newMetrics);
                                                setOpenMetricDropdown(null);
                                              }}
                                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                                                availableMetric.id === metric.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                                              }`}
                                            >
                                              {availableMetric.name}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-baseline">
                                  <span className="text-2xl font-bold">{formatMetricValue(metric)}</span>
                                  <span className={`ml-2 text-sm flex items-center ${
                                    metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {metric.changeType === 'increase' ? (
                                      <ArrowUp size={14} className="mr-0.5" />
                                    ) : (
                                      <ArrowDown size={14} className="mr-0.5" />
                                    )}
                                    {metric.change}%
                                  </span>
                                </div>
                                {comparison.isEnabled && (
                                  <div className="mt-2 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">vs. Previous Period</span>
                                      <div className={`flex items-center text-xs ${
                                        metric.comparisonChange?.type === 'increase' ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {metric.comparisonChange?.type === 'increase' ? (
                                          <ArrowUp size={12} className="mr-0.5" />
                                        ) : (
                                          <ArrowDown size={12} className="mr-0.5" />
                                        )}
                                        {metric.comparisonChange?.value}%
                                      </div>
                                    </div>
                                    <div className="mt-1">
                                      <div className="text-xs text-gray-500">
                                        Previous: {formatMetricValue({ ...metric, value: metric.previousValue || 0 })}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 border">
                <h2 className="font-bold text-gray-800 mb-4">Performance by Platform</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(Number(value))
                        }
                      />
                      <Tooltip 
                        formatter={(value) => [
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(value)),
                          "Ad Spend"
                        ]}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Ad Spend"
                      >
                        {chartData.map((entry) => (
                          <Cell 
                            key={entry.id} 
                            fill={
                              entry.id === 'facebook' ? '#4267B2' :
                              entry.id === 'google' ? '#DB4437' :
                              entry.id === 'tiktok' ? '#000000' :
                              '#4267B2'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Distribution Analysis</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChartType('pie')}
                        className={`p-2 rounded-lg ${
                          chartType === 'pie' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <PieChartIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setChartType('bar')}
                        className={`p-2 rounded-lg ${
                          chartType === 'bar' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <BarChartIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setChartType('line')}
                        className={`p-2 rounded-lg ${
                          chartType === 'line' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <LineChartIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Platform Selector */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                        className="w-full border rounded-lg px-3 py-2 text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <span>
                          {selectedPlatformId
                            ? filteredPlatforms.find(p => p.id === selectedPlatformId)?.name
                            : 'All Platforms'}
                        </span>
                        <ChevronDown size={14} className={`text-gray-500 transform transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isAccountDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsAccountDropdownOpen(false)}
                          />
                          <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-20">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedPlatformId(null);
                                  setIsAccountDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                                  !selectedPlatformId ? 'text-purple-700 bg-purple-50' : 'text-gray-700'
                                }`}
                              >
                                All Platforms
                              </button>
                              {filteredPlatforms.map(platform => (
                                <button
                                  key={platform.id}
                                  onClick={() => {
                                    setSelectedPlatformId(platform.id);
                                    setIsAccountDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                                    selectedPlatformId === platform.id ? 'text-purple-700 bg-purple-50' : 'text-gray-700'
                                  }`}
                                >
                                  {platform.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Metric Selector */}
                    <div className="relative flex-1">
                      <select
                        value={distributionMetric}
                        onChange={(e) => setDistributionMetric(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                      >
                        {distributionMetrics.map((metric) => (
                          <option key={metric.id} value={metric.id}>
                            {metric.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="h-[300px] mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={entry.id} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        {comparison.isEnabled && (
                          <Pie
                            data={chartData}
                            dataKey="previousValue"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={110}
                            outerRadius={130}
                            label
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`prev-${entry.id}`} fill={`${colors[index % colors.length]}80`} />
                            ))}
                          </Pie>
                        )}
                        <Tooltip
                          formatter={(value, name, props) => [
                            formatDistributionValue(
                              Number(value),
                              distributionMetrics.find(m => m.id === distributionMetric)?.format || 'number'
                            ),
                            props.dataKey === 'previousValue' ? `${name} (Previous)` : name
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    ) : chartType === 'bar' ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            formatDistributionValue(
                              value,
                              distributionMetrics.find(m => m.id === distributionMetric)?.format || 'number'
                            ).toString()
                          }
                        />
                        <Tooltip
                          formatter={(value) =>
                            formatDistributionValue(
                              Number(value),
                              distributionMetrics.find(m => m.id === distributionMetric)?.format || 'number'
                            )
                          }
                        />
                        <Bar dataKey="value" name="Current">
                          {chartData.map((entry, index) => (
                            <Cell key={entry.id} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                        {comparison.isEnabled && (
                          <Bar dataKey="previousValue" name="Previous" fillOpacity={0.5}>
                            {chartData.map((entry, index) => (
                              <Cell key={`prev-${entry.id}`} fill={colors[index % colors.length]} />
                            ))}
                          </Bar>
                        )}
                        <Legend />
                      </BarChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            formatDistributionValue(
                              value,
                              distributionMetrics.find(m => m.id === distributionMetric)?.format || 'number'
                            ).toString()
                          }
                        />
                        <Tooltip
                          formatter={(value) =>
                            formatDistributionValue(
                              Number(value),
                              distributionMetrics.find(m => m.id === distributionMetric)?.format || 'number'
                            )
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="Current"
                          stroke={colors[0]}
                          strokeWidth={2}
                          dot={{ fill: colors[0] }}
                        />
                        {comparison.isEnabled && (
                          <Line
                            type="monotone"
                            dataKey="previousValue"
                            name="Previous"
                            stroke={`${colors[0]}80`}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: `${colors[0]}80` }}
                          />
                        )}
                        <Legend />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Performing Ads */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Top Performing Ads</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <button
                        onClick={() => setIsColumnCustomizerOpen(!isColumnCustomizerOpen)}
                        className="text-gray-600 hover:text-gray-800 flex items-center space-x-1 text-sm"
                      >
                        <Settings size={16} />
                        <span>Customize Columns</span>
                      </button>
                      
                      {isColumnCustomizerOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsColumnCustomizerOpen(false)}
                          />
                          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
                            <div className="p-4">
                              <h3 className="text-sm font-medium text-gray-700 mb-3">Select Columns</h3>
                              <div className="space-y-2">
                                {selectedAdColumns.map((column) => (
                                  <label key={column.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={column.isVisible}
                                      onChange={() => {
                                        setSelectedAdColumns(
                                          selectedAdColumns.map((col) =>
                                            col.id === column.id
                                              ? { ...col, isVisible: !col.isVisible }
                                              : col
                                          )
                                        );
                                      }}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{column.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <button className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700">
                      View All <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        {selectedAdColumns
                          .filter(column => column.isVisible)
                          .map(column => (
                            <th
                              key={column.id}
                              className={`py-3 px-4 text-sm font-medium text-gray-500 ${
                                column.format === 'currency' || column.format === 'number' || column.format === 'percentage' || column.format === 'multiplier'
                                  ? 'text-right'
                                  : 'text-left'
                              }`}
                            >
                              {column.name}
                            </th>
                          ))}
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.topAds.map((ad) => (
                        <tr key={ad.id} className="border-b last:border-b-0">
                          {selectedAdColumns
                            .filter(column => column.isVisible)
                            .map(column => (
                              <td
                                key={column.id}
                                className={`py-3 px-4 ${
                                  column.format === 'currency' || column.format === 'number' || column.format === 'percentage' || column.format === 'multiplier'
                                    ? 'text-right'
                                    : ''
                                }`}
                              >
                                {column.id === 'name' ? (
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded overflow-hidden mr-3">
                                      <img 
                                        src={ad.image || '/images/ad-placeholder.jpg'} 
                                        alt={ad.name} 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{ad.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-900">
                                    {formatAdColumnValue(ad[column.key], column.format)}
                                  </span>
                                )}
                              </td>
                            ))}
                          <td className="py-3 px-4 text-right">
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Best Landing Pages, Ad Copy, and Headlines */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              {/* Best Landing Pages */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Best Landing Pages</h2>
                  <Link href="/best-landing-pages" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                    View All
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {landingPagesData.length > 0 ? (
                    landingPagesData.slice(0, 3).map((page) => (
                      <div key={page.id} className="border rounded-lg p-4 hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="font-medium text-gray-900 truncate max-w-[300px]">{page.url}</p>
                              <ExternalLink size={14} className="ml-1 text-gray-400" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Total Ad Spend</p>
                            <p className="font-medium text-gray-900">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(page.spend)}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Conversion Rate</p>
                            <p className="font-medium text-green-600">
                              {page.conversionRate.toFixed(2)}%
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Conversions</p>
                            <p className="font-medium text-gray-900">{page.conversions}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Cost per Conv.</p>
                            <p className="font-medium text-gray-900">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(page.costPerConversion)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No landing page data available
                    </div>
                  )}
                </div>
              </div>

              {/* Best Ad Copy */}
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Best Ad Copy</h2>
                  <Link href="/best-ad-copy" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                    View All
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {adCopyData.length > 0 ? (
                    adCopyData.slice(0, 3).map((copy) => (
                      <div key={copy.id} className="border rounded-lg p-4 hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 line-clamp-2">{copy.text}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Total Ad Spend</p>
                            <p className="font-medium text-gray-900">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(copy.spend)}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">CTR</p>
                            <p className="font-medium text-green-600">
                              {(copy.ctr * 100).toFixed(2)}%
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Conversions</p>
                            <p className="font-medium text-gray-900">{copy.conversions}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Cost per Conv.</p>
                            <p className="font-medium text-gray-900">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(copy.costPerConversion)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No ad copy data available
                    </div>
                  )}
                </div>
              </div>

              {/* Best Headlines */}
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Best Headlines</h2>
                  <button className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700">
                    View All <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
                <div className="space-y-4">
                  {bestHeadlines.map((headline) => (
                    <div key={headline.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                          <Sparkles size={16} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{headline.text}</div>
                          <div className="text-xs text-gray-500">CTR: {headline.ctr}%</div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show loading state */}
      {isLoadingData && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Loading data...
        </div>
      )}

      {/* Show error state */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}