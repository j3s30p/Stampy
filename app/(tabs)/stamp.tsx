import { useAppFlow } from '@core/flow';
import { StampView } from '@features/stamp/ui';

export default function StampScreen() {
  const { collectCandidate, flow, locationAccuracyMeters, locationAvailable, locationStatus } =
    useAppFlow();
  return (
    <StampView
      candidate={flow?.candidate ?? null}
      collectedCount={flow?.collectedCount ?? 0}
      locationAccuracyMeters={locationAccuracyMeters}
      locationAvailable={locationAvailable}
      locationStatus={locationStatus}
      recentStamps={flow?.myStamps ?? []}
      totalCount={flow?.totalSpotCount ?? 0}
      onCollect={collectCandidate}
    />
  );
}
