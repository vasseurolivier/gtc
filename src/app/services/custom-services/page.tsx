import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { TranslatedContent } from '@/components/shared/translated-content';
import { FlaskConical, Users, Briefcase, Network } from 'lucide-react';

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
              <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  <TranslatedContent content="Des solutions flexibles conçues pour répondre précisément à vos défis commerciaux uniques en Chine." />
              </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              <TranslatedContent content="Votre Partenaire pour l'Extra-Miliaire" />
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              <TranslatedContent content="Quand vos besoins dépassent le cadre standard, notre expertise et notre flexibilité font toute la différence." />
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {customServicesFeatures.map((feature) => (
              <div key={feature.title} className="flex gap-6">
                <div className="flex-shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="font-headline text-xl font-semibold">
                    <TranslatedContent content={feature.title} />
                  </h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    <TranslatedContent content={feature.description} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
                <TranslatedContent content="Vous avez un projet qui sort de l'ordinaire ?" />
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                <TranslatedContent content="Nous aimons les défis. Contactez-nous pour discuter de vos besoins spécifiques et nous construirons ensemble une solution sur mesure." />
            </p>
             {/* CTA Button could be added here */}
        </div>
      </section>
    </>
  );
}
