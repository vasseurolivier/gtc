import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ClipboardList, Microscope, Ship, BookCopy, Timer, DollarSign, FileText, Globe, CheckCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const tradingFeatures = [
  {
    icon: <ClipboardList className="h-10 w-10 text-primary" />,
    title: "Gestion des Commandes Proactive",
    description: "Nous agissons comme votre bureau local. Nous assurons un suivi quotidien de la production, anticipons les retards potentiels et communiquons de manière transparente avec vous et vos fournisseurs pour garantir le respect des délais."
  },
  {
    icon: <Microscope className="h-10 w-10 text-primary" />,
    title: "Contrôle Qualité Multi-Étapes",
    description: "Notre processus de contrôle qualité est intransigeant. Nous effectuons des inspections sur les matières premières (IQC), en cours de production (IPQC) et sur les produits finis (FQC) selon les normes AQL que vous définissez, vous assurant une qualité constante."
  },
  {
    icon: <Ship className="h-10 w-10 text-primary" />,
    title: "Logistique Internationale Optimisée",
    description: "Nous sélectionnons les meilleures options de fret (aérien, maritime, ferroviaire) en fonction de votre budget et de vos délais. Nous gérons toutes les formalités douanières (export en Chine, import dans votre pays) pour une livraison fluide."
  },
  {
    icon: <BookCopy className="h-10 w-10 text-primary" />,
    title: "Consolidation Intelligente",
    description: "Regroupez des commandes de plusieurs fournisseurs en une seule expédition pour réduire drastiquement vos coûts de transport. Nous gérons la collecte, l'entreposage temporaire et le chargement coordonné de vos marchandises."
  }
];

const processSteps = [
    { title: "Confirmation et Suivi", description: "Confirmation de commande et suivi proactif de la production." },
    { title: "Collecte & Consolidation", description: "Regroupement de vos marchandises dans notre entrepôt." },
    { title: "Inspection Qualité", description: "Inspection finale détaillée avec rapport photos/vidéos." },
    { title: "Emballage & Entreposage", description: "Conditionnement pour l'export et stockage sécurisé." },
    { title: "Réservation du Fret", description: "Sélection et réservation du transporteur optimal." },
    { title: "Dédouanement Export", description: "Gestion de toute la documentation pour la sortie de Chine." },
    { title: "Expédition", description: "Chargement et envoi de votre cargaison." },
    { title: "Suivi & Livraison", description: "Tracking en temps réel jusqu'à votre porte." },
];

const shippingOptions = [
    {
        title: "Fret Maritime",
        duration: "50-60 jours",
        cost: "€",
        bestFor: "Commandes volumineuses, non urgentes. Le plus rentable pour les gros volumes.",
        icon: <Ship className="h-8 w-8 text-primary" />
    },
    {
        title: "Fret Aérien",
        duration: "7-12 jours",
        cost: "€€€",
        bestFor: "Commandes urgentes, de grande valeur ou de faible volume. Le plus rapide.",
        icon: <Globe className="h-8 w-8 text-primary" />
    },
    {
        title: "Fret Ferroviaire (vers l'Europe)",
        duration: "30-40 jours",
        cost: "€€",
        bestFor: "Excellent compromis entre le coût du maritime et la rapidité de l'aérien.",
        icon: <Timer className="h-8 w-8 text-primary" />
    }
];

const faqs = [
    {
        question: "Qu'est-ce que l'AQL et comment le définissez-vous ?",
        answer: "AQL (Acceptable Quality Limit) est une norme statistique pour déterminer la taille de l'échantillon à inspecter et le nombre de défauts acceptables. Nous travaillons avec vous pour définir un niveau d'AQL (par exemple, 2.5) adapté à votre produit et à vos exigences de qualité."
    },
    {
        question: "Quels sont les Incoterms et pourquoi sont-ils importants ?",
        answer: "Les Incoterms (EXW, FOB, CIF, DDP, etc.) sont des règles internationales qui définissent les responsabilités de l'acheteur et du vendeur concernant la livraison des marchandises. Un choix judicieux est crucial pour maîtriser les coûts et les risques. Nous vous conseillons sur l'Incoterm le plus adapté à votre stratégie."
    },
    {
        question: "Comment gérez-vous les retards de production ou les problèmes de qualité ?",
        answer: "Grâce à notre suivi proactif, nous anticipons souvent les problèmes. Si un retard ou un défaut est détecté, nous vous en informons immédiatement avec des solutions possibles : négociation avec l'usine, recherche d'alternatives, ou plan de reprise. Notre rôle est de défendre vos intérêts et de minimiser l'impact sur votre activité."
    }
];


