import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';
import { PublicProviders } from '@/components/layout/public-providers';

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
      <div className="flex min-h-screen flex-col">
        <Header dictionary={dictionary.header} />
        <main className="flex-grow">{children}</main>
        <Footer dictionary={dictionary.footer} />
      </div>
    </PublicProviders>
  );
}
