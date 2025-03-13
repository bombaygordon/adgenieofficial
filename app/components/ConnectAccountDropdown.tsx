'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAccounts } from '../context/AccountsContext';
import type { Platform } from '../context/AccountsContext';

export default function ConnectAccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { platforms } = useAccounts();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border rounded-lg px-4 py-2 flex items-center space-x-2 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium">Connect Platform</span>
        <ChevronDown size={16} className={`text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-4">
              <h3 className="font-medium text-gray-900">Available Platforms</h3>
              <p className="text-sm text-gray-500 mt-1">Connect your ad accounts to start tracking performance</p>
            </div>

            <div className="border-t">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <platform.icon size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{platform.name}</p>
                      <p className="text-sm text-gray-500">{platform.accountName}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        platform.status === 'connected'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {platform.status === 'connected' ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 