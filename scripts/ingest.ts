// scripts/ingest.ts
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

console.log('ingest.ts 실행 시작, cwd:', process.cwd());

const filePath = path.resolve(process.cwd(), 'Q&A.xlsx');

if (!fs.existsSync(filePath)) {
  console.error('파일을 찾을 수 없습니다:', filePath);
  process.exit(1);
}

try {
  // buffer로 가져오기
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
} catch (err) {
  console.error('오류 발생:', err);
  process.exit(1);
}
