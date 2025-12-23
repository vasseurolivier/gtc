
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

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
      <div className="min-h-screen flex flex-col">
        <Header dictionary={dictionary.header} lang={locale} />
        <main className="flex-grow">{children}</main>
        <Footer dictionary={dictionary.footer} lang={locale} />
      </div>
  );
}
