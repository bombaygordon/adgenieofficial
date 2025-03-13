import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const DashboardComponent = dynamic(() => import('./components/Dashboard'), {
  ssr: false
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardComponent />
      </Suspense>
    </main>
  );
} 