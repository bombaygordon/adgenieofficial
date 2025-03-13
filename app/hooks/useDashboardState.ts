import { useState, useEffect } from 'react';

interface DashboardState {
  selectedMetrics: string[];
  selectedPlatform: string | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const defaultState: DashboardState = {
  selectedMetrics: ['adSpend', 'conversions', 'cpc', 'roas'],
  selectedPlatform: null,
  dateRange: {
    startDate: '2024-06-01',
    endDate: '2024-08-31'
  }
};

export function useDashboardState() {
  const [state, setState] = useState<DashboardState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('dashboardState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
      } catch (error) {
        console.error('Error parsing dashboard state:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('dashboardState', JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const updateMetrics = (metrics: string[]) => {
    setState(prev => ({ ...prev, selectedMetrics: metrics }));
  };

  const updatePlatform = (platform: string | null) => {
    setState(prev => ({ ...prev, selectedPlatform: platform }));
  };

  const updateDateRange = (startDate: string, endDate: string) => {
    setState(prev => ({
      ...prev,
      dateRange: { startDate, endDate }
    }));
  };

  const reorderMetrics = (startIndex: number, endIndex: number) => {
    const newMetrics = [...state.selectedMetrics];
    const [removed] = newMetrics.splice(startIndex, 1);
    newMetrics.splice(endIndex, 0, removed);
    setState(prev => ({ ...prev, selectedMetrics: newMetrics }));
  };

  return {
    ...state,
    updateMetrics,
    updatePlatform,
    updateDateRange,
    reorderMetrics
  };
} 