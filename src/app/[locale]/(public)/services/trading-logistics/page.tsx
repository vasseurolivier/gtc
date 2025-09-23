import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ClipboardList, Microscope, Ship, BookCopy, Timer, Globe, CheckCircle, HelpCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale } from '@/i18n-config';

export default async function TradingLogisticsPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const dictionary = await getDictionary(locale);
  const tradingLogisticsDict = dictionary.tradingLogisticsPage;

  const tradingFeatures = [
    {
      icon: <ClipboardList className="h-10 w-10 text-primary" />,
      title: tradingLogisticsDict.features.feature1.title,
      description: tradingLogisticsDict.features.feature1.description
    },
    {
      icon: <Microscope className="h-10 w-10 text-primary" />,
      title: tradingLogisticsDict.features.feature2.title,
      description: tradingLogisticsDict.features.feature2.description
    },
    {
      icon: <Ship className="h-10 w-10 text-primary" />,
      title: tradingLogisticsDict.features.feature3.title,
      description: tradingLogisticsDict.features.feature3.description
    },
    {
      icon: <BookCopy className="h-10 w-10 text-primary" />,
      title: tradingLogisticsDict.features.feature4.title,
      description: tradingLogisticsDict.features.feature4.description
    }
  ];

  const heroImage = PlaceHolderImages.find(p => p.id === 'trading-hero');
  const logisticsImage = PlaceHolderImages.find(p => p.id === 'logistics-process');


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
                  {tradingLogisticsDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {tradingLogisticsDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              {tradingLogisticsDict.supplyChain.title}
            </h2>
            <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              {tradingLogisticsDict.supplyChain.subtitle}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {tradingFeatures.map((feature) => (
              <Card key={feature.title} className="text-center flex flex-col items-center p-6 border-t-4 border-t-transparent hover:border-t-primary hover:shadow-xl transition-all duration-300 -translate-y-0 hover:-translate-y-2">
                <CardHeader className="p-0">
                  {feature.icon}
                  <CardTitle className="mt-6 font-headline text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </div>
                </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </section>

       <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative h-full min-h-[500px] rounded-lg overflow-hidden shadow-lg">
                    {logisticsImage && 
                        <Image src={logisticsImage.imageUrl} alt={logisticsImage.description} data-ai-hint={logisticsImage.imageHint} fill className="object-cover" />
                    }
                </div>
                <div>
                    <h2 className="text-3xl font-headline font-bold text-primary mb-6">{tradingLogisticsDict.logisticsProcess.title}</h2>
                    <ol className="space-y-4">
                        {tradingLogisticsDict.logisticsProcess.steps.map((step, index) => (
                            <li key={index} className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-4">{index + 1}</div>
                                <div>
                                    <h3 className="font-semibold text-lg">{step.title}</h3>
                                    <div className="text-muted-foreground">{step.description}</div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">{tradingLogisticsDict.shippingOptions.title}</h2>
                <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">{tradingLogisticsDict.shippingOptions.subtitle}</div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {tradingLogisticsDict.shippingOptions.options.map((option: any) => (
                    <Card key={option.title} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-xl font-headline">{option.title}</CardTitle>
                           {option.title === "Sea Freight" || option.title === "Fret Maritime" ? <Ship className="h-8 w-8 text-primary" /> : option.title === "Air Freight" || option.title === "Fret Aérien" ? <Globe className="h-8 w-8 text-primary" /> : <Timer className="h-8 w-8 text-primary" />}
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between">
                            <div>
                                <div className="text-2xl font-bold text-muted-foreground">{option.duration}</div>
                                <div className="text-xs text-muted-foreground uppercase font-semibold">{tradingLogisticsDict.shippingOptions.duration}</div>
                                
                                <div className="text-2xl font-bold text-primary mt-4">{option.cost}</div>
                                <div className="text-xs text-muted-foreground uppercase font-semibold">{tradingLogisticsDict.shippingOptions.cost}</div>
                            </div>
                            <div className="mt-4 text-sm text-muted-foreground pt-4 border-t">{option.bestFor}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
          <div className="container">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">{tradingLogisticsDict.qualityCommitment.title}</h2>
                <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">{tradingLogisticsDict.qualityCommitment.subtitle}</div>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Microscope className="w-8 h-8 text-primary"/></div>
                    <h3 className="text-xl font-headline font-semibold">{tradingLogisticsDict.qualityCommitment.item1.title}</h3>
                    <div className="text-muted-foreground mt-2">{tradingLogisticsDict.qualityCommitment.item1.description}</div>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-primary"/></div>
                    <h3 className="text-xl font-headline font-semibold">{tradingLogisticsDict.qualityCommitment.item2.title}</h3>
                    <div className="text-muted-foreground mt-2">{tradingLogisticsDict.qualityCommitment.item2.description}</div>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-primary"/></div>
                    <h3 className="text-xl font-headline font-semibold">{tradingLogisticsDict.qualityCommitment.item3.title}</h3>
                    <div className="text-muted-foreground mt-2">{tradingLogisticsDict.qualityCommitment.item3.description}</div>
                </div>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">{tradingLogisticsDict.customs.title}</h2>
                <div className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">{tradingLogisticsDict.customs.subtitle}</div>
            </div>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">{tradingLogisticsDict.customs.export.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                            {tradingLogisticsDict.customs.export.items.map((item: string) => <li key={item}>{item}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">{tradingLogisticsDict.customs.compliance.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                            {tradingLogisticsDict.customs.compliance.items.map((item: string) => <li key={item}>{item}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">{tradingLogisticsDict.faq.title}</h2>
                <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{tradingLogisticsDict.faq.subtitle}</div>
            </div>
            <Accordion type="single" collapsible className="w-full">
                {tradingLogisticsDict.faq.questions.map((faq: any, index: number) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="font-semibold text-lg text-left hover:no-underline">
                            <div className="flex items-center gap-4">
                                <HelpCircle className="h-6 w-6 text-primary flex-shrink-0" />
                                {faq.question}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base pl-10">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
                {tradingLogisticsDict.cta.title}
            </h2>
            <div className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {tradingLogisticsDict.cta.subtitle}
            </div>
        </div>
      </section>
    </>
  );
}
