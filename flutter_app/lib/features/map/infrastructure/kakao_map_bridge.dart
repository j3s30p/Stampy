import 'dart:convert';

import 'package:stampy/core/geo/coordinates.dart';

import '../domain/map_models.dart';

sealed class KakaoMapEvent {
  const KakaoMapEvent();
}

final class KakaoMapReady extends KakaoMapEvent {
  const KakaoMapReady();
}

final class KakaoMapTilesLoaded extends KakaoMapEvent {
  const KakaoMapTilesLoaded();
}

final class KakaoMapMarkerTap extends KakaoMapEvent {
  const KakaoMapMarkerTap(this.contentId);

  final String contentId;
}

final class KakaoMapMapTap extends KakaoMapEvent {
  const KakaoMapMapTap();
}

final class KakaoMapError extends KakaoMapEvent {
  const KakaoMapError({required this.code, required this.message});

  final String code;
  final String message;
}

final class KakaoMapBridgeFormatException implements FormatException {
  const KakaoMapBridgeFormatException(this.message, [this.source]);

  @override
  final String message;

  @override
  final Object? source;

  @override
  int? get offset => null;

  @override
  String toString() => 'KakaoMapBridgeFormatException: $message';
}

final class KakaoMapBridge {
  const KakaoMapBridge();

  static const int protocolVersion = 1;

  KakaoMapEvent parseEvent(String rawMessage) {
    final Object? decoded;
    try {
      decoded = jsonDecode(rawMessage);
    } on FormatException {
      throw KakaoMapBridgeFormatException('Message must be valid JSON.');
    }

    if (decoded is! Map<String, dynamic>) {
      throw KakaoMapBridgeFormatException('Message must be a JSON object.');
    }

    final version = decoded['version'];
    if (version is! int || version != protocolVersion) {
      throw KakaoMapBridgeFormatException(
        'Unsupported or missing protocol version.',
      );
    }

    final type = decoded['type'];
    if (type is! String) {
      throw KakaoMapBridgeFormatException('Message type must be a string.');
    }

    return switch (type) {
      'ready' => _withoutPayload(decoded, const KakaoMapReady()),
      'tilesLoaded' => _withoutPayload(decoded, const KakaoMapTilesLoaded()),
      'mapTap' => _withoutPayload(decoded, const KakaoMapMapTap()),
      'markerTap' => _markerTap(decoded),
      'error' => _error(decoded),
      _ => throw KakaoMapBridgeFormatException('Unknown message type.'),
    };
  }

  String encodeSetMapDataCommand(MapSnapshot snapshot) =>
      jsonEncode(<String, Object?>{
        'version': protocolVersion,
        'type': 'setMapData',
        'payload': snapshot._toBridgeJson(),
      });

  String buildSetMapDataScript(MapSnapshot snapshot) {
    final command = encodeSetMapDataCommand(snapshot);
    return 'window.StampyKakaoMap.receive($command);';
  }

  T _withoutPayload<T extends KakaoMapEvent>(
    Map<String, dynamic> message,
    T event,
  ) {
    _requireExactKeys(message, const <String>{'version', 'type'});
    return event;
  }

  KakaoMapMarkerTap _markerTap(Map<String, dynamic> message) {
    _requireExactKeys(message, const <String>{'version', 'type', 'contentId'});
    final contentId = _requiredString(message, 'contentId', maxLength: 128);
    return KakaoMapMarkerTap(contentId);
  }

  KakaoMapError _error(Map<String, dynamic> message) {
    _requireExactKeys(message, const <String>{
      'version',
      'type',
      'code',
      'message',
    });
    return KakaoMapError(
      code: _requiredString(message, 'code', maxLength: 64),
      message: _requiredString(message, 'message', maxLength: 1024),
    );
  }

  String _requiredString(
    Map<String, dynamic> message,
    String key, {
    required int maxLength,
  }) {
    final value = message[key];
    if (value is! String) {
      throw KakaoMapBridgeFormatException('$key must be a string.');
    }

    final trimmed = value.trim();
    if (trimmed.isEmpty || trimmed.length > maxLength) {
      throw KakaoMapBridgeFormatException('$key has an invalid length.');
    }

    return trimmed;
  }

  void _requireExactKeys(Map<String, dynamic> message, Set<String> expected) {
    final actual = message.keys.toSet();
    if (actual.length != expected.length || !actual.containsAll(expected)) {
      throw KakaoMapBridgeFormatException(
        'Message fields do not match the protocol.',
      );
    }
  }
}

extension on Coordinates {
  Map<String, double> _toBridgeJson() => <String, double>{
    'lat': latitude.value,
    'lng': longitude.value,
  };
}

extension on MapPin {
  Map<String, Object> _toBridgeJson() => <String, Object>{
    'contentId': contentId,
    'title': title,
    'kind': kind.name,
    'collected': collected,
    'location': location._toBridgeJson(),
  };
}

extension on MapSnapshot {
  Map<String, Object?> _toBridgeJson() => <String, Object?>{
    'center': center._toBridgeJson(),
    'currentLocation': currentLocation?._toBridgeJson(),
    'selectedContentId': selectedContentId,
    'selectedRadiusMeters': stampVerificationRadiusMeters,
    'pins': pins.map((pin) => pin._toBridgeJson()).toList(growable: false),
  };
}
