import type { Stamp } from '../model';

export interface StampRepository {
  listCollected(userId: string): Promise<Stamp[]>;
  collect(userId: string, stamp: Omit<Stamp, 'id' | 'collectedAt'>): Promise<Stamp>;
  hasCollected(userId: string, spotId: string): Promise<boolean>;
}
