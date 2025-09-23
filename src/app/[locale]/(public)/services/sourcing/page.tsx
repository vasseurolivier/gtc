
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileSignature, Handshake, Beaker, Factory, Shirt, ToyBrick, Lamp } from 'lucide-react';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function SourcingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const sourcingPageDict = dictionary.sourcingPage;

  const sourcingFeatures = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: sourcingPageDict.features.feature1.title,
      description: sourcingPageDict.features.feature1.description
    },
    {
      icon: <FileSignature className="h-8 w-8 text-primary" />,
      title: sourcingPageDict.features.feature2.title,
      description: sourcingPageDict.features.feature2.description
    },
    {
      icon: <Handshake className="h-8 w-8 text-primary" />,
      title: sourcingPageDict.features.feature3.title,
      description: sourcingPageDict.features.feature3.description
    },
    {
      icon: <Beaker className="h-8 w-8 text-primary" />,
      title: sourcingPageDict.features.feature4.title,
      description: sourcingPageDict.features.feature4.description
    }
  ];

  const factoryExamples = [
    {
      icon: <Shirt className="h-10 w-10 text-primary" />,
      title: sourcingPageDict.partnerships.partner1.title,
      description: sourcingPageDict.partnerships.partner1.description
    },
    {
      icon: <Factory className="h-10 w-10 text-primary" />,
      title: sourcingPageDict.partnerships.partner2.title,
      description: sourcingPageDict.partnerships.partner2.description
    },
    {
      icon: <Lamp className="h-10 w-10 text-primary" />,
      title: sourcingPageDict.partnerships.partner3.title,
      description: sourcingPageDict.partnerships.partner3.description
    },
    {
      icon: <ToyBrick className="h-10 w-10 text-primary" />,
      title: sourcingPageDict.partnerships.partner4.title,
      description: sourcingPageDict.partnerships.partner4.description
    }
  ];

  const heroImage = PlaceHolderImages.find(p => p.id === 'sourcing-hero');
  const processImage = PlaceHolderImages.find(p => p.id === 'sourcing-process');

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
                  {sourcingPageDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {sourcingPageDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              {sourcingPageDict.approach.title}
            </h2>
            <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              {sourcingPageDict.approach.subtitle}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
                {sourcingFeatures.map((feature, index) => (
                <div key={feature.title} className="flex gap-6">
                    <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            {feature.icon}
                        </div>
                    </div>
                    <div>
                    <h3 className="font-headline text-xl font-semibold">
                        {feature.title}
                    </h3>
                    <div className="mt-2 text-muted-foreground leading-relaxed">
                        {feature.description}
                    </div>
                    </div>
                </div>
                ))}
            </div>
            <div className="relative h-full min-h-[400px] rounded-xl overflow-hidden">
                 {processImage && (
                    <Image
                        src={processImage.imageUrl}
                        alt={processImage.description}
                        data-ai-hint={processImage.imageHint}
                        fill
                        className="object-cover"
                    />
                 )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              {sourcingPageDict.partnerships.title}
            </h2>
            <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              {sourcingPageDict.partnerships.subtitle}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {factoryExamples.map((example) => (
              <Card key={example.title} className="text-center flex flex-col items-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0">
                  {example.icon}
                  <CardTitle className="mt-6 font-headline text-xl">
                    {example.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="text-muted-foreground text-sm leading-relaxed">
                    {example.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
                {sourcingPageDict.cta.title}
            </h2>
            <div className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {sourcingPageDict.cta.subtitle}
            </div>
        </div>
      </section>
    </>
  );
}

    