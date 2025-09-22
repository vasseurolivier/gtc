"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, PackageSearch, ShoppingCart, Wrench } from 'lucide-react';

const services = [
  {
    icon: <PackageSearch className="h-10 w-10 text-primary" />,
    title: "Sourcing",
    description: "Nous trouvons et validons les meilleurs fabricants en Chine pour vos produits, en garantissant la qualité et des prix compétitifs."
  },
  {
    icon: <ArrowLeftRight className="h-10 w-10 text-primary" />,
    title: "Négoce",
    description: "Faciliter des opérations d'import/export fluides, en gérant toute la logistique et les douanes pour une expérience commerciale sans faille."
  },
  {
    icon: <ShoppingCart className="h-10 w-10 text-primary" />,
    title: "Solutions E-commerce",
    description: "Un soutien de bout en bout pour votre boutique en ligne, du sourcing de produits au stockage et à l'exécution des commandes."
  },
  {
    icon: <Wrench className="h-10 w-10 text-primary" />,
    title: "Services sur Mesure",
    description: "Des solutions personnalisées adaptées à vos besoins commerciaux uniques, y compris les audits d'usine et le contrôle qualité."
  }
];

export function ServicesSection() {
  return (
    <section id="services" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">
            Nos Services Principaux
          </h2>
          <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Des solutions complètes pour dynamiser votre activité mondiale.
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
