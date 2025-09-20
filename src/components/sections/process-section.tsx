"use client";
import { Contact, FileText, PackageCheck, Ship, Target } from 'lucide-react';
import { TranslatedContent } from '@/components/shared/translated-content';

const processSteps = [
  { icon: <Contact className="h-8 w-8 text-accent-foreground" />, title: "Initial Contact", description: "You reach out with your requirements." },
  { icon: <FileText className="h-8 w-8 text-accent-foreground" />, title: "Sourcing & Quote", description: "We source suppliers and provide a detailed quote." },
  { icon: <Target className="h-8 w-8 text-accent-foreground" />, title: "Quality Control", description: "Our team conducts rigorous quality checks." },
  { icon: <Ship className="h-8 w-8 text-accent-foreground" />, title: "Logistics", description: "We manage shipping, customs, and documentation." },
  { icon: <PackageCheck className="h-8 w-8 text-accent-foreground" />, title: "Final Delivery", description: "Your products arrive safely at your destination." }
];

export function ProcessSection() {
  return (
    <section id="process" className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">
            <TranslatedContent content="Our A-to-Z Process" />
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            <TranslatedContent content="A transparent and efficient journey from your idea to your doorstep." />
          </p>
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
                    <TranslatedContent content={step.title} />
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <TranslatedContent content={step.description} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
