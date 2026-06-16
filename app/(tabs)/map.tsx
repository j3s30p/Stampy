import { useRouter } from 'expo-router';
import { useAppFlow } from '@core/flow';
import { MapView } from '@features/map/ui';
import { env } from '@shared/config';

export default function MapScreen() {
  const router = useRouter();
  const { flow, selectEvent, selectSpot, currentLocation, locationStatus } = useAppFlow();

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
      selectedSpotId={flow?.selectedSpotId ?? null}
      currentLocation={currentLocation}
      locationStatus={locationStatus}
      useRealApi={env.useRealApi}
      onSelectEvent={selectEvent}
      onSelectSpot={selectSpot}
      onOpenEventDetail={openEventDetail}
      onOpenSpotDetail={openDetail}
      onOpenStamp={openStamp}
    />
  );
}
