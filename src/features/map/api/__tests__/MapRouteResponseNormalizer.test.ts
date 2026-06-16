import { asLatitude, asLongitude, type Coordinates } from '@shared/types';
import type { MapRouteRequest } from '../MapRouteRepository';
import {
  normalizeKakaoDrivingRouteResponse,
  normalizeMapRouteProxyResponse,
} from '../MapRouteResponseNormalizer';

const coord = (latitude: number, longitude: number): Coordinates => ({
  latitude: asLatitude(latitude),
  longitude: asLongitude(longitude),
});

describe('normalizeKakaoDrivingRouteResponse', () => {
  const request: MapRouteRequest = {
    origin: coord(37.5665, 126.978),
    destination: {
      kind: 'spot',
      contentId: 'spot-1',
      title: '서울도서관',
      location: coord(37.5669, 126.9779),
    },
  };

  it('normalizes driving route vertexes into Kakao map polyline points', () => {
    const route = normalizeKakaoDrivingRouteResponse(
      {
        routes: [
          {
            result_code: 0,
            summary: {
              distance: 1234,
              duration: 742,
            },
            sections: [
              {
                roads: [
                  {
                    vertexes: [126.978, 37.5665, 126.9779, 37.5667],
                  },
                  {
                    vertexes: [126.9778, 37.5668, 126.9779, 37.5669],
                  },
                ],
              },
            ],
          },
        ],
      },
      request,
    );

    expect(route).toEqual({
      mode: 'driving-api',
      targetContentId: 'spot-1',
      targetKind: 'spot',
      targetTitle: '서울도서관',
      distanceMeters: 1234,
      durationSeconds: 742,
      source: 'kakao-driving-api',
      summaryLabel: '차량 기준 경로 1.2km · 약 12분',
      points: [
        { lat: 37.5665, lng: 126.978 },
        { lat: 37.5667, lng: 126.9779 },
        { lat: 37.5668, lng: 126.9778 },
        { lat: 37.5669, lng: 126.9779 },
      ],
    });
  });

  it('throws when Kakao returns a non-zero result code', () => {
    expect(() =>
      normalizeKakaoDrivingRouteResponse(
        {
          routes: [
            {
              result_code: -5,
              result_msg: 'permission denied',
              summary: {
                distance: 0,
                duration: 0,
              },
              sections: [],
            },
          ],
        },
        request,
      ),
    ).toThrow('Map route failed: -5');
  });

  it('throws when vertexes cannot produce at least two route points', () => {
    expect(() =>
      normalizeKakaoDrivingRouteResponse(
        {
          routes: [
            {
              result_code: 0,
              summary: {
                distance: 10,
                duration: 60,
              },
              sections: [
                {
                  roads: [
                    {
                      vertexes: [126.978, 37.5665],
                    },
                  ],
                },
              ],
            },
          ],
        },
        request,
      ),
    ).toThrow('not include enough vertexes');
  });
});

describe('normalizeMapRouteProxyResponse', () => {
  const request: MapRouteRequest = {
    origin: coord(37.5665, 126.978),
    destination: {
      kind: 'spot',
      contentId: 'spot-1',
      title: '서울도서관',
      location: coord(37.5669, 126.9779),
    },
  };

  it('returns a valid app-domain route payload as-is', () => {
    const route = {
      mode: 'driving-api',
      targetContentId: 'spot-1',
      targetKind: 'spot',
      targetTitle: '서울도서관',
      distanceMeters: 1234,
      durationSeconds: 742,
      source: 'kakao-driving-api',
      summaryLabel: '차량 기준 경로 1.2km · 약 12분',
      points: [
        { lat: 37.5665, lng: 126.978 },
        { lat: 37.5669, lng: 126.9779 },
      ],
    } as const;

    expect(normalizeMapRouteProxyResponse(route, request)).toBe(route);
  });

  it('rejects an app-domain route payload with empty points', () => {
    expect(() =>
      normalizeMapRouteProxyResponse(
        {
          mode: 'driving-api',
          targetContentId: 'spot-1',
          targetKind: 'spot',
          targetTitle: '서울도서관',
          distanceMeters: 1234,
          durationSeconds: 742,
          source: 'kakao-driving-api',
          summaryLabel: '차량 기준 경로 1.2km · 약 12분',
          points: [],
        },
        request,
      ),
    ).toThrow('Map route response did not include a route.');
  });

  it('rejects an app-domain route payload with a non-number point', () => {
    expect(() =>
      normalizeMapRouteProxyResponse(
        {
          mode: 'driving-api',
          targetContentId: 'spot-1',
          targetKind: 'spot',
          targetTitle: '서울도서관',
          distanceMeters: 1234,
          durationSeconds: 742,
          source: 'kakao-driving-api',
          summaryLabel: '차량 기준 경로 1.2km · 약 12분',
          points: [
            { lat: 37.5665, lng: 126.978 },
            { lat: '37.5669', lng: 126.9779 },
          ],
        },
        request,
      ),
    ).toThrow('Map route response did not include a route.');
  });
});
