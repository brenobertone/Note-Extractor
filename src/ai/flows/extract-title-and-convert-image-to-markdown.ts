// This is an AI-powered utility that extracts a title from an image and converts it into a markdown file optimized for Obsidian.
//
// - extractTitleAndConvertImageToMarkdown - The main function to process the image and generate the markdown file.
// - ExtractTitleAndConvertImageToMarkdownInput - The input type for the function.
// - ExtractTitleAndConvertImageToMarkdownOutput - The output type for the function, containing the extracted title and markdown content.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTitleAndConvertImageToMarkdownInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "A publicly accessible URL for the uploaded note image (Firebase Storage download URL). The original full-resolution image will be used."
    ),
  noteId: z.string().describe('The ID of the note associated with the image.'),
});
export type ExtractTitleAndConvertImageToMarkdownInput = z.infer<typeof ExtractTitleAndConvertImageToMarkdownInputSchema>;

const ExtractTitleAndConvertImageToMarkdownOutputSchema = z.object({
  title: z.string().describe('The extracted title from the image.'),
  markdownContent: z.string().describe('The markdown content converted from the image, optimized for Obsidian.'),
});
export type ExtractTitleAndConvertImageToMarkdownOutput = z.infer<typeof ExtractTitleAndConvertImageToMarkdownOutputSchema>;

export async function extractTitleAndConvertImageToMarkdown(input: ExtractTitleAndConvertImageToMarkdownInput): Promise<ExtractTitleAndConvertImageToMarkdownOutput> {
  return extractTitleAndConvertImageToMarkdownFlow(input);
}

const extractTitleAndConvertImageToMarkdownPrompt = ai.definePrompt({
  name: 'extractTitleAndConvertImageToMarkdownPrompt',
  input: {schema: ExtractTitleAndConvertImageToMarkdownInputSchema},
  output: {schema: ExtractTitleAndConvertImageToMarkdownOutputSchema},
  prompt: `You are an expert in processing images of notes and converting them into markdown files optimized for Obsidian.

  Your task is to extract a relevant title from the image and convert the image content into a markdown file.
  The title should be used for naming both the image file and the markdown file.
  Optimize the markdown format for Obsidian, taking into account the content observed in the note image.

  Here is the image of the note:
  {{media url=imageUrl}}

  Analyze the image and extract the title (a concise, filename-friendly title). Convert the note content into Markdown optimized for Obsidian. Output a JSON object with the keys: title (string) and markdownContent (string).
`,
});

const extractTitleAndConvertImageToMarkdownFlow = ai.defineFlow(
  {
    name: 'extractTitleAndConvertImageToMarkdownFlow',
    inputSchema: ExtractTitleAndConvertImageToMarkdownInputSchema,
    outputSchema: ExtractTitleAndConvertImageToMarkdownOutputSchema,
  },
  async input => {
    const {output} = await extractTitleAndConvertImageToMarkdownPrompt(input);
    return output!;
  }
);
