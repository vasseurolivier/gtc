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
import { TranslatedContent } from "../shared/translated-content";
import Image from 'next/image';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Mail, MapPin, Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export function ContactSection() {
  const mapImage = PlaceHolderImages.find(p => p.id === 'contact-map');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We will get back to you shortly.",
    });
    form.reset();
  }

  return (
    <section id="contact" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">
            <TranslatedContent content="Get in Touch" />
          </h2>
          <div className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            <TranslatedContent content="Have a question or a project in mind? We'd love to hear from you." />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><TranslatedContent content="Your Name" /></FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                        <FormLabel><TranslatedContent content="Your Email" /></FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@example.com" {...field} />
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
                        <FormLabel><TranslatedContent content="Subject" /></FormLabel>
                        <FormControl>
                          <Input placeholder="Sourcing Inquiry" {...field} />
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
                        <FormLabel><TranslatedContent content="Your Message" /></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about your project..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <TranslatedContent content="Send Message" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="space-y-8 pt-2">
             <div>
                <h3 className="text-xl font-headline font-semibold mb-6">
                  <TranslatedContent content="Our Office"/>
                </h3>
                <div className="space-y-4 text-muted-foreground">
                    <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-4 mt-1 shrink-0 text-primary"/>
                        <span>浙江省， 金华市， 义乌市， 小三里唐3区， 6栋二单元1501</span>
                    </div>
                    <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-4 shrink-0 text-primary"/>
                        <span>+86 135 6477 0717 (telephone et Whatsapp)</span>
                    </div>
                    <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-4 shrink-0 text-primary"/>
                        <span>info@globaltradingchina.com</span>
                    </div>
                </div>
            </div>
            {mapImage && (
              <div className="rounded-lg overflow-hidden shadow-lg border">
                <Image
                  src={mapImage.imageUrl}
                  alt={mapImage.description}
                  data-ai-hint={mapImage.imageHint}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
