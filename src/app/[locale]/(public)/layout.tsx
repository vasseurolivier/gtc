import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';
import { PublicProviders } from '@/components/layout/public-providers';
import { Favicon } from '@/components/layout/favicon';

export default async function PublicLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);
  return (
    <PublicProviders>
      <Favicon />
      <div className="min-h-screen">
        <Header dictionary={dictionary.header} />
        <main>{children}</main>
        <Footer dictionary={dictionary.footer} />
      </div>
    </PublicProviders>
  );
}
