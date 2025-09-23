import { ContactSection } from "@/components/sections/contact-section";
import { getDictionary } from "@/lib/get-dictionary";
import { Locale } from "@/i18n-config";

type PageProps = {
  params: {
    locale: Locale;
  };
};

export default async function ContactPage({ params }: PageProps) {
  const { locale } = params;
  const dictionary = await getDictionary(locale);
  return <ContactSection dictionary={dictionary.contactSection} />;
}
