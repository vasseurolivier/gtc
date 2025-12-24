
"use client";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { HeroContactForm } from '@/components/forms/hero-contact-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useContext } from 'react';
import { CompanyInfoContext } from '@/context/company-info-context';

export function HeroSection() {
  const dictionary = {
    heroSection: {
      title: "Votre Partenaire Stratégique pour le Sourcing en Chine",
      subtitle: "Nous transformons vos idées en succès commerciaux grâce à notre expertise en sourcing, trading et solutions e-commerce.",
      ctaButton: "Demander un devis",
      brochureButton: "Télécharger la brochure"
    },
    contactSection: {
      title: "Commencez Votre Projet",
      subtitle: "Remplissez ce formulaire et notre équipe vous contactera sous 24h.",
      form: {
        name: { label: "Votre nom", placeholder: "Jean Dupont" },
        email: { label: "Votre email", placeholder: "jean.dupont@exemple.com" },
        phone: { label: "Téléphone / WhatsApp", placeholder: "+33 6 12 34 56 78" },
        message: { label: "Votre message", placeholder: "Parlez-nous de votre projet..." },
        submit: "Envoyer"
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
    <section className="relative w-full h-screen text-primary-foreground overflow-hidden">
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
       <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
      <div className="relative h-full flex flex-col justify-center container px-4 md:px-4 pt-24 md:pt-0">
        <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-full md:w-1/2 max-w-xl text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-shadow-lg text-white">
                    {dictionary.heroSection.title}
                </h1>
                <div className="mt-6 max-w-2xl mx-auto md:mx-0 text-lg md:text-xl text-neutral-200">
                    {dictionary.heroSection.subtitle}
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                    <Link href="/contact">
                        {dictionary.heroSection.ctaButton}
                        <ArrowRight className="ml-2" />
                    </Link>
                </Button>
                 {brochureUrl && (
                  <Button size="lg" variant="secondary" asChild>
                      <a href={brochureUrl} target="_blank" rel="noopener noreferrer">
                          {dictionary.heroSection.brochureButton}
                      </a>
                  </Button>
                 )}
                </div>
            </div>
             <div className="hidden md:block w-full md:w-1/2 max-w-md md:ml-auto">
              <HeroContactForm dictionary={dictionary.contactSection} />
            </div>
        </div>
      </div>
    </section>
  );
}
