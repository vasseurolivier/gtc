
"use client";
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { HeroContactForm } from '@/components/forms/hero-contact-form';
import { usePathname } from 'next/navigation';
import { i18n } from '@/i18n-config';


export function HeroSection({ dictionary }: { dictionary: any }) {
  const companyInfoContext = useContext(CompanyInfoContext);
  const heroVideo = companyInfoContext?.companyInfo?.heroVideo;
  const pathname = usePathname();

  // Key to force re-render of video element when src changes
  const [videoKey, setVideoKey] = useState(Date.now());

  useEffect(() => {
    setVideoKey(Date.now());
  }, [heroVideo]);
  
  const getCurrentLocale = () => {
    if (!pathname) return i18n.defaultLocale;
    const segments = pathname.split('/');
    if (segments.length > 1 && i18n.locales.includes(segments[1] as any)) {
      return segments[1];
    }
    return i18n.defaultLocale;
  }
  const locale = getCurrentLocale();

  const localePrefixed = (path: string) => `/${locale}${path}`;

  return (
    <section className="relative w-full h-screen text-primary-foreground overflow-hidden md:-mt-16">
      {heroVideo && (
        <video
          key={videoKey}
          autoPlay
          loop
          muted
          playsInline
          className="absolute z-0 w-auto min-w-full min-h-full max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
      <div className="relative h-full flex flex-col md:flex-row items-center justify-center container p-4 pt-20 md:pt-4">
        <div className="flex-1 w-full max-w-xl text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-shadow-lg text-white">
                {dictionary.heroSection.title}
            </h1>
            <div className="mt-6 max-w-2xl mx-auto md:mx-0 text-lg md:text-xl text-neutral-200">
                {dictionary.heroSection.subtitle}
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href={localePrefixed("/contact")}>
                    {dictionary.heroSection.ctaButton}
                    <ArrowRight className="ml-2" />
                </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
                <Link href={localePrefixed("/services")}>
                    {dictionary.heroSection.servicesButton}
                </Link>
            </Button>
            </div>
        </div>
         <div className="flex-1 w-full max-w-md mx-auto mt-10 md:mt-0">
          <HeroContactForm dictionary={dictionary.contactSection} />
        </div>
      </div>
    </section>
  );
}
