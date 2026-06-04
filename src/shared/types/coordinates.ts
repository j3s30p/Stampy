export type Latitude = number & { readonly __brand: 'Latitude' };
export type Longitude = number & { readonly __brand: 'Longitude' };

export interface Coordinates {
  readonly latitude: Latitude;
  readonly longitude: Longitude;
}

export const asLatitude = (value: number): Latitude => {
  if (value < -90 || value > 90) {
    throw new RangeError(`Latitude out of range: ${value}`);
  }
  return value as Latitude;
};

export const asLongitude = (value: number): Longitude => {
  if (value < -180 || value > 180) {
    throw new RangeError(`Longitude out of range: ${value}`);
  }
  return value as Longitude;
};
