
'use client';

import Image from 'next/image';
import { 
  Check, 
  Truck, 
  ShieldCheck, 
  FileText, 
  Boxes, 
  ArrowRight, 
  Zap, 
  HelpCircle,
  Ship,
  Scale,
  SearchCheck,
  Plane
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

export default function TradingLogisticsPage() {
  const dictionary = {
    hero: {
      tag: "Logistique Totale",
      title: "Trading & Logistique : Importez de Chine sans Stress",
      subtitle: "De la sortie d'usine à votre entrepôt, nous gérons chaque maillon de la chaîne. Suivi de production, contrôle qualité rigoureux et transport optimisé pour une tranquillité totale."
    },
    stats: [
      { label: "Containers / An", value: "5000+" },
      { label: "Taux de Conformité", value: "99.8%" },
      { label: "Blocages Douaniers", value: "0" },
      { label: "Délais Respectés", value: "95%" }
    ],
    pillars: {
      title: "Une Maîtrise Complète des Flux",
      items: [
        {
          icon: <Boxes className="h-8 w-8 text-primary" />,
          title: "Suivi de Production",
          description: "Nous ne nous contentons pas d'attendre la fin. Nous effectuons des points hebdomadaires avec l'usine pour anticiper les retards et corriger les erreurs de fabrication.",
          details: ["Planning de production", "Alertes retards", "Photos en direct"]
        },
        {
          icon: <SearchCheck className="h-8 w-8 text-primary" />,
          title: "Contrôle Qualité AQL",
          description: "Nos inspecteurs qualifiés se déplacent à l'usine pour effectuer des tests selon les standards internationaux AQL (Acceptable Quality Level).",
          details: ["Inspection finale", "Tests de résistance", "Conformité packaging"]
        },
        {
          icon: <FileText className="h-8 w-8 text-primary" />,
          title: "Documentation & Douane",
          description: "Factures commerciales, Packing List, certificats d'origine, CE, RoHS... Nous préparons chaque document pour un passage en douane fluide.",
          details: ["Conformité HS Code", "Gestion des taxes", "Certification export"]
        },
        {
          icon: <Truck className="h-8 w-8 text-primary" />,
          title: "Transport Multimodal",
          description: "Qu'il s'agisse de Maritime (FCL/LCL), Aérien ou Ferroviaire, nous choisissons la solution la plus rentable pour votre budget et vos délais.",
          details: ["Consolidation de fret", "DDP / FOB / CIF", "Assurance transport"]
        }
      ]
    },
    aqlSection: {
      title: "L'Importance du Contrôle AQL 2.5 / 4.0",
      subtitle: "Pourquoi accepteriez-vous des produits défectueux ? Notre inspection est votre dernière barrière de protection.",
      points: [
        "Vérification statistique rigoureuse des lots",
        "Contrôle dimensionnel et esthétique précis",
        "Test de fonctionnalité sur un échantillon représentatif",
        "Rapport détaillé avec photos et vidéos envoyé sous 24h"
      ]
    },
    faq: {
      title: "Questions sur la Logistique & Trading",
      items: [
        { q: "Qu'est-ce que l'AQL ?", a: "L'AQL (Acceptable Quality Level) est une norme internationale utilisée pour définir le niveau de qualité acceptable d'un lot de production sans avoir à inspecter chaque unité une par une." },
        { q: "Proposez-vous du transport DDP ?", a: "Oui, c'est l'une de nos solutions les plus populaires. En DDP (Delivery Duty Paid), nous nous occupons de tout : fret, dédouanement et taxes. Vous recevez la marchandise à votre porte sans frais cachés." },
        { q: "Puis-je regrouper des commandes de plusieurs fournisseurs ?", a: "Absolument. C'est la 'Consolidation'. Nous réceptionnons vos marchandises de différentes usines dans notre entrepôt de Yiwu ou Ningbo et les regroupons dans un seul container pour réduire vos coûts." },
        { q: "Gérez-vous les litiges avec les usines ?", a: "Oui. En cas de défaut détecté lors de l'inspection, nous bloquons le paiement final à l'usine et exigeons la remise en conformité ou le remplacement avant expédition." }
      ]
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'trading-hero');
  const logisticsImage = PlaceHolderImages.find(p => p.id === 'logistics-process');

  return (
    <>
      {/* Hero Section - 95vh & lowered text */}
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
        <div className="relative h-full flex flex-col justify-start md:justify-end items-start container px-8 md:px-16 pt-[7cm] md:pt-0 pb-12">
          <div className="max-w-3xl space-y-6">
              <Badge variant="secondary" className="bg-primary text-white border-none px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                {dictionary.hero.tag}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight text-white">
                  {dictionary.hero.title}
              </h1>
              <p className="text-xl md:text-2xl text-zinc-300 leading-relaxed max-w-2xl">
                  {dictionary.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 text-lg" asChild>
                  <Link href="/contact">Optimiser ma logistique <ArrowRight className="ml-2 h-5 w-5"/></Link>
                </Button>
              </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-zinc-900 text-white border-b border-zinc-800">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {dictionary.stats.map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-zinc-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Pillars Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container">
            <div className="text-center mb-20">
                 <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900 mb-6">
                    {dictionary.pillars.title}
                </h2>
                <div className="w-24 h-1.5 bg-primary mx-auto mb-8 rounded-full"></div>
                <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
                  Nous transformons la complexité de l'import-export en un avantage compétitif pour votre entreprise.
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

      {/* Logistics Focus Section */}
      <section className="py-20 bg-zinc-50 overflow-hidden border-y border-zinc-200">
        <div className="container grid md:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 md:order-1">
                {logisticsImage && (
                    <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
                        <Image 
                          src={logisticsImage.imageUrl} 
                          alt="Logistique internationale" 
                          data-ai-hint={logisticsImage.imageHint} 
                          fill 
                          className="object-cover transform hover:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent"></div>
                        <div className="absolute bottom-8 left-8 text-white">
                           <div className="flex gap-4 mb-2">
                              <Ship className="h-6 w-6" />
                              <Plane className="h-6 w-6" />
                              <Truck className="h-6 w-6" />
                           </div>
                           <p className="font-bold">Maîtrise totale du transport international</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="space-y-8 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
                  <Scale className="h-5 w-5" /> Rigueur & Conformité
                </div>
                <h3 className="text-3xl md:text-4xl font-bold font-headline text-zinc-900 leading-tight">
                  {dictionary.aqlSection.title}
                </h3>
                <p className="text-lg text-zinc-600 leading-relaxed">
                  {dictionary.aqlSection.subtitle}
                </p>
                <div className="space-y-4">
                  {dictionary.aqlSection.points.map((point, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border-l-4 border-l-primary">
                      <ShieldCheck className="h-6 w-6 text-primary shrink-0"/>
                      <p className="text-zinc-700 font-medium">{point}</p>
                    </div>
                  ))}
                </div>
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
        <div className="container relative text-center text-white space-y-10">
          <Ship className="h-16 w-16 mx-auto animate-pulse" />
          <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight text-white">
            Prêt à importer vos marchandises en toute sérénité ?
          </h2>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto font-medium">
            Contactez notre équipe logistique pour une étude personnalisée de vos flux.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-zinc-100 h-16 px-12 text-xl font-black shadow-2xl" asChild>
              <Link href="/contact">
                PARLER À UN LOGISTICIEN <ArrowRight className="ml-3 h-6 w-6"/>
              </Link>
            </Button>
          </div>
          <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">Devis sous 24 heures • Zéro frais cachés</p>
        </div>
      </section>
    </>
  );
}
