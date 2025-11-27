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
      .default("1024x1024")
      .describe("Image size.")
      .optional(),
  }),
  execute: async ({ prompt, size }) => {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size ?? "1024x1024",
      n: 1,
    });

    const url = response.data[0]?.url;
    if (!url) {
      throw new Error("No image URL returned from OpenAI.");
    }

    // The model will see this object as the tool result and can decide
    // how to present it (e.g. paste the URL or embed as markdown).
    return {
      imageUrl: url,
    };
  },
});
