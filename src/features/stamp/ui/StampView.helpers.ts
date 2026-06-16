import type { MutableRefObject } from 'react';
import type { StampCandidate } from '@features/stamp/model';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { RecentStamp, StampLocationStatus } from './StampView.types';

export const HOLD_DURATION_MS = 1500;
export const HOLD_RING_SIZE = 192;
export const HOLD_RING_RADIUS = 86;
export const HOLD_RING_CIRCUMFERENCE = 2 * Math.PI * HOLD_RING_RADIUS;

export const buildGridItems = (
  recentStamps: readonly RecentStamp[],
  candidate: StampCandidate | null,
) => {
  const knownItems = recentStamps.length > 0 ? recentStamps : [];
  const candidateItem =
    candidate && !knownItems.some((stamp) => stamp.contentId === candidate.contentId)
      ? [{ contentId: candidate.contentId, title: candidate.title, collected: candidate.collected }]
      : [];
  const filler = [
    { contentId: 'mock-cheonggye', title: '청계천', collected: false },
    { contentId: 'mock-deoksu', title: '덕수궁', collected: false },
    { contentId: 'mock-market', title: '광장시장', collected: false },
    { contentId: 'mock-cathedral', title: '명동성당', collected: false },
    { contentId: 'mock-forest', title: '서울숲', collected: false },
  ];

  return [...knownItems, ...candidateItem, ...filler].slice(0, 9);
};

export const getStampMeta = (
  stamp: { readonly contentId: string },
  candidate: StampCandidate | null,
) => {
  if (
    candidate?.contentId === stamp.contentId &&
    candidate.verificationDistanceMeters !== null &&
    candidate.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return `${candidate.distanceMeters}m · 인증 가능`;
  }

  if (candidate?.contentId === stamp.contentId) {
    return `${candidate.distanceMeters}m`;
  }

  return '방문 전';
};

export const getStampGlyph = (index: number) =>
  ['村', '宮', '塔', '門', '川', '德', '場', '聖', '林'][index] ?? '印';

export const clearHoldTimer = (
  timerRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
) => {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
};

export const getStatusHint = ({
  candidate,
  canVerify,
  locationAccuracyMeters,
  locationAvailable,
  locationStatus,
}: {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
  readonly locationAccuracyMeters: number | null;
  readonly locationAvailable: boolean;
  readonly locationStatus: StampLocationStatus;
}) => {
  if (!candidate) {
    return '주변 장소를 찾고 있어요.';
  }

  if (candidate.collected) {
    return '이미 이 장소의 도장을 찍었습니다.';
  }

  if (canVerify) {
    return '도장 영역을 꾹 누르고 있으면 인증이 완료돼요.';
  }

  if (locationStatus === 'denied') {
    return '위치 권한을 허용해야 도장을 찍을 수 있어요.';
  }

  if (locationStatus === 'loading' || locationStatus === 'unavailable' || !locationAvailable) {
    return 'GPS 확인 중';
  }

  if (locationAccuracyMeters === null) {
    return 'GPS 확인 중';
  }

  if (
    candidate.verificationDistanceMeters !== null &&
    candidate.verificationDistanceMeters > STAMP_RADIUS_METERS
  ) {
    return `반경 ${STAMP_RADIUS_METERS}m 안으로 이동하세요.`;
  }

  if (locationAccuracyMeters > STAMP_RADIUS_METERS) {
    return '위치 정확도가 아직 부족해요.';
  }

  return '상태를 확인하는 중이에요.';
};
