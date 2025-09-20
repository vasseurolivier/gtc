import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatedContent } from '@/components/shared/translated-content';
import { CheckCircle2, Search, FileSignature, Handshake, Beaker } from 'lucide-react';

const sourcingFeatures = [
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: "Identification de Fournisseurs Stratégiques",
    description: "Nous allons au-delà d'une simple recherche. Nous identifions des partenaires de fabrication qui s'alignent sur vos objectifs à long terme, en évaluant non seulement leur capacité de production actuelle mais aussi leur potentiel d'innovation et de croissance."
  },
  {
    icon: <FileSignature className="h-8 w-8 text-primary" />,
    title: "Vérification et Audit d'Usine Approfondis",
    description: "Nos audits sur site sont exhaustifs. Nous vérifions les licences, les certifications (ISO, BSCI, etc.), la stabilité financière, les conditions de travail et l'impact environnemental pour vous garantir un partenaire fiable et éthique."
  },
  {
    icon: <Handshake className="h-8 w-8 text-primary" />,
    title: "Négociation Experte",
    description: "Forts de notre expérience et de nos relations locales, nous négocions non seulement les meilleurs prix, mais aussi des conditions de paiement favorables, des délais de production optimisés et des clauses de qualité strictes pour protéger vos intérêts."
  },
  {
    icon: <Beaker className="h-8 w-8 text-primary" />,
    title: "Gestion d'Échantillonnage Efficace",
    description: "Nous coordonnons le développement, la production et l'expédition rapide des échantillons. Nous nous assurons que les prototypes et les échantillons de pré-production correspondent exactement à votre cahier des charges avant de lancer la fabrication en série."
  }
];

export default function SourcingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'sourcing-hero');

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
                  <TranslatedContent content="Sourcing et Achat Stratégique en Chine" />
              </h1>
              <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  <TranslatedContent content="De l'identification du fournisseur idéal à la négociation des meilleures conditions, nous sommes votre expert sur le terrain." />
              </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              <TranslatedContent content="Notre Approche du Sourcing" />
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              <TranslatedContent content="Nous transformons la complexité du marché chinois en une opportunité claire et sécurisée pour votre entreprise." />
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {sourcingFeatures.map((feature) => (
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
                <TranslatedContent content="Prêt à trouver le partenaire de fabrication parfait ?" />
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                <TranslatedContent content="Contactez-nous dès aujourd'hui pour discuter de vos besoins en sourcing. Notre équipe est prête à vous aider à naviguer le paysage manufacturier chinois avec confiance." />
            </p>
            {/* CTA Button could be added here */}
        </div>
      </section>
    </>
  );
}
