import prefixesJson from '../assets/prefixes.json';

/** The set of valid three-letter sticker prefixes (canonical source: assets/prefixes.json). */
export const PREFIXES: ReadonlySet<string> = new Set<string>(prefixesJson);
