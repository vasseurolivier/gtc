"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, PackageSearch, ShoppingCart, Wrench } from 'lucide-react';
import { TranslatedContent } from '@/components/shared/translated-content';

const services = [
  {
    icon: <PackageSearch className="h-10 w-10 text-primary" />,
    title: "Sourcing",
    description: "We find and vet the best manufacturers in China for your products, ensuring quality and competitive pricing."
  },
  {
    icon: <ArrowLeftRight className="h-10 w-10 text-primary" />,
    title: "Trading",
    description: "Facilitating smooth import/export operations, handling all logistics and customs for a seamless trade experience."
  },
  {
    icon: <ShoppingCart className="h-10 w-10 text-primary" />,
    title: "E-Commerce Solutions",
    description: "End-to-end support for your online business, from product sourcing and storage to order fulfillment."
  },
  {
    icon: <Wrench className="h-10 w-10 text-primary" />,
    title: "Bespoke Services",
    description: "Customized solutions tailored to your unique business needs, including factory audits and quality control."
  }
];

export function ServicesSection() {
  return (
    <section id="services" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">
            <TranslatedContent content="Our Core Services" />
          </h2>
          <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            <TranslatedContent content="Comprehensive solutions to power your global business." />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <Card key={service.title} className="text-center flex flex-col items-center p-6 border-t-4 border-t-transparent hover:border-t-primary hover:shadow-xl transition-all duration-300 -translate-y-0 hover:-translate-y-2">
              <CardHeader className="p-0">
                {service.icon}
                <CardTitle className="mt-6 font-headline text-xl">
                  <TranslatedContent content={service.title} />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <div className="text-muted-foreground text-sm leading-relaxed">
                  <TranslatedContent content={service.description} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
