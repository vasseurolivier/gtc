

"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Mail, MapPin, Phone, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { submitContactForm } from "@/actions/contact";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export function ContactSection() {
  const mapImage = PlaceHolderImages.find(p => p.id === 'contact-map');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const result = await submitContactForm(values);
        if (result.success) {
          toast({
            title: "Message Sent!",
            description: "Thank you for contacting us. We will get back to you shortly.",
          });
          form.reset();
        } else {
          // Check for specific Firestore permission error
          if (result.message && result.message.includes('permission-denied')) {
               toast({
                variant: "destructive",
                title: "Submission Error",
                description: "There was a problem with the database connection. Please try again later.",
              });
          } else {
              toast({
                variant: "destructive",
                title: "Failed to Send Message",
                description: result.message || "An unexpected error occurred.",
              });
          }
        }
    } catch (error) {
        console.error("Contact form submission error:", error);
        toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: "Could not submit the form. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <section id="contact" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">
            Nous contacter
          </h2>
          <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Vous avez une question ou un projet en tête ? Nous serions ravis d'en discuter avec vous.
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <Card className="shadow-lg flex flex-col">
            <CardContent className="p-8 flex-grow">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
                  <div className="space-y-6 flex-grow">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Votre nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean Dupont" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Votre email</FormLabel>
                          <FormControl>
                            <Input placeholder="jean.dupont@exemple.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sujet</FormLabel>
                          <FormControl>
                            <Input placeholder="Demande de sourcing" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Votre message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Parlez-nous de votre projet..." {...field} rows={6} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Envoyer le message"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="flex flex-col space-y-8 h-full">
             <div className="flex flex-col flex-grow justify-between h-full">
                <div>
                    <h3 className="text-xl font-headline font-semibold mb-6">
                      Nos bureaux
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                        <div className="flex items-start">
                            <MapPin className="h-5 w-5 mr-4 mt-1 shrink-0 text-primary"/>
                            <span>浙江省， 金华市， 义乌市， 小三里唐3区， 6栋二单元1501</span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="h-5 w-5 mr-4 shrink-0 text-primary"/>
                            <span>+86 135 6477 0717 (téléphone et Whatsapp)</span>
                        </div>
                        <div className="flex items-center">
                            <Mail className="h-5 w-5 mr-4 shrink-0 text-primary"/>
                            <span>info@globaltradingchina.com</span>
                        </div>
                    </div>
                </div>
                {mapImage && (
                  <div className="rounded-lg overflow-hidden shadow-lg border mt-8 flex-grow h-full min-h-[300px] relative">
                    <Image
                      src={mapImage.imageUrl}
                      alt={mapImage.description}
                      data-ai-hint={mapImage.imageHint}
                      fill
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
