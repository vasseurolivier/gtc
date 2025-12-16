
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
  params: { locale: Locale };
}) {
  const validLocale = params.locale === 'fr' || params.locale === 'en' ? params.locale : 'fr';
  const dictionary = await getDictionary(validLocale);

  return (
    <PublicProviders>
      <div className="min-h-screen">
        <Header dictionary={dictionary.header || {}} />
        <main>{children}</main>
        <Footer dictionary={dictionary.footer || {}} />
      </div>
    </PublicProviders>
  );
}
