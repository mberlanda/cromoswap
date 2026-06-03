import { describe, it, expect } from 'vitest';
import { requestCamera } from '../src/ui/camera-permission';

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
});
