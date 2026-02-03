
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, PackageSearch, ShoppingCart, Wrench } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ServicesPage() {
  const servicesPageDict = {
    hero: {
      title: "Solutions Complètes pour votre Chaîne d'Approvisionnement",
      subtitle: "De la recherche de fournisseur à la livraison, découvrez comment nous sécurisons chaque étape de votre importation depuis la Chine."
    },
    learnMore: "En savoir plus",
    services: {
      sourcing: {
        title: "Sourcing et Achat",
        shortDescription: "Trouvez et évaluez les meilleurs fournisseurs chinois pour vos produits.",
        details: [
          { title: "Identification de Fournisseurs Qualifiés", description: "Recherche et sélection de fabricants correspondant à votre cahier des charges et à vos exigences de qualité." },
          { title: "Vérification et Audit d'Usine", description: "Inspections sur site pour évaluer la capacité de production, les certifications et la conformité sociale (BSCI)." },
          { title: "Négociation de Prix et Conditions", description: "Obtention des meilleures conditions tarifaires et de paiement grâce à notre connaissance du marché local." },
          { title: "Gestion des Échantillons", description: "Coordination de la création et de l'envoi d'échantillons pour validation avant toute production de masse." }
        ]
      },
      trading: {
        title: "Trading et Logistique Internationale",
        shortDescription: "Facilitez vos opérations d'import-export avec une gestion logistique complète.",
        details: [
          { title: "Gestion et Suivi des Commandes", description: "Suivi rigoureux de la production et communication constante avec les fournisseurs pour garantir le respect des délais." },
          { title: "Contrôle Qualité (AQL)", description: "Inspections pré-production, en cours de production et finales pour assurer la conformité totale de vos produits." },
          { title: "Logistique et Dédouanement", description: "Organisation du transport (aérien, maritime, ferroviaire), gestion du dédouanement et de la documentation nécessaire." },
          { title: "Consolidation des Expéditions", description: "Regroupement de vos commandes de différents fournisseurs pour optimiser les coûts de transport depuis la Chine." }
        ]
      },
      ecommerce: {
        title: "Solutions E-commerce & Dropshipping",
        shortDescription: "Un soutien de bout en bout pour votre boutique en ligne, d'Amazon FBA à Shopify.",
        details: [
          { title: "Sourcing de Produits Gagnants", description: "Identification de produits tendance à fort potentiel pour les plateformes comme Amazon FBA, Shopify, etc." },
          { title: "Branding et Packaging Personnalisé", description: "Création de votre identité de marque, du logo à l'emballage sur mesure pour vous différencier." },
          { title: "Préparation FBA et 3PL Conforme", description: "Étiquetage, emballage et préparation des produits selon les standards stricts d'Amazon ou autres centres logistiques." },
          { title: "Dropshipping et Fulfillment depuis la Chine", description: "Gestion des stocks et expédition directe à vos clients finaux depuis nos entrepôts, optimisant vos flux." }
        ]
      },
      custom: {
        title: "Services sur Mesure & Conseil",
        shortDescription: "Des solutions personnalisées pour vos besoins uniques d'importation.",
        details: [
          { title: "Développement de Produit (OEM/ODM)", description: "Accompagnement de l'idée au prototype, incluant la conception, l'ingénierie et la recherche de matériaux." },
          { title: "Assistance Salons (Foire de Canton)", description: "Accompagnement et traduction lors de vos visites sur les salons professionnels en Chine." },
          { title: "Conseil en Stratégie d'Achat", description: "Analyse de votre chaîne d'approvisionnement et proposition de pistes d'optimisation pour réduire les coûts et les risques." },
          { title: "Gestion de Projets d'Importation Complexes", description: "Prise en charge de projets spécifiques nécessitant une coordination multi-fournisseurs et des compétences techniques pointues." }
        ]
      }
    }
  };
  const heroImage = PlaceHolderImages.find(p => p.id === 'services-hero');


  const services = [
    {
      icon: <PackageSearch className="h-10 w-10 text-primary" />,
      title: servicesPageDict.services.sourcing.title,
      shortDescription: servicesPageDict.services.sourcing.shortDescription,
      link: "/services/sourcing",
      details: servicesPageDict.services.sourcing.details
    },
    {
      icon: <ArrowLeftRight className="h-10 w-10 text-primary" />,
      title: servicesPageDict.services.trading.title,
      shortDescription: servicesPageDict.services.trading.shortDescription,
      link: "/services/trading-logistics",
      details: servicesPageDict.services.trading.details
    },
    {
      icon: <ShoppingCart className="h-10 w-10 text-primary" />,
      title: servicesPageDict.services.ecommerce.title,
      shortDescription: servicesPageDict.services.ecommerce.shortDescription,
      link: "/services/ecommerce-solutions",
      details: servicesPageDict.services.ecommerce.details
    },
    {
      icon: <Wrench className="h-10 w-10 text-primary" />,
      title: servicesPageDict.services.custom.title,
      shortDescription: servicesPageDict.services.custom.shortDescription,
      link: "/services/custom-services",
      details: servicesPageDict.services.custom.details
    }
  ];

  return (
    <>
      <section className="relative w-full h-[95vh] text-primary-foreground pt-16 md:pt-0 md:-mt-16">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative h-full flex flex-col justify-start md:justify-end items-start text-left p-8 md:p-16 pt-[4cm] md:pt-0 pb-12">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-shadow-lg text-white">
                  {servicesPageDict.hero.title}
              </h1>
              <div className="mt-6 max-w-3xl text-xl md:text-2xl text-neutral-200">
                  {servicesPageDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <div className="container py-16 md:py-24">
        <div className="space-y-12">
          {services.map((service) => (
            <Card key={service.title} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="grid md:grid-cols-12">
                <div className="md:col-span-4 p-8 bg-secondary/30 flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                      {service.icon}
                      <CardTitle className="font-headline text-2xl">
                        {service.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-4 text-base">
                      {service.shortDescription}
                    </CardDescription>
                    <Button asChild className="mt-6 w-fit">
                      <Link href={service.link}>
                        {servicesPageDict.learnMore}
                        <ChevronRight className="ml-2 h-4 w-4"/>
                      </Link>
                    </Button>
                </div>
                <div className="md:col-span-8 p-8">
                  <Accordion type="single" collapsible className="w-full">
                    {service.details.map((detail, i) => (
                      <AccordionItem value={`item-${service.title}-${i}`} key={i}>
                        <AccordionTrigger className="font-semibold hover:no-underline text-left">
                          {detail.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {detail.description}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
