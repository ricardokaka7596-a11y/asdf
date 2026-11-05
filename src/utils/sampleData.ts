import { SignatureRecord } from '../types';

/**
 * Generate a clean cursive signature canvas dataURL for sample testing
 */
function createSampleSignatureDataUrl(name: string, color: string = '#0f172a'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Flowing signature-like bezier strokes
  const startY = 110;
  ctx.moveTo(60, startY);
  ctx.bezierCurveTo(80, startY - 50, 110, startY - 60, 120, startY);
  ctx.bezierCurveTo(130, startY + 40, 140, startY - 20, 170, startY - 10);
  ctx.bezierCurveTo(190, startY, 210, startY - 40, 230, startY + 15);
  ctx.bezierCurveTo(250, startY + 50, 280, startY - 30, 310, startY - 5);
  // Flourish underline
  ctx.moveTo(50, startY + 30);
  ctx.bezierCurveTo(150, startY + 25, 270, startY + 35, 340, startY + 15);
  ctx.stroke();

  // Subtle name text below
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`(인) ${name}`, 340, 175);

  return canvas.toDataURL('image/png');
}

export function getSampleSignatures(): SignatureRecord[] {
  const now = Date.now();
  return [
    {
      id: `sig_sample_1_${now}`,
      name: '김민수',
      phone: '010-1234-5678',
      memo: '프로젝트 검수 확인',
      documentTitle: '전자 서약 및 수기 확인서',
      createdAt: new Date(now - 1000 * 60 * 35).toISOString(), // 35 min ago
      signatureDataUrl: createSampleSignatureDataUrl('김민수', '#0f172a'),
      syncedToSheets: false,
    },
    {
      id: `sig_sample_2_${now}`,
      name: '이서연',
      phone: '010-9876-5432',
      memo: '신규 장비 수령증',
      documentTitle: '물품 수령 및 서약서',
      createdAt: new Date(now - 1000 * 60 * 120).toISOString(), // 2 hours ago
      signatureDataUrl: createSampleSignatureDataUrl('이서연', '#1e3a8a'),
      syncedToSheets: false,
    },
    {
      id: `sig_sample_3_${now}`,
      name: '박도현',
      phone: '010-5555-8888',
      memo: '참석자 등록 및 개인정보 동의',
      documentTitle: '행사 참석 및 서약서',
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      signatureDataUrl: createSampleSignatureDataUrl('박도현', '#991b1b'),
      syncedToSheets: false,
    },
  ];
}
