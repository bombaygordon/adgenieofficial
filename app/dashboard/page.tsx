'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccounts } from '../context/AccountsContext';

const DashboardContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'auth_failed') {
      // Show error message to user
      alert('Failed to connect to Meta. Please try again.');
    }
  }, [error]);

  return (
    <>
      {error === 'auth_failed' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          Failed to connect to Meta. Please try again.
        </div>
      )}
      <div className="grid gap-6">
        {/* Dashboard content will go here */}
      </div>
    </>
  );
};

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Suspense fallback={null}>
        <DashboardContent />
      </Suspense>
    </div>
  );
} 