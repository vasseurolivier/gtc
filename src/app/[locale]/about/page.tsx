
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Building, Target, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const teamMembers = [
  {
    name: "Vasseur Olivier",
    role: "Fondateur & Directeur Général",
    imageUrl: "/placeholder-user.jpg",
    bio: "Avec plus de 15 ans d'expérience dans le commerce international et une connaissance approfondie du marché chinois, Olivier a fondé Global Trading China pour combler le fossé entre les entreprises occidentales et les fabricants chinois."
  },
  {
    name: "Jane Doe",
    role: "Responsable Sourcing",
    imageUrl: "/placeholder-user.jpg",
    bio: "Spécialiste de l'identification et de l'audit de fournisseurs, Jane dirige notre équipe de sourcing pour trouver les partenaires de fabrication les plus fiables et les plus compétitifs pour nos clients."
  },
  {
    name: "Li Wei",
    role: "Chef de la Logistique",
    imageUrl: "/placeholder-user.jpg",
    bio: "Expert en logistique internationale et en douanes, Li assure que les marchandises de nos clients sont livrées de manière efficace et sécurisée, en optimisant les coûts et les délais."
  }
];

const values = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Partenariat",
    description: "Nous construisons des relations à long terme basées sur la confiance et la transparence."
  },
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: "Rigueur",
    description: "Chaque étape, du sourcing au contrôle qualité, est menée avec la plus grande exigence."
  },
  {
    icon: <Building className="h-8 w-8 text-primary" />,
    title: "Expertise Locale",
    description: "Notre présence sur le terrain est votre meilleur atout pour naviguer le marché chinois."
  }
];


export default function AboutPage() {
  const aboutHero = PlaceHolderImages.find(p => p.id === 'about-hero');

  return (
    <>
      <section className="relative w-full h-[40vh] min-h-[300px] text-primary-foreground">
        {aboutHero && (
          <Image
            src={aboutHero.imageUrl}
            alt={aboutHero.description}
            data-ai-hint={aboutHero.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="relative h-full flex flex-col justify-center items-center text-center p-4">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  Notre Mission : Simplifier le Commerce avec la Chine
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  Nous sommes votre partenaire de confiance, dédié à transformer les opportunités du marché chinois en succès pour votre entreprise.
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                Qui Sommes-Nous ?
              </h2>
              <div className="mt-6 prose prose-lg max-w-none text-muted-foreground">
                <p>
                  Global Trading China est née de la conviction que l'accès au marché chinois, vaste et complexe, devrait être simple et sécurisé pour toute entreprise, quelle que soit sa taille. Fondée par des experts du commerce international avec des années d'expérience sur le terrain, notre société sert de pont entre les ambitions des entrepreneurs mondiaux et l'incroyable potentiel de production de la Chine.
                </p>
                <p>
                  Nous ne sommes pas de simples intermédiaires. Nous sommes une extension de votre équipe, vos yeux et vos oreilles en Chine. Notre mission est de défendre vos intérêts, de garantir la qualité de vos produits et d'optimiser votre chaîne d'approvisionnement pour une croissance durable.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {values.map(value => (
                <Card key={value.title}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    {value.icon}
                    <CardTitle>{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground">{value.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              Rencontrez Notre Équipe
            </h2>
            <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Des experts passionnés et dédiés à votre succès.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div key={member.name} className="text-center">
                <div className="relative h-32 w-32 mx-auto mb-4 rounded-full overflow-hidden">
                    <Image src={member.imageUrl} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="text-xl font-headline font-bold">{member.name}</h3>
                <div className="text-primary font-semibold">{member.role}</div>
                <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
