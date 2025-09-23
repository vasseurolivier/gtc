
import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { AboutSection } from '@/components/sections/about-section';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  return (
    <>
      <HeroSection dictionary={dictionary.heroSection} />
      <ServicesSection dictionary={dictionary.servicesSection} />
      <AboutSection dictionary={dictionary.aboutSection} />
      <ProcessSection dictionary={dictionary.processSection} />
    </>
  );
}

    