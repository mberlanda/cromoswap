/** A code bounding box, expressed relative to the sticker image (0..1). */
export interface CodeBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Orientation = 'portrait' | 'landscape';

/** One annotated corpus entry: an image and where its code sits. */
export interface CorpusAnnotation {
  orientation: Orientation;
  box: CodeBox;
}
