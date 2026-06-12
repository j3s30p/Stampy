import { asLatitude, asLongitude } from '@shared/types';

describe('asLatitude', () => {
  it('유효 범위 값을 그대로 반환한다', () => {
    expect(asLatitude(37.5665)).toBe(37.5665);
    expect(asLatitude(-90)).toBe(-90);
    expect(asLatitude(90)).toBe(90);
  });

  it('±90 을 벗어나면 RangeError', () => {
    expect(() => asLatitude(90.0001)).toThrow(RangeError);
    expect(() => asLatitude(-90.0001)).toThrow(RangeError);
  });
});

describe('asLongitude', () => {
  it('유효 범위 값을 그대로 반환한다', () => {
    expect(asLongitude(126.978)).toBe(126.978);
    expect(asLongitude(-180)).toBe(-180);
    expect(asLongitude(180)).toBe(180);
  });

  it('±180 을 벗어나면 RangeError', () => {
    expect(() => asLongitude(180.5)).toThrow(RangeError);
    expect(() => asLongitude(-180.5)).toThrow(RangeError);
  });
});
