import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { TranslatedContent } from '@/components/shared/translated-content';
import { Lightbulb, Package, Boxes, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ecommerceFeatures = [
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: "Sourcing de Produits Gagnants",
    description: "Grâce à notre analyse du marché et à notre présence sur le terrain, nous identifions des produits tendance avec un fort potentiel de marge pour des plateformes comme Amazon FBA, Shopify, et les places de marché européennes."
  },
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    title: "Branding et Packaging sur Mesure",
    description: "Différenciez-vous de la concurrence. Nous vous aidons à créer une marque forte, de la conception de votre logo à la réalisation d'emballages personnalisés (boîtes, étiquettes, manuels d'utilisation) qui ravira vos clients."
  },
  {
    icon: <Boxes className="h-8 w-8 text-primary" />,
    title: "Préparation FBA & 3PL Conforme",
    description: "Évitez les refus et les retards coûteux. Nous préparons vos produits selon les spécifications les plus strictes d'Amazon (étiquetage FNSKU, polybags, cartons master) ou de tout autre service logistique tiers (3PL)."
  },
  {
    icon: <Rocket className="h-8 w-8 text-primary" />,
    title: "Dropshipping et Fulfillment Fiables",
    description: "Lancez-vous sans investir dans un stock massif. Nous proposons des solutions de dropshipping où nous stockons vos produits et les expédions directement à vos clients finaux, avec des options de suivi et un packaging personnalisé."
  }
];

export default function EcommerceSolutionsPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'ecommerce-hero');
  const featureImage1 = PlaceHolderImages.find(p => p.id === 'ecommerce-feature-1');
  const featureImage2 = PlaceHolderImages.find(p => p.id === 'ecommerce-feature-2');

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
                  <TranslatedContent content="Solutions E-commerce Intégrées" />
              </h1>
              <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  <TranslatedContent content="Votre partenaire unique pour lancer et faire grandir votre boutique en ligne avec des produits sourcés en Chine." />
              </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              <TranslatedContent content="Votre Accélérateur E-commerce" />
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              <TranslatedContent content="Nous fournissons l'infrastructure et l'expertise nécessaires pour transformer votre idée en une entreprise e-commerce prospère." />
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                {ecommerceFeatures[0].icon}
                <h3 className="font-headline text-2xl font-bold mt-4">
                  <TranslatedContent content={ecommerceFeatures[0].title} />
                </h3>
                <p className="mt-2 text-muted-foreground text-lg">
                  <TranslatedContent content={ecommerceFeatures[0].description} />
                </p>
                
                {ecommerceFeatures[1].icon}
                <h3 className="font-headline text-2xl font-bold mt-8">
                  <TranslatedContent content={ecommerceFeatures[1].title} />
                </h3>
                <p className="mt-2 text-muted-foreground text-lg">
                  <TranslatedContent content={ecommerceFeatures[1].description} />
                </p>
              </div>
              {featureImage1 && 
                <div className="relative h-96 rounded-xl overflow-hidden">
                    <Image src={featureImage1.imageUrl} alt={featureImage1.description} data-ai-hint={featureImage1.imageHint} fill className="object-cover"/>
                </div>
              }
            </div>

             <div className="grid md:grid-cols-2 gap-12 items-center">
              {featureImage2 && 
                <div className="relative h-96 rounded-xl overflow-hidden md:order-last">
                    <Image src={featureImage2.imageUrl} alt={featureImage2.description} data-ai-hint={featureImage2.imageHint} fill className="object-cover"/>
                </div>
              }
              <div>
                {ecommerceFeatures[2].icon}
                <h3 className="font-headline text-2xl font-bold mt-4">
                  <TranslatedContent content={ecommerceFeatures[2].title} />
                </h3>
                <p className="mt-2 text-muted-foreground text-lg">
                  <TranslatedContent content={ecommerceFeatures[2].description} />
                </p>
                
                {ecommerceFeatures[3].icon}
                <h3 className="font-headline text-2xl font-bold mt-8">
                  <TranslatedContent content={ecommerceFeatures[3].title} />
                </h3>
                <p className="mt-2 text-muted-foreground text-lg">
                  <TranslatedContent content={ecommerceFeatures[3].description} />
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
                <TranslatedContent content="Prêt à lancer votre prochain best-seller ?" />
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                <TranslatedContent content="Discutons de votre projet e-commerce. Que vous soyez un vendeur Amazon expérimenté ou un débutant sur Shopify, nous avons la solution pour vous." />
            </p>
        </div>
      </section>
    </>
  );
}
