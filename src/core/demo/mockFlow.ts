import { eventRepository, tourRepository } from '@core/di';
import { distanceMetersBetween } from '@core/location';
import type { TourEvent } from '@features/event/model';
import { MockStampRepository } from '@features/stamp/api';
import type { Stamp } from '@features/stamp/model';
import type { MyStampSummary, RankingEntry, StampCandidate } from '@features/stamp/ui';
import type { TourSpot } from '@features/tour/model';
import type { HomeTourEvent, HomeTourSpot } from '@features/tour/ui';
import {
  STAMP_RADIUS_METERS,
  TOUR_DISCOVERY_LIMIT,
  TOUR_DISCOVERY_RADIUS_METERS,
} from '@shared/config';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';

const userId = 'mock-user-1';

const stampRepository = new MockStampRepository();

const seoulCityHallCenter = {
  latitude: asLatitude(37.5665),
  longitude: asLongitude(126.978),
};
const mockCollectionTotalCount = 12;

let collectedStamps: Stamp[] | null = null;
let selectedSpotId: string | null = null;
let selectedEventId: string | null = null;
const listeners = new Set<() => void>();

type TourSpotsFallbackResult = {
  readonly spots: readonly TourSpot[];
  readonly events: readonly TourEvent[];
  readonly distanceOrigin: Coordinates;
};

const loadCollectedStamps = async () => {
  collectedStamps ??= await stampRepository.listCollected(userId);
  return collectedStamps;
};

const sortAndLimitTourSpots = (spots: readonly TourSpot[], origin: Coordinates) => {
  return [...spots]
    .sort(
      (a, b) =>
        distanceMetersBetween(origin, a.location) - distanceMetersBetween(origin, b.location),
    )
    .slice(0, TOUR_DISCOVERY_LIMIT);
};

const notifyListeners = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

export async function getMockFlow(currentLocation: Coordinates | null = null) {
  const [{ events, spots, distanceOrigin }, stamps] = await Promise.all([
    loadTourSpotsWithFallback(currentLocation),
    loadCollectedStamps(),
  ]);
  const collectedSpotIds = new Set(stamps.map((stamp) => stamp.spotId));

  const spotCards: HomeTourSpot[] = spots.map((spot, index) => ({
    contentId: spot.contentId,
    title: spot.title,
    address: spot.address,
    theme: getTheme(spot, index),
    distanceMeters: distanceMetersBetween(distanceOrigin, spot.location),
    verificationDistanceMeters: currentLocation
      ? distanceMetersBetween(currentLocation, spot.location)
      : null,
    collected: collectedSpotIds.has(spot.contentId),
    location: spot.location,
    thumbnailUrl: spot.thumbnailUrl,
    imageUrls: spot.imageUrls,
    overview: spot.overview,
    homepage: spot.homepage,
    telephone: spot.telephone,
    contentTypeId: spot.contentTypeId,
  }));

  const eventCards: HomeTourEvent[] = events.map((event) => ({
    contentId: event.contentId,
    title: event.title,
    address: event.address,
    distanceMeters: distanceMetersBetween(distanceOrigin, event.location),
    verificationDistanceMeters: currentLocation
      ? distanceMetersBetween(currentLocation, event.location)
      : null,
    collected: collectedSpotIds.has(event.contentId),
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    thumbnailUrl: event.thumbnailUrl,
    imageUrls: event.imageUrls,
    overview: event.overview,
    homepage: event.homepage,
    telephone: event.telephone,
    contentTypeId: event.contentTypeId,
  }));

  const selectedSpot = spotCards.find((spot) => spot.contentId === selectedSpotId) ?? null;
  const selectedEvent = eventCards.find((event) => event.contentId === selectedEventId) ?? null;
  const stampCandidates: StampCandidate[] = [
    ...spotCards.map(toSpotStampCandidate),
    ...eventCards.map(toEventStampCandidate),
  ];
  const candidate: StampCandidate | null =
    (selectedEvent ? toEventStampCandidate(selectedEvent) : null) ??
    (selectedSpot ? toSpotStampCandidate(selectedSpot) : null) ??
    [...stampCandidates]
      .filter((candidate) => !candidate.collected)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)[0] ??
    [...stampCandidates].sort((a, b) => a.distanceMeters - b.distanceMeters)[0] ??
    null;

  const myStamps: MyStampSummary[] = [...spotCards, ...eventCards].map((spot) => {
    const collectedStamp = stamps.find((stamp) => stamp.spotId === spot.contentId);
    return {
      contentId: spot.contentId,
      title: spot.title,
      collected: Boolean(collectedStamp),
      collectedAt: collectedStamp?.collectedAt,
      thumbnailUrl: spot.thumbnailUrl,
    };
  });

  const collectedCount = stamps.length;
  const totalSpotCount = Math.max(
    spotCards.length + eventCards.length,
    collectedCount,
    mockCollectionTotalCount,
  );
  const rankingEntries: RankingEntry[] = [
    { id: 'team-river', nickname: '한강러너', stampCount: 3 },
    { id: 'mock-user-1', nickname: '스탬피 테스터', stampCount: collectedCount, isMe: true },
    { id: 'team-palace', nickname: '궁궐수집가', stampCount: 1 },
  ].sort((a, b) => b.stampCount - a.stampCount);

  return {
    spots: spotCards,
    events: eventCards,
    candidate,
    collectedCount,
    totalSpotCount,
    myStamps,
    rankingEntries,
    selectedSpot,
    selectedEvent,
    selectedEventId,
    selectedSpotId,
  };
}

