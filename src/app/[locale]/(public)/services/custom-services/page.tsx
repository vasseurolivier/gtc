
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FlaskConical, Users, Briefcase, Network, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function CustomServicesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const customServicesDict = dictionary.customServicesPage;
  
  const customServicesFeatures = [
    {
      icon: <FlaskConical className="h-8 w-8 text-primary" />,
      title: customServicesDict.features.feature1.title,
      description: customServicesDict.features.feature1.description
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: customServicesDict.features.feature2.title,
      description: customServicesDict.features.feature2.description
    },
    {
      icon: <Briefcase className="h-8 w-8 text-primary" />,
      title: customServicesDict.features.feature3.title,
      description: customServicesDict.features.feature3.description
    },
    {
      icon: <Network className="h-8 w-8 text-primary" />,
      title: customServicesDict.features.feature4.title,
      description: customServicesDict.features.feature4.description
    }
  ];
  
  const detailedServices = [
      {
          id: "oem-odm",
          title: customServicesDict.detailedServices.service1.title,
          description: customServicesDict.detailedServices.service1.description,
          imageUrlId: "custom-services-feature-1",
          points: customServicesDict.detailedServices.service1.points
      },
      {
          id: "trade-shows",
          title: customServicesDict.detailedServices.service2.title,
          description: customServicesDict.detailedServices.service2.description,
          imageUrlId: "custom-services-feature-2",
          points: customServicesDict.detailedServices.service2.points
      },
       {
          id: "purchasing-strategy",
          title: customServicesDict.detailedServices.service3.title,
          description: customServicesDict.detailedServices.service3.description,
          imageUrlId: "custom-services-feature-3",
          points: customServicesDict.detailedServices.service3.points
      },
      {
          id: "project-management",
          title: customServicesDict.detailedServices.service4.title,
          description: customServicesDict.detailedServices.service4.description,
          imageUrlId: "custom-services-feature-4",
          points: customServicesDict.detailedServices.service4.points
      }
  ]

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
                  {customServicesDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {customServicesDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              {customServicesDict.extraMile.title}
            </h2>
            <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              {customServicesDict.extraMile.subtitle}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {customServicesFeatures.map((feature, index) => (
                  <Card key={index} className="w-full flex flex-col md:flex-row items-center p-6 gap-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex-shrink-0">
                          {feature.icon}
                      </div>
                      <div className="text-center md:text-left">
                          <CardTitle className="text-xl font-headline">
                            {feature.title}
                          </CardTitle>
                          <CardContent className="p-0 mt-2">
                              <div className="text-muted-foreground">
                                {feature.description}
                              </div>
                          </CardContent>
                      </div>
                  </Card>
              ))}
          </div>
        </div>
      </section>
      
       <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container space-y-20">
          {detailedServices.map((service, index) => {
            const image = PlaceHolderImages.find(p => p.id === service.imageUrlId);
            const isOdd = index % 2 !== 0;

            return (
              <div key={service.id} className="grid md:grid-cols-2 gap-12 items-center">
                <div className={`relative h-96 rounded-xl overflow-hidden shadow-lg ${isOdd ? 'md:order-last' : ''}`}>
                    {image && <Image src={image.imageUrl} alt={service.title} data-ai-hint={image.imageHint} fill className="object-cover"/>}
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-headline font-bold text-primary">
                    {service.title}
                  </h3>
                  <div className="mt-4 text-muted-foreground text-lg">
                    {service.description}
                  </div>
                  <ul className="mt-6 space-y-3">
                    {service.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-3 mt-1 text-accent flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
                {customServicesDict.cta.title}
            </h2>
            <div className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {customServicesDict.cta.subtitle}
            </div>
        </div>
      </section>
    </>
  );
}

    