'use client';

import React, { createContext, useContext, useState } from 'react';
import { Facebook } from 'lucide-react';
import Image from 'next/image';

export interface Platform {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  accountId: string;
  accountName: string;
  icon: React.ElementType;
  description: string;
  accessToken?: string;
}

interface AccountsContextType {
  platforms: Platform[];
  connectPlatform: (platform: Platform) => void;
  disconnectPlatform: (platformId: string) => void;
  updatePlatformToken: (platformId: string, accessToken: string, accountId: string, accountName: string) => void;
  getPlatformToken: (platformId: string) => string | undefined;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const connectPlatform = (platform: Platform) => {
    setPlatforms(prev => [...prev, { ...platform, status: 'connected' }]);
  };

  const disconnectPlatform = (platformId: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== platformId));
  };

  const updatePlatformToken = (platformId: string, accessToken: string, accountId: string, accountName: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { ...p, accessToken, accountId, accountName, status: 'connected' }
        : p
    ));
  };

  const getPlatformToken = (platformId: string) => {
    return platforms.find(p => p.id === platformId)?.accessToken;
  };

  return (
    <AccountsContext.Provider value={{ 
      platforms, 
      connectPlatform, 
      disconnectPlatform,
      updatePlatformToken,
      getPlatformToken
    }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
} 