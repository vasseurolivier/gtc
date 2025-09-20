import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, PackageSearch, ShoppingCart, Wrench } from 'lucide-react';
import { TranslatedContent } from '@/components/shared/translated-content';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const services = [
  {
    icon: <PackageSearch className="h-10 w-10 text-primary" />,
    title: "Sourcing et Achat",
    shortDescription: "Trouvez et évaluez les meilleurs fournisseurs pour vos produits.",
    link: "/services/sourcing",
    details: [
      { title: "Identification de Fournisseurs", description: "Recherche et sélection de fabricants qualifiés correspondant à votre cahier des charges." },
      { title: "Vérification et Audit d'Usine", description: "Inspections sur site pour évaluer la capacité de production, les certifications et la conformité sociale." },
      { title: "Négociation des Prix", description: "Obtention des meilleures conditions tarifaires grâce à notre connaissance du marché local." },
      { title: "Échantillonnage", description: "Gestion de la création et de l'envoi d'échantillons pour validation avant production de masse." },
    ]
  },
  {
    icon: <ArrowLeftRight className="h-10 w-10 text-primary" />,
    title: "Trading et Logistique",
    shortDescription: "Facilitez vos opérations d'import-export avec une gestion complète.",
    link: "/services/trading-logistics",
    details: [
      { title: "Gestion des Commandes", description: "Suivi de la production et communication constante avec les fournisseurs pour respecter les délais." },
      { title: "Contrôle Qualité", description: "Inspections pré-production, en cours de production et finales pour garantir la conformité de vos produits." },
      { title: "Logistique Internationale", description: "Organisation du transport (aérien, maritime), du dédouanement et de la documentation nécessaire." },
      { title: "Consolidation des Expéditions", description: "Regroupement de commandes de différents fournisseurs pour optimiser les coûts de transport." },
    ]
  },
  {
    icon: <ShoppingCart className="h-10 w-10 text-primary" />,
    title: "Solutions E-commerce",
    shortDescription: "Un soutien de bout en bout pour votre boutique en ligne.",
    link: "/services/ecommerce-solutions",
    details: [
      { title: "Sourcing de Produits Gagnants", description: "Identification de produits tendance et à fort potentiel pour les plateformes comme Amazon FBA, Shopify, etc." },
      { title: "Branding et Packaging Personnalisé", description: "Création de votre identité de marque, de la conception du logo à l'emballage sur mesure." },
      { title: "Préparation FBA et 3PL", description: "Étiquetage, emballage et préparation des produits selon les standards Amazon ou autres centres logistiques." },
      { title: "Dropshipping et Fulfillment", description: "Gestion des stocks et expédition directe à vos clients finaux depuis nos entrepôts en Chine." },
    ]
  },
  {
    icon: <Wrench className="h-10 w-10 text-primary" />,
    title: "Services sur Mesure",
    shortDescription: "Des solutions personnalisées pour vos besoins uniques.",
    link: "/services/custom-services",
    details: [
      { title: "Développement de Produit", description: "Accompagnement de l'idée au prototype, incluant la conception, l'ingénierie et la recherche de matériaux." },
      { title: "Assistance pour les Salons Professionnels", description: "Accompagnement et traduction lors de vos visites sur les salons comme la Foire de Canton." },
      { title: "Conseil en Stratégie d'Achat", description: "Analyse de votre chaîne d'approvisionnement actuelle et proposition de pistes d'optimisation." },
      { title: "Gestion de Projets Complexes", description: "Prise en charge de projets spécifiques nécessitant une coordination multi-fournisseurs et des compétences techniques pointues." },
    ]
  }
];

export default function ServicesPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">
          <TranslatedContent content="Des Solutions Complètes pour Votre Entreprise" />
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          <TranslatedContent content="De la recherche du bon fournisseur à la livraison chez vous, découvrez comment nous pouvons vous aider à chaque étape de votre chaîne d'approvisionnement." />
        </p>
      </div>

      <div className="space-y-12">
        {services.map((service) => (
          <Card key={service.title} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="grid md:grid-cols-12">
              <div className="md:col-span-4 p-8 bg-secondary/30 flex flex-col justify-center">
                  <div className="flex items-center gap-4">
                    {service.icon}
                    <CardTitle className="font-headline text-2xl">
                      <TranslatedContent content={service.title} />
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-4 text-base">
                    <TranslatedContent content={service.shortDescription} />
                  </CardDescription>
                  <Button asChild className="mt-6 w-fit">
                    <Link href={service.link}>
                      <TranslatedContent content="En savoir plus"/>
                      <ChevronRight className="ml-2 h-4 w-4"/>
                    </Link>
                  </Button>
              </div>
              <div className="md:col-span-8 p-8">
                <Accordion type="single" collapsible className="w-full">
                  {service.details.map((detail, i) => (
                     <AccordionItem value={`item-${service.title}-${i}`} key={i}>
                       <AccordionTrigger className="font-semibold hover:no-underline text-left">
                         <TranslatedContent content={detail.title} />
                       </AccordionTrigger>
                       <AccordionContent className="text-muted-foreground">
                         <TranslatedContent content={detail.description} />
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
  );
}
