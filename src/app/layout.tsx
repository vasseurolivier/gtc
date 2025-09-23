import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/app-providers';
import { i18n, type Locale } from '@/i18n-config';

export const metadata: Metadata = {
  title: 'Global Trading China',
  description: 'Global Trading, Sourcing, and E-commerce Solutions from China',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <title>Admin Dashboard</title>
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
