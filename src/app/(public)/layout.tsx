
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { defaultLocale } from '@/i18n-config';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dictionary = getDictionary(defaultLocale);
  return (
      <div className="min-h-screen flex flex-col">
        <Header dictionary={dictionary.header} lang={defaultLocale} />
        <main className="flex-grow">{children}</main>
        <Footer dictionary={dictionary.footer} lang={defaultLocale} />
      </div>
  );
}
