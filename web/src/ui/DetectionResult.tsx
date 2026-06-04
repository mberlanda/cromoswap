import type { RankedCode } from '../domain/types';

interface DetectionResultProps {
  candidate: RankedCode;
  imageDataUrl: string;
  onConfirm: (code: string) => void;
  onCorrect: (code: string) => void;
  onSkip: () => void;
  onRescan: () => void;
}

/** Presents the best detected candidate with confirm/correct/skip/rescan actions. */
export function DetectionResult({
  candidate,
  imageDataUrl,
  onConfirm,
  onCorrect,
  onSkip,
  onRescan,
}: DetectionResultProps) {
  const { canonical } = candidate.code;
  const percent = Math.round(candidate.confidence * 100);

  return (
    <section aria-label="Detected sticker">
      <img src={imageDataUrl} alt={`Captured sticker ${canonical}`} />
      <p className="detected-code">{canonical}</p>
      <p className="confidence">Confidence: {percent}%</p>
      <div className="actions">
        <button type="button" className="primary" onClick={() => onConfirm(canonical)}>
          Save
        </button>
        <button type="button" className="secondary" onClick={() => onCorrect(canonical)}>
          Correct
        </button>
        <button type="button" className="quiet" onClick={onRescan}>
          Rescan
        </button>
        <button type="button" className="quiet" onClick={onSkip}>
          Skip
        </button>
      </div>
    </section>
  );
}
