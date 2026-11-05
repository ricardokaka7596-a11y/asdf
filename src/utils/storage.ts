import { SignatureRecord, AppSettings } from '../types';

const STORAGE_KEY_SIGNATURES = 'simple_sign_records_v1';
const STORAGE_KEY_SETTINGS = 'simple_sign_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  documentTitle: '전자 서약 및 수기 확인서',
  organizationName: '',
  enablePhoneField: true,
  enableMemoField: true,
  sheetsWebhookUrl: '',
  autoSyncToSheets: false,
};

export function loadSignatures(): SignatureRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIGNATURES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load signatures from localStorage', err);
    return [];
  }
}

export function saveSignature(record: SignatureRecord): SignatureRecord[] {
  const current = loadSignatures();
  const updated = [record, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_SIGNATURES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save signature to localStorage', err);
  }
  return updated;
}

export function deleteSignature(id: string): SignatureRecord[] {
  const current = loadSignatures();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_SIGNATURES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete signature', err);
  }
  return updated;
}

export function clearAllSignatures(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SIGNATURES);
  } catch (err) {
    console.error('Failed to clear signatures', err);
  }
}

export function updateSignature(id: string, partial: Partial<SignatureRecord>): SignatureRecord[] {
  const current = loadSignatures();
  const updated = current.map((item) => (item.id === id ? { ...item, ...partial } : item));
  try {
    localStorage.setItem(STORAGE_KEY_SIGNATURES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update signature', err);
  }
  return updated;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

/**
 * Format ISO date string into readable Korean format
 */
export function formatKoreanDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString;
  }
}

/**
 * Export signatures as CSV with UTF-8 BOM for Microsoft Excel & Google Sheets Korean compatibility
 */
export function exportToCSV(records: SignatureRecord[]): void {
  if (records.length === 0) return;

  const headers = ['서명ID', '서명일시', '이름', '연락처', '문서명', '메모/목적', '구글시트전송여부'];
  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${formatKoreanDateTime(r.createdAt)}"`,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${(r.phone || '').replace(/"/g, '""')}"`,
    `"${(r.documentTitle || '').replace(/"/g, '""')}"`,
    `"${(r.memo || '').replace(/"/g, '""')}"`,
    `"${r.syncedToSheets ? '완료' : '미전송'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `전자서명목록_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy tab-delimited text to clipboard so user can press Ctrl+V directly into Google Sheets
 */
export async function copyForGoogleSheets(records: SignatureRecord[]): Promise<boolean> {
  if (records.length === 0) return false;

  const headers = ['서명일시', '이름', '연락처', '문서명', '메모/목적', '서명상태'];
  const rows = records.map((r) => [
    formatKoreanDateTime(r.createdAt),
    r.name,
    r.phone || '-',
    r.documentTitle || '확인서',
    r.memo || '-',
    '서명 완료 (로컬 보관)',
  ]);

  const tsvContent = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');

  try {
    await navigator.clipboard.writeText(tsvContent);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Sync record to Google Apps Script Webhook endpoint if configured
 */
export async function syncToGoogleSheetsWebhook(
  record: SignatureRecord,
  webhookUrl: string
): Promise<{ success: boolean; message?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: '유효한 웹훅 URL이 설정되지 않았습니다.' };
  }

  try {
    const payload = {
      id: record.id,
      timestamp: formatKoreanDateTime(record.createdAt),
      name: record.name,
      phone: record.phone || '',
      documentTitle: record.documentTitle || '전자 서약서',
      memo: record.memo || '',
      signatureDataUrl: record.signatureDataUrl,
    };

    // Google Apps Script usually requires no-cors or standard POST
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script Web App redirects, so no-cors is standard
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (err) {
    console.error('Webhook sync error:', err);
    return { success: false, message: (err as Error).message || '네트워크 오류' };
  }
}
