
"use client";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { HeroContactForm } from '@/components/forms/hero-contact-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';
import { Badge } from '@/components/ui/badge';

export function HeroSection() {
  const dictionary = {
    heroSection: {
      tag: "Agent de Sourcing & Trading en Chine",
      title: "Votre Partenaire Stratégique pour Importer de Chine en toute Sérénité",
      subtitle: "Nous sécurisons vos achats, auditons vos usines et gérons votre logistique de A à Z. Transformez vos idées en succès commerciaux grâce à notre expertise terrain.",
      ctaButton: "Demander un diagnostic gratuit",
      brochureButton: "Télécharger notre Brochure"
    },
    contactSection: {
      title: "Diagnostic Gratuit",
      subtitle: "Parlez-nous de votre projet, nous vous répondons sous 24h.",
      form: {
        name: { label: "Votre nom", placeholder: "Jean Dupont" },
        email: { label: "Votre email", placeholder: "jean.dupont@exemple.com" },
        phone: { label: "Téléphone / WhatsApp", placeholder: "+33 6 12 34 56 78" },
        message: { label: "Votre message", placeholder: "Décrivez les produits recherchés..." },
        submit: "Lancer mon sourcing"
      },
      toast: {
        success: { title: "Message envoyé !", description: "Merci de nous avoir contactés. Nous reviendrons vers vous rapidement." },
        error: { title: "Échec de l'envoi du message", db: "Un problème est survenu. Veuillez réessayer plus tard.", unexpected: "Une erreur inattendue est survenue." }
      }
    }
  };
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  const companyInfoContext = useContext(CompanyInfoContext);
  const brochureUrl = companyInfoContext?.companyInfo.brochureUrl;

  return (
    <section className="relative w-full h-[95vh] md:h-screen text-white overflow-hidden pt-16 md:pt-0 md:-mt-16">
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
      <div className="absolute inset-0 bg-zinc-950/60 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />
      
      <div className="relative h-full flex flex-col justify-start md:justify-end container px-8 md:px-16 pb-12 pt-[2cm] md:pt-0">
        <div className="flex flex-col md:flex-row items-end gap-12">
            <div className="w-full lg:w-2/3 space-y-6">
                <Badge variant="secondary" className="bg-primary text-white border-none px-4 py-1 text-[10px] md:text-sm font-semibold uppercase tracking-wider animate-in fade-in slide-in-from-left-4 duration-1000">
                  {dictionary.heroSection.tag}
                </Badge>
                <h1 className="text-xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight text-white leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    {dictionary.heroSection.title}
                </h1>
                <p className="text-sm md:text-2xl text-zinc-300 leading-tight md:leading-relaxed max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    {dictionary.heroSection.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-12 md:h-14 px-6 md:px-8 text-base md:text-lg" asChild>
                      <Link href="/contact">
                          {dictionary.heroSection.ctaButton} <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                  </Button>
                  {brochureUrl && (
                    <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold" asChild>
                        <a href={brochureUrl} target="_blank" rel="noopener noreferrer">
                            {dictionary.heroSection.brochureButton}
                        </a>
                    </Button>
                  )}
                </div>
            </div>
            
            <div className="hidden lg:block w-full lg:w-1/3 max-w-md animate-in fade-in zoom-in-95 duration-1000 delay-700">
              <HeroContactForm dictionary={dictionary.contactSection} />
            </div>
        </div>
      </div>
      
      {/* Scroll Down Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-zinc-400 opacity-50 animate-bounce">
        <span className="text-[10px] uppercase tracking-widest font-bold">Découvrir</span>
        <ChevronDown className="h-4 w-4" />
      </div>
    </section>
  );
}
