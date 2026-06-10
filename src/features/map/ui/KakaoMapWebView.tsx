import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { Coordinates } from '@shared/types';
import { AppText, colors, spacing } from '@shared/ui';
import type {
  KakaoBridgeMessage,
  KakaoMapDataPayload,
  KakaoMapSpotPayload,
  MapSpotPin,
} from '../model';

interface KakaoMapWebViewProps {
  readonly kakaoJsKey: string;
  readonly spots: readonly MapSpotPin[];
  readonly selectedSpotId: string | null;
  readonly currentLocation: Coordinates | null;
  readonly onMarkerTap?: (spotId: string) => void;
  readonly onMapReady?: () => void;
  readonly onMapError?: (message: string) => void;
}

const SEOUL_CITY_HALL_CENTER = { lat: 37.5665, lng: 126.978 };

export function KakaoMapWebView({
  kakaoJsKey,
  spots,
  selectedSpotId,
  currentLocation,
  onMarkerTap,
  onMapReady,
  onMapError,
}: KakaoMapWebViewProps) {
  const webViewRef = useRef<{ injectJavaScript: (script: string) => void } | null>(null);
  const hasNotifiedReady = useRef(false);
  const isLoadedRef = useRef(false);
  const [syncTick, setSyncTick] = useState(0);
  const isWeb = Platform.OS === 'web';

  const payload = useMemo<KakaoMapDataPayload>(() => {
    const center = resolveCenter(spots, currentLocation);
    const mapSpots = spots.map(toKakaoMapSpotPayload);

    return {
      spots: mapSpots,
      selectedSpotId,
      currentLocation: currentLocation
        ? {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
          }
        : null,
      center,
      stampRadiusMeters: STAMP_RADIUS_METERS,
    };
  }, [currentLocation, selectedSpotId, spots]);

  const html = useMemo(() => buildHtml(kakaoJsKey), [kakaoJsKey]);
  const webViewSource = useMemo(
    () => ({
      html,
      baseUrl: 'https://stampy.local/',
    }),
    [html],
  );

  useEffect(() => {
    if (isWeb || !isLoadedRef.current || !webViewRef.current) {
      return;
    }

    webViewRef.current.injectJavaScript(
      `window.__STAMPY_MAP__?.setData(${JSON.stringify(payload)}); true;`,
    );
  }, [isWeb, payload, syncTick]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parseBridgeMessage(event.nativeEvent.data);

    if (!message) {
      return;
    }

    if (message.kind === 'ready') {
      if (!hasNotifiedReady.current) {
        hasNotifiedReady.current = true;
        onMapReady?.();
      }

      setSyncTick((value) => value + 1);
      return;
    }

    if (message.kind === 'marker:tap') {
      onMarkerTap?.(message.spotId);
      return;
    }

    if (message.kind === 'error') {
      onMapError?.(message.message);
    }
  };

  const renderNativeWebView = () => {
    const NativeWebView = require('react-native-webview').default as any;

    return (
      <NativeWebView
        ref={webViewRef}
        source={webViewSource}
        style={styles.webView}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onLoadEnd={() => {
          isLoadedRef.current = true;
          setSyncTick((value) => value + 1);
        }}
        onMessage={handleMessage}
        onError={(event: { nativeEvent: { description?: string } }) => {
          onMapError?.(event.nativeEvent.description || 'Kakao Maps WebView를 불러오지 못했습니다');
        }}
      />
    );
  };

  return (
    <View style={styles.root}>
      {isWeb ? (
        <View style={styles.webPreview}>
          <AppText variant="h3" style={styles.webPreviewTitle}>
            모바일 앱에서 Kakao 지도가 표시됩니다
          </AppText>
          <AppText variant="caption" tone="inkMuted" style={styles.webPreviewText}>
            Expo web preview에서는 Kakao Maps WebView 대신 이 안내가 보입니다.
          </AppText>
        </View>
      ) : (
        renderNativeWebView()
      )}
    </View>
  );
}

const resolveCenter = (spots: readonly MapSpotPin[], currentLocation: Coordinates | null) => {
  if (currentLocation) {
    return {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
    };
  }

  const firstSpot = spots[0]?.location;

  if (firstSpot) {
    return {
      lat: firstSpot.latitude,
      lng: firstSpot.longitude,
    };
  }

  return SEOUL_CITY_HALL_CENTER;
};

