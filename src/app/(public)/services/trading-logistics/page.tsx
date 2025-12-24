
import Image from 'next/image';
import { Check } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TradingLogisticsPage() {
  const dictionary = {
    hero: {
      title: "Trading et Logistique Internationale",
      subtitle: "Simplifiez et sécurisez vos opérations d'import-export avec une gestion logistique de bout en bout."
    },
    cta: "Optimiser ma logistique",
    features: {
      title: "Nos services de Trading et Logistique :",
      items: [
        { title: "Gestion et Suivi de Commandes", description: "Nous assurons un suivi rigoureux de la production et une communication constante avec les fournisseurs pour garantir le respect de vos délais." },
        { title: "Contrôle Qualité (AQL)", description: "Des inspections pré-production, en cours de production et finales (selon la norme AQL) pour assurer la conformité totale de vos produits avant expédition." },
        { title: "Logistique et Dédouanement", description: "Nous organisons le transport le plus adapté (aérien, maritime, ferroviaire) et gérons l'ensemble du processus de dédouanement et la documentation nécessaire." },
        { title: "Consolidation des Expéditions", description: "Regroupez vos commandes provenant de différents fournisseurs pour optimiser les coûts de transport et simplifier la réception de vos marchandises." }
      ]
    },
    process: {
      title: "La logistique, notre expertise",
      description: "De l'usine à votre entrepôt, nous maîtrisons chaque maillon de la chaîne logistique.",
      imageUrlId: "logistics-process"
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'trading-hero');
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
        <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  {dictionary.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {dictionary.hero.subtitle}
              </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="relative h-96 rounded-xl overflow-hidden shadow-lg md:order-last">
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
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30 text-center">
        <div className="container">
          <h2 className="text-3xl font-headline font-bold">Prêt à simplifier vos expéditions ?</h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Laissez-nous gérer la complexité de la logistique internationale pour que vous puissiez vous concentrer sur votre croissance.</p>
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
