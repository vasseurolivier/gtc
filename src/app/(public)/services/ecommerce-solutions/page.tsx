
'use client';

import Image from 'next/image';
import { 
  Check, 
  TrendingUp, 
  Box, 
  ShieldCheck, 
  Truck, 
  Rocket, 
  BarChart, 
  PackageSearch, 
  Star,
  ArrowRight,
  Fingerprint,
  Zap,
  HelpCircle
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import Link from 'next/link';

export default function EcommerceSolutionsPage() {
  const dictionary = {
    hero: {
      tag: "Partenaire Croissance",
      title: "Dominez votre Marché E-commerce avec le Sourcing Chinois",
      subtitle: "Nous sécurisons vos marges et votre réputation. De l'identification du 'Winner' à la livraison finale, nous gérons toute la complexité opérationnelle pour vous."
    },
    pillars: {
      title: "Nos 4 Piliers pour votre E-commerce",
      items: [
        {
          icon: <TrendingUp className="h-8 w-8 text-primary" />,
          title: "Sourcing de Produits Gagnants",
          description: "Ne perdez plus d'argent sur des produits invendables. Nous analysons les tendances, auditons les usines et trouvons les produits à fort potentiel de marge.",
          details: ["Veille concurrentielle", "Échantillonnage rapide", "Négociation directe usine"]
        },
        {
          icon: <Fingerprint className="h-8 w-8 text-primary" />,
          title: "Private Label & Branding",
          description: "Différenciez-vous radicalement. Nous gérons la création de vos packaging personnalisés, l'insertion de logos et le bundling de produits.",
          details: ["Packaging sur mesure", "Design de logo", "Notices en français/anglais"]
        },
        {
          icon: <ShieldCheck className="h-8 w-8 text-primary" />,
          title: "Contrôle Qualité & Conformité",
          description: "Évitez les retours clients et les suspensions de compte. Inspections rigoureuses AQL et vérification des certificats CE/normes jouets.",
          details: ["Inspection pré-expédition", "Vérification des labellisations", "Tests de fonctionnement"]
        },
        {
          icon: <Truck className="h-8 w-8 text-primary" />,
          title: "Service Logistique & 3PL",
          description: "Zéro stress logistique. Nous préparons vos envois selon vos standards : étiquetage personnalisé, carton master conforme, dédouanement.",
          details: ["Étiquetage individuel", "Envois maritimes/aériens", "Gestion du dédouanement"]
        }
      ]
    },
    fbaSection: {
      title: "Service Logistique",
      subtitle: "La logistique ne pardonne pas l'erreur. Nous sommes vos yeux et vos mains en Chine pour sécuriser vos flux.",
      points: [
        "Étiquetage individuel des unités",
        "Inserts promotionnels et cartes de remerciement",
        "Palettisation aux normes internationales",
        "DDP (Delivery Duty Paid) : aucun frais de douane surprise"
      ]
    },
    faq: {
      title: "Questions Fréquentes",
      items: [
        { q: "Quels sont vos MOQ (Minimum Order Quantity) ?", a: "Ils dépendent de l'usine, mais en tant qu'agent local, nous négocions souvent des MOQ plus bas pour nos clients e-commerce (parfois dès 50 ou 100 unités)." },
        { q: "Comment gérez-vous les retours ?", a: "Le contrôle qualité en Chine est notre priorité pour que les retours n'arrivent jamais. Si un défaut est détecté à l'inspection, l'usine remplace gratuitement avant l'envoi." },
        { q: "Pouvez-vous expédier directement en entrepôt ?", a: "Oui, c'est notre spécialité. Nous expédions directement de Chine vers vos entrepôts de stockage en Europe, USA ou Moyen-Orient." },
        { q: "Comment se déroule le paiement ?", a: "Nous sécurisons vos fonds. Nous ne payons le solde à l'usine qu'après validation de l'inspection qualité par notre équipe." }
      ]
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'ecommerce-hero');
  const winnerImage = PlaceHolderImages.find(p => p.id === 'ecommerce-winner');
  const logisticsImage = PlaceHolderImages.find(p => p.id === 'ecommerce-logistics');

  return (
    <>
      {/* Hero Section - Tall and lowered text */}
      <section className="relative w-full h-[95vh] text-white overflow-hidden pt-16 md:pt-0 md:-mt-16">
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
        <div className="absolute inset-0 bg-zinc-950/70" />
        <div className="relative h-full flex flex-col justify-end items-start container px-8 md:px-16 pb-24">
          <div className="max-w-3xl space-y-6">
              <Badge variant="secondary" className="bg-primary text-white border-none px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                {dictionary.hero.tag}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">
                  {dictionary.hero.title}
              </h1>
              <p className="text-xl text-zinc-300 leading-relaxed max-w-2xl">
                  {dictionary.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 text-lg" asChild>
                  <Link href="/contact">Lancer mon projet <ArrowRight className="ml-2 h-5 w-5"/></Link>
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 h-14 px-8 text-lg" asChild>
                  <Link href="#services">Découvrir nos solutions</Link>
                </Button>
              </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-12 bg-zinc-900 text-white">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">10+ Ans</div>
            <div className="text-sm text-zinc-400">D'expérience terrain</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-zinc-400">Conformité logistique garantie</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-sm text-zinc-400">Usines auditées par an</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">24h</div>
            <div className="text-sm text-zinc-400">Réponse garantie</div>
          </div>
        </div>
      </section>
      
      {/* 4 Pillars Section */}
      <section id="services" className="py-20 md:py-32 bg-white">
        <div className="container">
            <div className="text-center mb-20">
                 <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900 mb-6">
                    {dictionary.pillars.title}
                </h2>
                <div className="w-24 h-1.5 bg-primary mx-auto mb-8 rounded-full"></div>
                <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
                  Nous couvrons chaque aspect technique pour que vous puissiez vous concentrer sur le marketing et la croissance de votre marque.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {dictionary.pillars.items.map((pillar, index) => (
                    <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-none bg-zinc-50 overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-6 p-8">
                            <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-500">
                              {pillar.icon}
                            </div>
                            <div>
                              <CardTitle className="text-2xl font-bold text-zinc-900">{pillar.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <p className="text-zinc-600 text-lg mb-6">{pillar.description}</p>
                            <ul className="grid grid-cols-1 gap-3">
                              {pillar.details.map((detail, dIdx) => (
                                <li key={dIdx} className="flex items-center text-zinc-700 font-medium">
                                  <Zap className="h-4 w-4 mr-3 text-primary fill-primary"/> {detail}
                                </li>
                              ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* Winning Product Focus */}
      <section className="py-20 bg-zinc-50 overflow-hidden">
        <div className="container grid md:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 md:order-1">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                {winnerImage && (
                    <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
                        <Image 
                          src={winnerImage.imageUrl} 
                          alt="Winning products" 
                          data-ai-hint={winnerImage.imageHint} 
                          fill 
                          className="object-cover transform hover:scale-105 transition-all duration-700"
                        />
                    </div>
                )}
            </div>
            <div className="space-y-8 order-1 md:order-2">
                <Badge variant="outline" className="border-primary text-primary font-bold px-4 py-1">Sourcing Stratégique</Badge>
                <h3 className="text-3xl md:text-4xl font-bold font-headline text-zinc-900 leading-tight">Dénichez des "Winners" avant tout le monde</h3>
                <p className="text-lg text-zinc-600 leading-relaxed">
                  Le marché bouge vite. Nos agents sur le terrain visitent quotidiennement les marchés de <strong>Yiwu, Shenzhen et Guangzhou</strong>. Nous avons accès aux dernières innovations usines avant qu'elles n'apparaissent sur Alibaba. 
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border-l-4 border-l-primary">
                    <Star className="h-6 w-6 text-primary shrink-0"/>
                    <p className="text-zinc-700 font-medium">Accès aux prototypes exclusifs pour tester votre marché en avance.</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border-l-4 border-l-primary">
                    <PackageSearch className="h-6 w-6 text-primary shrink-0"/>
                    <p className="text-zinc-700 font-medium">Analyse réelle de la capacité de production pour éviter les ruptures de stock.</p>
                  </div>
                </div>
            </div>
        </div>
      </section>

      {/* Logistic Service Section */}
      <section className="py-20 md:py-32 bg-zinc-900 text-white">
        <div className="container grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <Box className="h-10 w-10 text-primary" />
                  <h2 className="text-3xl md:text-5xl font-headline font-bold">{dictionary.fbaSection.title}</h2>
                </div>
                <p className="text-xl text-zinc-400 leading-relaxed">
                  {dictionary.fbaSection.subtitle}
                </p>
                <div className="grid grid-cols-1 gap-6">
                  {dictionary.fbaSection.points.map((point, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <Check className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-lg font-medium">{point}</span>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 h-14 px-8 text-lg font-bold" asChild>
                  <Link href="/contact">Démarrer mon projet logistique</Link>
                </Button>
            </div>
            <div className="relative">
                {logisticsImage && (
                    <div className="relative h-[550px] w-full rounded-2xl overflow-hidden border-8 border-zinc-800 shadow-2xl">
                        <Image 
                          src={logisticsImage.imageUrl} 
                          alt="Logistic service" 
                          data-ai-hint={logisticsImage.imageHint} 
                          fill 
                          className="object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
                        <div className="absolute bottom-10 left-10 p-6 bg-primary rounded-xl shadow-xl max-w-xs">
                          <p className="text-white font-bold text-lg italic">"La rigueur logistique est la clé de la rentabilité."</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-zinc-900">{dictionary.faq.title}</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {dictionary.faq.items.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-b border-zinc-100 px-2">
                <AccordionTrigger className="text-xl font-semibold text-zinc-900 hover:text-primary transition-colors text-left py-6">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-lg text-zinc-600 leading-relaxed pb-6">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        <div className="container relative text-center text-white space-y-10">
          <Rocket className="h-16 w-16 mx-auto animate-bounce" />
          <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">
            Prêt à faire exploser vos ventes ?
          </h2>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto font-medium">
            Ne laissez pas la barrière de la langue ou la distance brider votre ambition. Nous sommes votre équipe en Chine.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-zinc-100 h-16 px-12 text-xl font-black shadow-2xl" asChild>
              <Link href="/contact">
                PARLER À UN EXPERT <ArrowRight className="ml-3 h-6 w-6"/>
              </Link>
            </Button>
          </div>
          <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">Réponse en moins de 24 heures • Sans engagement</p>
        </div>
      </section>
    </>
  );
}
