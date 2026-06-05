import { useMockFlow } from '@core/demo';
import { StampView } from '@features/stamp/ui';

export default function StampScreen() {
  const { collectCandidate, flow, locationAvailable, locationStatus } = useMockFlow();
  return (
    <StampView
      candidate={flow?.candidate ?? null}
      collectedCount={flow?.collectedCount ?? 0}
      locationAvailable={locationAvailable}
      locationStatus={locationStatus}
      totalCount={flow?.spots.length ?? 0}
      onCollect={collectCandidate}
    />
  );
}
