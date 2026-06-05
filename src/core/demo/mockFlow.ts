import { distanceMetersBetween } from '@core/location';
import { MockStampRepository } from '@features/stamp/api';
import type { Stamp } from '@features/stamp/model';
import type { MyStampSummary, RankingEntry, StampCandidate } from '@features/stamp/ui';
import { MockTourRepository } from '@features/tour/api';
import type { HomeTourSpot } from '@features/tour/ui';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';

const userId = 'mock-user-1';

const tourRepository = new MockTourRepository();
const stampRepository = new MockStampRepository();

const mockCenter = {
  latitude: asLatitude(37.5796),
  longitude: asLongitude(126.977),
};

let collectedStamps: Stamp[] | null = null;
let selectedSpotId: string | null = null;
const listeners = new Set<() => void>();

const loadCollectedStamps = async () => {
  collectedStamps ??= await stampRepository.listCollected(userId);
  return collectedStamps;
};

const notifyListeners = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

export async function getMockFlow(currentLocation: Coordinates | null = null) {
  const locationForDistance = currentLocation ?? mockCenter;
  const [spots, stamps] = await Promise.all([
    tourRepository.searchNearby(locationForDistance, STAMP_RADIUS_METERS),
    loadCollectedStamps(),
  ]);
  const collectedSpotIds = new Set(stamps.map((stamp) => stamp.spotId));

  const spotCards: HomeTourSpot[] = spots.map((spot, index) => ({
    contentId: spot.contentId,
    title: spot.title,
    address: spot.address,
    theme: index === 0 ? '궁궐 산책' : index === 1 ? '골목 여행' : '도심 휴식',
    distanceMeters: distanceMetersBetween(locationForDistance, spot.location),
    collected: collectedSpotIds.has(spot.contentId),
  }));

  const selectedSpot = spotCards.find((spot) => spot.contentId === selectedSpotId) ?? null;
  const candidate: StampCandidate | null =
    selectedSpot ??
    [...spotCards]
      .filter((spot) => !spot.collected)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)[0] ??
    [...spotCards].sort((a, b) => a.distanceMeters - b.distanceMeters)[0] ??
    null;

  const myStamps: MyStampSummary[] = spotCards.map((spot) => {
    const collectedStamp = stamps.find((stamp) => stamp.spotId === spot.contentId);
    return {
      contentId: spot.contentId,
      title: spot.title,
      collected: Boolean(collectedStamp),
      collectedAt: collectedStamp?.collectedAt,
    };
  });

  const collectedCount = stamps.length;
  const rankingEntries: RankingEntry[] = [
    { id: 'team-river', nickname: '한강러너', stampCount: 3 },
    { id: 'mock-user-1', nickname: '스탬피 테스터', stampCount: collectedCount, isMe: true },
    { id: 'team-palace', nickname: '궁궐수집가', stampCount: 1 },
  ].sort((a, b) => b.stampCount - a.stampCount);

  return {
    spots: spotCards,
    candidate,
    collectedCount,
    myStamps,
    rankingEntries,
    selectedSpot,
    selectedSpotId,
  };
}

export async function collectMockCandidate(currentLocation: Coordinates | null) {
  if (!currentLocation) {
    return getMockFlow();
  }

  const flow = await getMockFlow(currentLocation);
  const candidate = flow.candidate;

  if (!candidate || candidate.collected || candidate.distanceMeters > STAMP_RADIUS_METERS) {
    return flow;
  }

  const spots = await tourRepository.searchNearby(currentLocation, STAMP_RADIUS_METERS);
  const spot = spots.find((nextSpot) => nextSpot.contentId === candidate.contentId);

  if (!spot) {
    return flow;
  }

  const stamps = await loadCollectedStamps();
  const alreadyCollected = stamps.some((stamp) => stamp.spotId === spot.contentId);

  if (alreadyCollected) {
    return flow;
  }

  const nextStamp = await stampRepository.collect(userId, {
    spotId: spot.contentId,
    location: currentLocation,
  });

  collectedStamps = [...stamps, nextStamp];
  selectedSpotId = null;
  notifyListeners();

  return getMockFlow(currentLocation);
}

export function selectMockSpot(contentId: string) {
  selectedSpotId = contentId;
  notifyListeners();
}

export function subscribeMockFlow(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
