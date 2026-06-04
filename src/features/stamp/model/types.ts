import type { Coordinates } from '@shared/types';

export interface Stamp {
  readonly id: string;
  readonly spotId: string;
  readonly collectedAt: string;
  readonly location: Coordinates;
}

export interface StampSpot {
  readonly id: string;
  readonly title: string;
  readonly location: Coordinates;
  readonly radiusMeters: number;
}
