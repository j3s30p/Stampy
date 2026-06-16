import { distanceMetersBetween } from '@core/location';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import type { StampCandidate } from './types';

interface CollectRuleTarget {
  readonly location: Coordinates;
}

interface CollectRuleInput {
  readonly currentLocation: Coordinates | null;
  readonly accuracyMeters: number | null;
  readonly candidate: StampCandidate | null;
  readonly target: CollectRuleTarget | null;
}

interface CollectableRuleInput extends CollectRuleInput {
  readonly currentLocation: Coordinates;
  readonly candidate: StampCandidate;
  readonly target: CollectRuleTarget;
}

export function canCollectCandidate(input: CollectRuleInput): input is CollectableRuleInput {
  const { accuracyMeters, candidate, currentLocation, target } = input;

  if (!currentLocation || accuracyMeters === null || accuracyMeters > STAMP_RADIUS_METERS) {
    return false;
  }

  if (!candidate || candidate.collected || !target) {
    return false;
  }

  return distanceMetersBetween(currentLocation, target.location) <= STAMP_RADIUS_METERS;
}
