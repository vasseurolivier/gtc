import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/app-providers';

export const metadata: Metadata = {
  title: {
    template: '%s | Global Trading China',
    default: 'Global Trading China - Sourcing & Trading in China',
  },
  description: 'Your expert partner for sourcing, trading, and e-commerce solutions from China. We simplify your supply chain.',
  metadataBase: new URL('https://www.globaltradingchina.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      {children}
    </AppProviders>
  );
}
