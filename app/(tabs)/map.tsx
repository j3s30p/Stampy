import { useRouter } from 'expo-router';
import { useMockFlow } from '@core/demo';
import { MapView } from '@features/map/ui';

export default function MapScreen() {
  const router = useRouter();
  const { flow, selectSpot } = useMockFlow();

  const openDetail = (contentId: string) => {
    selectSpot(contentId);
    router.push({ pathname: '/spot-detail', params: { contentId } });
  };

  const openStamp = (contentId: string) => {
    selectSpot(contentId);
    router.push('/stamp');
  };

  return (
    <MapView spots={flow?.spots ?? []} onOpenSpotDetail={openDetail} onOpenStamp={openStamp} />
  );
}
