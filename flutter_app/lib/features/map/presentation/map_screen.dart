import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/location/location.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../domain/map_collect.dart';
import '../domain/map_models.dart';
import '../domain/map_repository.dart';
import '../domain/map_selection.dart';
import '../infrastructure/kakao_map_bridge.dart';
import 'map_location_status.dart';

const String _kakaoJavaScriptKey = String.fromEnvironment('KAKAO_JS_KEY');
const String _mapAssetPath = 'assets/map/kakao_map.html';
const String _keyPlaceholder = '__STAMPY_KAKAO_JS_KEY_JSON__';
const String _mapBaseUrl = 'https://stampy.local/';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({
    super.key,
    required this.repository,
    this.selectionRequest,
    this.collectedContentIds = const <String>{},
    this.resolveCollectAvailability,
    this.onCollectRequested,
    this.onCollectSucceeded,
  });

  final MapRepository repository;
  final MapSelectionRequest? selectionRequest;
  final Set<String> collectedContentIds;
  final MapCollectAvailabilityResolver? resolveCollectAvailability;
  final MapCollectRequest? onCollectRequested;
  final MapCollectSuccessCallback? onCollectSucceeded;

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen>
    with WidgetsBindingObserver {
  static const _bridge = KakaoMapBridge();

  late final WebViewController _webViewController;
  late Set<String> _appliedCollectedContentIds;

  MapSnapshot? _snapshot;
  LocationState _locationState = const LocationState.loading();
  HeadingDegrees? _currentHeading;
  ProviderSubscription<AsyncValue<LocationState>>? _locationSubscription;
  ProviderSubscription<AsyncValue<HeadingDegrees?>>? _headingSubscription;
  AppLifecycleState _appLifecycleState = AppLifecycleState.resumed;
  bool _mapVisible = false;
  bool _bridgeReady = false;
  bool _tilesLoaded = false;
  String? _errorMessage;
  String? _collectingContentId;
  String? _attemptContentId;
  MapCollectAvailability? _attemptAvailability;
  String? _collectFailureMessage;

  @override
  void initState() {
    super.initState();
    _appliedCollectedContentIds = Set<String>.unmodifiable(
      widget.collectedContentIds,
    );
    WidgetsBinding.instance.addObserver(this);
    _appLifecycleState =
        WidgetsBinding.instance.lifecycleState ?? AppLifecycleState.resumed;
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(StampyColors.canvas)
      ..addJavaScriptChannel(
        'StampyBridge',
        onMessageReceived: (message) {
          unawaited(_handleBridgeMessage(message.message));
        },
      );
    _locationSubscription = ref.listenManual<AsyncValue<LocationState>>(
      currentLocationProvider,
      (previous, next) {
        next.when(
          data: (state) => unawaited(_applyLocationState(state)),
          error: (error, stackTrace) =>
              unawaited(_applyLocationState(const LocationState.unavailable())),
          loading: () =>
              unawaited(_applyLocationState(const LocationState.loading())),
        );
      },
      fireImmediately: true,
    );
    unawaited(_loadMap());
  }

  @override
  void didUpdateWidget(covariant MapScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    var snapshot = _snapshot;
    var snapshotChanged = false;

    if (!setEquals(_appliedCollectedContentIds, widget.collectedContentIds)) {
      _appliedCollectedContentIds = Set<String>.unmodifiable(
        widget.collectedContentIds,
      );
      if (snapshot != null) {
        snapshot = snapshot.withCollectedContentIds(
          _appliedCollectedContentIds,
        );
        snapshotChanged = true;
      }
    }

    if (oldWidget.selectionRequest != widget.selectionRequest &&
        widget.selectionRequest != null &&
        snapshot != null) {
      snapshot = applyMapSelectionRequest(snapshot, widget.selectionRequest);
      snapshotChanged = true;
      _clearCollectFeedback();
    }

    if (snapshotChanged) {
      _snapshot = snapshot;
      unawaited(_sendSnapshot());
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final mapVisible = TickerMode.valuesOf(context).enabled;
    if (_mapVisible != mapVisible) {
      _mapVisible = mapVisible;
      _syncHeadingSubscription();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _appLifecycleState = state;
    _syncHeadingSubscription();
  }

  @override
  void dispose() {
    _locationSubscription?.close();
    _headingSubscription?.close();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
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
        _snapshot = applyMapSelectionRequest(
          _withLiveSensorState(
            snapshot.withCollectedContentIds(_appliedCollectedContentIds),
          ),
          widget.selectionRequest,
        );
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
            _clearCollectFeedback();
          });
          await _sendSnapshot();
        case KakaoMapMapTap():
          final snapshot = _snapshot;
          if (snapshot == null || snapshot.selectedContentId == null) {
            return;
          }
          setState(() {
            _snapshot = snapshot.withSelection(null);
            _clearCollectFeedback();
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

  Future<void> _sendHeading() async {
    final snapshot = _snapshot;
    if (!_bridgeReady || snapshot?.currentLocation == null) {
      return;
    }

    await _webViewController.runJavaScript(
      _bridge.buildSetCurrentHeadingScript(snapshot?.currentHeading),
    );
  }

  MapSnapshot _withLiveSensorState(MapSnapshot snapshot) {
    final withLocation = snapshot.withCurrentLocation(
      _locationState.fix?.coordinates,
    );
    if (withLocation.currentLocation == null) {
      return withLocation;
    }

    return withLocation.withCurrentHeading(_currentHeading);
  }

  Future<void> _applyLocationState(LocationState locationState) async {
    if (!mounted) {
      return;
    }

    setState(() {
      _locationState = locationState;
      _clearAttemptAvailability();
      if (locationState.status != LocationStatus.loading) {
        final snapshot = _snapshot;
        if (snapshot != null) {
          _snapshot = _withLiveSensorState(snapshot);
        }
      }
    });
    _syncHeadingSubscription();
    await _sendSnapshot();
  }

  void _syncHeadingSubscription() {
    final shouldListen =
        _mapVisible &&
        _appLifecycleState == AppLifecycleState.resumed &&
        _locationState.isAvailable;

    if (shouldListen) {
      if (_headingSubscription != null) {
        return;
      }

      unawaited(_sendHeading());
      _headingSubscription = ref.listenManual<AsyncValue<HeadingDegrees?>>(
        currentHeadingProvider,
        (previous, next) {
          next.when(
            data: (heading) => unawaited(_applyHeading(heading)),
            error: (error, stackTrace) => unawaited(_applyHeading(null)),
            loading: () {},
          );
        },
        fireImmediately: true,
      );
      return;
    }

    _headingSubscription?.close();
    _headingSubscription = null;
    if (_currentHeading == null) {
      return;
    }

    _currentHeading = null;
    final snapshot = _snapshot;
    if (snapshot != null && snapshot.currentLocation != null) {
      _snapshot = snapshot.withCurrentHeading(null);
      if (_mapVisible && _appLifecycleState == AppLifecycleState.resumed) {
        unawaited(_sendHeading());
      }
    }
  }

  Future<void> _applyHeading(HeadingDegrees? heading) async {
    if (!mounted) {
      return;
    }

    _currentHeading = heading;
    final snapshot = _snapshot;
    if (snapshot != null && snapshot.currentLocation != null) {
      _snapshot = snapshot.withCurrentHeading(heading);
    }
    await _sendHeading();
  }

  MapCollectAvailability _availabilityFor(MapPin pin) {
    final resolver = widget.resolveCollectAvailability;
    final resolved =
        _attemptContentId == pin.contentId && _attemptAvailability != null
        ? _attemptAvailability!
        : resolver?.call(pin, _locationState) ??
              MapCollectAvailability.blocked(
                reason: MapCollectBlockReason.notConfigured,
                statusLabel: '수집 기능을 준비하고 있어요',
              );

    if (!pin.collected) {
      return resolved;
    }

    return MapCollectAvailability.blocked(
      reason: MapCollectBlockReason.alreadyCollected,
      statusLabel: '이미 수집한 도장이에요',
      distanceMeters: resolved.distanceMeters,
    );
  }

  Future<void> _handleCollect(MapPin pin) async {
    final request = widget.onCollectRequested;
    if (request == null || _collectingContentId != null || pin.collected) {
      return;
    }

    setState(() {
      _collectingContentId = pin.contentId;
      _collectFailureMessage = null;
    });

    late final MapCollectResult result;
    try {
      result = await request(pin);
    } on Object {
      result = MapCollectFailed('도장을 수집하지 못했어요. 다시 시도해 주세요.');
    }

    if (!mounted) {
      return;
    }

    try {
      switch (result) {
        case MapCollectSucceeded(:final distanceMeters):
          final snapshot = _snapshot;
          if (snapshot == null ||
              snapshot.pinByContentId(pin.contentId) == null) {
            setState(() {
              _collectFailureMessage = '선택한 장소를 찾지 못했어요.';
            });
            return;
          }

          final updated = snapshot.withCollectedPin(pin.contentId);
          final collectedPin = updated.pinByContentId(pin.contentId)!;
          setState(() {
            _snapshot = updated;
            _attemptContentId = pin.contentId;
            _attemptAvailability = MapCollectAvailability.blocked(
              reason: MapCollectBlockReason.alreadyCollected,
              statusLabel: '도장 수집 완료',
              distanceMeters: distanceMeters,
            );
            _collectFailureMessage = null;
          });
          try {
            await _sendSnapshot();
          } on Object {
            _showError('수집 상태를 지도에 반영하지 못했어요.');
          }
          if (mounted) {
            widget.onCollectSucceeded?.call(collectedPin);
          }
        case MapCollectBlocked(:final availability):
          setState(() {
            _attemptContentId = pin.contentId;
            _attemptAvailability = availability;
            _collectFailureMessage = null;
          });
        case MapCollectFailed(:final message):
          setState(() {
            _collectFailureMessage = message;
          });
      }
    } finally {
      if (mounted) {
        setState(() {
          _collectingContentId = null;
        });
      }
    }
  }

  void _clearAttemptAvailability() {
    _attemptContentId = null;
    _attemptAvailability = null;
  }

  void _clearCollectFeedback() {
    _clearAttemptAvailability();
    _collectFailureMessage = null;
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
    final locationStatus = describeMapLocation(_locationState);
    final collectAvailability = selectedPin == null
        ? null
        : _availabilityFor(selectedPin);

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
            Positioned(
              top: _errorMessage == null ? 16 : 80,
              right: 16,
              child: _MapLocationChip(
                status: locationStatus,
                onRetry: locationStatus.canRetry
                    ? () => ref.invalidate(currentLocationProvider)
                    : null,
              ),
            ),
            if (selectedPin != null)
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: MapSelectedPinCard(
                  key: ValueKey<String>(selectedPin.contentId),
                  pin: selectedPin,
                  availability: collectAvailability!,
                  failureMessage: _collectFailureMessage,
                  isExternallyProcessing: _collectingContentId != null,
                  onCollect:
                      widget.onCollectRequested == null || selectedPin.collected
                      ? null
                      : () => _handleCollect(selectedPin),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _MapLocationChip extends StatelessWidget {
  const _MapLocationChip({required this.status, this.onRetry});

  final MapLocationStatus status;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final (foreground, background, icon) = switch (status.tone) {
      MapLocationTone.neutral => (
        StampyColors.mutedInk,
        StampyColors.paper,
        Icons.location_searching,
      ),
      MapLocationTone.available => (
        const Color(0xFF176B4D),
        const Color(0xFFE8F5EE),
        Icons.my_location,
      ),
      MapLocationTone.warning => (
        const Color(0xFF8A4B08),
        const Color(0xFFFFF0D8),
        Icons.location_off_outlined,
      ),
      MapLocationTone.error => (
        const Color(0xFF93000A),
        const Color(0xFFFFDAD6),
        Icons.location_disabled_outlined,
      ),
    };

    return DecoratedBox(
      decoration: BoxDecoration(
        color: background.withValues(alpha: 0.96),
        border: Border.all(color: StampyColors.hairline),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 260),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: foreground),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  status.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: foreground,
                    letterSpacing: 0,
                  ),
                ),
              ),
              if (onRetry != null) ...[
                const SizedBox(width: 4),
                IconButton(
                  constraints: const BoxConstraints.tightFor(
                    width: 44,
                    height: 44,
                  ),
                  padding: EdgeInsets.zero,
                  tooltip: '현재 위치 다시 확인',
                  onPressed: onRetry,
                  icon: Icon(Icons.refresh, size: 17, color: foreground),
                ),
              ],
            ],
          ),
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

class MapSelectedPinCard extends StatefulWidget {
  const MapSelectedPinCard({
    required this.pin,
    required this.availability,
    this.onCollect,
    this.failureMessage,
    this.isExternallyProcessing = false,
    super.key,
  });

  final MapPin pin;
  final MapCollectAvailability availability;
  final Future<void> Function()? onCollect;
  final String? failureMessage;
  final bool isExternallyProcessing;

  @override
  State<MapSelectedPinCard> createState() => _MapSelectedPinCardState();
}

class _MapSelectedPinCardState extends State<MapSelectedPinCard> {
  bool _isSubmitting = false;

  Future<void> _submit() async {
    final collect = widget.onCollect;
    if (collect == null || _isSubmitting || widget.isExternallyProcessing) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });
    try {
      await collect();
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pin = widget.pin;
    final availability = widget.availability;
    final isProcessing = _isSubmitting || widget.isExternallyProcessing;
    final isCollected =
        pin.collected ||
        availability.blockReason == MapCollectBlockReason.alreadyCollected;
    final distance = availability.distanceMeters;
    final distanceLabel = distance == null
        ? '거리 확인 필요'
        : '${distance.toStringAsFixed(1)} m';
    final canRefreshLocation = switch (availability.blockReason) {
      MapCollectBlockReason.locationUnavailable ||
      MapCollectBlockReason.accuracyUnavailable ||
      MapCollectBlockReason.accuracyInsufficient ||
      MapCollectBlockReason.outOfRange => true,
      _ => false,
    };
    final canSubmit =
        (availability.canCollect || canRefreshLocation) &&
        !isCollected &&
        !isProcessing &&
        widget.onCollect != null;
    final actionLabel = switch ((
      isCollected,
      isProcessing,
      availability.canCollect,
      canSubmit,
    )) {
      (true, _, _, _) => '수집 완료',
      (_, true, _, _) => '최신 위치 확인 중…',
      (_, _, true, true) => '도장 수집하기',
      (_, _, false, true) => '현재 위치 다시 확인',
      _ => '지금은 수집할 수 없어요',
    };
    final statusColor = availability.canCollect
        ? const Color(0xFF176B4D)
        : isCollected
        ? StampyColors.accent
        : StampyColors.mutedInk;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: StampyColors.paper.withValues(alpha: 0.98),
        border: Border.all(color: StampyColors.hairline),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Row(
              children: <Widget>[
                CircleAvatar(
                  backgroundColor: StampyColors.paleAccent,
                  foregroundColor: StampyColors.accent,
                  child: Icon(
                    isCollected ? Icons.verified : Icons.location_on_outlined,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        pin.title,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
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
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Semantics(
              container: true,
              liveRegion: true,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Expanded(
                    child: Text(
                      availability.statusLabel,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    distanceLabel,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: StampyColors.ink,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
            if (widget.failureMessage case final message?) ...[
              const SizedBox(height: 8),
              Semantics(
                container: true,
                liveRegion: true,
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF93000A),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            FilledButton.icon(
              key: const ValueKey<String>('map-collect-button'),
              onPressed: canSubmit ? _submit : null,
              icon: isProcessing
                  ? const SizedBox.square(
                      dimension: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: StampyColors.paper,
                      ),
                    )
                  : Icon(isCollected ? Icons.check : Icons.approval_outlined),
              label: Text(actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}
