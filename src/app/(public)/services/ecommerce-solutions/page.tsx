
import Image from 'next/image';
import { Check } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EcommerceSolutionsPage() {
  const dictionary = {
    hero: {
      title: "Solutions E-commerce & Dropshipping",
      subtitle: "Un soutien de bout en bout pour votre boutique en ligne, d'Amazon FBA à Shopify."
    },
    cta: "Lancer mon projet E-commerce",
    features: {
      title: "Nos solutions pour le E-commerce :",
      items: [
        { title: "Sourcing de Produits Gagnants", description: "Nous identifions pour vous des produits tendance à fort potentiel pour les plateformes comme Amazon FBA, Shopify, etc." },
        { title: "Branding et Packaging Personnalisé", description: "Créez une véritable identité de marque, du logo à l'emballage sur mesure, pour vous différencier de la concurrence." },
        { title: "Préparation FBA et 3PL Conforme", description: "Nous nous occupons de l'étiquetage, de l'emballage et de la préparation de vos produits selon les standards stricts d'Amazon et autres centres logistiques." },
        { title: "Dropshipping et Fulfillment depuis la Chine", description: "Optimisez vos flux en gérant vos stocks et en expédiant directement à vos clients finaux depuis nos entrepôts en Chine." }
      ]
    }
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'ecommerce-hero');
  const featureImage1 = PlaceHolderImages.find(p => p.id === 'ecommerce-feature-1');
  const featureImage2 = PlaceHolderImages.find(p => p.id === 'ecommerce-feature-2');

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
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Nous vous accompagnons à chaque étape de votre aventure e-commerce, de l'idée à l'expédition.</p>
            </div>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {dictionary.features.items.map((item, index) => (
              <Card key={item.title} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center">
                    <Check className="h-6 w-6 mr-4 text-primary flex-shrink-0" />
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4">
                <h3 className="text-2xl font-bold font-headline">Packaging & Branding à votre image</h3>
                <p className="text-muted-foreground">Un emballage réussi est votre premier contact avec le client. Nous vous aidons à concevoir et produire des packagings qui non seulement protègent votre produit, mais renforcent aussi votre image de marque et améliorent l'expérience client.</p>
            </div>
            {featureImage1 && 
                <div className="relative h-80 w-full rounded-lg overflow-hidden">
                    <Image src={featureImage1.imageUrl} alt={featureImage1.description} data-ai-hint={featureImage1.imageHint} fill className="object-cover"/>
                </div>
            }
        </div>
         <div className="container grid md:grid-cols-2 gap-8 md:gap-12 items-center mt-12">
            {featureImage2 && 
                <div className="relative h-80 w-full rounded-lg overflow-hidden md:order-last">
                    <Image src={featureImage2.imageUrl} alt={featureImage2.description} data-ai-hint={featureImage2.imageHint} fill className="object-cover"/>
                </div>
            }
            <div className="space-y-4">
                <h3 className="text-2xl font-bold font-headline">Préparation FBA & 3PL sans faille</h3>
                <p className="text-muted-foreground">Vendez sur Amazon en toute sérénité. Nous nous assurons que vos produits sont étiquetés, emballés et conditionnés en parfaite conformité avec les exigences complexes d'Amazon FBA et des autres plateformes logistiques (3PL), évitant ainsi tout refus ou retard coûteux.</p>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30 text-center">
        <div className="container">
          <h2 className="text-3xl font-headline font-bold">Votre succès en ligne commence en Chine</h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Confiez-nous votre sourcing et votre logistique pour construire une boutique en ligne rentable et pérenne.</p>
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

    