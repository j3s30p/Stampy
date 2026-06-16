import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentLocation } from '@core/location';
import type { RankingPeriod } from '@features/stamp/model';
import {
  collectMockCandidate,
  getMockFlow,
  selectMockEvent,
  selectMockSpot,
  subscribeMockFlow,
} from './mockFlow';

export type MockFlow = Awaited<ReturnType<typeof getMockFlow>>;

export function useMockFlow(rankingPeriod: RankingPeriod = 'weekly') {
  const [flow, setFlow] = useState<MockFlow | null>(null);
  const currentLocation = useCurrentLocation();
  const requestIdRef = useRef(0);

  const applyLatestFlow = useCallback(async (nextFlowPromise: Promise<MockFlow>) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const nextFlow = await nextFlowPromise;

    if (requestIdRef.current === requestId) {
      setFlow(nextFlow);
    }
  }, []);

  const refresh = useCallback(async () => {
    await applyLatestFlow(getMockFlow(currentLocation.location, rankingPeriod));
  }, [applyLatestFlow, currentLocation.location, rankingPeriod]);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeMockFlow(refresh);

    return () => {
      requestIdRef.current += 1;
      unsubscribe();
    };
  }, [rankingPeriod, refresh]);

  const collectCandidate = useCallback(async () => {
    await applyLatestFlow(
      collectMockCandidate(currentLocation.location, currentLocation.accuracyMeters, rankingPeriod),
    );
  }, [applyLatestFlow, currentLocation.accuracyMeters, currentLocation.location, rankingPeriod]);

  const selectSpot = useCallback((contentId: string) => {
    selectMockSpot(contentId);
  }, []);

  const selectEvent = useCallback((contentId: string) => {
    selectMockEvent(contentId);
  }, []);

  return {
    flow,
    collectCandidate,
    selectEvent,
    selectSpot,
    currentLocation: currentLocation.location,
    locationAvailable: currentLocation.status === 'granted' && currentLocation.location !== null,
    locationAccuracyMeters: currentLocation.accuracyMeters,
    locationStatus: currentLocation.status,
  };
}
