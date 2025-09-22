"use client";

import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { optimizeContentForSEO, OptimizeContentForSEOOutput } from "@/ai/flows/optimize-content-for-seo";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  content: z.string().min(50, { message: "Content must be at least 50 characters." }),
  keywords: z.string().min(3, { message: "Please provide at least one keyword." }),
});

export default function SeoOptimizerPage() {
  const [result, setResult] = useState<OptimizeContentForSEOOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      keywords: "sourcing China, trading China, import China",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const seoResult = await optimizeContentForSEO(values);
      setResult(seoResult);
      toast({
        title: "Optimization Complete",
        description: "Your content has been successfully optimized.",
      });
    } catch (error) {
      console.error("SEO optimization failed:", error);
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: "An error occurred while optimizing your content. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-headline font-bold">SEO Content Optimizer</h1>
          <div className="mt-2 text-lg text-muted-foreground">
            Optimize your website content for search engines using AI.
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content to Optimize</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Paste your article or page content here..." {...field} rows={10} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Keywords</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., sourcing China, trading China" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Optimizing..." : "Optimize Content"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && (
            <div className="flex flex-col justify-center items-center text-center gap-4 py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-muted-foreground">AI is working its magic...</div>
            </div>
        )}

        {result && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Optimized Content</CardTitle>
                <CardDescription>This content has been rewritten for better SEO performance.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-base leading-relaxed whitespace-pre-wrap">{result.optimizedContent}</div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Keyword Suggestions</CardTitle>
                  <CardDescription>Consider adding these keywords to your content.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">{result.keywordSuggestions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Meta Description</CardTitle>
                  <CardDescription>A suggested meta description for search engine results.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">{result.metaDescription}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
