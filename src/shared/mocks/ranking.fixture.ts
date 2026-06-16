import type { RankingEntry } from '@features/stamp/model';

export const weeklyRankingFixtures: readonly RankingEntry[] = [
  { id: 'weekly-1', nickname: '도장왕준호', stampCount: 12 },
  { id: 'weekly-2', nickname: '서울탐험가', stampCount: 9 },
  { id: 'weekly-3', nickname: '하늘바람', stampCount: 8 },
  { id: 'weekly-4', nickname: '한옥러버', stampCount: 7 },
  { id: 'weekly-5', nickname: '길따라도윤', stampCount: 7 },
  { id: 'weekly-6', nickname: '궁궐지기', stampCount: 6 },
  { id: 'weekly-7', nickname: '주말여행자', stampCount: 5 },
  { id: 'team-river', nickname: '한강러너', stampCount: 3 },
  { id: 'team-palace', nickname: '궁궐수집가', stampCount: 1 },
] as const;

export const allTimeRankingFixtures: readonly RankingEntry[] = [
  { id: 'all-1', nickname: '전국도장왕', stampCount: 48 },
  { id: 'all-2', nickname: '계절여행가', stampCount: 42 },
  { id: 'all-3', nickname: '시장탐험대', stampCount: 36 },
  { id: 'all-4', nickname: '문화산책러', stampCount: 31 },
  { id: 'team-river', nickname: '한강러너', stampCount: 28 },
  { id: 'team-palace', nickname: '궁궐수집가', stampCount: 24 },
] as const;
