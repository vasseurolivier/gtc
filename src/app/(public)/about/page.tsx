
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Target, 
  Users, 
  ShieldCheck, 
  Handshake, 
  Globe, 
  Package, 
  Shirt, 
  Gem, 
  ToyBrick, 
  Sofa, 
  Tv, 
  Car, 
  Wrench,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Link from 'next/link';

export default function AboutPage() {
  const aboutPageDict = {
    hero: {
      tag: "Notre ADN",
      title: "Simplifier et Sécuriser vos Achats en Chine",
      subtitle: "Nous sommes bien plus qu'un agent : nous sommes votre équipe locale, vos yeux et vos oreilles au cœur des pôles industriels chinois."
    },
    stats: [
      { label: "Années d'Expérience", value: "10+", icon: <History className="h-5 w-5" /> },
      { label: "Usines Auditées", value: "1000+", icon: <Building className="h-5 w-5" /> },
      { label: "Clients Mondiaux", value: "25+", icon: <Users className="h-5 w-5" /> },
      { label: "Conteneurs / An", value: "5000+", icon: <Package className="h-5 w-5" /> }
    ],
    mission: {
      title: "Notre Mission : Votre Croissance",
      p1: "Global Trading China est née de la conviction que l'accès au marché chinois doit être simple et sécurisé. Fondée par des experts du commerce international basés à Yiwu, notre société sert de pont entre vos ambitions et le potentiel de production de la Chine.",
      p2: "Nous ne sommes pas de simples intermédiaires. Nous sommes une extension de votre équipe. Notre mission est de défendre vos intérêts, de garantir la qualité de vos produits via des audits rigoureux, et d'optimiser votre chaîne d'approvisionnement pour une rentabilité maximale."
    },
    values: [
      { icon: <Handshake className="h-8 w-8 text-primary" />, title: "Confiance", description: "Nous construisons des partenariats à long terme basés sur une transparence totale." },
      { icon: <Target className="h-8 w-8 text-primary" />, title: "Rigueur", description: "Chaque étape du sourcing au contrôle AQL est menée avec une exigence absolue." },
      { icon: <Globe className="h-8 w-8 text-primary" />, title: "Expertise Locale", description: "Notre présence physique en Chine est votre meilleur atout pour négocier efficacement." }
    ],
    productSectors: [
      { icon: <Shirt className="h-10 w-10 text-primary" />, name: "Textile & Mode" },
      { icon: <Tv className="h-10 w-10 text-primary" />, name: "Électronique" },
      { icon: <Sofa className="h-10 w-10 text-primary" />, name: "Mobilier & Déco" },
      { icon: <Gem className="h-10 w-10 text-primary" />, name: "Bijoux & Accessoires" },
      { icon: <ToyBrick className="h-10 w-10 text-primary" />, name: "Jouets & Jeux" },
      { icon: <Package className="h-10 w-10 text-primary" />, name: "Packaging" },
      { icon: <Wrench className="h-10 w-10 text-primary" />, name: "Outillage" },
      { icon: <Car className="h-10 w-10 text-primary" />, name: "Pièces Auto" },
    ]
  };

  const aboutHero = PlaceHolderImages.find(p => p.id === 'about-hero');
  const aboutStory = PlaceHolderImages.find(p => p.id === 'about-home');
  const carouselImages = [
    PlaceHolderImages.find(p => p.id === 'carousel-1'),
    PlaceHolderImages.find(p => p.id === 'carousel-2'),
    PlaceHolderImages.find(p => p.id === 'carousel-3'),
    PlaceHolderImages.find(p => p.id === 'carousel-4'),
    PlaceHolderImages.find(p => p.id === 'carousel-5'),
  ].filter(Boolean);

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[95vh] text-white overflow-hidden pt-16 md:pt-0 md:-mt-16">
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
        <div className="absolute inset-0 bg-zinc-950/60 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-start md:justify-end items-start container px-8 md:px-16 pb-12 pt-[0.5cm] md:pt-0">
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Badge variant="secondary" className="bg-primary text-white border-none px-4 py-1 text-sm font-semibold uppercase tracking-widest">
                {aboutPageDict.hero.tag}
              </Badge>
              <h1 className="text-xl md:text-7xl font-headline font-extrabold tracking-tight text-white leading-tight">
                  {aboutPageDict.hero.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm md:text-2xl text-zinc-300 leading-relaxed font-medium">
                  {aboutPageDict.hero.subtitle}
              </p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-zinc-900 border-b border-zinc-800">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8">
          {aboutPageDict.stats.map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="text-3xl md:text-4xl font-black text-primary">{stat.value}</div>
              <div className="text-[10px] md:text-xs text-zinc-400 uppercase font-bold tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
                <Award className="h-5 w-5" /> Notre Mission
              </div>
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900 leading-tight">
                {aboutPageDict.mission.title}
              </h2>
              <div className="text-lg text-zinc-600 leading-relaxed space-y-6">
                <p>{aboutPageDict.mission.p1}</p>
                <p>{aboutPageDict.mission.p2}</p>
              </div>
              <div className="flex flex-col gap-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-zinc-700 font-medium">Réduction moyenne des coûts d'achat de 15% à 25%.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-zinc-700 font-medium">Contrôles qualité AQL stricts avant chaque expédition.</p>
                </div>
              </div>
            </div>
            
            <div className="relative animate-in fade-in slide-in-from-right-4 duration-1000">
              {aboutStory && (
                <div className="relative h-[600px] w-full rounded-[40px] overflow-hidden shadow-2xl border-[12px] border-zinc-50">
                  <Image
                    src={aboutStory.imageUrl}
                    alt="Notre équipe sur le terrain"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 p-8 bg-white rounded-3xl shadow-xl max-w-sm">
                    <p className="text-zinc-900 font-bold text-lg italic leading-snug">
                      "Nous ne nous contentons pas de trouver des usines, nous bâtissons les chaînes d'approvisionnement du futur."
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1 w-8 bg-primary rounded-full"></div>
                      <span className="text-xs uppercase font-black text-zinc-400 tracking-widest">Fondation GTC</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="container">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900">Nos Valeurs Fondamentales</h2>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">Ce qui guide chaque négociation et chaque inspection en votre nom.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {aboutPageDict.values.map((value, i) => (
              <Card key={i} className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-white p-8">
                <CardHeader className="p-0 mb-6">
                  <div className="p-4 bg-zinc-50 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors duration-500">
                    {value.icon}
                  </div>
                </CardHeader>
                <CardTitle className="text-2xl font-bold text-zinc-900 mb-4">{value.title}</CardTitle>
                <CardContent className="p-0">
                  <p className="text-zinc-500 text-lg leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Immersive Image Carousel */}
      <section className="w-full py-24 bg-zinc-950 overflow-hidden">
        <div className="container mb-12 text-center">
          <h2 className="text-2xl md:text-4xl font-headline font-bold text-white mb-4">L'Expertise en Action</h2>
          <p className="text-zinc-400">Quelques clichés de nos audits et de nos opérations logistiques.</p>
        </div>
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {carouselImages.map((image, index) => (
              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden group">
                  {image && (
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      data-ai-hint={image.imageHint}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                    <p className="text-white text-sm font-medium italic">{image?.description}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex justify-center gap-4 mt-12">
            <CarouselPrevious className="static translate-y-0 h-12 w-12 bg-white/10 text-white border-white/20 hover:bg-primary" />
            <CarouselNext className="static translate-y-0 h-12 w-12 bg-white/10 text-white border-white/20 hover:bg-primary" />
          </div>
        </Carousel>
      </section>
      
      {/* Product Sectors Grid */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900">
              Secteurs de Prédilection
            </h2>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
              Notre réseau couvre un large éventail d'industries pour répondre à tous vos besoins.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
            {aboutPageDict.productSectors.map((sector, i) => (
              <div key={i} className="flex flex-col items-center p-8 rounded-3xl bg-zinc-50 hover:bg-primary/5 transition-all duration-300 group">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  {sector.icon}
                </div>
                <h3 className="font-bold text-zinc-800 text-center tracking-tight">{sector.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        <div className="container relative text-center text-white space-y-10">
          <div className="inline-flex items-center gap-2 bg-black/20 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            Prêt à démarrer ?
          </div>
          <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">
            Confiez votre Sourcing à des Experts.
          </h2>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
            Ne laissez plus la distance freiner votre business. Obtenez une étude de faisabilité gratuite pour votre projet.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
            <Button size="lg" className="bg-white text-primary hover:bg-zinc-100 h-16 px-12 text-xl font-black shadow-2xl transition-all" asChild>
              <Link href="/contact">
                NOUS CONTACTER <ArrowRight className="ml-3 h-6 w-6"/>
              </Link>
            </Button>
          </div>
          <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">Réponse garantie sous 24 heures</p>
        </div>
      </section>
    </>
  );
}

function History(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}
