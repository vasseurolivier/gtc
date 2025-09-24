
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n, Locale } from '@/i18n-config';
import { CompanyInfoProvider } from '@/context/company-info-context';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function PublicLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <CompanyInfoProvider>
          <div className="flex min-h-screen flex-col">
            <Header dictionary={dictionary.header} />
            <main className="flex-grow">{children}</main>
            <Footer dictionary={dictionary.footer} />
          </div>
        </CompanyInfoProvider>
      </body>
    </html>
  );
}
