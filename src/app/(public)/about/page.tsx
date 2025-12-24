
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Building, Target, Users, ShieldCheck, Handshake, Globe, Package, Shirt, Gem, ToyBrick, Sofa, Tv, Car, Wrench } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function AboutPage() {
  const aboutPageDict = {
    hero: {
      title: "Notre Mission : Simplifier et Sécuriser vos Achats en Chine",
      subtitle: "Nous sommes votre partenaire de sourcing dédié, transformant les opportunités du marché chinois en succès pour votre entreprise."
    },
    aboutUs: {
      title: "Qui Sommes-Nous ?",
      p1: "Global Trading China est née de la conviction que l'accès au vaste et complexe marché chinois devrait être simple et sécurisé pour toute entreprise. Fondée par des experts du commerce international avec des années d'expérience sur le terrain, notre société sert de pont entre les ambitions des entrepreneurs mondiaux et l'incroyable potentiel de production de la Chine.",
      p2: "Nous ne sommes pas de simples intermédiaires. Nous sommes une extension de votre équipe, votre agent de sourcing en Chine. Notre mission est de défendre vos intérêts, de garantir la qualité de vos produits grâce à des audits et des contrôles rigoureux, et d'optimiser votre chaîne d'approvisionnement pour une croissance durable."
    },
    values: {
      value1: { title: "Partenariat", description: "Nous construisons des relations à long terme basées sur la confiance et la transparence pour tous vos projets d'import." },
      value2: { title: "Rigueur", description: "Chaque étape, du sourcing au contrôle qualité, est menée avec la plus grande exigence pour garantir votre satisfaction." },
      value3: { title: "Expertise Locale", description: "Notre présence en Chine est votre meilleur atout pour naviguer le marché, trouver les bons fournisseurs et négocier efficacement." }
    },
    advantages: {
      title: "Pourquoi Travailler Avec un Agent de Sourcing ?",
      subtitle: "Découvrez les avantages clés qui font de nous votre partenaire idéal pour vos achats en Chine.",
      advantage1: { title: "Interlocuteur Unique", description: "Simplifiez vos opérations d'import. Nous centralisons la communication et gérons pour vous l'ensemble des acteurs, des fournisseurs aux transporteurs." },
      advantage2: { title: "Sécurisation des Risques", description: "Nous protégeons vos investissements grâce à des contrôles qualité AQL, des audits d'usines et une gestion sécurisée des paiements." },
      advantage3: { title: "Présence sur le Terrain", description: "Notre équipe en Chine lève la barrière de la langue, comprend la culture locale et réagit en temps réel à tout imprévu de production." }
    },
    productSectors: {
      title: "Nos Secteurs de Sourcing",
      subtitle: "Notre expertise en approvisionnement couvre un large éventail d'industries, nous permettant de répondre à des besoins variés et spécifiques.",
      sectors: {
        textiles: "Textile & Habillement",
        electronics: "Électronique",
        furniture: "Mobilier & Décoration",
        jewelry: "Bijoux & Accessoires",
        toys: "Jouets & Jeux",
        packaging: "Packaging",
        tools: "Outillage & Quincaillerie",
        autoParts: "Pièces Automobiles",
        promotionalItems: "Objets Publicitaires",
        buildingMaterials: "Matériaux de Construction"
      }
    }
  };

  const values = [
    { icon: <Users className="h-8 w-8 text-primary" />, title: aboutPageDict.values.value1.title, description: aboutPageDict.values.value1.description },
    { icon: <Target className="h-8 w-8 text-primary" />, title: aboutPageDict.values.value2.title, description: aboutPageDict.values.value2.description },
    { icon: <Building className="h-8 w-8 text-primary" />, title: aboutPageDict.values.value3.title, description: aboutPageDict.values.value3.description }
  ];

  const advantages = [
    { icon: <Handshake className="h-10 w-10 text-primary" />, title: aboutPageDict.advantages.advantage1.title, description: aboutPageDict.advantages.advantage1.description },
    { icon: <ShieldCheck className="h-10 w-10 text-primary" />, title: aboutPageDict.advantages.advantage2.title, description: aboutPageDict.advantages.advantage2.description },
    { icon: <Globe className="h-10 w-10 text-primary" />, title: aboutPageDict.advantages.advantage3.title, description: aboutPageDict.advantages.advantage3.description }
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
      <section className="relative w-full h-[60vh] text-primary-foreground pt-16 md:pt-0 md:-mt-16">
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
