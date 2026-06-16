import type { StampCandidate } from '@features/stamp/model';

export type StampLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

export interface RecentStamp {
  readonly contentId: string;
  readonly title: string;
  readonly collected: boolean;
}

export interface StampViewProps {
  readonly candidate: StampCandidate | null;
  readonly mode?: 'collection' | 'capture';
  readonly collectedCount?: number;
  readonly totalCount?: number;
  readonly locationAvailable: boolean;
  readonly locationAccuracyMeters: number | null;
  readonly locationStatus: StampLocationStatus;
  readonly recentStamps?: readonly RecentStamp[];
  readonly onBack?: () => void;
  readonly onCollect?: () => void | Promise<void>;
}
