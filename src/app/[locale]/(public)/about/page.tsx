
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Building, Target, Users, ShieldCheck, Handshake, Globe, Package, Shirt, Gem, ToyBrick, Sofa, Tv, Car, Wrench } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default async function AboutPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const dictionary = await getDictionary(locale);
  
  const aboutPageDict = dictionary.aboutPage;

  const values = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: aboutPageDict.values.value1.title,
      description: aboutPageDict.values.value1.description
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: aboutPageDict.values.value2.title,
      description: aboutPageDict.values.value2.description
    },
    {
      icon: <Building className="h-8 w-8 text-primary" />,
      title: aboutPageDict.values.value3.title,
      description: aboutPageDict.values.value3.description
    }
  ];

  const advantages = [
    {
      icon: <Handshake className="h-10 w-10 text-primary" />,
      title: aboutPageDict.advantages.advantage1.title,
      description: aboutPageDict.advantages.advantage1.description,
    },
    {
        icon: <ShieldCheck className="h-10 w-10 text-primary" />,
        title: aboutPageDict.advantages.advantage2.title,
        description: aboutPageDict.advantages.advantage2.description,
    },
    {
        icon: <Globe className="h-10 w-10 text-primary" />,
        title: aboutPageDict.advantages.advantage3.title,
        description: aboutPageDict.advantages.advantage3.description,
    }
  ];
  
  const productSectors = [
    { icon: <Shirt className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.textiles },
    { icon: <Tv className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.electronics },
    { icon: <Sofa className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.furniture },
    { icon: <Gem className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.jewelry },
    { icon: <ToyBrick className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.toys },
    { icon: <Package className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.packaging },
    { icon: <Wrench className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.tools },
    { icon: <Car className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.autoParts },
    { icon: <Users className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.promotionalItems },
    { icon: <Building className="h-10 w-10 text-primary" />, name: aboutPageDict.productSectors.sectors.buildingMaterials },
  ];

  const aboutHero = PlaceHolderImages.find(p => p.id === 'about-hero');
  const carouselImages = [
    PlaceHolderImages.find(p => p.id === 'carousel-1'),
    PlaceHolderImages.find(p => p.id === 'carousel-2'),
    PlaceHolderImages.find(p => p.id === 'carousel-3'),
    PlaceHolderImages.find(p => p.id === 'carousel-4'),
    PlaceHolderImages.find(p => p.id === 'carousel-5'),
  ].filter(Boolean);

  return (
    <>
      <section className="relative w-full h-[40vh] min-h-[300px] text-primary-foreground">
        {aboutHero && (
          <Image
            src={aboutHero.imageUrl}
            alt={aboutHero.description}
            data-ai-hint={aboutHero.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  {aboutPageDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {aboutPageDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                {aboutPageDict.aboutUs.title}
              </h2>
              <div className="mt-6 prose prose-lg max-w-none text-muted-foreground">
                <p>
                  {aboutPageDict.aboutUs.p1}
                </p>
                <p>
                  {aboutPageDict.aboutUs.p2}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {values.map(value => (
                <Card key={value.title}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    {value.icon}
                    <CardTitle>{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">{value.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              {aboutPageDict.advantages.title}
            </h2>
            <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              {aboutPageDict.advantages.subtitle}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {advantages.map((advantage) => (
              <Card key={advantage.title} className="text-center p-8">
                <div className="flex justify-center mb-4">
                  {advantage.icon}
                </div>
                <CardTitle className="font-headline text-xl mb-2">{advantage.title}</CardTitle>
                <CardContent className="p-0 text-muted-foreground">
                  {advantage.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 bg-card">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {carouselImages.map((image, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <CardContent className="flex aspect-square items-center justify-center p-0">
                       {image && 
                        <div className="relative w-full h-full">
                            <Image
                                src={image.imageUrl}
                                alt={image.description}
                                data-ai-hint={image.imageHint}
                                fill
                                className="object-cover"
                            />
                        </div>
                       }
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-16"/>
          <CarouselNext className="mr-16"/>
        </Carousel>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              {aboutPageDict.productSectors.title}
            </h2>
            <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              {aboutPageDict.productSectors.subtitle}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-center">
            {productSectors.map((sector) => (
              <div key={sector.name} className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {sector.icon}
                </div>
                <h3 className="font-semibold text-muted-foreground">{sector.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
