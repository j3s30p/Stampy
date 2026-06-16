import { useRouter } from 'expo-router';
import { useAppFlow } from '@core/flow';
import { StampView } from '@features/stamp/ui';

export default function StampCaptureScreen() {
  const router = useRouter();
  const { collectCandidate, flow, locationAccuracyMeters, locationAvailable, locationStatus } =
    useAppFlow();

  return (
    <StampView
      candidate={flow?.candidate ?? null}
      collectedCount={flow?.collectedCount ?? 0}
      locationAccuracyMeters={locationAccuracyMeters}
      locationAvailable={locationAvailable}
      locationStatus={locationStatus}
      mode="capture"
      recentStamps={flow?.myStamps ?? []}
      totalCount={flow?.totalSpotCount ?? 0}
      onBack={() => router.back()}
      onCollect={collectCandidate}
    />
  );
}
