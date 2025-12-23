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
  params: { lang: Locale };
}) {
  const dictionary = await getDictionary(params.lang);
  return (
    <PublicProviders>
      <div className="min-h-screen">
        <Header dictionary={dictionary.header} lang={params.lang} />
        <main>{children}</main>
        <Footer dictionary={dictionary.footer} lang={params.lang} />
      </div>
    </PublicProviders>
  );
}
