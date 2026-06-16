import type { HomeTourEvent, HomeTourSpot } from '@features/tour/model';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { RecommendedHomeItem } from './HomeView.types';

export const formatEventPeriod = (event: HomeTourEvent) => {
  return `${formatCompactDate(event.startDate)}-${formatCompactDate(event.endDate)}`;
};

export const getEventStatusLabel = (event: HomeTourEvent) => {
  const today = getTodayCompactDate();

  if (today < event.startDate) {
    return '예정 행사';
  }

  if (today > event.endDate) {
    return '종료 행사';
  }

  return '진행 중';
};

export const getSpotStatusLabel = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (
    spot.verificationDistanceMeters !== null &&
    spot.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return '지금 인증 가능';
  }

  return '이동 필요';
};

export const getSpotStatusTone = (spot: HomeTourSpot): 'done' | 'ready' | 'neutral' => {
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

export const getStampGlyph = (index: number) => ['村', '宮', '塔'][index % 3] ?? '印';

export const toRecommendedSpot = (spot: HomeTourSpot): RecommendedHomeItem => ({
  kind: 'spot',
  contentId: spot.contentId,
  title: spot.title,
  distanceMeters: spot.distanceMeters,
  verificationDistanceMeters: spot.verificationDistanceMeters,
  collected: spot.collected,
  thumbnailUrl: spot.thumbnailUrl ?? spot.imageUrls[0],
});

export const toRecommendedEvent = (event: HomeTourEvent): RecommendedHomeItem => ({
  kind: 'event',
  contentId: event.contentId,
  title: event.title,
  distanceMeters: event.distanceMeters,
  verificationDistanceMeters: event.verificationDistanceMeters,
  collected: event.collected,
  thumbnailUrl: event.thumbnailUrl ?? event.imageUrls[0],
});

export const pickRecommendedItem = (
  items: readonly RecommendedHomeItem[],
): RecommendedHomeItem | null => {
  const sortedItems = [...items].sort((a, b) => a.distanceMeters - b.distanceMeters);

  return (
    sortedItems.find(
      (item) =>
        !item.collected &&
        item.verificationDistanceMeters !== null &&
        item.verificationDistanceMeters <= STAMP_RADIUS_METERS,
    ) ??
    sortedItems.find((item) => !item.collected) ??
    sortedItems[0] ??
    null
  );
};

const formatCompactDate = (value: string) => {
  if (value.length !== 8) {
    return value;
  }

  return `${Number(value.slice(4, 6))}.${Number(value.slice(6, 8))}`;
};

const getTodayCompactDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
};
