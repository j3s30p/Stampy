import { MapView } from '@features/map/ui';
import { useMockFlow } from './useMockFlow';

export default function MapScreen() {
  const flow = useMockFlow();
  return <MapView spots={flow?.spots ?? []} />;
}
