// scripts/ingest.ts
// @ts-nocheck
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { getQdrantClient } from '../lib/qdrant.ts';
import { embedOne } from '../lib/embeddings.ts';



async function main() {
  console.log('ingest.ts 실행 시작, cwd:', process.cwd());

  const filePath = path.resolve(process.cwd(), 'Q&A.xlsx');

  if (!fs.existsSync(filePath)) {
    console.error('파일을 찾을 수 없습니다:', filePath);
    process.exit(1);
  }

  // 1) 엑셀 읽기
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    console.error('워크북에 시트가 없습니다.');
    process.exit(1);
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet || !sheet['!ref']) {
    console.error('첫 번째 시트를 찾을 수 없습니다.');
    process.exit(1);
  }

  // 2) Q/A 파싱
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const qRegex = /^Q\.\s*/i;
  const aRegex = /^A\.\s*/i;
  const results: { q: string; a: string }[] = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    for (let r = range.s.r; r <= range.e.r; r++) {
      const qAddr = XLSX.utils.encode_cell({ c, r });
      const qCell = sheet[qAddr];
      if (!qCell) continue;
      const qText = String(qCell.v ?? '').trim();
      if (!qRegex.test(qText)) continue;

      const aAddr = XLSX.utils.encode_cell({ c, r: r + 1 });
      const aCell = sheet[aAddr];
      if (!aCell) continue;
      const aText = String(aCell.v ?? '').trim();
      if (!aRegex.test(aText)) continue;

      const qBody = qText.replace(qRegex, '').trim();
      const aBody = aText.replace(aRegex, '').trim();
      results.push({ q: qBody, a: aBody });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  console.log(`총 ${results.length}개 Q/A 추출됨`);

  // 3) 임베딩 + Qdrant 업서트
  const collection = process.env.QDRANT_COLLECTION!;
  const points: any[] = [];

  for (let i = 0; i < results.length; i++) {
    const { q, a } = results[i];
    console.log(`임베딩 중 (${i + 1}/${results.length}):`, q);
    const vector = await embedOne(q); // 질문만 임베딩

    points.push({
      id: i + 1,
      vector,
      payload: {
        question: q,
        answer: a,
        source: 'Q&A.xlsx',
      },
    });
  }

  console.log(`Qdrant upsert 준비 완료, 포인트 수: ${points.length}`);

  const qdrant = getQdrantClient();
  await qdrant.upsert(collection, {
    wait: true,
    points,
  });

  console.log(`Qdrant에 ${points.length}개 포인트 upsert 완료`);
}

main().catch((err) => {
  console.error('ingest 실행 중 오류:', err);
  process.exit(1);
});