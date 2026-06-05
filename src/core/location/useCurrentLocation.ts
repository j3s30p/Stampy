import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';

export type CurrentLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

export interface CurrentLocationState {
  readonly location: Coordinates | null;
  readonly status: CurrentLocationStatus;
}

const toCoordinates = (coords: Location.LocationObjectCoords): Coordinates => ({
  latitude: asLatitude(coords.latitude),
  longitude: asLongitude(coords.longitude),
});

export function useCurrentLocation(): CurrentLocationState {
  const [state, setState] = useState<CurrentLocationState>({
    location: null,
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
        setState({ location: null, status: 'denied' });
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
            status: 'granted',
          });
        },
      );
    };

    void startWatching().catch(() => {
      if (mounted) {
        setState({ location: null, status: 'unavailable' });
      }
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return state;
}
