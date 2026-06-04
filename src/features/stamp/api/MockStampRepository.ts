import type { Stamp } from '../model';
import type { StampRepository } from './StampRepository';

export class MockStampRepository implements StampRepository {
  async listCollected(_userId: string): Promise<Stamp[]> {
    return [];
  }

  async collect(_userId: string, _stamp: Omit<Stamp, 'id' | 'collectedAt'>): Promise<Stamp> {
    throw new Error('MockStampRepository.collect: Stage 2 에서 본문 채움');
  }

  async hasCollected(_userId: string, _spotId: string): Promise<boolean> {
    return false;
  }
}
