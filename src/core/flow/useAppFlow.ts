import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentLocation } from '@core/location';
import type { RankingPeriod } from '@features/stamp/model';
import {
  collectCandidate as collectAppCandidate,
  getAppFlow,
  selectEvent as selectAppEvent,
  selectSpot as selectAppSpot,
  subscribeAppFlow,
} from './appFlow';

export type AppFlow = Awaited<ReturnType<typeof getAppFlow>>;

export function useAppFlow(rankingPeriod: RankingPeriod = 'weekly') {
  const [flow, setFlow] = useState<AppFlow | null>(null);
  const currentLocation = useCurrentLocation();
  const requestIdRef = useRef(0);

  const applyLatestFlow = useCallback(async (nextFlowPromise: Promise<AppFlow>) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const nextFlow = await nextFlowPromise;

    if (requestIdRef.current === requestId) {
      setFlow(nextFlow);
    }
  }, []);

  const refresh = useCallback(async () => {
    await applyLatestFlow(getAppFlow(currentLocation.location, rankingPeriod));
  }, [applyLatestFlow, currentLocation.location, rankingPeriod]);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeAppFlow(refresh);

    return () => {
      requestIdRef.current += 1;
      unsubscribe();
    };
  }, [rankingPeriod, refresh]);

  const collectCandidate = useCallback(async () => {
    await applyLatestFlow(
      collectAppCandidate(currentLocation.location, currentLocation.accuracyMeters, rankingPeriod),
    );
  }, [applyLatestFlow, currentLocation.accuracyMeters, currentLocation.location, rankingPeriod]);

  const selectSpot = useCallback((contentId: string) => {
    selectAppSpot(contentId);
  }, []);

  const selectEvent = useCallback((contentId: string) => {
    selectAppEvent(contentId);
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
