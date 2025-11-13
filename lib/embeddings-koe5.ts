// lib/embeddings-koe5.ts
// @ts-nocheck
import { HfInference } from "@huggingface/inference";

export async function embedOneKoe5(text: string): Promise<number[]> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error("HF_API_KEY is not set in env");
  }

  const hf = new HfInference(apiKey);
  const modelId = process.env.HF_MODEL || "nlpai-lab/KoE5";

  const input = text.trim().replace(/\s+/g, " ");

  // feature-extraction으로 임베딩 뽑기
  const out = await hf.featureExtraction({
    model: modelId,
    inputs: input,
  });

  // out: number[] 또는 number[][]
  let vec: number[];
  if (Array.isArray(out[0])) {
    vec = (out as number[][])[0];
  } else {
    vec = out as number[];
  }

  return vec;
}
