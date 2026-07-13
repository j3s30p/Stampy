import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../data/fake_map_repository.dart';
import '../domain/map_models.dart';
import '../domain/map_repository.dart';
import '../infrastructure/kakao_map_bridge.dart';

const String _kakaoJavaScriptKey = String.fromEnvironment('KAKAO_JS_KEY');
const String _mapAssetPath = 'assets/map/kakao_map.html';
const String _keyPlaceholder = '__STAMPY_KAKAO_JS_KEY_JSON__';
const String _mapBaseUrl = 'https://stampy.local/';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key, this.repository = const FakeMapRepository()});

  final MapRepository repository;

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  static const _bridge = KakaoMapBridge();

  late final WebViewController _webViewController;

  MapSnapshot? _snapshot;
  bool _bridgeReady = false;
  bool _tilesLoaded = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(StampyColors.canvas)
      ..addJavaScriptChannel(
        'StampyBridge',
        onMessageReceived: (message) {
          unawaited(_handleBridgeMessage(message.message));
        },
      );
    unawaited(_loadMap());
  }

  Future<void> _loadMap() async {
    try {
      final snapshot = await widget.repository.loadSnapshot();
      final template = await rootBundle.loadString(_mapAssetPath);
      final html = _configureDocument(template);

      if (!mounted) {
        return;
      }

      setState(() {
        _snapshot = snapshot;
      });
      await _webViewController.loadHtmlString(html, baseUrl: _mapBaseUrl);
    } on Object {
      _showError('지도 화면을 준비하지 못했어요.');
    }
  }

  String _configureDocument(String template) {
    if (!template.contains(_keyPlaceholder) ||
        template.indexOf(_keyPlaceholder) !=
            template.lastIndexOf(_keyPlaceholder)) {
      throw StateError('Kakao map document has an invalid key placeholder.');
    }

    return template.replaceFirst(
      _keyPlaceholder,
      jsonEncode(_kakaoJavaScriptKey),
    );
  }

  Future<void> _handleBridgeMessage(String rawMessage) async {
    try {
      final event = _bridge.parseEvent(rawMessage);
      switch (event) {
        case KakaoMapReady():
          if (!mounted) {
            return;
          }
          setState(() {
            _bridgeReady = true;
            _errorMessage = null;
          });
          await _sendSnapshot();
        case KakaoMapTilesLoaded():
          if (!mounted || _tilesLoaded) {
            return;
          }
          setState(() {
            _tilesLoaded = true;
          });
        case KakaoMapMarkerTap(:final contentId):
          final snapshot = _snapshot;
          if (snapshot == null || snapshot.pinByContentId(contentId) == null) {
            _showError('알 수 없는 지도 마커예요.');
            return;
          }
          setState(() {
            _snapshot = snapshot.withSelection(contentId);
          });
          await _sendSnapshot();
        case KakaoMapMapTap():
          final snapshot = _snapshot;
          if (snapshot == null || snapshot.selectedContentId == null) {
            return;
          }
          setState(() {
            _snapshot = snapshot.withSelection(null);
          });
          await _sendSnapshot();
        case KakaoMapError(:final message):
          _showError(_redactSecret(message));
      }
    } on KakaoMapBridgeFormatException {
      _showError('지도 메시지 형식이 올바르지 않아요.');
    } on Object {
      _showError('지도와 통신하는 중 문제가 발생했어요.');
    }
  }

  Future<void> _sendSnapshot() async {
    final snapshot = _snapshot;
    if (!_bridgeReady || snapshot == null) {
      return;
    }

    await _webViewController.runJavaScript(
      _bridge.buildSetMapDataScript(snapshot),
    );
  }

  String _redactSecret(String message) {
    if (_kakaoJavaScriptKey.isEmpty) {
      return message;
    }

    return message.replaceAll(_kakaoJavaScriptKey, '[redacted]');
  }

  void _showError(String message) {
    if (!mounted) {
      return;
    }

    setState(() {
      _errorMessage = message;
    });
  }

  @override
  Widget build(BuildContext context) {
    final selectedPin = _snapshot?.selectedPin;

    return Scaffold(
      backgroundColor: StampyColors.canvas,
      appBar: AppBar(
        backgroundColor: StampyColors.paper,
        foregroundColor: StampyColors.ink,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 20,
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(Icons.edit_calendar_outlined, color: StampyColors.accent),
            SizedBox(width: 8),
            Text(
              'Stampy',
              style: TextStyle(
                color: StampyColors.accent,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
      body: ClipRect(
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: <Widget>[
            Positioned.fill(
              child: ClipRect(
                child: WebViewWidget(controller: _webViewController),
              ),
            ),
            if (!_tilesLoaded && _errorMessage == null)
              const Positioned(
                top: 16,
                left: 16,
                child: _MapStatusChip(label: '지도 불러오는 중'),
              ),
            if (_errorMessage case final message?)
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: _MapErrorBanner(message: message),
              ),
            if (selectedPin != null)
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: _SelectedPinCard(pin: selectedPin),
              ),
          ],
        ),
      ),
    );
  }
}

class _MapStatusChip extends StatelessWidget {
  const _MapStatusChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: StampyColors.paper.withValues(alpha: 0.94),
      border: Border.all(color: StampyColors.hairline),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const SizedBox.square(
            dimension: 14,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: StampyColors.accent,
            ),
          ),
          const SizedBox(width: 8),
          Text(label, style: Theme.of(context).textTheme.labelMedium),
        ],
      ),
    ),
  );
}

class _MapErrorBanner extends StatelessWidget {
  const _MapErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: const Color(0xFFFFDAD6),
      border: Border.all(color: const Color(0xFFBA1A1A)),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: <Widget>[
          const Icon(Icons.error_outline, color: Color(0xFF93000A)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: const Color(0xFF93000A)),
            ),
          ),
        ],
      ),
    ),
  );
}

class _SelectedPinCard extends StatelessWidget {
  const _SelectedPinCard({required this.pin});

  final MapPin pin;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: StampyColors.paper.withValues(alpha: 0.96),
      border: Border.all(color: StampyColors.hairline),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: <Widget>[
          const CircleAvatar(
            backgroundColor: StampyColors.paleAccent,
            foregroundColor: StampyColors.accent,
            child: Icon(Icons.verified_outlined),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  pin.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${pin.location.latitude.value.toStringAsFixed(4)}° N, '
                  '${pin.location.longitude.value.toStringAsFixed(4)}° E',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: StampyColors.mutedInk,
                    letterSpacing: 0.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            '100 m',
            style: TextStyle(
              color: StampyColors.accent,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    ),
  );
}
