
import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/app-providers';
import Script from 'next/script';
import { CompanyInfoProvider } from '@/context/company-info-context';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Global Trading China',
  description: 'Global Trading, Sourcing, and E-commerce Solutions from China',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
          {/* Google tag (gtag.js) */}
          <Script async src="https://www.googletagmanager.com/gtag/js?id=G-WSMMTQ99HW"></Script>
          <Script id="google-analytics">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-WSMMTQ99HW');
            `}
          </Script>
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <AppProviders>
          <CompanyInfoProvider>
            {children}
          </CompanyInfoProvider>
        </AppProviders>
      </body>
    </html>
  );
}