export default function TradingLogisticsPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'trading-hero');
  const logisticsImage = PlaceHolderImages.find(p => p.id === 'logistics-process');


  return (
    <>
      <section className="relative w-full h-[40vh] min-h-[300px] text-primary-foreground">
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
                  Trading et Logistique Sans Faille
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  De l'usine à votre porte, nous gérons chaque détail de vos opérations d'import-export pour une tranquillité d'esprit totale.
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              La Maîtrise de la Chaîne Logistique
            </h2>
            <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              Nous transformons les défis logistiques et commerciaux en un processus simple, transparent et efficace.
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {tradingFeatures.map((feature) => (
              <Card key={feature.title} className="text-center flex flex-col items-center p-6 border-t-4 border-t-transparent hover:border-t-primary hover:shadow-xl transition-all duration-300 -translate-y-0 hover:-translate-y-2">
                <CardHeader className="p-0">
                  {feature.icon}
                  <CardTitle className="mt-6 font-headline text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </div>
                </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </section>

       <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative h-full min-h-[500px] rounded-lg overflow-hidden shadow-lg">
                    {logisticsImage && 
                        <Image src={logisticsImage.imageUrl} alt={logisticsImage.description} data-ai-hint={logisticsImage.imageHint} fill className="object-cover" />
                    }
                </div>
                <div>
                    <h2 className="text-3xl font-headline font-bold text-primary mb-6">Notre Processus Logistique Détaillé</h2>
                    <ol className="space-y-4">
                        {processSteps.map((step, index) => (
                            <li key={index} className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-4">{index + 1}</div>
                                <div>
                                    <h3 className="font-semibold text-lg">{step.title}</h3>
                                    <div className="text-muted-foreground">{step.description}</div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Délais & Coûts : Choisir la Bonne Option</h2>
                <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">Chaque expédition est unique. Nous vous aidons à choisir la meilleure méthode de transport en fonction de vos priorités.</div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {shippingOptions.map(option => (
                    <Card key={option.title} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-xl font-headline">{option.title}</CardTitle>
                           {option.icon}
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between">
                            <div>
                                <div className="text-2xl font-bold text-muted-foreground">{option.duration}</div>
                                <div className="text-xs text-muted-foreground uppercase font-semibold">Durée estimée</div>
                                
                                <div className="text-2xl font-bold text-primary mt-4">{option.cost}</div>
                                <div className="text-xs text-muted-foreground uppercase font-semibold">Coût relatif</div>
                            </div>
                            <div className="mt-4 text-sm text-muted-foreground pt-4 border-t">{option.bestFor}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
          <div className="container">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Notre Engagement Qualité : Zéro Compromis</h2>
                <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">La qualité n'est pas une option, c'est notre promesse. Découvrez comment nous protégeons votre investissement et votre réputation.</div>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Microscope className="w-8 h-8 text-primary"/></div>
                    <h3 className="text-xl font-headline font-semibold">Inspection sur Mesure</h3>
                    <div className="text-muted-foreground mt-2">Nous développons une check-list d'inspection spécifique à votre produit, couvrant l'esthétique, les dimensions, la fonctionnalité, l'emballage et l'étiquetage.</div>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-primary"/></div>
                    <h3 className="text-xl font-headline font-semibold">Normes AQL</h3>
                    <div className="text-muted-foreground mt-2">Nous appliquons les standards internationaux AQL (Acceptable Quality Limit) pour une évaluation objective et statistique de la qualité de vos lots de production.</div>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-primary"/></div>
                    <h3 className="text-xl font-headline font-semibold">Rapports Détaillés</h3>
                    <div className="text-muted-foreground mt-2">Vous recevez un rapport complet avec photos et vidéos après chaque inspection, vous donnant une vision claire de la situation avant même que la marchandise ne quitte l'usine.</div>
                </div>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Douanes & Documentation : Naviguer la Complexité</h2>
                <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">Nous gérons la paperasse pour que vous n'ayez pas à le faire. Une documentation correcte est la clé d'une expédition sans heurt.</div>
            </div>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Documentation d'Exportation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                            <li>Facture Commerciale</li>
                            <li>Liste de Colisage</li>
                            <li>Connaissement (Bill of Lading) ou Lettre de Transport Aérien (AWB)</li>
                            <li>Certificat d'Origine (si nécessaire)</li>
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Conformité & Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                            <li>Vérification de la conformité aux normes (CE, RoHS, FCC, etc.)</li>
                            <li>Assistance pour l'obtention des certificats de test requis</li>
                            <li>Conseil sur les réglementations spécifiques à votre marché</li>
                            <li>Gestion des licences d'exportation pour produits réglementés</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Questions Fréquentes</h2>
                <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Quelques réponses aux questions que nous recevons le plus souvent.</div>
            </div>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="font-semibold text-lg text-left hover:no-underline">
                            <div className="flex items-center gap-4">
                                <HelpCircle className="h-6 w-6 text-primary flex-shrink-0" />
                                {faq.question}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base pl-10">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
                Optimisez votre chaîne d'approvisionnement dès maintenant.
            </h2>
            <div className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Laissez-nous gérer la complexité de la logistique et du commerce international pour que vous puissiez vous concentrer sur votre croissance.
            </div>
        </div>
      </section>
    </>
  );
}
