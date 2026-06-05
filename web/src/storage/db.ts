import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Scan, Session, AlbumEntry } from '../domain/types';

export interface StickerDb extends DBSchema {
  sessions: { key: string; value: Session };
  scans: { key: string; value: Scan; indexes: { bySession: string } };
  images: { key: string; value: { scanId: string; dataUrl: string } };
  album: {
    key: string;
    value: AlbumEntry;
    indexes: { byUser: string; byUserAndCode: [string, string] };
  };
}

export const DB_NAME = 'wc-sticker-scanner';
export const DB_VERSION = 2;

/** Open (and migrate) the local IndexedDB database. */
export function openStickerDb(): Promise<IDBPDatabase<StickerDb>> {
  return openDB<StickerDb>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('sessions', { keyPath: 'id' });
        const scans = db.createObjectStore('scans', { keyPath: 'id' });
        scans.createIndex('bySession', 'sessionId');
        db.createObjectStore('images', { keyPath: 'scanId' });
      }
      if (oldVersion < 2) {
        const album = db.createObjectStore('album', { keyPath: 'id' });
        album.createIndex('byUser', 'userName');
        album.createIndex('byUserAndCode', ['userName', 'normalizedCode'], { unique: true });
      }
    },
    // When a newer DB version is requested (e.g. another tab upgraded), close
    // this connection so the upgrade isn't blocked indefinitely.
    blocking(_cv, _nv, event) {
      (event.target as IDBOpenDBRequest)?.result?.close();
    },
  });
}
