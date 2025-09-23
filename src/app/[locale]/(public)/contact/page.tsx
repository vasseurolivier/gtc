
import { ContactSection } from "@/components/sections/contact-section";
import { getDictionary } from "@/lib/get-dictionary";
import { Locale } from "@/i18n-config";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  return <ContactSection dictionary={dictionary.contactSection} />;
}

    