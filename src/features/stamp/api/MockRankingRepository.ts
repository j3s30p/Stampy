import type { AuthRepository } from '@core/auth';
import { allTimeRankingFixtures, weeklyRankingFixtures } from '@shared/mocks';
import type { RankingEntry, RankingPeriod } from '../model';
import type { RankingRepository } from './RankingRepository';
import type { StampRepository } from './StampRepository';

export class MockRankingRepository implements RankingRepository {
  constructor(
    private readonly stampRepository: StampRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async getRanking(period: RankingPeriod): Promise<RankingEntry[]> {
    const user = await this.resolveCurrentUser();
    const collectedStampCount = (await this.stampRepository.listCollected(user.id)).length;
    const fixtureEntries = period === 'weekly' ? weeklyRankingFixtures : allTimeRankingFixtures;
    const otherEntries = fixtureEntries.filter((entry) => !entry.isMe && entry.id !== user.id);

    return [
      ...otherEntries,
      {
        id: user.id,
        nickname: user.nickname,
        stampCount: collectedStampCount,
        isMe: true,
      },
    ].sort((a, b) => b.stampCount - a.stampCount);
  }

  private async resolveCurrentUser() {
    return (
      (await this.authRepository.currentUser()) ?? (await this.authRepository.signInAnonymously())
    );
  }
}
