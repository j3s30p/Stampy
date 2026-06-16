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
}

export interface RankingEntry {
  readonly id: string;
  readonly nickname: string;
  readonly stampCount: number;
  readonly isMe?: boolean;
}

export type RankingPeriod = 'weekly' | 'all';
