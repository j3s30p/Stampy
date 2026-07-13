import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/fake_stamp_repository.dart';
import '../domain/stamp_domain.dart';

final stampRepositoryProvider = Provider<StampRepository>(
  (ref) => FakeStampRepository(),
);

final stampSessionProvider =
    NotifierProvider<StampSessionController, StampSessionState>(
      StampSessionController.new,
    );

final class StampSessionState {
  StampSessionState({
    List<CollectedStamp> collectedStamps = const <CollectedStamp>[],
    this.isCollecting = false,
    this.error,
  }) : collectedStamps = List<CollectedStamp>.unmodifiable(collectedStamps);

  final List<CollectedStamp> collectedStamps;
  final bool isCollecting;
  final Object? error;

  StampSessionState copyWith({
    List<CollectedStamp>? collectedStamps,
    bool? isCollecting,
    Object? error,
    bool clearError = false,
  }) => StampSessionState(
    collectedStamps: collectedStamps ?? this.collectedStamps,
    isCollecting: isCollecting ?? this.isCollecting,
    error: clearError ? null : error ?? this.error,
  );
}

final class StampSessionController extends Notifier<StampSessionState> {
  late StampRepository _repository;
  int _activeCollections = 0;

  @override
  StampSessionState build() {
    _repository = ref.watch(stampRepositoryProvider);
    unawaited(Future<void>.microtask(_loadCollected));
    return StampSessionState();
  }

  bool isCollected(String contentId) {
    final normalizedContentId = contentId.trim();
    return state.collectedStamps.any(
      (stamp) => stamp.contentId == normalizedContentId,
    );
  }

  Future<CollectStampResult> collect(CollectStampRequest request) async {
    _activeCollections += 1;
    state = state.copyWith(isCollecting: true, clearError: true);

    try {
      final result = await _repository.collect(request);
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
      state = state.copyWith(error: error);
      rethrow;
    } finally {
      _activeCollections -= 1;
      state = state.copyWith(isCollecting: _activeCollections > 0);
    }
  }

  Future<void> _loadCollected() async {
    try {
      final collected = await _repository.loadCollected();
      state = state.copyWith(
        collectedStamps: _mergeByContentId(collected, state.collectedStamps),
        clearError: true,
      );
    } on Object catch (error) {
      state = state.copyWith(error: error);
    }
  }
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
