'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  MessageSquare, 
  Type, 
  ExternalLink, 
  Settings,
  Menu
} from 'lucide-react';

export default function SideNav({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Top Ads', href: '/top-ads', icon: TrendingUp },
    { name: 'Best Copy', href: '/best-copy', icon: MessageSquare },
    { name: 'Best Headlines', href: '/best-headlines', icon: Type },
    { name: 'Best Landing Pages', href: '/best-landing-pages', icon: ExternalLink },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile nav toggle */}
      <button 
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <Menu className="text-gray-700" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Side Navigation */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen 
        bg-white border-r border-gray-200
        transition-transform duration-200 ease-in-out
        w-64 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">AdGenie</h1>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
} 