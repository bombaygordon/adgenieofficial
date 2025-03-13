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
}

interface AccountsContextType {
  platforms: Platform[];
  connectPlatform: (platform: Platform) => void;
  disconnectPlatform: (platformId: string) => void;
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