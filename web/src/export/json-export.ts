import type { Scan, Session } from '../domain/types';
import type { Clock, ImageStore } from '../storage/types';
import { countByCode } from '../domain/counts';

export interface JsonExport {
  session: Session;
  exportedAt: string;
  totalScans: number;
  countsByCode: Record<string, number>;
  scans: Scan[];
  /** Image data URLs keyed by scan id; only includes scans with stored images. */
  images: Record<string, string>;
}

/**
 * Build a self-contained JSON export embedding metadata, scans, counts, and
 * image data URLs pulled from the image store. `now` is injected for tests.
 */
export async function toJsonExport(
  session: Session,
  scans: Scan[],
  imageStore: ImageStore,
  now: Clock,
): Promise<JsonExport> {
  const images: Record<string, string> = {};
  for (const scan of scans) {
    const dataUrl = await imageStore.get(scan.id);
    if (dataUrl !== undefined) {
      images[scan.id] = dataUrl;
    }
  }

  return {
    session,
    exportedAt: now(),
    totalScans: scans.length,
    countsByCode: countByCode(scans),
    scans,
    images,
  };
}
