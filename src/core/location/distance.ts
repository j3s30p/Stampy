import { EARTH_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceMetersBetween = (from: Coordinates, to: Coordinates) => {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const halfChordLength =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(
    EARTH_RADIUS_METERS *
      2 *
      Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength)),
  );
};
