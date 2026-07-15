import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/core/auth/auth_providers.dart';

import '../data/fake_stamp_repository.dart';
import '../domain/stamp_domain.dart';

final stampRepositoryProvider = Provider<StampRepository>(
  (ref) => FakeStampRepository(),
);

final stampSessionProvider =
    NotifierProvider<StampSessionController, StampSessionState>(
      StampSessionController.new,
    );

enum StampSessionLoadStatus { loading, loaded, failed }

final class StampSessionState {
  StampSessionState({
    List<CollectedStamp> collectedStamps = const <CollectedStamp>[],
    this.loadStatus = StampSessionLoadStatus.loading,
    this.isCollecting = false,
    this.error,
  }) : collectedStamps = List<CollectedStamp>.unmodifiable(collectedStamps);

  final List<CollectedStamp> collectedStamps;
  final StampSessionLoadStatus loadStatus;
  final bool isCollecting;
  final Object? error;

  StampSessionState copyWith({
    List<CollectedStamp>? collectedStamps,
    StampSessionLoadStatus? loadStatus,
    bool? isCollecting,
    Object? error,
    bool clearError = false,
  }) => StampSessionState(
    collectedStamps: collectedStamps ?? this.collectedStamps,
    loadStatus: loadStatus ?? this.loadStatus,
    isCollecting: isCollecting ?? this.isCollecting,
    error: clearError ? null : error ?? this.error,
  );
}

final class StampSessionController extends Notifier<StampSessionState> {
  late StampRepository _repository;
  int _activeCollections = 0;
  int _generation = 0;
  String? _sessionKey;

  @override
  StampSessionState build() {
    _repository = ref.watch(stampRepositoryProvider);
    _sessionKey = ref.watch(
      currentAuthUserProvider.select(
        (authUser) => switch (authUser) {
          AsyncData(:final value) => value.isSignedOut ? null : value.id,
          _ => null,
        },
      ),
    );
    final generation = ++_generation;
    _activeCollections = 0;
    if (_sessionKey != null) {
      final repository = _repository;
      unawaited(
        Future<void>.microtask(() => _loadCollected(repository, generation)),
      );
    }
    return StampSessionState();
  }

  bool isCollected(String contentId) {
    final normalizedContentId = contentId.trim();
    return state.collectedStamps.any(
      (stamp) => stamp.contentId == normalizedContentId,
    );
  }

  Future<void> retryLoad() async {
    if (_sessionKey == null ||
        state.loadStatus != StampSessionLoadStatus.failed) {
      return;
    }

    final repository = _repository;
    final generation = _generation;
    state = state.copyWith(
      loadStatus: StampSessionLoadStatus.loading,
      clearError: true,
    );
    await _loadCollected(repository, generation);
  }

  Future<CollectStampResult> collect(CollectStampRequest request) async {
    if (_sessionKey == null) {
      throw const StampRepositoryException('The stamp session is not ready.');
    }

    final repository = _repository;
    final generation = _generation;
    _activeCollections += 1;
    state = state.copyWith(isCollecting: true, clearError: true);

    try {
      final result = await repository.collect(request);
      if (!_isCurrent(generation)) {
        throw const StampRepositoryException(
          'The stamp session changed during collection.',
        );
      }
      final stamp = switch (result) {
        CollectStampSuccess(:final record) => record,
        CollectStampDuplicate(:final existing) => existing,
      };
      state = state.copyWith(
        collectedStamps: _mergeByContentId(
          state.collectedStamps,
          <CollectedStamp>[stamp],
        ),
      );
      return result;
    } on Object catch (error) {
      if (_isCurrent(generation)) {
        state = state.copyWith(error: error);
      }
      rethrow;
    } finally {
      if (_isCurrent(generation)) {
        _activeCollections -= 1;
        state = state.copyWith(isCollecting: _activeCollections > 0);
      }
    }
  }

  Future<void> _loadCollected(
    StampRepository repository,
    int generation,
  ) async {
    try {
      final collected = await repository.loadCollected();
      if (!_isCurrent(generation)) {
        return;
      }
      state = state.copyWith(
        collectedStamps: _mergeByContentId(collected, state.collectedStamps),
        loadStatus: StampSessionLoadStatus.loaded,
        clearError: true,
      );
    } on Object catch (error) {
      if (_isCurrent(generation)) {
        state = state.copyWith(
          loadStatus: StampSessionLoadStatus.failed,
          error: error,
        );
      }
    }
  }

  bool _isCurrent(int generation) => ref.mounted && generation == _generation;
}

List<CollectedStamp> _mergeByContentId(
  Iterable<CollectedStamp> first,
  Iterable<CollectedStamp> second,
) {
  final byContentId = <String, CollectedStamp>{};
  for (final stamp in first.followedBy(second)) {
    byContentId[stamp.contentId] = stamp;
  }
  return List<CollectedStamp>.unmodifiable(byContentId.values);
}
