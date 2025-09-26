
"use client";
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { HeroContactForm } from '@/components/forms/hero-contact-form';

export function HeroSection({ dictionary }: { dictionary: any }) {
  const companyInfoContext = useContext(CompanyInfoContext);
  const heroVideo = companyInfoContext?.companyInfo?.heroVideo;

  // Key to force re-render of video element when src changes
  const [videoKey, setVideoKey] = useState(Date.now());

  useEffect(() => {
    setVideoKey(Date.now());
  }, [heroVideo]);

  return (
    <section className="relative w-full h-screen text-primary-foreground overflow-hidden -mt-16">
      {heroVideo && (
        <video
          key={videoKey}
          autoPlay
          loop
          muted
          playsInline
          className="absolute z-0 w-auto min-w-full min-h-full max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-cover"
        >
          <source src={heroVideo} />
          Your browser does not support the video tag.
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
      <div className="relative h-full flex items-center container p-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
                <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-shadow-lg text-white">
                    {dictionary.heroSection.title}
                </h1>
                <div className="mt-6 max-w-2xl text-lg md:text-xl text-neutral-200">
                    {dictionary.heroSection.subtitle}
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-start">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                    <Link href="/contact">
                        {dictionary.heroSection.ctaButton}
                        <ArrowRight className="ml-2" />
                    </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                    <Link href="/services">
                        {dictionary.heroSection.servicesButton}
                    </Link>
                </Button>
                </div>
            </div>
             <div className="hidden md:block">
              <HeroContactForm dictionary={dictionary.contactSection} />
            </div>
        </div>
      </div>
    </section>
  );
}
