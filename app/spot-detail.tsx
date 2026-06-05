import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMockFlow } from '@core/demo';
import { TourSpotDetailView } from '@features/tour/ui';
import { AppText, colors, spacing } from '@shared/ui';

export default function SpotDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contentId?: string | string[] }>();
  const { flow, selectSpot } = useMockFlow();
  const contentId = Array.isArray(params.contentId) ? params.contentId[0] : params.contentId;
  const spot =
    contentId && flow
      ? (flow.spots.find((candidate) => candidate.contentId === contentId) ?? null)
      : null;

  if (!flow) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xxl,
            gap: spacing.md,
          }}
        >
          <AppText variant="h1">관광지 정보를 불러오는 중</AppText>
          <AppText variant="body" tone="inkSoft" style={{ textAlign: 'center' }}>
            현재 위치와 스팟 목록을 확인하고 있어요.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const openStamp = () => {
    if (spot) {
      selectSpot(spot.contentId);
    }
    router.push('/stamp');
  };

  return (
    <TourSpotDetailView
      spot={spot}
      onBack={() => router.back()}
      onOpenDirections={() => undefined}
      onOpenStamp={openStamp}
    />
  );
}
