import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AccountsProvider } from './context/AccountsContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AdGenie Dashboard',
  description: 'AI-powered advertising analytics dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AccountsProvider>
          {children}
        </AccountsProvider>
      </body>
    </html>
  );
} 