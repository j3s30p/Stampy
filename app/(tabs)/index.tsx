import { HomeView } from '@features/tour/ui';
import { useMockFlow } from './useMockFlow';

export default function HomeScreen() {
  const flow = useMockFlow();
  return <HomeView spots={flow?.spots ?? []} collectedCount={flow?.collectedCount ?? 0} />;
}
