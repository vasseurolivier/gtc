'use server';
/**
 * @fileOverview An SEO content optimization AI agent.
 *
 * - optimizeContentForSEO - A function that handles the SEO content optimization process.
 * - OptimizeContentForSEOInput - The input type for the optimizeContentForSEO function.
 * - OptimizeContentForSEOOutput - The return type for the optimizeContentForSEO function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeContentForSEOInputSchema = z.object({
  content: z.string().describe('The content to be optimized for SEO.'),
  keywords: z.string().describe('The target keywords for SEO optimization.'),
});
export type OptimizeContentForSEOInput = z.infer<typeof OptimizeContentForSEOInputSchema>;

const OptimizeContentForSEOOutputSchema = z.object({
  optimizedContent: z.string().describe('The content optimized for SEO.'),
  keywordSuggestions: z.string().describe('Suggested keywords for SEO optimization.'),
  metaDescription: z.string().describe('Suggested meta description for the content.'),
});
export type OptimizeContentForSEOOutput = z.infer<typeof OptimizeContentForSEOOutputSchema>;

export async function optimizeContentForSEO(input: OptimizeContentForSEOInput): Promise<OptimizeContentForSEOOutput> {
  return optimizeContentForSEOFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeContentForSEOPrompt',
  input: {schema: OptimizeContentForSEOInputSchema},
  output: {schema: OptimizeContentForSEOOutputSchema},
  prompt: `You are an expert SEO specialist. Optimize the given content for search engines using the provided keywords.

Content: {{{content}}}
Keywords: {{{keywords}}}

Provide the optimized content, suggest additional relevant keywords, and generate a meta description for the content.

Ensure the optimized content is engaging and maintains readability while incorporating the keywords naturally.

Output in the following JSON format:
{
  "optimizedContent": "Optimized content here",
  "keywordSuggestions": "Suggested keywords here",
  "metaDescription": "Meta description here"
}`,
});

const optimizeContentForSEOFlow = ai.defineFlow(
  {
    name: 'optimizeContentForSEOFlow',
    inputSchema: OptimizeContentForSEOInputSchema,
    outputSchema: OptimizeContentForSEOOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
