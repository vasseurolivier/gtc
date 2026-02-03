
'use client';

import Image from 'next/image';
import { 
  Check, 
  Search, 
  ShieldAlert, 
  Gavel, 
  PackageCheck, 
  ArrowRight, 
  Zap, 
  HelpCircle,
  Factory,
  ClipboardCheck
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

export default function SourcingPage() {
  const dictionary = {
    hero: {
      tag: "Expertise Terrain",
      title: "Sourcing & Achat : Trouvez le Fournisseur Parfait en Chine",
      subtitle: "Ne jouez pas votre rentabilité à la loterie sur Alibaba. Nous identifions, auditons et négocions pour vous avec les meilleures usines chinoises pour sécuriser vos marges et votre qualité."
    },
    stats: [
      { label: "Usines Auditées", value: "1000+" },
      { label: "Satisfaction Client", value: "98%" },
      { label: "Économie Moyenne", value: "15-25%" },
      { label: "Présence Terrain", value: "10 ans" }
    ],
    pillars: {
      title: "Une Méthodologie de Sourcing Sans Faille",
      items: [
        {
          icon: <Search className="h-8 w-8 text-primary" />,
          title: "Identification Précise",
          description: "Nous ne nous arrêtons pas aux premiers résultats de recherche. Nous filtrons les fabricants réels des simples traders pour vous garantir les meilleurs prix directs usine.",
          details: ["Cahier des charges strict", "Filtrage multi-critères", "Vérification des licences"]
        },
        {
          icon: <ShieldAlert className="h-8 w-8 text-primary" />,
          title: "Audit & Due Diligence",
          description: "Nous vérifions la santé financière, la capacité de production et la conformité sociale des usines (BSCI, ISO) avant même que vous ne payiez un échantillon.",
          details: ["Visites sur site", "Contrôle des certifications", "Audit de capacité"]
        },
        {
          icon: <Gavel className="h-8 w-8 text-primary" />,
          title: "Négociation & Contrats",
          description: "Grâce à notre maîtrise du mandarin et de la culture d'affaires locale, nous obtenons des conditions que les acheteurs étrangers ne pourraient jamais avoir seuls.",
          details: ["Prix 'Local Market'", "Contrats sécurisés", "Protection acompte"]
        },
        {
          icon: <PackageCheck className="h-8 w-8 text-primary" />,
          title: "Gestion des Échantillons",
          description: "Nous consolidons et vérifions vos échantillons dans nos bureaux pour vous éviter de payer plusieurs frais d'envoi internationaux inutiles.",
          details: ["Consolidation express", "Rapport de conformité", "Validation technique"]
        }
      ]
    },
    auditSection: {
      title: "Pourquoi l'Audit d'Usine est-il Crucial ?",
      subtitle: "En Chine, l'image numérique d'une usine est souvent loin de la réalité physique. Nos agents sont vos yeux sur place.",
      points: [
        "Éviter les usines fantômes ou les 'Shell Companies'",
        "Vérifier que l'usine possède bien les machines déclarées",
        "S'assurer du respect des normes de sécurité et d'éthique",
        "Confirmer la capacité réelle à tenir vos délais de production"
      ]
    },
    faq: {
      title: "Questions Fréquentes sur le Sourcing",
      items: [
        { q: "Comment vous rémunérez-vous ?", a: "Nous travaillons généralement sur une base de commission liée à la commande ou au forfait selon la complexité du projet. Notre coût est souvent largement compensé par la négociation de prix que nous obtenons pour vous." },
        { q: "Puis-je commander de petites quantités ?", a: "Oui. L'un de nos rôles est de négocier les MOQ (Minimum Order Quantities) avec les usines. Notre présence locale nous donne un levier de négociation plus fort que pour un acheteur à distance." },
        { q: "Comment garantissez-vous que l'usine ne changera pas la qualité ?", a: "C'est tout l'intérêt de nos contrats et de nos inspections en cours de production. Nous lions les paiements à des étapes de validation qualité strictes." },
        { q: "Quelles villes couvrez-vous ?", a: "Nous sommes basés à Yiwu, mais nos agents se déplacent partout en Chine : Shenzhen, Guangzhou, Ningbo, Shanghai et les pôles industriels du nord." }
      ]
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'sourcing-hero');
  const auditImage = PlaceHolderImages.find(p => p.id === 'sourcing-process');

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
        <div className="relative h-full flex flex-col justify-end items-start container px-8 md:px-16 pb-32">
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
                  <Link href="/contact">Trouver mes fournisseurs <ArrowRight className="ml-2 h-5 w-5"/></Link>
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
                  Plus qu'un simple annuaire, nous sommes votre département achat externalisé en Chine.
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

      {/* Audit Focus Section */}
      <section className="py-20 bg-zinc-50 overflow-hidden border-y border-zinc-200">
        <div className="container grid md:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 md:order-1">
                {auditImage && (
                    <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
                        <Image 
                          src={auditImage.imageUrl} 
                          alt="Audit d'usine" 
                          data-ai-hint={auditImage.imageHint} 
                          fill 
                          className="object-cover transform hover:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent"></div>
                        <div className="absolute bottom-8 left-8">
                           <Badge className="bg-primary mb-2">Audit Certifié</Badge>
                           <p className="text-white font-bold">Inspection réelle sur ligne de production</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="space-y-8 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
                  <ClipboardCheck className="h-5 w-5" /> Sécurisation des risques
                </div>
                <h3 className="text-3xl md:text-4xl font-bold font-headline text-zinc-900 leading-tight">
                  {dictionary.auditSection.title}
                </h3>
                <p className="text-lg text-zinc-600 leading-relaxed">
                  {dictionary.auditSection.subtitle}
                </p>
                <div className="space-y-4">
                  {dictionary.auditSection.points.map((point, i) => (
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
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="container relative text-center text-white space-y-10">
          <Factory className="h-16 w-16 mx-auto text-primary" />
          <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">
            Prêt à sécuriser votre chaîne d'approvisionnement ?
          </h2>
          <p className="text-2xl text-zinc-400 max-w-2xl mx-auto font-medium">
            Contactez notre équipe de sourcing aujourd'hui et obtenez un premier diagnostic de vos besoins.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 h-16 px-12 text-xl font-black shadow-2xl" asChild>
              <Link href="/contact">
                DEMANDER UN DEVIS SOURCING <ArrowRight className="ml-3 h-6 w-6"/>
              </Link>
            </Button>
          </div>
          <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">Analyse gratuite sous 24 heures • Expertise multi-secteurs</p>
        </div>
      </section>
    </>
  );
}
