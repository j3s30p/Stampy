import type { RankingEntry, RankingPeriod } from '../model';

export interface RankingRepository {
  getRanking(period: RankingPeriod): Promise<RankingEntry[]>;
}
