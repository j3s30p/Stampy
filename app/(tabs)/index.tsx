import { useRouter } from 'expo-router';
import { useMockFlow } from '@core/demo';
import { HomeView } from '@features/tour/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { flow, selectSpot } = useMockFlow();

  const openDetail = (contentId: string) => {
    selectSpot(contentId);
    router.push({ pathname: '/spot-detail', params: { contentId } });
  };

  return (
    <HomeView
      spots={flow?.spots ?? []}
      collectedCount={flow?.collectedCount ?? 0}
      onSelectSpot={openDetail}
    />
  );
}
