import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMockFlow } from '@core/demo';
import { mapRouteRepository } from '@core/di';
import { MapView } from '@features/map/ui';
import { env } from '@shared/config';

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    directions?: string | string[];
    eventId?: string | string[];
    spotId?: string | string[];
  }>();
  const { currentLocation, flow, selectEvent, selectSpot, locationStatus } = useMockFlow();
  const directionsRequestKey = getSingleParam(params.directions);
  const selectedEventId = getSingleParam(params.eventId) ?? flow?.selectedEventId ?? null;
  const selectedSpotId = selectedEventId
    ? null
    : (getSingleParam(params.spotId) ?? flow?.selectedSpotId ?? null);

  const openDetail = (contentId: string) => {
    selectSpot(contentId);
    router.push({ pathname: '/spot-detail', params: { contentId } });
  };

  const openEventDetail = (contentId: string) => {
    selectEvent(contentId);
    router.push({ pathname: '/event-detail', params: { contentId } });
  };

  const openStamp = (contentId: string) => {
    if (flow?.events.some((event) => event.contentId === contentId)) {
      selectEvent(contentId);
    } else {
      selectSpot(contentId);
    }

    router.push('/stamp-capture');
  };

  return (
    <MapView
      kakaoJsKey={env.kakaoJsKey}
      spots={flow?.spots ?? []}
      events={flow?.events ?? []}
      totalCount={flow?.totalSpotCount ?? 0}
      selectedSpotId={selectedSpotId}
      selectedEventId={selectedEventId}
      currentLocation={currentLocation}
      locationStatus={locationStatus}
      mapRouteRepository={mapRouteRepository}
      directionsRequestKey={directionsRequestKey}
      useRealApi={env.useRealApi}
      onSelectEvent={selectEvent}
      onSelectSpot={selectSpot}
      onOpenEventDetail={openEventDetail}
      onOpenSpotDetail={openDetail}
      onOpenStamp={openStamp}
    />
  );
}

const getSingleParam = (value: string | string[] | undefined): string | null => {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
};
