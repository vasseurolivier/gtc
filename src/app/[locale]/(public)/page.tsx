
import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { AboutSection } from '@/components/sections/about-section';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function Home({ params: paramsPromise }: HomePageProps) {
  const { locale } = await paramsPromise;
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
