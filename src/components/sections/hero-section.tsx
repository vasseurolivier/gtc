
"use client";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { HeroContactForm } from '@/components/forms/hero-contact-form';
import { usePathname } from 'next/navigation';
import { i18n } from '@/i18n-config';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function HeroSection({ dictionary }: { dictionary: any }) {
  const pathname = usePathname();
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  
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
    <section className="relative w-full h-screen text-primary-foreground overflow-hidden">
      {heroImage && (
        <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
        />
      )}
       <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
      <div className="relative h-full flex flex-col justify-center container px-0 md:px-4 pt-24 md:pt-0">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
            <div className="w-full md:w-1/2 max-w-xl text-left">
                <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-shadow-lg text-white">
                    {dictionary.heroSection.title}
                </h1>
                <div className="mt-6 max-w-2xl text-lg md:text-xl text-neutral-200">
                    {dictionary.heroSection.subtitle}
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
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
             <div className="w-full md:w-1/2 max-w-md md:ml-auto">
              <HeroContactForm dictionary={dictionary.contactSection} />
            </div>
        </div>
      </div>
    </section>
  );
}
