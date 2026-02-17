
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeftRight, 
  PackageSearch, 
  ShoppingCart, 
  Wrench, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Truck, 
  Globe,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';

export default function ServicesPage() {
  const servicesPageDict = {
    hero: {
      tag: "Expertise Import-Export",
      title: "Solutions Complètes pour votre Chaîne d'Approvisionnement",
      subtitle: "De la recherche de fournisseur à la livraison finale, nous sécurisons chaque étape de votre importation depuis la Chine pour maximiser votre rentabilité."
    },
    cta: "Discuter de mon projet",
    services: [
      {
        id: "sourcing",
        icon: <PackageSearch className="h-10 w-10" />,
        title: "Sourcing & Achat",
        description: "Trouvez les meilleurs fabricants sans passer par les traders. Nous filtrons le marché pour vous garantir des prix direct usine.",
        imageUrl: PlaceHolderImages.find(p => p.id === 'sourcing-hero')?.imageUrl,
        link: "/services/sourcing",
        features: ["Identification fournisseurs qualifiés", "Audit d'usine complet", "Négociation en mandarin", "Gestion d'échantillons"]
      },
      {
        id: "trading",
        icon: <ArrowLeftRight className="h-10 w-10" />,
        title: "Trading & Logistique",
        description: "Gagnez en sérénité. Nous gérons le suivi de production, le contrôle qualité AQL et le transport jusqu'à votre entrepôt.",
        imageUrl: PlaceHolderImages.find(p => p.id === 'trading-hero')?.imageUrl,
        link: "/services/trading-logistics",
        features: ["Contrôle Qualité AQL 2.5/4.0", "Consolidation de fret", "Dédouanement & Taxes", "Livraison DDP"]
      },
      {
        id: "ecommerce",
        icon: <ShoppingCart className="h-10 w-10" />,
        title: "Solutions E-commerce",
        description: "Propulsez votre marque. Sourcing de 'winners', packaging personnalisé et préparation logistique Amazon FBA.",
        imageUrl: PlaceHolderImages.find(p => p.id === 'ecommerce-hero')?.imageUrl,
        link: "/services/ecommerce-solutions",
        features: ["Recherche de produits gagnants", "Private Label & Branding", "Étiquetage FBA", "Fulfillment direct Chine"]
      },
      {
        id: "custom",
        icon: <Wrench className="h-10 w-10" />,
        title: "Services sur Mesure",
        description: "Développement de produits innovants (OEM/ODM) et accompagnement stratégique sur les plus grands salons de Chine.",
        imageUrl: PlaceHolderImages.find(p => p.id === 'custom-services-hero')?.imageUrl,
        link: "/services/custom-services",
        features: ["Développement de moules", "Accords de confidentialité NNN", "Assistance Foire de Canton", "Conseil en stratégie d'achat"]
      }
    ]
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[95vh] text-white overflow-hidden pt-16 md:pt-0 md:-mt-16">
        <Image
          src={PlaceHolderImages.find(p => p.id === 'services-hero')?.imageUrl || ''}
          alt="Solutions Globales"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-zinc-950/70 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-start md:justify-end items-start container px-8 md:px-16 pb-12 pt-[2cm] md:pt-0">
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Badge variant="secondary" className="bg-primary text-white border-none px-4 py-1 text-sm font-semibold uppercase tracking-widest">
                {servicesPageDict.hero.tag}
              </Badge>
              <h1 className="text-xl md:text-7xl font-headline font-extrabold tracking-tight text-white leading-tight">
                  {servicesPageDict.hero.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm md:text-2xl text-zinc-300 leading-relaxed font-medium">
                  {servicesPageDict.hero.subtitle}
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 h-14 px-8 font-black uppercase tracking-tighter" asChild>
                  <Link href="/contact">{servicesPageDict.cta} <ArrowRight className="ml-2 h-5 w-5"/></Link>
                </Button>
              </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation Grid */}
      <section className="py-20 bg-zinc-50 border-b border-zinc-200">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesPageDict.services.map((service) => (
              <Link key={service.id} href={service.link}>
                <Card className="group h-full border-none shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-white overflow-hidden">
                  <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="p-4 bg-zinc-50 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500 mb-6">
                      {service.icon}
                    </div>
                    <h3 className="font-headline font-bold text-xl text-zinc-900 group-hover:text-primary transition-colors">{service.title}</h3>
                    <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Alternating Sections */}
      <section className="py-24 bg-white space-y-32">
        {servicesPageDict.services.map((service, index) => {
          const isOdd = index % 2 !== 0;
          return (
            <div key={service.id} className="container">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className={cn("space-y-8", isOdd ? "md:order-last" : "")}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      {service.icon}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900">{service.title}</h2>
                  </div>
                  <p className="text-xl text-zinc-600 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {service.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <Button variant="outline" className="h-12 px-8 border-2 font-bold" asChild>
                      <Link href={service.link}>Détails du service <ChevronRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-[3rem] rotate-3 -z-10"></div>
                  <div className="relative h-[500px] w-full rounded-[3rem] overflow-hidden shadow-2xl">
                    <Image
                      src={service.imageUrl || 'https://picsum.photos/seed/service/800/600'}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Trust Badges */}
      <section className="py-24 bg-zinc-950 text-white overflow-hidden">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold">Votre Sécurité est notre Priorité</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Chaque service est conçu pour éliminer les risques inhérents à l'importation de Chine.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 border border-primary/30">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Paiement Sécurisé</h3>
              <p className="text-zinc-400 text-sm">Nous ne libérons vos fonds aux usines qu'après validation du contrôle qualité.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 border border-primary/30">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Agents Locaux</h3>
              <p className="text-zinc-400 text-sm">Basés à Yiwu, nos agents se déplacent physiquement sur les lignes de production.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 border border-primary/30">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Logistique Maitrisée</h3>
              <p className="text-zinc-400 text-sm">Zéro surprise en douane. Nous gérons toute la documentation export et import.</p>
            </div>
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
            Obtenez une étude de faisabilité gratuite pour votre projet d'importation sous 24 heures.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
            <Button size="lg" className="bg-white text-primary hover:bg-zinc-100 h-16 px-12 text-xl font-black shadow-2xl transition-all" asChild>
              <Link href="/contact">
                NOUS CONTACTER <ArrowRight className="ml-3 h-6 w-6"/>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
