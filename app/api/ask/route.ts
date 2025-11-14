// app/api/ask/route.ts
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { embedOne } from '@/lib/embeddings';
import { getQdrantClient } from '@/lib/qdrant';

const COLLECTION = process.env.QDRANT_COLLECTION!;
const SCORE_THRESHOLD = 0.75; //임계값 설정

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body?.question;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'question is required' },
        { status: 400 },
      );
    }

    // 질문 벡터화 (Gemini 임베딩)
    const vector = await embedOne(question);

    // Qdrant 검색
    const qdrant = getQdrantClient();
    const results = await qdrant.search(COLLECTION, {
      vector,
      limit: 3,
      with_payload: true,
      score_threshold: SCORE_THRESHOLD,
    });

    if (!results || results.length === 0) {
      // 유사 항목이 없는 경우
      return NextResponse.json({
        matched: false,
        answer: null,
        reason: '현재 등록된 Q&A는 Perso.ai / 이스트소프트 관련 내용만 포함하고 있어요. 입력하신 질문과 비슷한 내용을 데이터에서 찾지 못했습니다.',
      });
    }

    const top = results[0];
    const payload = top.payload as any;

    //score 로그 (매치된 경우)
    console.log('[ask] score', {
        question,
        score: top.score,
    });

    return NextResponse.json({
      matched: true,
      answer: payload.answer,
      question: payload.question,
      score: top.score,
    });
  } catch (err) {
    console.error('[POST /api/ask] error:', err);
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500 },
    );
  }
}