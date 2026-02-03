
'use client';

import Image from 'next/image';
import { 
  Check, 
  Lightbulb, 
  Compass, 
  Users, 
  Wrench, 
  ArrowRight, 
  Zap, 
  HelpCircle,
  Gem,
  Cpu,
  Microscope,
  MessagesSquare
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

export default function CustomServicesPage() {
  const dictionary = {
    hero: {
      tag: "Solution Premium",
      title: "Services sur Mesure : Votre Projet, Nos Experts",
      subtitle: "Développement de produit OEM/ODM, accompagnement sur salons ou conseil stratégique. Nous apportons une réponse personnalisée à vos besoins les plus complexes en Chine."
    },
    stats: [
      { label: "Nouveaux Produits / An", value: "50+" },
      { label: "Accompagnements Salons", value: "200+" },
      { label: "Success Rate R&D", value: "95%" },
      { label: "Experts Dédiés", value: "15" }
    ],
    pillars: {
      title: "L'Accompagnement Premium",
      items: [
        {
          icon: <Cpu className="h-8 w-8 text-primary" />,
          title: "Développement Produit (OEM/ODM)",
          description: "Nous transformons vos croquis en produits finis. Nous gérons la création de moules, le prototypage et les tests techniques avec les ingénieurs d'usine.",
          details: ["Design industriel", "Moulage & Outillage", "Prototypage 3D"]
        },
        {
          icon: <Users className="h-8 w-8 text-primary" />,
          title: "Assistance Salons (Canton Fair)",
          description: "Ne perdez pas votre temps dans les salons géants. Nous préparons votre itinéraire, vous accompagnons pour la traduction et la négociation technique.",
          details: ["Traduction spécialisée", "Négociation en direct", "Suivi post-salon"]
        },
        {
          icon: <Compass className="h-8 w-8 text-primary" />,
          title: "Conseil en Stratégie d'Achat",
          description: "Audit de votre chaîne d'approvisionnement actuelle pour identifier les points de perte et optimiser vos marges via des solutions innovantes.",
          details: ["Audit de coûts", "Optimisation flux", "Veille concurrentielle"]
        },
        {
          icon: <Wrench className="h-8 w-8 text-primary" />,
          title: "Projets Complexes & Techniques",
          description: "Coordination multi-fournisseurs pour des produits assemblés nécessitant des composants provenant de différentes provinces chinoises.",
          details: ["Coordination multi-sites", "Intégration technique", "Zéro défaut assemblage"]
        }
      ]
    },
    developmentSection: {
      title: "De l'Idée au Rayonnage : Le Cycle R&D",
      subtitle: "Développer un produit unique en Chine demande une maîtrise parfaite de la propriété intellectuelle et de l'ingénierie.",
      points: [
        "Signature d'accords de confidentialité (NNN Agreements) avec les usines",
        "Modélisation technique et validation des contraintes de fabrication",
        "Création de moules exclusifs appartenant contractuellement à votre société",
        "Validation rigoureuse des prototypes avant lancement de la production de masse"
      ]
    },
    faq: {
      title: "Questions sur les Services Personnalisés",
      items: [
        { q: "Qu'est-ce qu'un contrat NNN ?", a: "C'est un contrat de 'Non-Use, Non-Disclosure, and Non-Circumvention'. Il est indispensable en Chine pour protéger vos idées et empêcher une usine de vendre votre produit à vos concurrents." },
        { q: "Combien coûte la création d'un moule ?", a: "Le coût varie énormément selon le matériau et la complexité. Cela peut aller de quelques centaines à plusieurs dizaines de milliers de dollars. Nous négocions pour que vous en soyez le propriétaire légal exclusif." },
        { q: "Pouvez-vous m'aider pour la Foire de Canton ?", a: "Oui, c'est l'une de nos spécialités. Nous organisons votre visite, sélectionnons les stands pertinents et sécurisons les contacts pris sur place pour un suivi efficace." },
        { q: "Accompagnez-vous les startups ?", a: "Absolument. Nous aimons aider les jeunes marques à structurer leur sourcing dès le premier jour pour éviter les erreurs de débutant qui coûtent cher." }
      ]
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'custom-services-hero');
  const developmentImage = PlaceHolderImages.find(p => p.id === 'custom-services-feature-1');

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
                  <Link href="/contact">Lancer mon projet sur mesure <ArrowRight className="ml-2 h-5 w-5"/></Link>
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
                  Des solutions d'ingénierie et de conseil haut de gamme pour les projets qui demandent de l'innovation.
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

      {/* R&D Focus Section */}
      <section className="py-20 bg-zinc-50 overflow-hidden border-y border-zinc-200">
        <div className="container grid md:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 md:order-1">
                {developmentImage && (
                    <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
                        <Image 
                          src={developmentImage.imageUrl} 
                          alt="Développement produit" 
                          data-ai-hint={developmentImage.imageHint} 
                          fill 
                          className="object-cover transform hover:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent"></div>
                        <div className="absolute bottom-8 left-8 text-white">
                           <div className="flex gap-4 mb-2">
                              <Microscope className="h-6 w-6 text-primary" />
                              <Lightbulb className="h-6 w-6 text-primary" />
                           </div>
                           <p className="font-bold">L'innovation produit pilotée par des experts</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="space-y-8 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
                  <Gem className="h-5 w-5" /> Valeur Ajoutée
                </div>
                <h3 className="text-3xl md:text-4xl font-bold font-headline text-zinc-900 leading-tight">
                  {dictionary.developmentSection.title}
                </h3>
                <p className="text-lg text-zinc-600 leading-relaxed">
                  {dictionary.developmentSection.subtitle}
                </p>
                <div className="space-y-4">
                  {dictionary.developmentSection.points.map((point, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border-l-4 border-l-primary">
                      <Check className="h-6 w-6 text-primary shrink-0"/>
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
      <section className="py-24 bg-zinc-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="container relative text-center text-white space-y-10">
          <MessagesSquare className="h-16 w-16 mx-auto text-primary" />
          <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight text-white">
            Un projet unique mérite une attention exclusive.
          </h2>
          <p className="text-2xl text-zinc-400 max-w-2xl mx-auto font-medium">
            Contactez-nous pour une consultation privée et gratuite sur votre projet sur-mesure.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 h-16 px-12 text-xl font-black shadow-2xl" asChild>
              <Link href="/contact">
                DISCUTER DE MON PROJET <ArrowRight className="ml-3 h-6 w-6"/>
              </Link>
            </Button>
          </div>
          <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">Confidentialité garantie • Accompagnement Premium</p>
        </div>
      </section>
    </>
  );
}
