'use client';

import dynamic from 'next/dynamic';

const DataSources = dynamic(() => import('../components/DataSources'), {
  ssr: false
});

export default function DataSourcesPage() {
  return <DataSources />;
} 