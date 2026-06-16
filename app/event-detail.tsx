import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMockFlow } from '@core/demo';
import { eventRepository } from '@core/di';
import type { TourEvent } from '@features/event/model';
import { EventDetailView } from '@features/event/ui';
import type { HomeTourEvent } from '@features/tour/ui';
import { AppText, colors, spacing } from '@shared/ui';

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contentId?: string | string[] }>();
  const { flow, selectEvent } = useMockFlow();
  const contentId = Array.isArray(params.contentId) ? params.contentId[0] : params.contentId;
  const baseEvent =
    contentId && flow
      ? (flow.events.find((candidate) => candidate.contentId === contentId) ?? null)
      : null;
  const [detailEvent, setDetailEvent] = useState<{
    readonly contentId: string;
    readonly event: TourEvent | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!contentId || !baseEvent) {
      return () => {
        cancelled = true;
      };
    }

    void eventRepository
      .byId(contentId)
      .then((nextDetailEvent) => {
        if (!cancelled) {
          setDetailEvent({ contentId, event: nextDetailEvent });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetailEvent({ contentId, event: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [baseEvent, contentId]);

  const detailForCurrentEvent =
    detailEvent !== null && detailEvent.contentId === contentId ? detailEvent.event : null;
  const event = baseEvent ? mergeEvent(baseEvent, detailForCurrentEvent) : null;

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
          <AppText variant="h1">행사 정보를 불러오는 중</AppText>
          <AppText variant="body" tone="inkSoft" style={{ textAlign: 'center' }}>
            현재 위치와 행사 목록을 확인하고 있어요.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const openStamp = () => {
    if (event) {
      selectEvent(event.contentId);
    }
    router.push('/stamp-capture');
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  return (
    <EventDetailView
      event={event}
      onBack={goBack}
      onOpenDirections={() => undefined}
      onOpenStamp={openStamp}
    />
  );
}

const mergeEvent = (baseEvent: HomeTourEvent, detailEvent: TourEvent | null): HomeTourEvent => {
  if (!detailEvent) {
    return baseEvent;
  }

  return {
    ...baseEvent,
    title: detailEvent.title,
    address: detailEvent.address || baseEvent.address,
    thumbnailUrl: detailEvent.thumbnailUrl ?? detailEvent.imageUrls[0] ?? baseEvent.thumbnailUrl,
    imageUrls: detailEvent.imageUrls.length > 0 ? detailEvent.imageUrls : baseEvent.imageUrls,
    overview: detailEvent.overview ?? baseEvent.overview,
    homepage: detailEvent.homepage ?? baseEvent.homepage,
    telephone: detailEvent.telephone ?? baseEvent.telephone,
    contentTypeId: detailEvent.contentTypeId ?? baseEvent.contentTypeId,
    startDate: detailEvent.startDate || baseEvent.startDate,
    endDate: detailEvent.endDate || baseEvent.endDate,
  };
};
