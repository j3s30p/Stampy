import type { Coordinates } from '@shared/types';

export interface MapSpotPin {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
  readonly location: Coordinates;
  readonly thumbnailUrl?: string;
}

export interface MapEventPin {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
  readonly location: Coordinates;
  readonly startDate: string;
  readonly endDate: string;
  readonly thumbnailUrl?: string;
}

export interface KakaoMapPointPayload {
  readonly lat: number;
  readonly lng: number;
}

export interface KakaoMapSpotPayload {
  readonly kind: 'spot' | 'event';
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
  readonly location: KakaoMapPointPayload;
}

export interface KakaoMapRoutePayload {
  readonly mode: 'straight-line' | 'walking-api' | 'driving-api';
  readonly targetContentId: string;
  readonly targetKind: 'spot' | 'event';
  readonly targetTitle: string;
  readonly distanceMeters: number;
  readonly durationSeconds?: number;
  readonly source?: 'kakao-driving-api' | 'kakao-walking-api' | 'straight-line-fallback';
  readonly summaryLabel: string;
  readonly points: readonly KakaoMapPointPayload[];
}

export type KakaoBridgeMessage =
  | { readonly kind: 'ready' }
  | { readonly kind: 'tiles:loaded' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'map:tap' }
  | { readonly kind: 'marker:tap'; readonly spotId: string };

export interface KakaoMapDataPayload {
  readonly spots: readonly KakaoMapSpotPayload[];
  readonly selectedSpotId: string | null;
  readonly currentLocation: KakaoMapPointPayload | null;
  readonly center: KakaoMapPointPayload;
  readonly stampRadiusMeters: number;
  readonly route: KakaoMapRoutePayload | null;
}
