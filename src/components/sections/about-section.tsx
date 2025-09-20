"use client";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TranslatedContent } from '@/components/shared/translated-content';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AboutSection() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'about-home');

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
              <TranslatedContent content="Votre Partenaire de Confiance en Chine" />
            </h2>
            <div className="mt-4 text-lg text-muted-foreground leading-relaxed space-y-4">
              <div>
                <TranslatedContent content="Fondée sur les principes de confiance et d'efficacité, TradeBridge Global est plus qu'une société de négoce. Nous sommes vos yeux et vos oreilles sur le terrain, dédiés à simplifier les complexités du commerce international." />
              </div>
              <div>
                <TranslatedContent content="Notre mission est de connecter les entreprises du monde entier aux vastes opportunités de la Chine, en offrant une expertise locale, un contrôle qualité rigoureux et une communication transparente à chaque étape." />
              </div>
            </div>
            <Button size="lg" className="mt-8" asChild>
                <Link href="/about">
                    <TranslatedContent content="En savoir plus sur nous" />
                    <ArrowRight className="ml-2" />
                </Link>
            </Button>
          </div>
          <div className="relative h-96 rounded-xl overflow-hidden shadow-lg">
            {aboutImage && (
              <Image
                src={aboutImage.imageUrl}
                alt={aboutImage.description}
                data-ai-hint={aboutImage.imageHint}
                fill
                className="object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
