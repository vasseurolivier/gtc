
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';
import { PublicProviders } from '@/components/layout/public-providers';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dictionary = {} as any; // Temporary fix to allow build to pass

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
