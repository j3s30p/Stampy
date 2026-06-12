import type { TourEvent } from '@features/event/model';
import { asLatitude, asLongitude } from '@shared/types';

export const tourEventFixtures: readonly TourEvent[] = [
  {
    contentId: 'event-culture-flows-seoul-plaza-2026',
    title: '문화가 흐르는 서울광장',
    address: '서울광장, 110 Sejong-daero, Jung-gu, Seoul',
    location: {
      latitude: asLatitude(37.5665),
      longitude: asLongitude(126.978),
    },
    startDate: '20260501',
    endDate: '20261231',
    imageUrls: [],
    overview: '서울광장에서 5월부터 12월까지 이어지는 시민 문화 공연.',
    contentTypeId: '15',
  },
  {
    contentId: 'event-seoul-street-busking-guseokguseok-live-2026',
    title: '서울 거리공연 구석구석 라이브',
    address: '청계광장 및 서울 도심 일대, Jongno-gu, Seoul',
    location: {
      latitude: asLatitude(37.5691),
      longitude: asLongitude(126.9777),
    },
    startDate: '20260401',
    endDate: '20261231',
    imageUrls: [],
    overview: '4월부터 12월까지 서울 도심 곳곳에서 이어지는 거리공연.',
    contentTypeId: '15',
  },
  {
    contentId: 'event-revisiting-performance-springday-2026',
    title: '다시보는 공연봄날',
    address: '세종문화회관 S씨어터, 서울남산국악당, Seoul',
    location: {
      latitude: asLatitude(37.5722),
      longitude: asLongitude(126.9757),
    },
    startDate: '20260610',
    endDate: '20260628',
    imageUrls: [],
    overview: '세종문화회관 S씨어터와 서울남산국악당에서 이어지는 무료 청소년 공연.',
    contentTypeId: '15',
  },
  {
    contentId: 'event-damien-hirst-truth-is-false-everything-is-possible-2026',
    title: 'Damien Hirst solo exhibition: Truth is False, Everything is Possible',
    address: '30 Samcheong-ro, Jongno-gu, Seoul',
    location: {
      latitude: asLatitude(37.5796),
      longitude: asLongitude(126.9805),
    },
    startDate: '20260320',
    endDate: '20260628',
    imageUrls: [],
    overview: 'MMCA Seoul에서 열리는 Damien Hirst 개인전.',
    contentTypeId: '15',
  },
] as const;
