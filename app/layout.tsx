import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AccountsProvider } from './context/AccountsContext';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AdGenie',
  description: 'AI-powered ad optimization platform',
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
        <Script id="clean-fb-hash" strategy="afterInteractive">
          {`
            if (window.location.hash === '#_=_') {
              if (window.history.replaceState) {
                window.history.replaceState(null, null, window.location.href.split('#')[0]);
              } else {
                window.location.hash = '';
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
} 