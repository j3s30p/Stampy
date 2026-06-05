import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMockFlow } from '@core/demo';
import { TourSpotDetailView } from '@features/tour/ui';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF3F8' }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 12,
          }}
        >
          <Text style={{ color: '#172033', fontSize: 20, fontWeight: '900' }}>
            관광지 정보를 불러오는 중
          </Text>
          <Text style={{ color: '#657084', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            현재 위치와 스팟 목록을 확인하고 있어요.
          </Text>
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
