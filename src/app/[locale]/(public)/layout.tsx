import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(params.locale);
  return (
      <div className="min-h-screen flex flex-col">
        <Header dictionary={dictionary.header} lang={params.locale} />
        <main className="flex-grow">{children}</main>
        <Footer dictionary={dictionary.footer} lang={params.locale} />
      </div>
  );
}
