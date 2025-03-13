'use client';

import React, { createContext, useContext, useState } from 'react';

interface Platform {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  accountId: string;
  accountName: string;
}

interface AccountsContextType {
  platforms: Platform[];
  connectPlatform: (platform: Platform) => void;
  disconnectPlatform: (platformId: string) => void;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'facebook',
      name: 'Facebook',
      status: 'connected',
      accountId: 'fb-123',
      accountName: 'Facebook Main'
    },
    {
      id: 'google',
      name: 'Google',
      status: 'connected',
      accountId: 'g-456',
      accountName: 'Google Ads Primary'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      status: 'connected',
      accountId: 'tt-789',
      accountName: 'TikTok Business'
    }
  ]);

  const connectPlatform = (platform: Platform) => {
    setPlatforms(prev => [...prev, platform]);
  };

  const disconnectPlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, status: 'disconnected' as const } : p
    ));
  };

  return (
    <AccountsContext.Provider value={{ platforms, connectPlatform, disconnectPlatform }}>
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