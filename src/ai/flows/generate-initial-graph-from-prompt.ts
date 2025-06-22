'use server';
/**
 * @fileOverview Generates a sample transaction graph from a text prompt describing a suspicious scenario.
 *
 * - generateInitialGraphFromPrompt - A function that generates the graph.
 * - GenerateInitialGraphFromPromptInput - The input type for the generateInitialGraphFromPrompt function.
 * - GenerateInitialGraphFromPromptOutput - The return type for the generateInitialGraphFromPrompt function.
 */

import { ai } from '@/ai/genkit'; // Use ai for this flow
import {z} from 'genkit';

const GenerateInitialGraphFromPromptInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      'A text prompt describing a suspicious transaction scenario for which a transaction graph should be generated.'
    ),
});
export type GenerateInitialGraphFromPromptInput = z.infer<
  typeof GenerateInitialGraphFromPromptInputSchema
>;

const GenerateInitialGraphFromPromptOutputSchema = z.object({
  graphData: z
    .string()
    .describe(
      'A string representation of the generated transaction graph data in JSON format.'
    ),
});
export type GenerateInitialGraphFromPromptOutput = z.infer<
  typeof GenerateInitialGraphFromPromptOutputSchema
>;

export async function generateInitialGraphFromPrompt(
  input: GenerateInitialGraphFromPromptInput
): Promise<GenerateInitialGraphFromPromptOutput> {
  return generateInitialGraphFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialGraphFromPromptPrompt',
  input: {schema: GenerateInitialGraphFromPromptInputSchema},
  output: {schema: GenerateInitialGraphFromPromptOutputSchema},
  prompt: `You are an expert in generating transaction graph data representing suspicious transaction scenarios. Generate a JSON string that represents a transaction graph based on the following text description: {{{prompt}}}.  The JSON should represent nodes as entities (e.g., accounts, merchants, IP addresses) and edges as transactions. Include relevant details such as transaction amounts, timestamps, and relationships between entities to reflect the scenario described in the text.  Ensure the generated graph data is valid JSON and suitable for use with a fraud detection system. Return ONLY the JSON string. No other explanation is required.`,
});

const generateInitialGraphFromPromptFlow = ai.defineFlow(
  {
    name: 'generateInitialGraphFromPromptFlow',
    inputSchema: GenerateInitialGraphFromPromptInputSchema,
    outputSchema: GenerateInitialGraphFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
