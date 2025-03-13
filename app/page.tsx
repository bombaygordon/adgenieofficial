'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const DashboardComponent = dynamic(() => import('./components/Dashboard'), {
  ssr: false
});

export default function Home() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const connected = searchParams.get('connected');

  useEffect(() => {
    if (error === 'auth_failed') {
      alert('Failed to connect to Meta. Please try again.');
    }
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">AdGenie Dashboard</h1>
      <div className="grid gap-4">
        <Link 
          href="/data-sources"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Data Sources
        </Link>
      </div>
      {error === 'auth_failed' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Failed to connect to Meta. Please try again.
        </div>
      )}

      {connected === 'meta' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Successfully connected to Meta Ads!
        </div>
      )}

      <Suspense fallback={<div>Loading...</div>}>
        <DashboardComponent />
      </Suspense>
    </main>
  );
} 