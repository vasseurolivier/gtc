
import { ContactSection } from "@/components/sections/contact-section";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ContactPage() {
  const dictionary = {
    contactSection: {
      title: "Nous contacter",
      subtitle: "Vous avez une question ou un projet d'importation ? Nous serions ravis d'en discuter avec vous.",
      form: {
        name: { label: "Votre nom", placeholder: "Jean Dupont" },
        email: { label: "Votre email", placeholder: "jean.dupont@exemple.com" },
        phone: { label: "Téléphone / WhatsApp", placeholder: "+33 6 12 34 56 78" },
        subject: { label: "Sujet", placeholder: "Demande de sourcing en Chine" },
        message: { label: "Votre message", placeholder: "Parlez-nous de votre projet, des produits recherchés..." },
        submit: "Envoyer le message"
      },
      office: {
        title: "Nos bureaux",
        address: "浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501",
        phone: "+86 135 6477 0717",
        email: "info@globaltradingchina.com"
      },
      toast: {
        success: { title: "Message envoyé !", description: "Merci de nous avoir contactés. Nous reviendrons vers vous rapidement." },
        error: { title: "Échec de l'envoi du message", db: "Un problème est survenu avec la connexion à la base de données. Veuillez vérifier vos règles de sécurité Firestore.", unexpected: "Une erreur inattendue est survenue." }
      }
    }
  };
  const heroImage = PlaceHolderImages.find(p => p.id === 'contact-hero');
  
  return (
    <>
      <section className="relative w-full h-[84vh] text-primary-foreground pt-16 md:pt-0 md:-mt-16">
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
        <div className="relative h-full flex flex-col justify-end items-start text-left p-8 md:p-16">
          <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
                  {dictionary.contactSection.title}
              </h1>
              <div className="mt-4 max-w-3xl text-lg md:text-xl text-neutral-200">
                  {dictionary.contactSection.subtitle}
              </div>
          </div>
        </div>
      </section>
      <ContactSection dictionary={dictionary.contactSection} />
    </>
  );
}
