import { useRouter } from 'expo-router';
import { useMockFlow } from '@core/demo';
import { HomeView } from '@features/tour/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { flow, selectSpot } = useMockFlow();

  const openStamp = (contentId: string) => {
    selectSpot(contentId);
    router.push('/stamp');
  };

  return (
    <HomeView
      spots={flow?.spots ?? []}
      collectedCount={flow?.collectedCount ?? 0}
      onSelectSpot={openStamp}
    />
  );
}
