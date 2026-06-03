import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Scan, Session } from '../domain/types';

export interface StickerDb extends DBSchema {
  sessions: { key: string; value: Session };
  scans: { key: string; value: Scan; indexes: { bySession: string } };
  images: { key: string; value: { scanId: string; dataUrl: string } };
}

export const DB_NAME = 'wc-sticker-scanner';
export const DB_VERSION = 1;

/** Open (and migrate) the local IndexedDB database. */
export function openStickerDb(): Promise<IDBPDatabase<StickerDb>> {
  return openDB<StickerDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('sessions', { keyPath: 'id' });
      const scans = db.createObjectStore('scans', { keyPath: 'id' });
      scans.createIndex('bySession', 'sessionId');
      db.createObjectStore('images', { keyPath: 'scanId' });
    },
  });
}
