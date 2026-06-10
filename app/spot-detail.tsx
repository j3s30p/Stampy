import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMockFlow } from '@core/demo';
import { tourRepository } from '@core/di';
import type { TourSpot } from '@features/tour/model';
import { TourSpotDetailView, type HomeTourSpot } from '@features/tour/ui';
import { AppText, colors, spacing } from '@shared/ui';

export default function SpotDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contentId?: string | string[] }>();
  const { flow, selectSpot } = useMockFlow();
  const contentId = Array.isArray(params.contentId) ? params.contentId[0] : params.contentId;
  const baseSpot =
    contentId && flow
      ? (flow.spots.find((candidate) => candidate.contentId === contentId) ?? null)
      : null;
  const [detailSpot, setDetailSpot] = useState<{
    readonly contentId: string;
    readonly spot: TourSpot | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!contentId || !baseSpot) {
      return () => {
        cancelled = true;
      };
    }

    void tourRepository
      .byId(contentId)
      .then((nextDetailSpot) => {
        if (!cancelled) {
          setDetailSpot({ contentId, spot: nextDetailSpot });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetailSpot({ contentId, spot: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [baseSpot, contentId]);

  const detailForCurrentSpot =
    detailSpot !== null && detailSpot.contentId === contentId ? detailSpot.spot : null;
  const spot = baseSpot ? mergeSpot(baseSpot, detailForCurrentSpot) : null;

  if (!flow) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
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
    router.push('/stamp-capture');
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

const mergeSpot = (baseSpot: HomeTourSpot, detailSpot: TourSpot | null): HomeTourSpot => {
  if (!detailSpot) {
    return baseSpot;
  }

  return {
    ...baseSpot,
    title: detailSpot.title,
    address: detailSpot.address,
    thumbnailUrl: detailSpot.thumbnailUrl ?? detailSpot.imageUrls[0] ?? baseSpot.thumbnailUrl,
    imageUrls: detailSpot.imageUrls.length > 0 ? detailSpot.imageUrls : baseSpot.imageUrls,
    overview: detailSpot.overview ?? baseSpot.overview,
    homepage: detailSpot.homepage ?? baseSpot.homepage,
    telephone: detailSpot.telephone ?? baseSpot.telephone,
    contentTypeId: detailSpot.contentTypeId ?? baseSpot.contentTypeId,
  };
};
