import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { env } from '@shared/config';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';

export type CurrentLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

export interface CurrentLocationState {
  readonly location: Coordinates | null;
  readonly accuracyMeters: number | null;
  readonly status: CurrentLocationStatus;
}

const MOCK_CURRENT_LOCATION: Coordinates = {
  latitude: asLatitude(37.5665),
  longitude: asLongitude(126.978),
};

const MOCK_CURRENT_LOCATION_STATE: CurrentLocationState = {
  location: MOCK_CURRENT_LOCATION,
  accuracyMeters: 0,
  status: 'granted',
};

const shouldUseLocalDevOrMockCurrentLocationFallback = __DEV__ || !env.useRealApi;

const toCoordinates = (coords: Location.LocationObjectCoords): Coordinates => {
  return {
    latitude: asLatitude(coords.latitude),
    longitude: asLongitude(coords.longitude),
  };
};

export function useCurrentLocation(): CurrentLocationState {
  const [state, setState] = useState<CurrentLocationState>(() =>
    shouldUseLocalDevOrMockCurrentLocationFallback
      ? MOCK_CURRENT_LOCATION_STATE
      : {
          location: null,
          accuracyMeters: null,
          status: 'loading',
        },
  );

  useEffect(() => {
    if (shouldUseLocalDevOrMockCurrentLocationFallback) {
      return undefined;
    }

    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!mounted) {
        return;
      }

      if (!permission.granted) {
        setState({
          location: null,
          accuracyMeters: null,
          status: 'denied',
        });
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 1,
        },
        (position) => {
          setState({
            location: toCoordinates(position.coords),
            accuracyMeters: position.coords.accuracy ?? null,
            status: 'granted',
          });
        },
      );
    };

    void startWatching().catch(() => {
      if (mounted) {
        setState({
          location: null,
          accuracyMeters: null,
          status: 'unavailable',
        });
      }
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return state;
}
