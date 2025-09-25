"use client";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AboutSection({ dictionary }: { dictionary: any }) {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'about-home');

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
              {dictionary.title}
            </h2>
            <div className="mt-4 text-lg text-muted-foreground leading-relaxed space-y-4">
              <div>
                {dictionary.p1}
              </div>
              <div>
                {dictionary.p2}
              </div>
            </div>
            <Button size="lg" className="mt-8" asChild>
                <Link href="/about">
                    {dictionary.button}
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
