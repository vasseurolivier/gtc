
'use client';

import Image from 'next/image';
import { 
  Check, 
  TrendingUp, 
  Box, 
  ShieldCheck, 
  Truck, 
  Rocket, 
  ArrowRight,
  Fingerprint,
  Zap,
  HelpCircle,
  Star,
  PackageSearch,
  Cpu,
  RefreshCcw,
  Code2,
  Globe2,
  Lock
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      tag: "Automatisation & Scalabilité",
      title: "Vendez en Ligne, nous gérons la Chine pour vous.",
      subtitle: "Concentrez-vous à 100% sur votre marketing et la croissance de votre marque. De l'usine à votre client final, nous automatisons toute votre chaîne d'approvisionnement grâce à nos intégrations API performantes."
    },
    automation: {
      title: "Intégration Totale : Shopify, WooCommerce & API",
      subtitle: "Ne perdez plus de temps en logistique. Notre système se connecte directement à votre boutique pour une exécution des commandes en temps réel.",
      features: [
        {
          icon: <RefreshCcw className="h-6 w-6 text-primary" />,
          title: "Synchronisation Automatique",
          description: "Dès qu'une commande est passée sur votre site, elle est transmise à nos agents en Chine. Finis les fichiers Excel et les erreurs de saisie."
        },
        {
          icon: <Code2 className="h-6 w-6 text-primary" />,
          title: "API Robuste & Stable",
          description: "Développée pour les marques à forte croissance, notre API gère des volumes importants sans latence pour un suivi fluide."
        },
        {
          icon: <Truck className="h-6 w-6 text-primary" />,
          title: "Tracking en Temps Réel",
          description: "Les numéros de suivi sont automatiquement renvoyés vers votre boutique pour informer vos clients instantanément."
        }
      ]
    },
    pillars: {
      title: "Votre Département 'Chine' Externalisé",
      items: [
        {
          icon: <TrendingUp className="h-8 w-8 text-primary" />,
          title: "Sourcing de Produits Gagnants",
          description: "Nous analysons les tendances locales et auditons les usines pour dénicher les 'winners' avant qu'ils ne soient saturés sur le marché mondial.",
          details: ["Accès exclusif usines", "Analyse de marge", "Échantillonnage express"]
        },
        {
          icon: <Fingerprint className="h-8 w-8 text-primary" />,
          title: "Branding & Private Label",
          description: "Créez une marque forte. Nous gérons la conception de vos packagings, l'insertion de logos et la création de bundles uniques.",
          details: ["Packaging premium", "Inserts personnalisés", "Identité visuelle"]
        },
        {
          icon: <ShieldCheck className="h-8 w-8 text-primary" />,
          title: "Contrôle Qualité Impitoyable",
          description: "Zéro retour client. Nos inspecteurs effectuent des tests AQL stricts sur chaque lot pour garantir une conformité totale.",
          details: ["Inspection AQL 2.5", "Tests de résistance", "Vérification certification CE"]
        },
        {
          icon: <Zap className="h-8 w-8 text-primary" />,
          title: "Fulfillment & Stockage",
          description: "Nous stockons vos produits dans nos entrepôts sécurisés en Chine et expédions directement à vos clients ou vers Amazon FBA.",
          details: ["Stockage flexible", "Préparation de commande", "Expédition mondiale"]
        }
      ]
    },
    marketingSection: {
      title: "Vous vendez, nous faisons le reste.",
      subtitle: "La logistique en Chine est un métier à part entière. En nous déléguant cette partie, vous libérez un temps précieux pour votre stratégie commerciale.",
      points: [
        "Réduction drastique de vos coûts fixes opérationnels.",
        "Élimination des risques liés à la langue et à la culture d'affaires chinoise.",
        "Scalabilité immédiate : passez de 10 à 1000 commandes/jour sans changer d'équipe.",
        "Accès à des tarifs de transport négociés (DDP, Aérien, Maritime)."
      ]
    },
    faq: {
      title: "Questions Fréquentes",
      items: [
        { q: "Comment se passe la connexion avec Shopify ?", a: "C'est très simple. Nous fournissons une clé API ou utilisons une application passerelle qui synchronise vos commandes entrantes avec notre système de gestion en Chine." },
        { q: "Quels sont vos MOQ pour le Private Label ?", a: "Grâce à nos relations privilégiées avec les usines, nous pouvons souvent négocier des personnalisations dès 100 ou 500 unités, là où d'autres demandent des milliers." },
        { q: "Gérez-vous le dédouanement ?", a: "Oui, nous proposons des solutions DDP (Delivery Duty Paid). Vous et vos clients n'avez aucun frais de douane ou TVA surprise à régler à la livraison." },
        { q: "Est-ce que je garde la propriété de mes moules ?", a: "Absolument. Nous signons des contrats NNN avec les usines pour garantir que vous restez le propriétaire exclusif de vos designs et de vos moules." }
      ]
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'ecommerce-hero');
  const winnerImage = PlaceHolderImages.find(p => p.id === 'ecommerce-winner');
  const automationImage = PlaceHolderImages.find(p => p.id === 'ecommerce-logistics');

  return (
    <>
      {/* Hero Section */}
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
        <div className="relative h-full flex flex-col justify-start md:justify-end items-start container px-8 md:px-16 pt-[2cm] md:pt-0 pb-12">
          <div className="max-w-4xl space-y-6">
              <Badge variant="secondary" className="bg-primary text-white border-none px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                {dictionary.hero.tag}
              </Badge>
              <h1 className="text-xl md:text-6xl font-headline font-extrabold tracking-tight text-white leading-tight">
                  {dictionary.hero.title}
              </h1>
              <p className="text-sm md:text-2xl text-zinc-300 leading-tight max-w-3xl">
                  {dictionary.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-12 md:h-14 px-6 md:px-8 text-base md:text-lg shadow-xl shadow-primary/20" asChild>
                  <Link href="/contact">Automatiser mon business <ArrowRight className="ml-2 h-5 w-5"/></Link>
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg" asChild>
                  <Link href="#automation">Voir l'intégration API</Link>
                </Button>
              </div>
          </div>
        </div>
      </section>

      {/* Integration / Automation Section */}
      <section id="automation" className="py-24 bg-white overflow-hidden">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
                <Cpu className="h-5 w-5" /> Smart Logistics
              </div>
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900 leading-tight">
                {dictionary.automation.title}
              </h2>
              <p className="text-xl text-zinc-600 leading-relaxed">
                {dictionary.automation.subtitle}
              </p>
              <div className="grid grid-cols-1 gap-6">
                {dictionary.automation.features.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 transition-all hover:shadow-md group">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-primary group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{item.title}</h4>
                      <p className="text-sm text-zinc-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
              {automationImage && (
                <div className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-[12px] border-zinc-50">
                  <Image
                    src={automationImage.imageUrl}
                    alt="Automation systems"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex -space-x-2">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white border-2 border-white font-black text-xs">S</div>
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white border-2 border-white font-black text-xs">API</div>
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white border-2 border-white font-black text-xs">G</div>
                      </div>
                      <div className="h-1 w-12 bg-zinc-100 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Connecté en continu</span>
                    </div>
                    <p className="text-zinc-900 font-bold text-sm leading-snug">
                      "Une architecture technique robuste pour absorber vos pics de croissance sans aucune intervention manuelle."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* 4 Pillars Section */}
      <section className="py-20 md:py-32 bg-zinc-950 text-white">
        <div className="container">
            <div className="text-center mb-20">
                 <h2 className="text-3xl md:text-5xl font-headline font-bold mb-6">
                    {dictionary.pillars.title}
                </h2>
                <div className="w-24 h-1.5 bg-primary mx-auto mb-8 rounded-full"></div>
                <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
                  Nous sommes vos yeux et vos bras en Chine. Nous sécurisons chaque étape technique pour que votre marque soit irréprochable.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {dictionary.pillars.items.map((pillar, index) => (
                    <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-none bg-zinc-900 overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-6 p-8">
                            <div className="p-4 bg-zinc-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-500">
                              {pillar.icon}
                            </div>
                            <div>
                              <CardTitle className="text-2xl font-bold text-white">{pillar.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <p className="text-zinc-400 text-lg mb-6">{pillar.description}</p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {pillar.details.map((detail, dIdx) => (
                                <li key={dIdx} className="flex items-center text-zinc-300 font-medium">
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

      {/* Hands-off Focus Section */}
      <section className="py-24 bg-zinc-50 border-y border-zinc-200">
        <div className="container grid md:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 md:order-1">
                {winnerImage && (
                    <div className="relative h-[550px] w-full rounded-[3rem] overflow-hidden shadow-2xl">
                        <Image 
                          src={winnerImage.imageUrl} 
                          alt="Focus on sales" 
                          data-ai-hint={winnerImage.imageHint} 
                          fill 
                          className="object-cover transform hover:scale-105 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent mix-blend-overlay"></div>
                        <div className="absolute top-10 left-10 p-6 bg-zinc-900 text-white rounded-2xl shadow-2xl max-w-[200px] animate-in fade-in zoom-in duration-700">
                           <TrendingUp className="h-8 w-8 text-primary mb-2" />
                           <p className="text-2xl font-black">100%</p>
                           <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Focus Commercial</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="space-y-8 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
                  <Lock className="h-5 w-5" /> Tranquillité d'Esprit
                </div>
                <h3 className="text-3xl md:text-4xl font-bold font-headline text-zinc-900 leading-tight">
                  {dictionary.marketingSection.title}
                </h3>
                <p className="text-lg text-zinc-600 leading-relaxed">
                  {dictionary.marketingSection.subtitle}
                </p>
                <div className="space-y-4">
                  {dictionary.marketingSection.points.map((point, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border-l-4 border-l-primary">
                      <Check className="h-6 w-6 text-primary shrink-0"/>
                      <p className="text-zinc-700 font-bold">{point}</p>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="h-14 px-8 font-black uppercase tracking-widest bg-zinc-900 hover:bg-black text-white" asChild>
                  <Link href="/contact">Demander une démo API</Link>
                </Button>
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
            Prêt à scaler votre marque sans limites ?
          </h2>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto font-medium">
            Confiez votre logistique Chine à des experts. Intégration rapide, automatisation totale, sécurité maximale.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-zinc-100 h-16 px-12 text-xl font-black shadow-2xl" asChild>
              <Link href="/contact">
                PARLER À UN EXPERT <ArrowRight className="ml-3 h-6 w-6"/>
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 pt-4 opacity-70">
            <div className="flex items-center gap-2"><Globe2 className="h-5 w-5"/> <span className="text-[10px] font-bold uppercase tracking-widest">Support Global 24/7</span></div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> <span className="text-[10px] font-bold uppercase tracking-widest">Contrôles AQL Inclus</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
