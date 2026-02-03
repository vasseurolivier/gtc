
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeftRight, PackageSearch, ShoppingCart, Wrench, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ServicesSection() {
  const dictionary = {
      title: "Des Solutions de Bout en Bout",
      subtitle: "Nous couvrons chaque maillon de votre chaîne d'approvisionnement pour garantir votre rentabilité.",
      sourcing: {
          title: "Sourcing & Achat",
          description: "Ne jouez pas votre marge à la loterie. Nous trouvons et auditons les usines qui correspondent à vos standards.",
          points: ["Identification fournisseurs", "Négociation de prix", "Contrats sécurisés"],
          link: "/services/sourcing"
      },
      trading: {
          title: "Trading & Logistique",
          description: "De la sortie d'usine à votre entrepôt. Nous gérons le transport, la douane et le suivi administratif.",
          points: ["Consolidation de fret", "Gestion DDP / FOB", "Assurance transport"],
          link: "/services/trading-logistics"
      },
      ecommerce: {
          title: "Solutions E-commerce",
          description: "Spécialiste Amazon FBA et Dropshipping. Branding, packaging et préparation logistique conforme.",
          points: ["Winners Sourcing", "Private Label", "Logistique FBA"],
          link: "/services/ecommerce-solutions"
      },
      custom: {
          title: "Services Sur-Mesure",
          description: "Développement produit OEM/ODM, accompagnement sur salons et conseil stratégique.",
          points: ["Prototypes 3D", "Audit technique", "Accords NNN"],
          link: "/services/custom-services"
      }
  };
  
  const services = [
    {
      icon: <PackageSearch className="h-12 w-12 text-primary" />,
      ...dictionary.sourcing
    },
    {
      icon: <ArrowLeftRight className="h-12 w-12 text-primary" />,
      ...dictionary.trading
    },
    {
      icon: <ShoppingCart className="h-12 w-12 text-primary" />,
      ...dictionary.ecommerce
    },
    {
      icon: <Wrench className="h-12 w-12 text-primary" />,
      ...dictionary.custom
    }
  ];

  return (
    <section id="services" className="py-24 bg-white">
      <div className="container">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900 mb-6">
            {dictionary.title}
          </h2>
          <div className="w-24 h-1.5 bg-primary mx-auto mb-8 rounded-full"></div>
          <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
            {dictionary.subtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <Card key={service.title} className="group flex flex-col border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-zinc-50 hover:-translate-y-2 overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <div className="p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform duration-500 mb-6">
                  {service.icon}
                </div>
                <CardTitle className="font-headline text-2xl text-zinc-900 mb-4">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex-grow">
                <p className="text-zinc-600 text-base leading-relaxed mb-6">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.points.map((point, i) => (
                    <li key={i} className="flex items-center text-sm font-medium text-zinc-700">
                      <CheckCircle2 className="h-4 w-4 text-primary mr-2 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="link" className="p-0 text-primary font-bold hover:no-underline group-hover:gap-2 transition-all" asChild>
                  <Link href={service.link}>
                    En savoir plus <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
