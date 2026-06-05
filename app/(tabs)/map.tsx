import { useMockFlow } from '@core/demo';
import { MapView } from '@features/map/ui';

export default function MapScreen() {
  const { flow } = useMockFlow();
  return <MapView spots={flow?.spots ?? []} />;
}
