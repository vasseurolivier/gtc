
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, PackageSearch, ShoppingCart, Wrench } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale, i18n } from '@/i18n-config';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const servicesPageDict = dictionary.servicesPage;
  const heroImage = PlaceHolderImages.find(p => p.id === 'services-hero');

  const localePrefixed = (path: string) => `/${locale}${path}`;

  const services = [
    {
      icon: <PackageSearch className="h-10 w-10 text-primary" />,
      title: servicesPageDict.services.sourcing.title,
      shortDescription: servicesPageDict.services.sourcing.shortDescription,
      link: "/services/sourcing",
      details: servicesPageDict.services.sourcing.details
    },
    {
      icon: <ArrowLeftRight className="h-10 w-10 text-primary" />,
      title: servicesPageDict.services.trading.title,
      shortDescription: servicesPageDict.services.trading.shortDescription,
      link: "/services/trading-logistics",
      details: servicesPageDict.services.trading.details
    },
    {
      icon: <ShoppingCart className="h-10 w-10 text-primary" />,
      title: servicesPageDict.services.ecommerce.title,
      shortDescription: servicesPageDict.services.ecommerce.shortDescription,
      link: "/services/ecommerce-solutions",
      details: servicesPageDict.services.ecommerce.details
    },
    {
      icon: <Wrench className="h-10 w-10 text-primary" />,
      title: servicesPageDict.services.custom.title,
      shortDescription: servicesPageDict.services.custom.shortDescription,
      link: "/services/custom-services",
      details: servicesPageDict.services.custom.details
    }
  ];

  return (
    <>
      <section className="relative w-full h-[60vh] text-primary-foreground pt-16 md:pt-0">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  {servicesPageDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {servicesPageDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <div className="container py-16 md:py-24">
        <div className="space-y-12">
          {services.map((service) => (
            <Card key={service.title} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="grid md:grid-cols-12">
                <div className="md:col-span-4 p-8 bg-secondary/30 flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                      {service.icon}
                      <CardTitle className="font-headline text-2xl">
                        {service.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-4 text-base">
                      {service.shortDescription}
                    </CardDescription>
                    <Button asChild className="mt-6 w-fit">
                      <Link href={localePrefixed(service.link)}>
                        {servicesPageDict.learnMore}
                        <ChevronRight className="ml-2 h-4 w-4"/>
                      </Link>
                    </Button>
                </div>
                <div className="md:col-span-8 p-8">
                  <Accordion type="single" collapsible className="w-full">
                    {service.details.map((detail, i) => (
                      <AccordionItem value={`item-${service.title}-${i}`} key={i}>
                        <AccordionTrigger className="font-semibold hover:no-underline text-left">
                          {detail.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {detail.description}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

    
