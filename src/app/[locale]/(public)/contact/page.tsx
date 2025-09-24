
import { ContactSection } from "@/components/sections/contact-section";
import { getDictionary } from "@/lib/get-dictionary";
import { Locale } from "@/i18n-config";

interface ContactPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function ContactPage({ params: paramsPromise }: ContactPageProps) {
  const { locale } = await paramsPromise;
  const dictionary = await getDictionary(locale);
  return <ContactSection dictionary={dictionary.contactSection} />;
}
