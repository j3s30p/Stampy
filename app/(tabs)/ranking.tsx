import { useMockFlow } from '@core/demo';
import { RankingView } from '@features/stamp/ui';

export default function RankingScreen() {
  const flow = useMockFlow();
  return <RankingView entries={flow?.rankingEntries ?? []} />;
}
