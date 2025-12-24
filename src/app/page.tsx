import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { AboutSection } from '@/components/sections/about-section';
import { getDictionary } from '@/lib/get-dictionary';
import { defaultLocale } from '@/i18n-config';

export default function Home() {
  const dictionary = getDictionary(defaultLocale);
  return (
    <>
      <HeroSection dictionary={dictionary} lang={defaultLocale} />
      <ServicesSection dictionary={dictionary.servicesSection} />
      <AboutSection dictionary={dictionary.aboutSection} lang={defaultLocale} />
      <ProcessSection dictionary={dictionary.processSection} />
    </>
  );
}
