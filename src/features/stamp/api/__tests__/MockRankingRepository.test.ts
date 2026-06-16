import type { AuthRepository, UserIdentity } from '@core/auth';
import { asLatitude, asLongitude } from '@shared/types';
import { MockRankingRepository } from '../MockRankingRepository';
import type { StampRepository } from '../StampRepository';

const mockUser: UserIdentity = {
  id: 'mock-user-1',
  nickname: '스탬피 테스터',
};

const createAuthRepository = (): AuthRepository => ({
  currentUser: async () => mockUser,
  signInAnonymously: async () => mockUser,
  signOut: async () => {},
});

const createStampRepository = (stampCount: number): StampRepository => ({
  listCollected: async () =>
    Array.from({ length: stampCount }, (_, index) => ({
      id: `stamp-${index}`,
      spotId: `spot-${index}`,
      collectedAt: '2026-06-16T00:00:00.000Z',
      location: {
        latitude: asLatitude(37.5665),
        longitude: asLongitude(126.978),
      },
    })),
  collect: async (_userId, stamp) => ({
    ...stamp,
    id: `stamp-${stamp.spotId}`,
    collectedAt: '2026-06-16T00:00:00.000Z',
  }),
  hasCollected: async () => false,
});

describe('MockRankingRepository', () => {
  it('내 순위의 도장 수는 StampRepository의 현재 수집 수와 일치한다', async () => {
    const repository = new MockRankingRepository(createStampRepository(4), createAuthRepository());

    const ranking = await repository.getRanking('weekly');
    const me = ranking.find((entry) => entry.isMe);

    expect(me).toMatchObject({
      id: mockUser.id,
      nickname: mockUser.nickname,
      stampCount: 4,
      isMe: true,
    });
  });

  it('weekly와 all 계약 모두 fixture 참가자와 내 순위를 반환한다', async () => {
    const repository = new MockRankingRepository(createStampRepository(2), createAuthRepository());

    const weeklyRanking = await repository.getRanking('weekly');
    const allTimeRanking = await repository.getRanking('all');

    expect(weeklyRanking.some((entry) => entry.nickname === '한강러너')).toBe(true);
    expect(allTimeRanking.some((entry) => entry.nickname === '궁궐수집가')).toBe(true);
    expect(weeklyRanking.filter((entry) => entry.isMe)).toHaveLength(1);
    expect(allTimeRanking.filter((entry) => entry.isMe)).toHaveLength(1);
  });

  it('period별 fixture 데이터를 구분해서 반환한다', async () => {
    const repository = new MockRankingRepository(createStampRepository(2), createAuthRepository());

    const weeklyRanking = await repository.getRanking('weekly');
    const allTimeRanking = await repository.getRanking('all');

    expect(weeklyRanking[0]?.nickname).toBe('도장왕준호');
    expect(allTimeRanking[0]?.nickname).toBe('전국도장왕');
  });
});
