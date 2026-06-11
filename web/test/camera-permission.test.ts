import { describe, it, expect } from 'vitest';
import { cameraConstraints, requestCamera } from '../src/ui/camera-permission';

const fakeStream = {} as MediaStream;

function rejectingWith(name: string): () => Promise<MediaStream> {
  return () => {
    const err = new Error(name);
    err.name = name;
    return Promise.reject(err);
  };
}

describe('requestCamera', () => {
  it('returns granted with the stream on success', async () => {
    const result = await requestCamera(async () => fakeStream);
    expect(result).toEqual({ state: 'granted', stream: fakeStream });
  });

  it('maps NotAllowedError to denied', async () => {
    const result = await requestCamera(rejectingWith('NotAllowedError'));
    expect(result).toEqual({ state: 'denied' });
  });

  it('maps NotFoundError to no-camera', async () => {
    const result = await requestCamera(rejectingWith('NotFoundError'));
    expect(result).toEqual({ state: 'no-camera' });
  });

  it('maps any other error to error with a message', async () => {
    const result = await requestCamera(rejectingWith('OverconstrainedError'));
    expect(result.state).toBe('error');
  });

  it('handles a non-Error rejection with a fallback message', async () => {
    const result = await requestCamera(() => Promise.reject('boom'));
    expect(result).toEqual({ state: 'error', message: 'Unknown error' });
  });
});

describe('camera quality presets', () => {
  it('requests Full HD ideal dimensions by default', async () => {
    let constraints: MediaStreamConstraints | undefined;
    await requestCamera(async (c) => {
      constraints = c;
      return fakeStream;
    });
    const video = constraints?.video as MediaTrackConstraints;
    expect(video.facingMode).toBe('environment');
    expect(video.width).toEqual({ ideal: 1920 });
    expect(video.height).toEqual({ ideal: 1080 });
  });

  it('maps each named preset to its ideal resolution', () => {
    expect(cameraConstraints('sd').video).toMatchObject({
      width: { ideal: 640 },
      height: { ideal: 480 },
    });
    expect(cameraConstraints('hd').video).toMatchObject({
      width: { ideal: 1280 },
      height: { ideal: 720 },
    });
    expect(cameraConstraints('fhd').video).toMatchObject({
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    });
  });

  it('uses ideal (not exact) constraints so unsupported cameras still open', () => {
    const video = cameraConstraints('fhd').video as MediaTrackConstraints;
    expect(video.width).not.toHaveProperty('exact');
    expect(video.height).not.toHaveProperty('exact');
  });

  it('passes the requested preset through requestCamera', async () => {
    let constraints: MediaStreamConstraints | undefined;
    await requestCamera(async (c) => {
      constraints = c;
      return fakeStream;
    }, 'sd');
    expect((constraints?.video as MediaTrackConstraints).width).toEqual({ ideal: 640 });
  });
});
