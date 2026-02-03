
"use client";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, ShieldCheck, Target, Users } from 'lucide-react';
import Link from 'next/link';

export function AboutSection() {
  const dictionary = {
      title: "Plus qu'un Agent, votre Équipe en Chine",
      p1: "Fondée sur une décennie d'expérience sur le terrain, Global Trading China est née d'un constat simple : l'importation ne doit pas être une source de stress pour les entrepreneurs.",
      p2: "Nous ne sommes pas de simples intermédiaires. Nous agissons comme votre département achat externalisé. Notre équipe maîtrise les codes culturels, la langue et les spécificités techniques du marché chinois pour défendre vos intérêts en permanence.",
      features: [
        { icon: <ShieldCheck className="h-6 w-6" />, text: "Sécurisation totale des paiements et des flux." },
        { icon: <Users className="h-6 w-6" />, text: "Une équipe dédiée qui parle votre langue." },
        { icon: <Target className="h-6 w-6" />, text: "Focus constant sur la qualité et les délais." }
      ],
      button: "Découvrir notre histoire"
  };
  const aboutImage = PlaceHolderImages.find(p => p.id === 'about-home');
  
  return (
    <section className="py-24 md:py-32 bg-zinc-950 text-white overflow-hidden">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            {aboutImage && (
              <div className="relative h-[550px] w-full rounded-3xl overflow-hidden shadow-2xl border-8 border-zinc-900">
                <Image
                  src={aboutImage.imageUrl}
                  alt={aboutImage.description}
                  data-ai-hint={aboutImage.imageHint}
                  fill
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8 p-6 bg-primary rounded-2xl shadow-xl max-w-xs">
                  <p className="text-white font-bold text-lg italic">"Nous transformons la barrière de la distance en un avantage compétitif."</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
              <Users className="h-5 w-5" /> Qui Sommes-Nous ?
            </div>
            <h2 className="text-3xl md:text-5xl font-headline font-bold leading-tight">
              {dictionary.title}
            </h2>
            <div className="text-lg text-zinc-400 leading-relaxed space-y-6">
              <p>{dictionary.p1}</p>
              <p>{dictionary.p2}</p>
            </div>
            
            <div className="space-y-4 pt-4">
              {dictionary.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                  <div className="text-primary">{feature.icon}</div>
                  <span className="font-medium text-zinc-200">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 text-lg" asChild>
                <Link href={`/about`}>
                    {dictionary.button}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
