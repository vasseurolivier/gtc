
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';
import { PublicProviders } from '@/components/layout/public-providers';

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  return (
    <PublicProviders>
      <div className="min-h-screen">
        <Header dictionary={dictionary.header} />
        <main>{children}</main>
        <Footer dictionary={dictionary.footer} />
      </div>
    </PublicProviders>
  );
}
