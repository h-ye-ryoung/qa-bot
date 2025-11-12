// lib/embeddings.ts
// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function embedOne(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const modelId = process.env.EMBEDDING_MODEL || "text-embedding-004";
  const model = client.getGenerativeModel({ model: modelId });

  const clean = text.trim().replace(/\s+/g, " ");
  const res = await model.embedContent(clean);
  return res.embedding.values;
}
