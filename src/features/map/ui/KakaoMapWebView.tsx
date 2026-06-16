import Constants from 'expo-constants';
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
  MapEventPin,
  MapSpotPin,
} from '../model';

interface KakaoMapWebViewProps {
  readonly kakaoJsKey: string;
  readonly spots: readonly MapSpotPin[];
  readonly events: readonly MapEventPin[];
  readonly selectedSpotId: string | null;
  readonly currentLocation: Coordinates | null;
  readonly onMarkerTap?: (spotId: string) => void;
  readonly onMapTap?: () => void;
  readonly onMapReady?: () => void;
  readonly onMapError?: (message: string) => void;
}

const SEOUL_CITY_HALL_CENTER = { lat: 37.5665, lng: 126.978 };
const webViewPalette = {
  background: '#f8f7f4',
} as const;

const IPV6_LOOPBACK_HOSTS = new Set(['::1', '0:0:0:0:0:0:0:1']);

const resolveKakaoMapPageUri = (kakaoJsKey: string): string | null => {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    Constants.manifest?.debuggerHost;
  const host = hostUri?.replace(/^https?:\/\//, '').split('/')[0];

  if (!host) {
    return null;
  }

  const normalizedHost = normalizeKakaoMapPageHost(host);

  return `http://${normalizedHost}/kakao-map.html?appkey=${encodeURIComponent(kakaoJsKey)}`;
};

const normalizeKakaoMapPageHost = (host: string): string => {
  try {
    const parsedHost = new URL(`http://${host}`);
    const hostname = parsedHost.hostname.replace(/^\[|\]$/g, '');

    if (isLoopbackHost(hostname)) {
      return parsedHost.port ? `localhost:${parsedHost.port}` : 'localhost';
    }
  } catch {
    const hostname = host.replace(/^\[|\]$/g, '');

    if (isLoopbackHost(hostname)) {
      return 'localhost';
    }

    const unbracketedIpv6Loopback = parseUnbracketedIpv6LoopbackHost(hostname);

    if (unbracketedIpv6Loopback) {
      return unbracketedIpv6Loopback.port
        ? `localhost:${unbracketedIpv6Loopback.port}`
        : 'localhost';
    }
  }

  return host;
};

const isLoopbackHost = (hostname: string): boolean =>
  hostname === '127.0.0.1' || IPV6_LOOPBACK_HOSTS.has(hostname.toLowerCase());

const parseUnbracketedIpv6LoopbackHost = (host: string): { readonly port: string } | null => {
  const portSeparatorIndex = host.lastIndexOf(':');

  if (portSeparatorIndex < 0) {
    return null;
  }

  const hostname = host.slice(0, portSeparatorIndex);
  const port = host.slice(portSeparatorIndex + 1);

  if (!/^\d+$/.test(port) || !isLoopbackHost(hostname)) {
    return null;
  }

  return { port };
};

export function KakaoMapWebView({
  kakaoJsKey,
  events = [],
  spots,
  selectedSpotId,
  currentLocation,
  onMarkerTap,
  onMapTap,
  onMapReady,
  onMapError,
}: KakaoMapWebViewProps) {
  const webViewRef = useRef<{ injectJavaScript: (script: string) => void } | null>(null);
  const isLoadedRef = useRef(false);
  const [syncTick, setSyncTick] = useState(0);
  const isWeb = Platform.OS === 'web';

  const payload = useMemo<KakaoMapDataPayload>(() => {
    const center = resolveCenter(spots, selectedSpotId, currentLocation);
    const mapSpots = [...spots.map(toKakaoMapSpotPayload), ...events.map(toKakaoMapEventPayload)];

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
  }, [currentLocation, events, selectedSpotId, spots]);

  const kakaoMapPageUri = useMemo(() => resolveKakaoMapPageUri(kakaoJsKey), [kakaoJsKey]);
  const webViewSource = useMemo(
    () => (kakaoMapPageUri ? { uri: kakaoMapPageUri } : null),
    [kakaoMapPageUri],
  );

  useEffect(() => {
    if (!isWeb && !kakaoMapPageUri) {
      onMapError?.('Expo 개발 서버 주소를 확인하지 못했습니다');
    }
  }, [isWeb, kakaoMapPageUri, onMapError]);

  useEffect(() => {
    if (isWeb || !isLoadedRef.current || !webViewRef.current) {
      return;
    }

    webViewRef.current.injectJavaScript(
      `window.__STAMPY_KAKAO_MAP__?.setData(${JSON.stringify(payload)}); true;`,
    );
  }, [isWeb, payload, syncTick]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parseBridgeMessage(event.nativeEvent.data);

    if (!message) {
      return;
    }

    if (message.kind === 'ready') {
      setSyncTick((value) => value + 1);
      return;
    }

    if (message.kind === 'tiles:loaded') {
      onMapReady?.();
      return;
    }

    if (message.kind === 'marker:tap') {
      onMarkerTap?.(message.spotId);
      return;
    }

    if (message.kind === 'map:tap') {
      onMapTap?.();
      return;
    }

    if (message.kind === 'error') {
      onMapError?.(message.message);
    }
  };

  const renderNativeWebView = () => {
    if (!webViewSource) {
      return null;
    }

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

const resolveCenter = (
  spots: readonly MapSpotPin[],
  selectedSpotId: string | null,
  currentLocation: Coordinates | null,
) => {
  if (currentLocation) {
    return {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
    };
  }

  const selectedSpot = spots.find((spot) => spot.contentId === selectedSpotId)?.location;

  if (selectedSpot) {
    return {
      lat: selectedSpot.latitude,
      lng: selectedSpot.longitude,
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
  kind: 'spot',
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

const toKakaoMapEventPayload = (event: MapEventPin): KakaoMapSpotPayload => ({
  kind: 'event',
  contentId: event.contentId,
  title: event.title,
  address: event.address,
  distanceMeters: event.distanceMeters,
  collected: event.collected,
  location: {
    lat: event.location.latitude,
    lng: event.location.longitude,
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
      parsed.kind !== 'tiles:loaded' &&
      parsed.kind !== 'error' &&
      parsed.kind !== 'map:tap' &&
      parsed.kind !== 'marker:tap'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
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
    backgroundColor: webViewPalette.background,
  },
});
