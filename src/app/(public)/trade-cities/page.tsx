
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Building, Wifi, Package } from 'lucide-react';

export default function TradeCitiesPage() {
  const tradeCitiesDict = {
    hero: {
      title: "Pôles Commerciaux Stratégiques pour le Sourcing en Chine",
      subtitle: "Découvrez les villes clés au cœur du commerce mondial et comment nous vous y donnons un accès privilégié."
    },
    cities: {
      guangzhou: {
        name: "Guangzhou (Canton)",
        subtitle: "La Capitale Mondiale du Commerce Traditionnel",
        description: "Port commercial historique, Guangzhou est un hub essentiel, célèbre pour la Foire de Canton. La ville excelle dans le sourcing de textile, vêtements, maroquinerie et électronique grand public.",
        specialties: ["Textile & Habillement", "Foire de Canton", "Électronique", "Articles en cuir"]
      },
      shenzhen: {
        name: "Shenzhen",
        subtitle: "La Silicon Valley du Hardware",
        description: "Voisine de Hong Kong, Shenzhen est l'épicentre mondial de la fabrication électronique, des composants aux produits finis. Si votre projet concerne la high-tech, les gadgets ou les startups, Shenzhen est la ville de sourcing incontournable.",
        specialties: ["Électronique grand public", "Composants", "Startups Tech", "Innovation"]
      },
      yiwu: {
        name: "Yiwu",
        subtitle: "Le plus Grand Marché de Gros au Monde",
        description: "Yiwu abrite l'immense 'International Trade City'. C'est le paradis pour le sourcing de petits articles, biens de consommation, jouets, et bijoux. Idéal pour les acheteurs cherchant de faibles MOQ sur une très grande variété de produits.",
        specialties: ["Petites marchandises", "Jouets & Gadgets", "Bijoux & Accessoires", "Faibles MOQ"]
      }
    }
  };

  const cities = [
    {
      id: "guangzhou",
      name: tradeCitiesDict.cities.guangzhou.name,
      subtitle: tradeCitiesDict.cities.guangzhou.subtitle,
      description: tradeCitiesDict.cities.guangzhou.description,
      imageUrlId: "guangzhou-city",
      specialties: tradeCitiesDict.cities.guangzhou.specialties,
      icon: <Building className="h-8 w-8 text-primary" />,
    },
    {
      id: "shenzhen",
      name: tradeCitiesDict.cities.shenzhen.name,
      subtitle: tradeCitiesDict.cities.shenzhen.subtitle,
      description: tradeCitiesDict.cities.shenzhen.description,
      imageUrlId: "shenzhen-city",
      specialties: tradeCitiesDict.cities.shenzhen.specialties,
      icon: <Wifi className="h-8 w-8 text-primary" />,
    },
    {
      id: "yiwu",
      name: tradeCitiesDict.cities.yiwu.name,
      subtitle: tradeCitiesDict.cities.yiwu.subtitle,
      description: tradeCitiesDict.cities.yiwu.description,
      imageUrlId: "yiwu-city",
      specialties: tradeCitiesDict.cities.yiwu.specialties,
      icon: <Package className="h-8 w-8 text-primary" />,
    },
  ];

  const heroImage = PlaceHolderImages.find(p => p.id === 'trade-cities-hero');

  return (
    <>
      <section className="relative w-full h-[95vh] text-primary-foreground pt-16 md:pt-0 md:-mt-16">
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
        <div className="relative h-full flex flex-col justify-start md:justify-end items-start text-left p-8 md:p-16 pt-[4cm] md:pt-0">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  {tradeCitiesDict.hero.title}
              </h1>
              <div className="mt-4 max-w-3xl text-lg md:text-xl text-neutral-200">
                  {tradeCitiesDict.hero.subtitle}
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container space-y-20">
          {cities.map((city, index) => {
            const image = PlaceHolderImages.find(p => p.id === city.imageUrlId);
            const isOdd = index % 2 !== 0;

            return (
              <div key={city.id} className="grid md:grid-cols-2 gap-12 items-center">
                <div className={`relative h-96 rounded-xl overflow-hidden shadow-lg ${isOdd ? 'md:order-last' : ''}`}>
                    {image && <Image src={image.imageUrl} alt={city.name} data-ai-hint={image.imageHint ?? ''} fill className="object-cover"/>}
                </div>
                <div>
                  <div className="flex items-center gap-4">
                    {city.icon}
                    <h2 className="text-3xl font-headline font-bold text-primary">
                        {city.name}
                    </h2>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-muted-foreground">
                    {city.subtitle}
                  </div>
                  <div className="mt-4 text-muted-foreground leading-relaxed">
                    {city.description}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {city.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
