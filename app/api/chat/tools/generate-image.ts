// app/api/chat/tools/generate-image.ts
import OpenAI from "openai";
import { tool } from "ai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateImage = tool({
  description:
    "Generate a single image for travel scenes, hotel vibes, outfits, or moodboards.",
  parameters: z.object({
    prompt: z
      .string()
      .describe("A clear, detailed description of the image to generate."),
    size: z
      .enum(["1024x1024", "512x512"])
      .describe("Image size.")
      .optional(),
  }),
  execute: async ({ prompt, size }: { prompt: string; size?: "1024x1024" | "512x512" }) => {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size ?? "1024x1024",
      n: 1,
