import { useRouter } from 'expo-router';
import { useMockFlow } from '@core/demo';
import { HomeView } from '@features/tour/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { flow, selectEvent, selectSpot } = useMockFlow();

  const openDetail = (contentId: string) => {
    selectSpot(contentId);
    router.push({ pathname: '/spot-detail', params: { contentId } });
  };

  const openEventDetail = (contentId: string) => {
    selectEvent(contentId);
    router.push({ pathname: '/event-detail', params: { contentId } });
  };

  return (
    <HomeView
      spots={flow?.spots ?? []}
      events={flow?.events ?? []}
      collectedCount={flow?.collectedCount ?? 0}
      totalCount={flow?.totalSpotCount ?? 0}
      onSelectEvent={openEventDetail}
      onSelectSpot={openDetail}
    />
  );
}
