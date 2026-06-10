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

export interface KakaoMapPointPayload {
  readonly lat: number;
  readonly lng: number;
}

export interface KakaoMapSpotPayload {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
  readonly location: KakaoMapPointPayload;
}

export interface MapCameraState {
  readonly center: Coordinates;
  readonly zoomLevel: number;
}

export type KakaoBridgeMessage =
  | { readonly kind: 'ready' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'marker:tap'; readonly spotId: string }
  | { readonly kind: 'camera:move'; readonly state: MapCameraState };

export interface KakaoMapDataPayload {
  readonly spots: readonly KakaoMapSpotPayload[];
  readonly selectedSpotId: string | null;
  readonly currentLocation: KakaoMapPointPayload | null;
  readonly center: KakaoMapPointPayload;
  readonly stampRadiusMeters: number;
}
