
import Image from 'next/image';
import { Check } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CustomServicesPage() {
  const dictionary = {
    hero: {
      title: "Services sur Mesure & Conseil",
      subtitle: "Des solutions personnalisées pour vos besoins uniques d'importation et de développement produit."
    },
    cta: "Discuter de mon projet sur mesure",
    features: {
      title: "Nos services personnalisés pour des projets uniques :",
      items: [
        { title: "Développement de Produit (OEM/ODM)", description: "Nous vous accompagnons de l'idée au prototype, incluant la conception, l'ingénierie, la recherche de matériaux et la création de moules.", imageUrlId: "custom-services-feature-1" },
        { title: "Assistance Salons (Foire de Canton)", description: "Optimisez vos visites sur les salons professionnels en Chine (Foire de Canton, etc.) avec notre accompagnement logistique, notre traduction et nos conseils en négociation.", imageUrlId: "custom-services-feature-2" },
        { title: "Conseil en Stratégie d'Achat", description: "Nous analysons votre chaîne d'approvisionnement actuelle et vous proposons des pistes concrètes d'optimisation pour réduire les coûts et les risques.", imageUrlId: "custom-services-feature-3" },
        { title: "Gestion de Projets d'Importation Complexes", description: "Nous prenons en charge de A à Z vos projets spécifiques nécessitant une coordination multi-fournisseurs, des compétences techniques pointues ou une logistique particulière.", imageUrlId: "custom-services-feature-4" }
      ]
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'custom-services-hero');

  return (
    <>
      <section className="relative w-full h-[60vh] text-primary-foreground pt-16 md:pt-0 md:-mt-16">
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
            <div className="text-center mb-16">
                 <h2 className="text-3xl font-headline font-bold text-primary mb-6">
                    {dictionary.features.title}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Votre projet ne rentre dans aucune case ? C'est notre spécialité.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {dictionary.features.items.map((item) => {
                    const featureImage = PlaceHolderImages.find(p => p.id === item.imageUrlId);
                    return (
                        <Card key={item.title} className="overflow-hidden group">
                           {featureImage && (
                             <div className="relative h-64 w-full">
                                <Image src={featureImage.imageUrl} alt={item.title} data-ai-hint={featureImage.imageHint} fill className="object-cover transition-transform duration-300 group-hover:scale-105"/>
                             </div>
                           )}
                            <CardHeader>
                                <CardTitle>{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{item.description}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30 text-center">
        <div className="container">
          <h2 className="text-3xl font-headline font-bold">Un projet unique mérite une solution unique.</h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Contactez-nous pour nous exposer votre besoin. Nous construirons ensemble la stratégie d'approvisionnement qui vous convient.</p>
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

    