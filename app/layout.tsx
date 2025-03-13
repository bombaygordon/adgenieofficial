import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AccountsProvider } from './context/AccountsContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AdGenie Dashboard',
  description: 'A comprehensive dashboard for managing your ad campaigns across multiple platforms.',
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