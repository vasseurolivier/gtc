import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { AboutSection } from '@/components/sections/about-section';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function Home({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = await getDictionary(lang);
  return (
    <>
      <HeroSection dictionary={dictionary} lang={lang} />
      <ServicesSection dictionary={dictionary.servicesSection} />
      <AboutSection dictionary={dictionary.aboutSection} lang={lang} />
      <ProcessSection dictionary={dictionary.processSection} />
    </>
  );
}
