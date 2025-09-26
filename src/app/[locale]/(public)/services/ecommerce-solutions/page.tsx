
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Lightbulb, Package, Boxes, Rocket } from 'lucide-react';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function EcommerceSolutionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const ecommerceDict = dictionary.ecommerceSolutionsPage;

  const ecommerceFeatures = [
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: ecommerceDict.features.feature1.title,
      description: ecommerceDict.features.feature1.description
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: ecommerceDict.features.feature2.title,
      description: ecommerceDict.features.feature2.description
    },
    {
      icon: <Boxes className="h-8 w-8 text-primary" />,
      title: ecommerceDict.features.feature3.title,
      description: ecommerceDict.features.feature3.description
    },
    {
      icon: <Rocket className="h-8 w-8 text-primary" />,
      title: ecommerceDict.features.feature4.title,
      description: ecommerceDict.features.feature4.description
    }
  ];

  const heroImage = PlaceHolderImages.find(p => p.id === 'ecommerce-hero');
  const featureImage1 = PlaceHolderImages.find(p => p.id === 'ecommerce-feature-1');
  const featureImage2 = PlaceHolderImages.find(p => p.id === 'ecommerce-feature-2');

  return (
    <>
      <section className="relative w-full h-[60vh] text-primary-foreground -mt-16">
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
                  {ecommerceDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {ecommerceDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              {ecommerceDict.accelerator.title}
            </h2>
            <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              {ecommerceDict.accelerator.subtitle}
            </div>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                {ecommerceFeatures[0].icon}
                <h3 className="font-headline text-2xl font-bold mt-4">
                  {ecommerceFeatures[0].title}
                </h3>
                <div className="mt-2 text-muted-foreground text-lg">
                  {ecommerceFeatures[0].description}
                </div>
                
                {ecommerceFeatures[1].icon}
                <h3 className="font-headline text-2xl font-bold mt-8">
                  {ecommerceFeatures[1].title}
                </h3>
                <div className="mt-2 text-muted-foreground text-lg">
                  {ecommerceFeatures[1].description}
                </div>
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
                  {ecommerceFeatures[2].title}
                </h3>
                <div className="mt-2 text-muted-foreground text-lg">
                  {ecommerceFeatures[2].description}
                </div>
                
                {ecommerceFeatures[3].icon}
                <h3 className="font-headline text-2xl font-bold mt-8">
                  {ecommerceFeatures[3].title}
                </h3>
                <div className="mt-2 text-muted-foreground text-lg">
                  {ecommerceFeatures[3].description}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
                {ecommerceDict.cta.title}
            </h2>
            <div className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {ecommerceDict.cta.subtitle}
            </div>
        </div>
      </section>
    </>
  );
}

    