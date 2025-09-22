"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, PackageSearch, ShoppingCart, Wrench } from 'lucide-react';

export function ServicesSection({ dictionary }: { dictionary: any }) {
  const services = [
    {
      icon: <PackageSearch className="h-10 w-10 text-primary" />,
      title: dictionary.sourcing.title,
      description: dictionary.sourcing.description
    },
    {
      icon: <ArrowLeftRight className="h-10 w-10 text-primary" />,
      title: dictionary.trading.title,
      description: dictionary.trading.description
    },
    {
      icon: <ShoppingCart className="h-10 w-10 text-primary" />,
      title: dictionary.ecommerce.title,
      description: dictionary.ecommerce.description
    },
    {
      icon: <Wrench className="h-10 w-10 text-primary" />,
      title: dictionary.custom.title,
      description: dictionary.custom.description
    }
  ];

  return (
    <section id="services" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">
            {dictionary.title}
          </h2>
          <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            {dictionary.subtitle}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <Card key={service.title} className="text-center flex flex-col items-center p-6 border-t-4 border-t-transparent hover:border-t-primary hover:shadow-xl transition-all duration-300 -translate-y-0 hover:-translate-y-2">
              <CardHeader className="p-0">
                {service.icon}
                <CardTitle className="mt-6 font-headline text-xl">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <div className="text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
