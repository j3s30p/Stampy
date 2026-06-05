import { collectedStampFixtures } from '@shared/mocks';
import type { Stamp } from '../model';
import type { StampRepository } from './StampRepository';

export class MockStampRepository implements StampRepository {
  async listCollected(_userId: string): Promise<Stamp[]> {
    return [...collectedStampFixtures];
  }

  async collect(_userId: string, _stamp: Omit<Stamp, 'id' | 'collectedAt'>): Promise<Stamp> {
    return {
      ..._stamp,
      id: `stamp-${_stamp.spotId}`,
      collectedAt: new Date().toISOString(),
    };
  }

  async hasCollected(_userId: string, _spotId: string): Promise<boolean> {
    return collectedStampFixtures.some((stamp) => stamp.spotId === _spotId);
  }
}
