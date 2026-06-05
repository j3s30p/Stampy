import { useMockFlow } from '@core/demo';
import { StampView } from '@features/stamp/ui';

export default function StampScreen() {
  const flow = useMockFlow();
  return (
    <StampView
      candidate={flow?.candidate ?? null}
      collectedCount={flow?.collectedCount ?? 0}
      totalCount={flow?.spots.length ?? 0}
    />
  );
}
