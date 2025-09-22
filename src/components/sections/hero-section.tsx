"use client";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] md:h-[calc(100vh-4rem)] md:min-h-[600px] text-primary-foreground">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
      <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
        <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-shadow-lg">
                Your Bridge to Global Trade
            </h1>
            <div className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">
                Expert sourcing, trading, and e-commerce solutions from the heart of China to the world.
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/contact">
                    Get Started
                    <ArrowRight className="ml-2" />
                </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
                <Link href="/services">
                    Our Services
                </Link>
            </Button>
            </div>
        </div>
      </div>
    </section>
  );
}
