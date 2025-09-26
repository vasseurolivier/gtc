
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Building, Wifi, Package } from 'lucide-react';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function TradeCitiesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const tradeCitiesDict = dictionary.tradeCitiesPage;

  const cities = [
    {
      id: "guangzhou",
      name: tradeCitiesDict.cities.guangzhou.name,
      subtitle: tradeCitiesDict.cities.guangzhou.subtitle,
      description: tradeCitiesDict.cities.guangzhou.description,
      imageUrlId: "guangzhou-city",
      specialties: tradeCitiesDict.cities.guangzhou.specialties,
      icon: <Building className="h-8 w-8 text-primary" />,
    },
    {
      id: "shenzhen",
      name: tradeCitiesDict.cities.shenzhen.name,
      subtitle: tradeCitiesDict.cities.shenzhen.subtitle,
      description: tradeCitiesDict.cities.shenzhen.description,
      imageUrlId: "shenzhen-city",
      specialties: tradeCitiesDict.cities.shenzhen.specialties,
      icon: <Wifi className="h-8 w-8 text-primary" />,
    },
    {
      id: "yiwu",
      name: tradeCitiesDict.cities.yiwu.name,
      subtitle: tradeCitiesDict.cities.yiwu.subtitle,
      description: tradeCitiesDict.cities.yiwu.description,
      imageUrlId: "yiwu-city",
      specialties: tradeCitiesDict.cities.yiwu.specialties,
      icon: <Package className="h-8 w-8 text-primary" />,
    },
  ];

  const heroImage = PlaceHolderImages.find(p => p.id === 'trade-cities-hero');

  return (
    <>
      <section className="relative w-full h-[60vh] text-primary-foreground -mt-16">
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
                  {tradeCitiesDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {tradeCitiesDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container space-y-20">
          {cities.map((city, index) => {
            const image = PlaceHolderImages.find(p => p.id === city.imageUrlId);
            const isOdd = index % 2 !== 0;

            return (
              <div key={city.id} className="grid md:grid-cols-2 gap-12 items-center">
                <div className={`relative h-96 rounded-xl overflow-hidden shadow-lg ${isOdd ? 'md:order-last' : ''}`}>
                    {image && <Image src={image.imageUrl} alt={city.name} data-ai-hint={image.imageHint ?? ''} fill className="object-cover"/>}
                </div>
                <div>
                  <div className="flex items-center gap-4">
                    {city.icon}
                    <h2 className="text-3xl font-headline font-bold text-primary">
                        {city.name}
                    </h2>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-muted-foreground">
                    {city.subtitle}
                  </div>
                  <div className="mt-4 text-muted-foreground leading-relaxed">
                    {city.description}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {city.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

    