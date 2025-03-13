'use client';

import React, { createContext, useContext, useState } from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

export interface Platform {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  accountId: string;
  accountName: string;
  icon: React.ElementType;
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
      id: 'facebook1',
      name: 'Facebook',
      status: 'connected',
      accountId: 'fb123',
      accountName: 'Main Facebook Account',
      icon: Facebook
    },
    {
      id: 'instagram1',
      name: 'Instagram',
      status: 'connected',
      accountId: 'ig123',
      accountName: 'Business Instagram',
      icon: Instagram
    },
    {
      id: 'youtube1',
      name: 'YouTube',
      status: 'disconnected',
      accountId: 'yt123',
      accountName: 'Brand Channel',
      icon: Youtube
    }
  ]);

  const connectPlatform = (platform: Platform) => {
    setPlatforms(prev => [...prev, platform]);
  };

  const disconnectPlatform = (platformId: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== platformId));
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