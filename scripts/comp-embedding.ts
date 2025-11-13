// scripts/comp-embedding.ts
// @ts-nocheck
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { embedOne as embedGemini } from "../lib/embeddings.ts";
import { embedOneKoe5 } from "../lib/embeddings-koe5.ts";

// 코사인 유사도
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length); // 길이 다르면 최소 길이 사용

  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}

// 평가용 쌍들: positive(비슷해야 함) / negative(비슷하면 안 됨)
const pairs = [
  {
    type: "positive",
    name: "Perso 서비스 소개",
    a: "Perso.ai는 어떤 서비스인가요?",
    b: "Perso.ai가 어떤 서비스인지 설명해줘.",
  },
  {
    type: "positive",
    name: "Perso 요금제",
    a: "Perso.ai의 요금제는 어떻게 구성되어 있나요?",
    b: "Perso.ai 요금제 종류 알려줘.",
  },
  {
    type: "positive",
    name: "이스트소프트 회사 소개",
    a: "이스트소프트는 어떤 회사인가요?",
    b: "이스트소프트 회사에 대해 소개해줘.",
  },
  {
    type: "negative",
    name: "고양이 vs 이스트소프트",
    a: "고양이가 커피 마시면 어떻게 돼?",
    b: "이스트소프트는 어떤 회사인가요?",
  },
  {
    type: "negative",
    name: "땅콩버터 vs 요금제",
    a: "땅콩버터 레시피 알려줘.",
    b: "Perso.ai의 요금제는 어떻게 구성되어 있나요?",
  },
  {
    type: "negative",
    name: "라면 vs 다국어 더빙",
    a: "라면 맛있게 끓이는 방법 알려줘.",
    b: "Perso.ai는 어떤 서비스인가요?",
  },
];

async function evalWith(label: string, embed: (t: string) => Promise<number[]>) {
  console.log(`\n===== ${label} =====`);

  const posScores: number[] = [];
  const negScores: number[] = [];

  for (const p of pairs) {
    const v1 = await embed(p.a);
    const v2 = await embed(p.b);
    const s = cosine(v1, v2);

    const sFixed = Number(s.toFixed(4));
    const tag = p.type === "positive" ? "POS" : "NEG";

    console.log(
      `[${tag}] ${p.name}\n  A: ${p.a}\n  B: ${p.b}\n  -> cosine: ${sFixed}\n`,
    );

    if (p.type === "positive") posScores.push(s);
    else negScores.push(s);
  }

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  console.log(
    `>>> ${label} 평균 유사도: POS=${avg(posScores).toFixed(
      4,
    )}, NEG=${avg(negScores).toFixed(4)}`,
  );
}

async function main() {
  await evalWith("Gemini text-embedding-004", embedGemini);
  await evalWith("KoE5 (nlpai-lab/KoE5)", embedOneKoe5);
}

main().catch((err) => {
  console.error("eval error:", err);
  process.exit(1);
});