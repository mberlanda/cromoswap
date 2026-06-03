/**
 * A minimal RGBA raster, structurally compatible with the DOM `ImageData`
 * (`{ width, height, data }`). Using our own type keeps the OCR pipeline
 * testable without a canvas/DOM.
 */
export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** A rectangle relative to an image, each component in [0, 1]. */
export interface RelativeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
