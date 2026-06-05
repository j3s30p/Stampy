import { useMockFlow } from '@core/demo';
import { HomeView } from '@features/tour/ui';

export default function HomeScreen() {
  const flow = useMockFlow();
  return <HomeView spots={flow?.spots ?? []} collectedCount={flow?.collectedCount ?? 0} />;
}
