import { useRouter } from 'expo-router';
import { useMockFlow } from '@core/demo';
import { MyPageView } from '@features/stamp/ui';

export default function MyScreen() {
  const router = useRouter();
  const { flow, selectSpot } = useMockFlow();

  const openDetail = (contentId: string) => {
    selectSpot(contentId);
    router.push({ pathname: '/spot-detail', params: { contentId } });
  };

  return (
    <MyPageView nickname="스탬피 테스터" stamps={flow?.myStamps ?? []} onSelectStamp={openDetail} />
  );
}
