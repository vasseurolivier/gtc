
import { ContactSection } from "@/components/sections/contact-section";
import { getDictionary } from "@/lib/get-dictionary";
import { Locale } from "@/i18n-config";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const heroImage = PlaceHolderImages.find(p => p.id === 'contact-hero');
  
  return (
    <>
      <section className="relative w-full h-[60vh] text-primary-foreground pt-16 md:pt-0">
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
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  {dictionary.contactSection.title}
              </h1>
              <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                  {dictionary.contactSection.subtitle}
              </div>
          </div>
        </div>
      </section>
      <ContactSection dictionary={dictionary.contactSection} />
    </>
  );
}

    
    

    
