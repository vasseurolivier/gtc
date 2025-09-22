"use client";
import { Contact, FileText, PackageCheck, Ship, Target } from 'lucide-react';

export function ProcessSection({ dictionary }: { dictionary: any }) {
  const processSteps = [
    { icon: <Contact className="h-8 w-8 text-accent-foreground" />, title: dictionary.step1.title, description: dictionary.step1.description },
    { icon: <FileText className="h-8 w-8 text-accent-foreground" />, title: dictionary.step2.title, description: dictionary.step2.description },
    { icon: <Target className="h-8 w-8 text-accent-foreground" />, title: dictionary.step3.title, description: dictionary.step3.description },
    { icon: <Ship className="h-8 w-8 text-accent-foreground" />, title: dictionary.step4.title, description: dictionary.step4.description },
    { icon: <PackageCheck className="h-8 w-8 text-accent-foreground" />, title: dictionary.step5.title, description: dictionary.step5.description }
  ];

  return (
    <section id="process" className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">
            {dictionary.title}
          </h2>
          <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            {dictionary.subtitle}
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
