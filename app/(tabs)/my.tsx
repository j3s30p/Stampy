import { useMockFlow } from '@core/demo';
import { MyPageView } from '@features/stamp/ui';

export default function MyScreen() {
  const flow = useMockFlow();
  return <MyPageView nickname="스탬피 테스터" stamps={flow?.myStamps ?? []} />;
}
