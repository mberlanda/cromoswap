import type { RankedCode } from '../domain/types';

const LOW_CONFIDENCE_THRESHOLD = 0.70;

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
  const lowConfidence = candidate.confidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <section aria-label="Detected sticker">
      <img src={imageDataUrl} alt={`Captured sticker ${canonical}`} />
      <p className="detected-code">{canonical}</p>
      <div className="confidence-meter" aria-label={`Confidence ${percent}%`}>
        <div className="confidence-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="confidence-pct">{percent}%</p>
      <div className="actions">
        <button type="button" className="primary" onClick={() => onConfirm(canonical)}>
          Save
        </button>
        <button
          type="button"
          className={lowConfidence ? 'primary' : 'secondary'}
          onClick={() => onCorrect(canonical)}
        >
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
