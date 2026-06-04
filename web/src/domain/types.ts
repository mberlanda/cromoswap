export interface Candidate {
  raw: string;
  confidence: number;
}

export type ScanSource = 'ocr' | 'manual';

export interface StickerCode {
  prefix: string;
  number: number;
  canonical: string;
}

export interface RankedCode {
  code: StickerCode;
  confidence: number;
}

export interface Scan {
  id: string;
  sessionId: string;
  normalizedCode: string;
  source: ScanSource;
  confidence: number;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumEntry {
  id: string;
  userName: string;
  normalizedCode: string;
  ownedAt: string;
}
