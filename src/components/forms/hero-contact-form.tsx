
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { submitContactForm } from "@/actions/contact";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export function HeroContactForm({ dictionary }: { dictionary: any }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const result = await submitContactForm({ ...values, subject: "Hero Contact Form" });
        if (result.success) {
          toast({
            title: dictionary.toast.success.title,
            description: dictionary.toast.success.description,
          });
          form.reset();
        } else {
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
    <Card className="shadow-2xl bg-black/50 border-white/20 text-white backdrop-blur-sm">
        <CardHeader>
            <CardTitle>{dictionary.title}</CardTitle>
            <CardDescription className="text-neutral-300">{dictionary.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <Input placeholder={dictionary.form.name.placeholder} {...field} className="bg-white/10 border-white/20 placeholder:text-neutral-400 focus:bg-white/20" />
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
                        <FormControl>
                            <Input placeholder={dictionary.form.email.placeholder} {...field} className="bg-white/10 border-white/20 placeholder:text-neutral-400 focus:bg-white/20" />
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
                        <FormControl>
                        <Textarea placeholder={dictionary.form.message.placeholder} {...field} rows={4} className="bg-white/10 border-white/20 placeholder:text-neutral-400 focus:bg-white/20" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : dictionary.form.submit}
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