const toKakaoMapSpotPayload = (spot: MapSpotPin): KakaoMapSpotPayload => ({
  contentId: spot.contentId,
  title: spot.title,
  address: spot.address,
  distanceMeters: spot.distanceMeters,
  collected: spot.collected,
  location: {
    lat: spot.location.latitude,
    lng: spot.location.longitude,
  },
});

const parseBridgeMessage = (raw: string): KakaoBridgeMessage | null => {
  try {
    const parsed = JSON.parse(raw) as KakaoBridgeMessage;

    if (!parsed || typeof parsed !== 'object' || !('kind' in parsed)) {
      return null;
    }

    if (
      parsed.kind !== 'ready' &&
      parsed.kind !== 'error' &&
      parsed.kind !== 'marker:tap' &&
      parsed.kind !== 'camera:move'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const buildHtml = (kakaoJsKey: string) => {
  const safeSdkUrlLabel = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=[redacted]&autoload=false';
  const sdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
    kakaoJsKey,
  )}&autoload=false`;

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self' data: https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net; img-src 'self' data: https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net; style-src 'self' 'unsafe-inline' https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net; connect-src 'self' https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net;"
    />
    <style>
      html, body, #map {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #f8f7f4;
      }
      #map {
        position: relative;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      (function () {
        var map = null;
        var latestData = null;
        var spotMarkers = [];
        var stampRadiusCircle = null;
        var currentLocationMarker = null;
        var lastErrorSignature = null;

        function postMessage(message) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
        }

        function normalizeErrorMessage(prefix, error, context) {
          var parts = [prefix];

          if (context) {
            parts.push('[' + context + ']');
          }

          if (error && typeof error === 'object') {
            var message = error.message || error.reason || error.type || '알 수 없는 오류';
            parts.push(String(message));

            if (error.filename || error.sourceURL) {
              parts.push('@ ' + (error.filename || error.sourceURL));
            }

            if (typeof error.lineno === 'number' || typeof error.colno === 'number') {
              parts.push('(' + (error.lineno || '?') + ':' + (error.colno || '?') + ')');
            }

            if (error.stack) {
              parts.push(String(error.stack));
            }
          } else if (error !== undefined && error !== null) {
            parts.push(String(error));
          } else {
            parts.push('알 수 없는 오류');
          }

          return parts.join(' ');
        }

        function postError(prefix, error, context) {
          var message = normalizeErrorMessage(prefix, error, context);

          if (message === lastErrorSignature) {
            return;
          }

          lastErrorSignature = message;
          postMessage({ kind: 'error', message: message });
        }

        function reportWindowError(event) {
          var target = event && event.target ? event.target : null;
          var context =
            (event && event.message) ||
            (target && (target.src || target.href || target.tagName)) ||
            null;

          postError('WebView window.error', event && (event.error || event), context);
        }

        function reportUnhandledRejection(event) {
          postError('WebView unhandledrejection', event && (event.reason || event), null);
        }

        function reportSecurityPolicyViolation(event) {
          postError(
            'WebView CSP error',
            {
              message: event.violatedDirective + ' blocked ' + event.blockedURI,
              filename: event.sourceFile,
              lineno: event.lineNumber,
              colno: event.columnNumber,
            },
            event.originalPolicy || 'securitypolicyviolation',
          );
        }

        window.addEventListener('error', reportWindowError, true);
        window.addEventListener('unhandledrejection', reportUnhandledRejection);
        window.addEventListener('securitypolicyviolation', reportSecurityPolicyViolation);

        function markerImage(color) {
          var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 39C14 39 25 24 25 15C25 8.9 20.1 4 14 4C7.9 4 3 8.9 3 15C3 24 14 39 14 39Z" fill="' + color + '" stroke="#ffffff" stroke-width="2"/><circle cx="14" cy="15" r="5" fill="#ffffff"/></svg>';
          return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        }

        function toLatLng(point) {
          return new kakao.maps.LatLng(point.lat, point.lng);
        }

        function clearMarkers(markers) {
          markers.forEach(function (marker) {
            marker.setMap(null);
          });
          markers.length = 0;
        }

        function render() {
          if (!map || !latestData) {
            return;
          }

          try {
            var center = toLatLng(latestData.center);
            map.setCenter(center);

            clearMarkers(spotMarkers);

            if (stampRadiusCircle) {
              stampRadiusCircle.setMap(null);
              stampRadiusCircle = null;
            }

            var selectedSpot = null;
            latestData.spots.forEach(function (spot) {
              if (spot.contentId === latestData.selectedSpotId) {
                selectedSpot = spot;
              }
            });

            if (!selectedSpot && latestData.spots.length > 0) {
              selectedSpot = latestData.spots[0];
            }

            if (selectedSpot) {
              stampRadiusCircle = new kakao.maps.Circle({
                center: toLatLng(selectedSpot.location),
                radius: latestData.stampRadiusMeters,
                strokeWeight: 2,
                strokeColor: '#18A968',
                strokeOpacity: 0.9,
                strokeStyle: 'dash',
                fillColor: '#18A968',
                fillOpacity: 0.12,
                map: map,
              });
            }

            latestData.spots.forEach(function (spot) {
              var isSelected = latestData.selectedSpotId === spot.contentId;
              var marker = new kakao.maps.Marker({
                map: map,
                position: toLatLng(spot.location),
                title: spot.title,
                zIndex: isSelected ? 20 : 10,
                image: new kakao.maps.MarkerImage(
                  markerImage(isSelected ? '#e54848' : spot.collected ? '#1f7aea' : '#6b7280'),
                  new kakao.maps.Size(28, 40),
                  { offset: new kakao.maps.Point(14, 40) }
                ),
              });

              kakao.maps.event.addListener(marker, 'click', function () {
                postMessage({ kind: 'marker:tap', spotId: spot.contentId });
              });

              spotMarkers.push(marker);
            });

            if (currentLocationMarker) {
              currentLocationMarker.setMap(null);
              currentLocationMarker = null;
            }

            if (latestData.currentLocation) {
              currentLocationMarker = new kakao.maps.Marker({
                map: map,
                position: toLatLng(latestData.currentLocation),
                title: '현재 위치',
                zIndex: 30,
                image: new kakao.maps.MarkerImage(
                  markerImage('#2563eb'),
                  new kakao.maps.Size(24, 34),
                  { offset: new kakao.maps.Point(12, 34) }
                ),
              });
            }
          } catch (error) {
            postError('WebView render error', error, 'render');
          }
        }

        function applyData(data) {
          latestData = data;

          if (!map) {
            return;
          }

          render();
        }

        function initMap() {
          if (map) {
            return;
          }

          try {
            var mapContainer = document.getElementById('map');

            if (!mapContainer) {
              postError('WebView init error', new Error('map container를 찾을 수 없습니다.'), 'initMap');
              return;
            }

            map = new kakao.maps.Map(mapContainer, {
              center: toLatLng(latestData ? latestData.center : { lat: 37.5665, lng: 126.978 }),
              level: 4,
            });

            render();
            postMessage({ kind: 'ready' });
          } catch (error) {
            postError('WebView init error', error, 'initMap');
          }
        }

        window.__STAMPY_MAP__ = {
          setData: applyData,
        };

        var sdk = document.createElement('script');
        sdk.src = '${sdkUrl}';
        sdk.async = true;
        sdk.onload = function () {
          if (!window.kakao || !window.kakao.maps) {
            postError(
              'WebView SDK error',
              new Error('Kakao Maps SDK를 찾을 수 없습니다.'),
              '${safeSdkUrlLabel}'
            );
            return;
          }

          try {
            kakao.maps.load(initMap);
          } catch (error) {
            postError('WebView SDK error', error, 'kakao.maps.load');
          }
        };
        sdk.onerror = function () {
          postError(
            'WebView SDK error',
            new Error('Kakao Maps SDK를 불러오지 못했습니다.'),
            '${safeSdkUrlLabel}'
          );
        };
        document.head.appendChild(sdk);
      })();
    </script>
  </body>
</html>`;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 0,
  },
  webPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.surfaceSink,
  },
  webPreviewTitle: {
    textAlign: 'center',
  },
  webPreviewText: {
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  webView: {
    flex: 1,
    backgroundColor: '#f8f7f4',
  },
});
