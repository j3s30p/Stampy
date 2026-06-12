import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';

export type CurrentLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

export interface CurrentLocationState {
  readonly location: Coordinates | null;
  readonly accuracyMeters: number | null;
  readonly status: CurrentLocationStatus;
}

const TEMP_SIMULATOR_LOCATION: Coordinates = {
  latitude: asLatitude(37.5665),
  longitude: asLongitude(126.978),
};

const toCoordinates = (_coords: Location.LocationObjectCoords): Coordinates => {
  // TODO: remove this simulator-only override before real-device QA.
  // Keep the production path identical: OS location -> Coordinates -> app state.
  // For the current simulator test pass, replace only the final returned value.
  return TEMP_SIMULATOR_LOCATION;
};

export function useCurrentLocation(): CurrentLocationState {
  const [state, setState] = useState<CurrentLocationState>({
    location: null,
    accuracyMeters: null,
    status: 'loading',
  });

  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!mounted) {
        return;
      }

      if (!permission.granted) {
        setState({ location: null, accuracyMeters: null, status: 'denied' });
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
        setState({ location: null, accuracyMeters: null, status: 'unavailable' });
      }
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return state;
}
