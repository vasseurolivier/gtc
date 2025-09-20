import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { TranslatedContent } from '@/components/shared/translated-content';
import { ClipboardList, Microscope, Ship, BookCopy } from 'lucide-react';

const tradingFeatures = [
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: "Gestion des Commandes Proactive",
    description: "Nous agissons comme votre bureau local. Nous assurons un suivi quotidien de la production, anticipons les retards potentiels et communiquons de manière transparente avec vous et vos fournisseurs pour garantir le respect des délais."
  },
  {
    icon: <Microscope className="h-8 w-8 text-primary" />,
    title: "Contrôle Qualité Multi-Étapes",
    description: "Notre processus de contrôle qualité est intransigeant. Nous effectuons des inspections sur les matières premières (IQC), en cours de production (IPQC) et sur les produits finis (FQC) selon les normes AQL que vous définissez, vous assurant une qualité constante."
  },
  {
    icon: <Ship className="h-8 w-8 text-primary" />,
    title: "Logistique Internationale Optimisée",
    description: "Nous sélectionnons les meilleures options de fret (aérien, maritime, ferroviaire) en fonction de votre budget et de vos délais. Nous gérons toutes les formalités douanières (export en Chine, import dans votre pays) pour une livraison fluide."
  },
  {
    icon: <BookCopy className="h-8 w-8 text-primary" />,
    title: "Consolidation Intelligente",
    description: "Regroupez des commandes de plusieurs fournisseurs en une seule expédition pour réduire drastiquement vos coûts de transport. Nous gérons la collecte, l'entreposage temporaire et le chargement coordonné de vos marchandises."
  }
];

export default function TradingLogisticsPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'trading-hero');

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
                  <TranslatedContent content="Trading et Logistique Sans Faille" />
              </h1>
              <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  <TranslatedContent content="De l'usine à votre porte, nous gérons chaque détail de vos opérations d'import-export pour une tranquillité d'esprit totale." />
              </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              <TranslatedContent content="La Maîtrise de la Chaîne Logistique" />
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              <TranslatedContent content="Nous transformons les défis logistiques et commerciaux en un processus simple, transparent et efficace." />
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {tradingFeatures.map((feature) => (
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
                <TranslatedContent content="Optimisez votre chaîne d'approvisionnement dès maintenant." />
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                <TranslatedContent content="Laissez-nous gérer la complexité de la logistique et du commerce international pour que vous puissiez vous concentrer sur votre croissance." />
            </p>
             {/* CTA Button could be added here */}
        </div>
      </section>
    </>
  );
}
