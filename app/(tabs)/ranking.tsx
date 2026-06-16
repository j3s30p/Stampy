import { useState } from 'react';
import { useMockFlow } from '@core/demo';
import type { RankingPeriod } from '@features/stamp/model';
import { RankingView } from '@features/stamp/ui';

export default function RankingScreen() {
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('weekly');
  const { flow } = useMockFlow(activePeriod);
  const rankingEntries = flow?.rankingPeriod === activePeriod ? flow.rankingEntries : [];

  return (
    <RankingView
      activePeriod={activePeriod}
      entries={rankingEntries}
      onPeriodChange={setActivePeriod}
    />
  );
}
