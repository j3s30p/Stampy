import type { Coordinates } from '@shared/types';

export interface MapCameraState {
  readonly center: Coordinates;
  readonly zoomLevel: number;
}

export type KakaoBridgeMessage =
  | { readonly kind: 'ready' }
  | { readonly kind: 'marker:tap'; readonly spotId: string }
  | { readonly kind: 'camera:move'; readonly state: MapCameraState };
