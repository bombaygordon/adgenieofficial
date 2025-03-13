'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAccounts } from '../context/AccountsContext';

export default function ConnectAccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { platforms, connectPlatform, disconnectPlatform } = useAccounts();
  const connectedCount = platforms.filter(p => p.status === 'connected').length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border rounded-lg text-sm flex items-center space-x-2 bg-white hover:bg-gray-50 transition-colors"
      >
        <span>
          {connectedCount > 0 
            ? `${connectedCount} Account${connectedCount > 1 ? 's' : ''} Connected`
            : 'Connect Accounts'
          }
        </span>
        <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-4 border-b">
              <h3 className="font-medium text-gray-900">Connected Accounts</h3>
              <p className="text-sm text-gray-500">Manage your ad platform connections</p>
            </div>

            <div className="p-2">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <platform.icon size={18} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{platform.name}</p>
                        {platform.status === 'connected' && platform.accountName && (
                          <p className="text-sm text-gray-500">{platform.accountName}</p>
                        )}
                      </div>
                    </div>
                    {platform.status === 'connected' ? (
                      <button
                        onClick={() => {
                          disconnectPlatform(platform.id);
                          setIsOpen(false);
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          connectPlatform(platform.id);
                          setIsOpen(false);
                        }}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-500 text-center">
                Connect your ad accounts to sync performance data
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 