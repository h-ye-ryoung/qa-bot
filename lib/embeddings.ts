// lib/embeddings.ts
// @ts-nocheck

import { HfInference } from "@huggingface/inference";

let hfClient: HfInference | null = null;
let modelId: string | null = null;

// env가 다 로딩된 이후에 한 번만 클라이언트 생성
function getKoe5Client() {
  if (!hfClient) {
    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      throw new Error("HF_API_KEY is not set in environment");
    }
    hfClient = new HfInference(apiKey);
    modelId = process.env.HF_MODEL || "nlpai-lab/KoE5";
  }
  return { hf: hfClient!, modelId: modelId! };
}

// L2 정규화 함수
function l2normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

// 임베딩 함수
export async function embedOne(text: string): Promise<number[]> {
  const { hf, modelId } = getKoe5Client();

  const input = text.trim().replace(/\s+/g, " ");
  if (!input) {
    return [];
  }

  // KoE5 임베딩 (feature-extraction 엔드포인트)
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

  return l2normalize(vec);
}
