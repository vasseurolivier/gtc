import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n, Locale } from '@/i18n-config';
import { PublicProviders } from '@/components/layout/public-providers';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(params.locale);
  return (
    <PublicProviders>
        <div className="min-h-screen flex flex-col">
            <Header dictionary={dictionary.header || {}} />
            <main className="flex-grow">{children}</main>
            <Footer dictionary={dictionary.footer || {}} />
        </div>
    </PublicProviders>
  );
}