const loadTourSpotsWithFallback = async (
  currentLocation: Coordinates | null,
): Promise<TourSpotsFallbackResult> => {
  if (!currentLocation) {
    const [spots, events] = await Promise.all([
      tourRepository.searchNearby(seoulCityHallCenter, TOUR_DISCOVERY_RADIUS_METERS),
      eventRepository.searchNearby(seoulCityHallCenter, TOUR_DISCOVERY_RADIUS_METERS),
    ]);

    return {
      spots: sortAndLimitTourSpots(spots, seoulCityHallCenter),
      events: sortAndLimitTourEvents(events, seoulCityHallCenter),
      distanceOrigin: seoulCityHallCenter,
    };
  }

  try {
    const [currentLocationSpots, currentLocationEvents] = await Promise.all([
      tourRepository.searchNearby(currentLocation, TOUR_DISCOVERY_RADIUS_METERS),
      eventRepository.searchNearby(currentLocation, TOUR_DISCOVERY_RADIUS_METERS),
    ]);

    if (currentLocationSpots.length > 0 || currentLocationEvents.length > 0) {
      return {
        spots: sortAndLimitTourSpots(currentLocationSpots, currentLocation),
        events: sortAndLimitTourEvents(currentLocationEvents, currentLocation),
        distanceOrigin: currentLocation,
      };
    }
  } catch {
    // Fall back to the Seoul City Hall center when the live location lookup fails.
  }

  const [fallbackSpots, fallbackEvents] = await Promise.all([
    tourRepository.searchNearby(seoulCityHallCenter, TOUR_DISCOVERY_RADIUS_METERS),
    eventRepository.searchNearby(seoulCityHallCenter, TOUR_DISCOVERY_RADIUS_METERS),
  ]);

  return {
    spots: sortAndLimitTourSpots(fallbackSpots, seoulCityHallCenter),
    events: sortAndLimitTourEvents(fallbackEvents, seoulCityHallCenter),
    distanceOrigin: seoulCityHallCenter,
  };
};

const sortAndLimitTourEvents = (events: readonly TourEvent[], origin: Coordinates) => {
  return [...events]
    .sort(
      (a, b) =>
        distanceMetersBetween(origin, a.location) - distanceMetersBetween(origin, b.location),
    )
    .slice(0, TOUR_DISCOVERY_LIMIT);
};

const getTheme = (spot: TourSpot, index: number) => {
  if (spot.contentTypeId === '12') {
    if (spot.title.includes('궁')) {
      return '궁궐 산책';
    }

    if (spot.title.includes('한옥') || spot.title.includes('마을')) {
      return '골목 여행';
    }

    return '관광지';
  }

  return index === 0 ? '추천 스팟' : '도심 여행';
};

const toSpotStampCandidate = (spot: HomeTourSpot): StampCandidate => ({
  kind: 'spot',
  contentId: spot.contentId,
  title: spot.title,
  address: spot.address,
  distanceMeters: spot.distanceMeters,
  verificationDistanceMeters: spot.verificationDistanceMeters,
  collected: spot.collected,
});

const toEventStampCandidate = (event: HomeTourEvent): StampCandidate => ({
  kind: 'event',
  contentId: event.contentId,
  title: event.title,
  address: event.address,
  distanceMeters: event.distanceMeters,
  verificationDistanceMeters: event.verificationDistanceMeters,
  collected: event.collected,
});

export async function collectMockCandidate(
  currentLocation: Coordinates | null,
  accuracyMeters: number | null,
) {
  if (!currentLocation || accuracyMeters === null || accuracyMeters > STAMP_RADIUS_METERS) {
    return getMockFlow(currentLocation);
  }

  const flow = await getMockFlow(currentLocation);
  const candidate = flow.candidate;

  if (!candidate || candidate.collected) {
    return flow;
  }

  const candidateSpot =
    flow.spots.find((spot) => spot.contentId === candidate.contentId) ??
    flow.events.find((event) => event.contentId === candidate.contentId);

  if (!candidateSpot) {
    return flow;
  }

  const actualDistanceMeters = distanceMetersBetween(currentLocation, candidateSpot.location);

  if (actualDistanceMeters > STAMP_RADIUS_METERS) {
    return flow;
  }

  const stamps = await loadCollectedStamps();
  const alreadyCollected = stamps.some((stamp) => stamp.spotId === candidate.contentId);

  if (alreadyCollected) {
    return flow;
  }

  const nextStamp = await stampRepository.collect(userId, {
    spotId: candidate.contentId,
    location: currentLocation,
  });

  collectedStamps = [...stamps, nextStamp];
  selectedSpotId = null;
  selectedEventId = null;
  notifyListeners();

  return getMockFlow(currentLocation);
}

export function selectMockSpot(contentId: string) {
  selectedSpotId = contentId;
  selectedEventId = null;
  notifyListeners();
}

export function selectMockEvent(contentId: string) {
  selectedEventId = contentId;
  selectedSpotId = null;
  notifyListeners();
}

export function subscribeMockFlow(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
