import { asLatitude, asLongitude } from '@shared/types';

export interface TourSpotFixture {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly location: {
    readonly latitude: ReturnType<typeof asLatitude>;
    readonly longitude: ReturnType<typeof asLongitude>;
  };
  readonly thumbnailUrl?: string;
  readonly contentTypeId: string;
  readonly theme: string;
  readonly distanceMeters: number;
}

export const tourSpotFixtures: readonly TourSpotFixture[] = [
  {
    contentId: 'spot-gyeongbokgung',
    title: '경복궁',
    address: '서울 종로구 사직로 161',
    location: {
      latitude: asLatitude(37.5796),
      longitude: asLongitude(126.977),
    },
    contentTypeId: '12',
    theme: '궁궐 산책',
    distanceMeters: 86,
  },
  {
    contentId: 'spot-bukchon',
    title: '북촌한옥마을',
    address: '서울 종로구 계동길 37',
    location: {
      latitude: asLatitude(37.5826),
      longitude: asLongitude(126.983),
    },
    contentTypeId: '12',
    theme: '골목 여행',
    distanceMeters: 420,
  },
  {
    contentId: 'spot-cheonggyecheon',
    title: '청계천',
    address: '서울 중구 청계천로',
    location: {
      latitude: asLatitude(37.569),
      longitude: asLongitude(126.9785),
    },
    contentTypeId: '12',
    theme: '도심 휴식',
    distanceMeters: 760,
  },
];
