export interface SignatureRecord {
  id: string;
  name: string;
  signatureDataUrl: string;
  createdAt: string; // ISO 8601
  memo?: string;
  phone?: string;
  documentTitle?: string;
  syncedToSheets?: boolean;
}

export type PenColor = '#0f172a' | '#1e3a8a' | '#991b1b';
export type PenWidth = 2 | 3.5 | 5;

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export interface AppSettings {
  documentTitle: string;
  organizationName: string;
  enablePhoneField: boolean;
  enableMemoField: boolean;
  sheetsWebhookUrl: string;
  autoSyncToSheets: boolean;
}
