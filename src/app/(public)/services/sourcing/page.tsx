
import Image from 'next/image';
import { Check } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SourcingPage() {
  const dictionary = {
    hero: {
      title: "Sourcing et Achat",
      subtitle: "Trouvez et évaluez les meilleurs fournisseurs chinois pour vos produits, en toute confiance."
    },
    cta: "Contactez-nous pour votre projet",
    features: {
      title: "Nos services de Sourcing et Achat incluent :",
      items: [
        { title: "Identification de Fournisseurs Qualifiés", description: "Recherche et sélection rigoureuse de fabricants correspondant parfaitement à votre cahier des charges et à vos exigences de qualité et de budget." },
        { title: "Vérification et Audit d'Usine", description: "Nous menons des inspections sur site pour évaluer la capacité de production, les certifications (ISO, BSCI, etc.) et la fiabilité de nos partenaires potentiels." },
        { title: "Négociation de Prix et Conditions", description: "Grâce à notre connaissance approfondie du marché local et à nos relations, nous obtenons pour vous les meilleures conditions tarifaires et de paiement." },
        { title: "Gestion des Échantillons", description: "Nous coordonnons la création, la vérification et l'envoi rapide d'échantillons pour que vous puissiez valider la qualité avant toute production de masse." }
      ]
    },
    process: {
      title: "Notre méthodologie de sourcing",
      description: "Un processus transparent et efficace pour garantir le succès de votre approvisionnement.",
      imageUrlId: "sourcing-process"
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'sourcing-hero');
  const processImage = PlaceHolderImages.find(p => p.id === dictionary.process.imageUrlId);

  return (
    <>
      <section className="relative w-full h-[84vh] text-primary-foreground pt-16 md:pt-0 md:-mt-16">
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
        <div className="relative h-full flex flex-col justify-end items-start text-left p-8 md:p-16">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  {dictionary.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl text-lg md:text-xl text-neutral-200">
                  {dictionary.hero.subtitle}
              </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-headline font-bold text-primary mb-6">
                {dictionary.features.title}
              </h2>
              <ul className="space-y-6">
                {dictionary.features.items.map((item) => (
                  <li key={item.title} className="flex">
                    <Check className="h-6 w-6 mr-4 mt-1 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
             <div className="relative h-96 rounded-xl overflow-hidden shadow-lg">
                {processImage && (
                  <Image
                    src={processImage.imageUrl}
                    alt={dictionary.process.description}
                    data-ai-hint={processImage.imageHint}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-2xl font-bold text-white shadow-lg">{dictionary.process.title}</h3>
                    <p className="text-white/90 mt-2 max-w-sm">{dictionary.process.description}</p>
                </div>
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30 text-center">
        <div className="container">
          <h2 className="text-3xl font-headline font-bold">Prêt à trouver le fournisseur idéal ?</h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Discutons de votre projet et laissons notre équipe en Chine vous trouver les meilleures opportunités.</p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/contact">
              {dictionary.cta}
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
