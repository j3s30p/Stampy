import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/features/map/data/fake_map_repository.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:stampy/features/map/infrastructure/kakao_map_bridge.dart';

void main() {
  const bridge = KakaoMapBridge();

  group('KakaoMapBridge.parseEvent', () {
    test('parses every supported event', () {
      expect(
        bridge.parseEvent('{"version":1,"type":"ready"}'),
        isA<KakaoMapReady>(),
      );
      expect(
        bridge.parseEvent('{"version":1,"type":"tilesLoaded"}'),
        isA<KakaoMapTilesLoaded>(),
      );
      expect(
        bridge.parseEvent('{"version":1,"type":"mapTap"}'),
        isA<KakaoMapMapTap>(),
      );

      final markerTap = bridge.parseEvent(
        '{"version":1,"type":"markerTap","contentId":"tour-126508"}',
      );
      expect(markerTap, isA<KakaoMapMarkerTap>());
      expect((markerTap as KakaoMapMarkerTap).contentId, 'tour-126508');

      final error = bridge.parseEvent(
        '{"version":1,"type":"error","code":"sdkLoadFailed",'
        '"message":"SDK load failed"}',
      );
      expect(error, isA<KakaoMapError>());
      expect((error as KakaoMapError).code, 'sdkLoadFailed');
      expect(error.message, 'SDK load failed');
    });

    test('rejects invalid JSON and non-object messages', () {
      expect(
        () => bridge.parseEvent('{'),
        throwsA(isA<KakaoMapBridgeFormatException>()),
      );
      expect(
        () => bridge.parseEvent('[]'),
        throwsA(isA<KakaoMapBridgeFormatException>()),
      );
    });

    test('rejects missing, non-integer, and unsupported versions', () {
      for (final raw in <String>[
        '{"type":"ready"}',
        '{"version":1.0,"type":"ready"}',
        '{"version":2,"type":"ready"}',
      ]) {
        expect(
          () => bridge.parseEvent(raw),
          throwsA(isA<KakaoMapBridgeFormatException>()),
        );
      }
    });

    test('rejects unknown types and extra fields', () {
      for (final raw in <String>[
        '{"version":1,"type":"unknown"}',
        '{"version":1,"type":"ready","extra":true}',
        '{"version":1,"type":"mapTap","contentId":"unexpected"}',
      ]) {
        expect(
          () => bridge.parseEvent(raw),
          throwsA(isA<KakaoMapBridgeFormatException>()),
        );
      }
    });

    test('rejects incomplete or invalid event payloads', () {
      for (final raw in <String>[
        '{"version":1,"type":"markerTap"}',
        '{"version":1,"type":"markerTap","contentId":""}',
        '{"version":1,"type":"markerTap","contentId":42}',
        '{"version":1,"type":"error","code":"failed"}',
        '{"version":1,"type":"error","code":"","message":"failed"}',
      ]) {
        expect(
          () => bridge.parseEvent(raw),
          throwsA(isA<KakaoMapBridgeFormatException>()),
        );
      }
    });
  });

  test(
    'setMapData command includes real coordinates and the 100m radius',
    () async {
      final snapshot = await const FakeMapRepository().loadSnapshot();
      final decoded =
          jsonDecode(bridge.encodeSetMapDataCommand(snapshot))
              as Map<String, dynamic>;
      final payload = decoded['payload'] as Map<String, dynamic>;
      final center = payload['center'] as Map<String, dynamic>;
      final pins = payload['pins'] as List<dynamic>;

      expect(decoded.keys.toSet(), <String>{'version', 'type', 'payload'});
      expect(decoded['version'], KakaoMapBridge.protocolVersion);
      expect(decoded['type'], 'setMapData');
      expect(payload['selectedRadiusMeters'], stampVerificationRadiusMeters);
      expect(payload['selectedContentId'], 'tour-126508');
      expect(center['lat'], closeTo(37.579617, 0.0000001));
      expect(center['lng'], closeTo(126.977041, 0.0000001));
      expect(pins, isNotEmpty);
    },
  );

  test('setMapData preserves current latitude and longitude order', () async {
    final baseSnapshot = await const FakeMapRepository().loadSnapshot();
    final currentLocation = Coordinates(
      latitude: Latitude(37.123456),
      longitude: Longitude(127.654321),
    );
    final snapshot = baseSnapshot.withCurrentLocation(currentLocation);

    final decoded =
        jsonDecode(bridge.encodeSetMapDataCommand(snapshot))
            as Map<String, dynamic>;
    final payload = decoded['payload'] as Map<String, dynamic>;
    final center = payload['center'] as Map<String, dynamic>;
    final encodedLocation = payload['currentLocation'] as Map<String, dynamic>;

    expect(encodedLocation, <String, dynamic>{
      'lat': 37.123456,
      'lng': 127.654321,
    });
    expect(center, encodedLocation);
  });
}
