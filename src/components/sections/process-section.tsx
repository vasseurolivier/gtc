"use client";
import { Contact, FileText, PackageCheck, Ship, Target } from 'lucide-react';

const processSteps = [
  { icon: <Contact className="h-8 w-8 text-accent-foreground" />, title: "Contact Initial", description: "Vous nous contactez avec vos besoins." },
  { icon: <FileText className="h-8 w-8 text-accent-foreground" />, title: "Sourcing & Devis", description: "Nous trouvons des fournisseurs et vous proposons un devis détaillé." },
  { icon: <Target className="h-8 w-8 text-accent-foreground" />, title: "Contrôle Qualité", description: "Notre équipe effectue des contrôles qualité rigoureux." },
  { icon: <Ship className="h-8 w-8 text-accent-foreground" />, title: "Logistique", description: "Nous gérons l'expédition, les douanes et les documents." },
  { icon: <PackageCheck className="h-8 w-8 text-accent-foreground" />, title: "Livraison Finale", description: "Vos produits arrivent en toute sécurité à destination." }
];

export function ProcessSection() {
  return (
    <section id="process" className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">
            Notre Processus de A à Z
          </h2>
          <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Un parcours transparent et efficace, de votre idée à votre porte.
          </div>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute top-10 left-0 w-full h-0.5 bg-border -translate-y-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-y-12 md:gap-x-8">
            {processSteps.map((step, index) => (
              <div key={index} className="flex md:flex-col items-start md:items-center text-left md:text-center relative">
                <div className="flex-shrink-0">
                  <div className="bg-accent p-5 rounded-full relative z-10 border-4 border-background shadow-md">
                    {step.icon}
                  </div>
                </div>
                <div className="ml-6 md:ml-0 md:mt-6">
                  <h3 className="font-headline font-semibold text-lg">
                    {step.title}
                  </h3>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
