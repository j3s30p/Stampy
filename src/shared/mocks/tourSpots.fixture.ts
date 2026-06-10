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
  readonly imageUrls: readonly string[];
  readonly overview?: string;
  readonly homepage?: string;
  readonly telephone?: string;
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
    imageUrls: [
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80',
    ],
    overview:
      '조선 왕조의 법궁으로, 서울을 대표하는 궁궐 관광지입니다. 넓은 전각과 정원, 계절마다 달라지는 풍경을 함께 즐길 수 있습니다.',
    homepage: 'https://royal.cha.go.kr/ENG/contents/E101010000.do?mc=EN_05_01',
    telephone: '02-3700-3900',
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
    imageUrls: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    ],
    overview:
      '전통 한옥과 골목 풍경이 이어지는 도심 산책 명소입니다. 천천히 걸으며 사진과 풍경을 함께 즐기기 좋은 곳입니다.',
    homepage: 'https://www.bukchon.seoul.kr',
    telephone: '02-2148-4161',
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
    imageUrls: [
      'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=1200&q=80',
    ],
    overview:
      '도심을 가로지르는 산책로와 물길이 이어지는 휴식형 관광지입니다. 짧은 코스에서도 분위기 전환이 잘 되는 스팟입니다.',
    homepage: 'https://korean.visitseoul.net/nature/cheonggyecheon/SGR0044',
    telephone: '02-120',
    contentTypeId: '12',
    theme: '도심 휴식',
    distanceMeters: 760,
  },
];
