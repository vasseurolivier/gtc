
import { ContactSection } from "@/components/sections/contact-section";
import { getDictionary } from "@/lib/get-dictionary";
import { Locale } from "@/i18n-config";

export default async function ContactPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(params.locale);
  return <ContactSection dictionary={dictionary.contactSection} />;
}
