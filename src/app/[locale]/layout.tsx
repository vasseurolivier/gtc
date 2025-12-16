import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n, Locale } from '@/i18n-config';

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
    <div className="min-h-screen flex flex-col">
      <Header dictionary={dictionary.header || {}} />
      <main className="flex-grow">{children}</main>
      <Footer dictionary={dictionary.footer || {}} />
    </div>
  );
}
