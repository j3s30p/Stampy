import { useRouter } from 'expo-router';
import { useMockFlow } from '@core/demo';
import { MapView } from '@features/map/ui';
import { env } from '@shared/config';

export default function MapScreen() {
  const router = useRouter();
  const { flow, selectSpot, currentLocation, locationStatus } = useMockFlow();

  const openDetail = (contentId: string) => {
    selectSpot(contentId);
    router.push({ pathname: '/spot-detail', params: { contentId } });
  };

  const openStamp = (contentId: string) => {
    selectSpot(contentId);
    router.push('/stamp');
  };

  return (
    <MapView
      kakaoJsKey={env.kakaoJsKey}
      spots={flow?.spots ?? []}
      selectedSpotId={flow?.selectedSpotId ?? null}
      currentLocation={currentLocation}
      locationStatus={locationStatus}
      onSelectSpot={selectSpot}
      onOpenSpotDetail={openDetail}
      onOpenStamp={openStamp}
    />
  );
}
