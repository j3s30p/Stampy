import type { TourSpot } from '@features/tour/model';
import { asLatitude, asLongitude } from '@shared/types';

export const tourSpotFixtures: readonly TourSpot[] = [
  {
    contentId: 'spot-gyeongbokgung-palace',
    title: 'Gyeongbokgung Palace',
    address: '161 Sajik-ro, Jongno-gu, Seoul',
    location: {
      latitude: asLatitude(37.579617),
      longitude: asLongitude(126.977041),
    },
    imageUrls: [],
    overview: '조선의 법궁으로 서울 도심에서 가장 대표적인 궁궐.',
    contentTypeId: '12',
  },
  {
    contentId: 'spot-deoksugung-palace',
    title: 'Deoksugung Palace',
    address: '99 Sejong-daero, Jung-gu, Seoul',
    location: {
      latitude: asLatitude(37.565825),
      longitude: asLongitude(126.975471),
    },
    imageUrls: [],
    overview: '석조전과 정관헌이 함께 있는 도심 속 궁궐.',
    contentTypeId: '12',
  },
  {
    contentId: 'spot-bukchon-hanok-village',
    title: 'Bukchon Hanok Village',
    address: '37 Gyedong-gil, Jongno-gu, Seoul',
    location: {
      latitude: asLatitude(37.582604),
      longitude: asLongitude(126.983682),
    },
    imageUrls: [],
    overview: '전통 한옥이 밀집한 북촌의 골목 풍경.',
    contentTypeId: '12',
  },
  {
    contentId: 'spot-insadong-culture-street',
    title: 'Insadong Culture Street',
    address: 'Insadong-gil, Jongno-gu, Seoul',
    location: {
      latitude: asLatitude(37.574433),
      longitude: asLongitude(126.985022),
    },
    imageUrls: [],
    overview: '전통 공예점과 찻집이 이어지는 문화 산책로.',
    contentTypeId: '12',
  },
  {
    contentId: 'spot-myeongdong-cathedral',
    title: 'Myeongdong Cathedral',
    address: '74 Myeongdong-gil, Jung-gu, Seoul',
    location: {
      latitude: asLatitude(37.563635),
      longitude: asLongitude(126.987621),
    },
    imageUrls: [],
    overview: '서울 최초의 본당이 있는 고딕 성당.',
    contentTypeId: '12',
  },
  {
    contentId: 'spot-namdaemun-market',
    title: 'Namdaemun Market',
    address: '21 Namdaemunsijang 4-gil, Jung-gu, Seoul',
    location: {
      latitude: asLatitude(37.559234),
      longitude: asLongitude(126.977497),
    },
    imageUrls: [],
    overview: '오랜 역사를 지닌 서울 대표 전통시장.',
    contentTypeId: '12',
  },
  {
    contentId: 'spot-seoul-museum-of-art',
    title: 'Seoul Museum of Art',
    address: '61 Deoksugung-gil, Jung-gu, Seoul',
    location: {
      latitude: asLatitude(37.564682),
      longitude: asLongitude(126.973566),
    },
    imageUrls: [],
    overview: '현대미술 전시를 자주 볼 수 있는 도심 미술관.',
    contentTypeId: '12',
  },
  {
    contentId: 'spot-n-seoul-tower',
    title: 'N Seoul Tower',
    address: '105 Namsangongwon-gil, Yongsan-gu, Seoul',
    location: {
      latitude: asLatitude(37.551169),
      longitude: asLongitude(126.988226),
    },
    imageUrls: [],
    overview: '남산 정상에서 서울 전경을 내려다볼 수 있는 전망 명소.',
    contentTypeId: '12',
  },
] as const;
