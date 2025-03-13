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
import { performanceData, platformData, topAds, landingPages, adCopy, headlines } from '../lib/mockData';
import SideNav from './SideNav';
import ConnectAccountDropdown from './ConnectAccountDropdown';
import { useAccounts } from '../context/AccountsContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useDashboardState } from '../hooks/useDashboardState';
import { Switch } from '@headlessui/react';

// Define platform types
interface Platform {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  accountId: string;
  accountName: string;
}

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
  { id: 'ctr', name: 'Click-Through Rate', format: 'percentage', value: 3.2, change: 0.8, changeType: 'increase' },
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
        maximumFractionDigits: 0,
      }).format(value);
    case 'multiplier':
      return `${value.toFixed(1)}x`;
    default:
      return value.toLocaleString();
  }
};

const colors = ['#4267B2', '#DB4437', '#000000', '#E4405F'];

const dateRangePresets = [
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

  // Initialize state for data and navigation
  const [performance] = useState(performanceData);
  const [platforms] = useState<PlatformData[]>(platformData);
  const [topPerformingAds] = useState(topAds);
  const [bestLandingPages] = useState(landingPages);
  const [bestAdCopy] = useState(adCopy);
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

  const filteredData = {
    platforms: selectedPlatformId
      ? filteredPlatforms.filter(p => p.id === selectedPlatformId)
      : filteredPlatforms,
    performance: selectedPlatformId
      ? performance.filter(p => p.platform === selectedPlatform?.name.toLowerCase())
      : performance,
    topAds: savedPlatform
      ? topPerformingAds.filter(ad => ad.platform.toLowerCase() === savedPlatform)
      : topPerformingAds
  };

  // Update the chartData useMemo to include comparison data
  const chartData = useMemo(() => {
    const currentData = selectedPlatformId
      ? [{
          id: selectedPlatformId,
          name: filteredPlatforms.find(p => p.id === selectedPlatformId)?.name || '',
          value: filteredData.performance
            .filter(p => p.platform === filteredPlatforms.find(fp => fp.id === selectedPlatformId)?.name.toLowerCase())
            .reduce((sum, p) => {
              const value = p[distributionMetric as keyof typeof p];
              return sum + (typeof value === 'number' ? value : 0);
            }, 0),
        }]
      : filteredPlatforms.map(platform => ({
          id: platform.id,
          name: platform.name,
          value: filteredData.performance
            .filter(p => p.platform === platform.name.toLowerCase())
            .reduce((sum, p) => {
              const value = p[distributionMetric as keyof typeof p];
              return sum + (typeof value === 'number' ? value : 0);
            }, 0),
        }));

    if (!comparison.isEnabled) {
      return currentData;
    }

    // Add comparison data
    return currentData.map(item => ({
      ...item,
      previousValue: item.value * (0.8 + Math.random() * 0.4), // Simulated previous period data
    }));
  }, [selectedPlatformId, filteredPlatforms, filteredData.performance, distributionMetric, comparison.isEnabled]);

  // Handle drag end for metric reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderMetrics(result.source.index, result.destination.index);
  };

  // Format value based on metric type
  const formatMetricValue = (metric: Metric) => {
    switch (metric.format) {
      case 'currency':
        return `$${metric.value.toLocaleString()}`;
      case 'number':
        return metric.value.toLocaleString();
      case 'percentage':
        return `${metric.value}%`;
      case 'multiplier':
        return `${metric.value}x`;
      default:
        return metric.value;
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
        return `$${value.toLocaleString()}`;
      case 'number':
        return value.toLocaleString();
      case 'percentage':
        return `${value}%`;
      case 'multiplier':
        return `${value}x`;
      default:
        return value;
    }
  };

  const getPresetRange = (preset: { start: number | string, end: number }) => {
    const end = new Date();
    let start = new Date();
    
    if (typeof preset.start === 'number') {
      start.setDate(end.getDate() + preset.start);
    } else if (preset.start === 'year') {
      start = new Date(end.getFullYear(), 0, 1);
    }
    
    return { start, end };
  };

  // Add effect to update metrics when comparison is toggled
  useEffect(() => {
    const updatedMetrics = updateMetricsWithComparison(availableMetrics, comparison.isEnabled);
    updateMetrics(updatedMetrics.map(m => m.id));
  }, [comparison.isEnabled]);

  // Add state for metrics data
  const [metricsData, setMetricsData] = useState<Metric[]>(availableMetrics);

  // Early return if data is not available
  if (!platforms || !performance) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b">
          <h1 className="text-2xl font-bold ml-12 lg:ml-0">Dashboard Overview</h1>
          <div className="flex items-center space-x-6">
            <ConnectAccountDropdown />
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
                  <LineChart data={filteredData.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {!savedPlatform ? (
                      <>
                        <Line type="monotone" dataKey="facebook" stroke="#4267B2" strokeWidth={2} />
                        <Line type="monotone" dataKey="google" stroke="#DB4437" strokeWidth={2} />
                        <Line type="monotone" dataKey="tiktok" stroke="#000000" strokeWidth={2} />
                      </>
                    ) : (
                      <Line
                        type="monotone"
                        dataKey={savedPlatform}
                        stroke={
                          savedPlatform === 'facebook' ? '#4267B2' :
                          savedPlatform === 'google' ? '#DB4437' :
                          '#000000'
                        }
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
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
          
          {/* Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Top Performing Ads</h2>
                <div className="flex items-center space-x-2">
                  <button className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors flex items-center">
                    <Sparkles size={14} className="mr-1.5" />
                    Analyze with AI
                  </button>
                  <button className="text-xs text-blue-600 flex items-center">
                    View All <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredData.topAds.map((ad) => (
                  <div key={ad.id} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-800">{ad.name}</div>
                      <div className="text-sm text-gray-500">{ad.platform}</div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">CTR: {ad.ctr}%</span>
                      <span className="text-gray-500">Conv: {ad.conversions}</span>
                      <span className="text-green-600">ROI: {ad.roi}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Best Landing Pages</h2>
                <div className="flex items-center space-x-2">
                  <button className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors flex items-center">
                    <Sparkles size={14} className="mr-1.5" />
                    Analyze with AI
                  </button>
                  <button className="text-xs text-blue-600 flex items-center">
                    View All <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {bestLandingPages.map((page) => (
                  <div key={page.id} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-800 flex items-center">
                        {page.url}
                        <ExternalLink size={14} className="ml-1 text-gray-400" />
                      </div>
                      <div className="text-green-600">{page.convRate}%</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {page.visitors.toLocaleString()} visitors
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Best Ad Copy</h2>
                <div className="flex items-center space-x-2">
                  <button className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors flex items-center">
                    <Sparkles size={14} className="mr-1.5" />
                    Analyze with AI
                  </button>
                  <button className="text-xs text-blue-600 flex items-center">
                    View All <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {bestAdCopy.map((copy) => (
                  <div key={copy.id} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center mb-1">
                      <div className="flex-1 font-medium text-gray-800">"{copy.text}"</div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">CTR: {copy.ctr}%</span>
                      <span className="text-gray-500">Engagement: {copy.eng}%</span>
                      <button className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                        Use Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Best Performing Headlines</h2>
                <div className="flex items-center space-x-2">
                  <button className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors flex items-center">
                    <Sparkles size={14} className="mr-1.5" />
                    Analyze with AI
                  </button>
                  <button className="text-xs text-blue-600 flex items-center">
                    View All <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {bestHeadlines.map((headline) => (
                  <div key={headline.id} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center mb-1">
                      <div className="flex-1 font-medium text-gray-800">"{headline.text}"</div>
                      <div className="ml-2 font-medium text-green-600">{headline.ctr}% CTR</div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                        Use Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 