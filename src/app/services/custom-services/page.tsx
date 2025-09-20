import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { TranslatedContent } from '@/components/shared/translated-content';
import { FlaskConical, Users, Briefcase, Network, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const customServicesFeatures = [
  {
    icon: <FlaskConical className="h-8 w-8 text-primary" />,
    title: "Développement de Produit sur Mesure (OEM/ODM)",
    description: "Vous avez une idée innovante ? Nous la transformons en réalité. Nous vous accompagnons de la conception 3D et du prototypage à la recherche de matériaux spécifiques et à la mise en place d'une ligne de production dédiée."
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Assistance pour Salons Professionnels",
    description: "Optimisez votre visite en Chine. Nous vous accompagnons sur les salons majeurs comme la Foire de Canton, en assurant la traduction, la prise de contact, la présélection des stands pertinents et le suivi post-salon."
  },
  {
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    title: "Conseil en Stratégie d'Achat",
    description: "Au-delà de l'opérationnel, nous vous apportons une vision stratégique. Nous analysons votre chaîne d'approvisionnement, identifions les points de friction et proposons des solutions pour réduire les coûts, minimiser les risques et améliorer l'efficacité."
  },
  {
    icon: <Network className="h-8 w-8 text-primary" />,
    title: "Gestion de Projets Complexes",
    description: "Pour les projets nécessitant la coordination de multiples fournisseurs, des compétences techniques pointues ou un cahier des charges particulièrement exigeant, nous agissons comme votre chef de projet unique en Chine, garantissant la cohésion et le succès du projet."
  }
];

const detailedServices = [
    {
        id: "oem-odm",
        title: "Du Concept au Produit Fini : Notre Processus OEM/ODM",
        description: "Nous transformons votre vision en un produit commercialisable grâce à un processus structuré et collaboratif.",
        imageUrlId: "custom-services-feature-1",
        points: [
            "Analyse du cahier des charges et étude de faisabilité.",
            "Conception 3D, modélisation et création de prototypes.",
            "Sourcing de matériaux et composants spécifiques.",
            "Sélection de l'usine la plus adaptée et mise en production.",
            "Suivi de la fabrication et contrôle qualité à chaque étape."
        ]
    },
    {
        id: "trade-shows",
        title: "Maximisez Votre Impact sur les Salons Professionnels",
        description: "Faites de votre visite sur les salons chinois un investissement rentable avec un accompagnement sur mesure.",
        imageUrlId: "custom-services-feature-2",
        points: [
            "Préparation en amont : définition des objectifs, présélection des exposants.",
            "Accompagnement sur place : traduction technique, aide à la négociation.",
            "Logistique : réservation d'hôtel, transport, organisation de l'agenda.",
            "Suivi post-salon : centralisation des contacts, suivi des offres, gestion des échantillons.",
            "Organisation de visites d'usines en marge du salon."
        ]
    },
     {
        id: "purchasing-strategy",
        title: "Une Stratégie d'Achat Intelligente pour une Croissance Durable",
        description: "Nous optimisons votre chaîne d'approvisionnement pour la rendre plus résiliente, plus efficace et moins coûteuse.",
        imageUrlId: "custom-services-feature-3",
        points: [
            "Audit complet de votre chaîne d'approvisionnement actuelle.",
            "Analyse des risques (géopolitiques, logistiques, fournisseurs).",
            "Rationalisation du panel de fournisseurs et identification de sources alternatives.",
            "Mise en place d'indicateurs de performance (KPIs).",
            "Conseil sur les Incoterms et les stratégies de dédouanement."
        ]
    },
    {
        id: "project-management",
        title: "Gestion de Projets Complexes : Votre Chef d'Orchestre en Chine",
        description: "Nous assurons la synchronisation parfaite de tous les intervenants pour mener à bien vos projets les plus ambitieux.",
        imageUrlId: "custom-services-feature-4",
        points: [
            "Point de contact unique pour tous les fournisseurs et parties prenantes.",
            "Élaboration d'un planning détaillé et suivi rigoureux des jalons.",
            "Gestion de la documentation technique et des conformités réglementaires.",
            "Coordination des flux logistiques entre les différents sites de production.",
            "Reporting régulier et transparent sur l'avancement du projet."
        ]
    }
]

export default function CustomServicesPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'custom-services-hero');

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
                  <TranslatedContent content="Services sur Mesure et Conseil Stratégique" />
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  <TranslatedContent content="Des solutions flexibles conçues pour répondre précisément à vos défis commerciaux uniques en Chine." />
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              <TranslatedContent content="Votre Partenaire pour l'Extra-Miliaire" />
            </h2>
            <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              <TranslatedContent content="Quand vos besoins dépassent le cadre standard, notre expertise et notre flexibilité font toute la différence." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {customServicesFeatures.map((feature, index) => (
                  <Card key={index} className="w-full flex flex-col md:flex-row items-center p-6 gap-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex-shrink-0">
                          {feature.icon}
                      </div>
                      <div className="text-center md:text-left">
                          <CardTitle className="text-xl font-headline">
                            <TranslatedContent content={feature.title} />
                          </CardTitle>
                          <CardContent className="p-0 mt-2">
                              <p className="text-muted-foreground">
                                <TranslatedContent content={feature.description} />
                              </p>
                          </CardContent>
                      </div>
                  </Card>
              ))}
          </div>
        </div>
      </section>
      
       <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container space-y-20">
          {detailedServices.map((service, index) => {
            const image = PlaceHolderImages.find(p => p.id === service.imageUrlId);
            const isOdd = index % 2 !== 0;

            return (
              <div key={service.id} className="grid md:grid-cols-2 gap-12 items-center">
                <div className={`relative h-96 rounded-xl overflow-hidden shadow-lg ${isOdd ? 'md:order-last' : ''}`}>
                    {image && <Image src={image.imageUrl} alt={service.title} data-ai-hint={image.imageHint} fill className="object-cover"/>}
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-headline font-bold text-primary">
                    <TranslatedContent content={service.title} />
                  </h3>
                  <div className="mt-4 text-muted-foreground text-lg">
                    <TranslatedContent content={service.description} />
                  </div>
                  <ul className="mt-6 space-y-3">
                    {service.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-3 mt-1 text-accent flex-shrink-0" />
                        <span className="text-muted-foreground">
                          <TranslatedContent content={point} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
                <TranslatedContent content="Vous avez un projet qui sort de l'ordinaire ?" />
            </h2>
            <div className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                <TranslatedContent content="Nous aimons les défis. Contactez-nous pour discuter de vos besoins spécifiques et nous construirons ensemble une solution sur mesure." />
            </div>
        </div>
      </section>
    </>
  );
}
