
"use client";
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';

export function HeroSection({ dictionary }: { dictionary: any }) {
  const companyInfoContext = useContext(CompanyInfoContext);
  const heroVideo = companyInfoContext?.companyInfo?.heroVideo || 'hero-video.mp4';

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] md:h-[calc(100vh-4rem)] md:min-h-[600px] text-primary-foreground overflow-hidden">
      <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute z-0 w-auto min-w-full min-h-full max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-cover"
          // Use a key to force re-render when the video source changes
          key={heroVideo}
        >
          <source src={`/videos/${heroVideo}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
      <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
        <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-shadow-lg text-white whitespace-nowrap">
                {dictionary.title}
            </h1>
            <div className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">
                {dictionary.subtitle}
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/contact">
                    {dictionary.ctaButton}
                    <ArrowRight className="ml-2" />
                </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
                <Link href="/services">
                    {dictionary.servicesButton}
                </Link>
            </Button>
            </div>
        </div>
      </div>
    </section>
  );
}
