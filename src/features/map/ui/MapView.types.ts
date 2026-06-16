import type Ionicons from '@expo/vector-icons/Ionicons';
import type { CurrentLocationStatus } from '@core/location';
import type { Coordinates } from '@shared/types';
import type { MapEventPin, MapSpotPin } from '../model';

export interface MapViewProps {
  readonly kakaoJsKey: string;
  readonly spots: readonly MapSpotPin[];
  readonly events: readonly MapEventPin[];
  readonly totalCount: number;
  readonly selectedSpotId: string | null;
  readonly currentLocation: Coordinates | null;
  readonly locationStatus: CurrentLocationStatus;
  readonly useRealApi?: boolean;
  readonly onSelectSpot?: (contentId: string) => void;
  readonly onSelectEvent?: (contentId: string) => void;
  readonly onOpenEventDetail?: (contentId: string) => void;
  readonly onOpenSpotDetail?: (contentId: string) => void;
  readonly onOpenStamp?: (contentId: string) => void;
}

export type MapFilter = 'all' | 'spot' | 'event' | 'uncollected';

export interface MapFilterOption {
  readonly key: MapFilter;
  readonly label: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
}
