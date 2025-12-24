
import type { Metadata } from 'next';
import '../globals.css';
import { AppProviders } from '@/components/app-providers';
import { PublicProviders } from '@/components/layout/public-providers';
import Script from 'next/script';
import { i18n, type Locale } from '@/i18n-config';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Global Trading China',
  description: 'Global Trading, Sourcing, and E-commerce Solutions from China',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale} suppressHydrationWarning>
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
          <PublicProviders>
            {children}
          </PublicProviders>
        </AppProviders>
      </body>
    </html>
  );
}
