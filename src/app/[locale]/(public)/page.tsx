
import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { AboutSection } from '@/components/sections/about-section';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

type Props = {
  params: { locale: Locale };
};

export default async function Home({ params: { locale } }: Props) {
  const dictionary = await getDictionary(locale);
  return (
    <>
      <HeroSection dictionary={dictionary} />
      <ServicesSection dictionary={dictionary.servicesSection} />
      <AboutSection dictionary={dictionary.aboutSection} />
      <ProcessSection dictionary={dictionary.processSection} />
    </>
  );
}

    