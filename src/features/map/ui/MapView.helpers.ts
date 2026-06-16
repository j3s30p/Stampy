import type { CurrentLocationStatus } from '@core/location';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import type { MapEventPin, MapSpotPin } from '../model';
import type { MapFilter, MapFilterOption } from './MapView.types';

export const buildKakaoDirectionsUrl = (spot: MapSpotPin) => {
  const lat = spot.location.latitude;
  const lng = spot.location.longitude;
  return `https://map.kakao.com/link/to/${encodeURIComponent(spot.title)},${lat},${lng}`;
};

export const getSpotStatusLabel = (spot: MapSpotPin) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return `${STAMP_RADIUS_METERS}m 안에 있어요`;
  }

  return '인증 확인 필요';
};

export const getSpotStatusBadgeLabel = (spot: MapSpotPin) => {
  if (spot.collected) {
    return '수집';
  }

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return '인증 가능';
  }

  return '이동 필요';
};

export const getSpotStatusTone = (spot: MapSpotPin): 'done' | 'ready' | 'neutral' => {
  if (spot.collected) {
    return 'done';
  }

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return 'ready';
  }

  return 'neutral';
};

export const getLocationStatusLabel = (
  status: CurrentLocationStatus,
  context: {
    readonly currentLocation: Coordinates | null;
    readonly useRealApi: boolean;
  },
) => {
  if (context.useRealApi && status !== 'loading' && !context.currentLocation) {
    return '위치를 찾을 수 없음';
  }

  switch (status) {
    case 'granted':
      return 'GPS 양호';
    case 'denied':
      return 'GPS 권한 필요';
    case 'loading':
      return 'GPS 확인 중';
    default:
      return 'GPS 확인 중';
  }
};

export const resolveEffectiveSelectedSpotId = (
  spots: readonly MapSpotPin[],
  internalSelectedSpotId: string | null,
) => {
  const candidateSpotId = internalSelectedSpotId;

  if (candidateSpotId && spots.some((spot) => spot.contentId === candidateSpotId)) {
    return candidateSpotId;
  }

  return null;
};

export const resolveSelectedSpot = (
  spots: readonly MapSpotPin[],
  selectedSpotId: string | null,
) => {
  if (!selectedSpotId) {
    return null;
  }

  return spots.find((spot) => spot.contentId === selectedSpotId) ?? null;
};

export const mapFilters: readonly MapFilterOption[] = [
  { key: 'all', label: '전체', icon: 'layers-outline' },
  { key: 'spot', label: '관광지', icon: 'image-outline' },
  { key: 'event', label: '행사', icon: 'calendar-clear-outline' },
  { key: 'uncollected', label: '미수집', icon: 'lock-open-outline' },
];

export const filterSpots = (spots: readonly MapSpotPin[], activeFilter: MapFilter) => {
  if (activeFilter === 'event') {
    return [];
  }

  if (activeFilter === 'uncollected') {
    return spots.filter((spot) => !spot.collected);
  }

  return spots;
};

export const filterEvents = (events: readonly MapEventPin[], activeFilter: MapFilter) => {
  if (activeFilter === 'spot' || activeFilter === 'uncollected') {
    return [];
  }

  return events;
};

export const formatEventPeriod = (event: MapEventPin) => {
  return `${formatCompactDate(event.startDate)}-${formatCompactDate(event.endDate)}`;
};

const formatCompactDate = (value: string) => {
  if (value.length !== 8) {
    return value;
  }

  return `${Number(value.slice(4, 6))}.${Number(value.slice(6, 8))}`;
};

export const getEventStatusLabel = (event: MapEventPin) => {
  const today = getTodayCompactDate();

  if (today < event.startDate) {
    return '예정 행사';
  }

  if (today > event.endDate) {
    return '종료 행사';
  }

  return '진행 중';
};

const getTodayCompactDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
};
