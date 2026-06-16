import { useState } from 'react';
import { useAppFlow } from '@core/flow';
import type { RankingPeriod } from '@features/stamp/model';
import { RankingView } from '@features/stamp/ui';

export default function RankingScreen() {
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('weekly');
  const { flow } = useAppFlow(activePeriod);
  const rankingEntries = flow?.rankingPeriod === activePeriod ? flow.rankingEntries : [];

  return (
    <RankingView
      activePeriod={activePeriod}
      entries={rankingEntries}
      onPeriodChange={setActivePeriod}
    />
  );
}
