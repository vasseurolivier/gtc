import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/app-providers';
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
}: Readonly<{
  children: React.ReactNode;
  params: { locale: Locale };
}>) {
  return (
    <html lang={params.locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
