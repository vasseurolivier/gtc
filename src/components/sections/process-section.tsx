
"use client";
import { Contact, FileText, PackageCheck, Ship, Target, ArrowRight } from 'lucide-react';

export function ProcessSection() {
    const dictionary = {
        title: "Un Processus Rigoureux",
        subtitle: "De la prise de contact à la réception de votre marchandise, nous assurons un suivi sans faille.",
        steps: [
          { 
            number: "01",
            icon: <Contact className="h-8 w-8" />, 
            title: "Prise de Contact", 
            description: "Analyse de votre cahier des charges et conseil stratégique sur la faisabilité." 
          },
          { 
            number: "02",
            icon: <FileText className="h-8 w-8" />, 
            title: "Sourcing & Devis", 
            description: "Identification et audit des meilleures usines. Envoi d'une proforma détaillée." 
          },
          { 
            number: "03",
            icon: <Target className="h-8 w-8" />, 
            title: "Production & Suivi", 
            description: "Validation des échantillons et contrôles qualité AQL sur ligne de production." 
          },
          { 
            number: "04",
            icon: <Ship className="h-8 w-8" />, 
            title: "Logistique", 
            description: "Gestion de l'emballage, du dédouanement et du transport multimodal." 
          },
          { 
            number: "05",
            icon: <PackageCheck className="h-8 w-8" />, 
            title: "Livraison", 
            description: "Réception de vos produits et suivi post-livraison pour assurer votre satisfaction." 
          }
        ]
    };

  return (
    <section id="process" className="py-24 bg-white relative overflow-hidden">
      <div className="container">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-headline font-bold text-zinc-900 mb-6">
            {dictionary.title}
          </h2>
          <div className="w-24 h-1.5 bg-primary mx-auto mb-8 rounded-full"></div>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            {dictionary.subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-16 left-0 w-full h-0.5 bg-zinc-100 z-0"></div>
          
          {dictionary.steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-white border-2 border-zinc-100 rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:border-primary group-hover:shadow-xl transition-all duration-500 group-hover:-rotate-6">
                  {step.icon}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  {step.number}
                </div>
              </div>
              <h3 className="font-headline font-bold text-lg text-zinc-900 mb-3 group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {step.description}
              </p>
              
              {/* Desktop Arrow */}
              {index < dictionary.steps.length - 1 && (
                <div className="hidden md:block absolute top-16 -right-6 text-zinc-200">
                  <ArrowRight className="h-6 w-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
