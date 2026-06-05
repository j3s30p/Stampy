import { RankingView } from '@features/stamp/ui';
import { useMockFlow } from './useMockFlow';

export default function RankingScreen() {
  const flow = useMockFlow();
  return <RankingView entries={flow?.rankingEntries ?? []} />;
}
