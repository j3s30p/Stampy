import { useCallback, useEffect, useState } from 'react';
import { useCurrentLocation } from '@core/location';
import { collectMockCandidate, getMockFlow, selectMockSpot, subscribeMockFlow } from './mockFlow';

export type MockFlow = Awaited<ReturnType<typeof getMockFlow>>;

export function useMockFlow() {
  const [flow, setFlow] = useState<MockFlow | null>(null);
  const currentLocation = useCurrentLocation();

  const refresh = useCallback(async () => {
    setFlow(await getMockFlow(currentLocation.location));
  }, [currentLocation.location]);

  useEffect(() => {
    let mounted = true;

    const refreshIfMounted = () => {
      void getMockFlow(currentLocation.location).then((nextFlow) => {
        if (mounted) {
          setFlow(nextFlow);
        }
      });
    };

    refreshIfMounted();
    const unsubscribe = subscribeMockFlow(refresh);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [currentLocation.location, refresh]);

  const collectCandidate = useCallback(async () => {
    setFlow(await collectMockCandidate(currentLocation.location, currentLocation.accuracyMeters));
  }, [currentLocation.accuracyMeters, currentLocation.location]);

  const selectSpot = useCallback((contentId: string) => {
    selectMockSpot(contentId);
  }, []);

  return {
    flow,
    collectCandidate,
    selectSpot,
    currentLocation: currentLocation.location,
    locationAvailable: currentLocation.status === 'granted' && currentLocation.location !== null,
    locationAccuracyMeters: currentLocation.accuracyMeters,
    locationStatus: currentLocation.status,
  };
}
