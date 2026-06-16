import { useRouter } from 'expo-router';
import { useAppFlow } from '@core/flow';
import { MyPageView } from '@features/stamp/ui';

export default function MyScreen() {
  const router = useRouter();
  const { flow, selectSpot } = useAppFlow();

  const openDetail = (contentId: string) => {
    selectSpot(contentId);
    router.push({ pathname: '/spot-detail', params: { contentId } });
  };

  return (
    <MyPageView nickname="스탬피 테스터" stamps={flow?.myStamps ?? []} onSelectStamp={openDetail} />
  );
}
