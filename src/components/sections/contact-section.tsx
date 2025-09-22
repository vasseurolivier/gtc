

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

export function ContactSection({ dictionary }: { dictionary: any }) {
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
            title: dictionary.toast.success.title,
            description: dictionary.toast.success.description,
          });
          form.reset();
        } else {
          // Check for specific Firestore permission error
          if (result.message && result.message.includes('permission-denied')) {
               toast({
                variant: "destructive",
                title: dictionary.toast.error.title,
                description: dictionary.toast.error.db,
              });
          } else {
              toast({
                variant: "destructive",
                title: dictionary.toast.error.title,
                description: result.message || dictionary.toast.error.unexpected,
              });
          }
        }
    } catch (error) {
        console.error("Contact form submission error:", error);
        toast({
            variant: "destructive",
            title: dictionary.toast.error.title,
            description: dictionary.toast.error.unexpected,
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
            {dictionary.title}
          </h2>
          <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            {dictionary.subtitle}
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
                          <FormLabel>{dictionary.form.name.label}</FormLabel>
                          <FormControl>
                            <Input placeholder={dictionary.form.name.placeholder} {...field} />
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
                          <FormLabel>{dictionary.form.email.label}</FormLabel>
                          <FormControl>
                            <Input placeholder={dictionary.form.email.placeholder} {...field} />
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
                          <FormLabel>{dictionary.form.subject.label}</FormLabel>
                          <FormControl>
                            <Input placeholder={dictionary.form.subject.placeholder} {...field} />
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
                          <FormLabel>{dictionary.form.message.label}</FormLabel>
                          <FormControl>
                            <Textarea placeholder={dictionary.form.message.placeholder} {...field} rows={6} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : dictionary.form.submit}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="flex flex-col space-y-8 h-full">
             <div className="flex flex-col flex-grow justify-between h-full">
                <div>
                    <h3 className="text-xl font-headline font-semibold mb-6">
                      {dictionary.office.title}
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                        <div className="flex items-start">
                            <MapPin className="h-5 w-5 mr-4 mt-1 shrink-0 text-primary"/>
                            <span>{dictionary.office.address}</span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="h-5 w-5 mr-4 shrink-0 text-primary"/>
                            <span>{dictionary.office.phone}</span>
                        </div>
                        <div className="flex items-center">
                            <Mail className="h-5 w-5 mr-4 shrink-0 text-primary"/>
                            <span>{dictionary.office.email}</span>
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
