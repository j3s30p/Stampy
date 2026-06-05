import { MockStampRepository } from '@features/stamp/api';
import type { MyStampSummary, RankingEntry, StampCandidate } from '@features/stamp/ui';
import { MockTourRepository } from '@features/tour/api';
import type { HomeTourSpot } from '@features/tour/ui';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { asLatitude, asLongitude } from '@shared/types';

const userId = 'mock-user-1';

const tourRepository = new MockTourRepository();
const stampRepository = new MockStampRepository();

const mockCenter = {
  latitude: asLatitude(37.5796),
  longitude: asLongitude(126.977),
};

export async function getMockFlow() {
  const [spots, stamps] = await Promise.all([
    tourRepository.searchNearby(mockCenter, STAMP_RADIUS_METERS),
    stampRepository.listCollected(userId),
  ]);
  const collectedSpotIds = new Set(stamps.map((stamp) => stamp.spotId));

  const spotCards: HomeTourSpot[] = spots.map((spot, index) => ({
    contentId: spot.contentId,
    title: spot.title,
    address: spot.address,
    theme: index === 0 ? '궁궐 산책' : index === 1 ? '골목 여행' : '도심 휴식',
    distanceMeters: index === 0 ? 86 : index === 1 ? 420 : 760,
    collected: collectedSpotIds.has(spot.contentId),
  }));

  const candidate: StampCandidate | null =
    spotCards.find((spot) => !spot.collected) ?? spotCards[0] ?? null;

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
  };
}
