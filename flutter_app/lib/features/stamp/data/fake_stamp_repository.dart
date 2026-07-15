import '../domain/stamp_domain.dart';

final class FakeStampRepository implements StampRepository {
  FakeStampRepository({
    Iterable<CollectedStamp> initialStamps = const <CollectedStamp>[],
    this.collectedSigunguCount = 0,
    DateTime Function()? clock,
  }) : assert(collectedSigunguCount >= 0),
       _clock = clock ?? DateTime.now {
    for (final stamp in initialStamps) {
      if (_stampsByContentId.containsKey(stamp.contentId)) {
        throw ArgumentError.value(
          initialStamps,
          'initialStamps',
          'Content ids must be unique',
        );
      }
      _stampsByContentId[stamp.contentId] = stamp;
    }
  }

  final DateTime Function() _clock;
  final int collectedSigunguCount;
  final Map<String, CollectedStamp> _stampsByContentId =
      <String, CollectedStamp>{};

  @override
  Future<List<CollectedStamp>> loadCollected() =>
      Future<List<CollectedStamp>>.value(
        List<CollectedStamp>.unmodifiable(_stampsByContentId.values),
      );

  @override
  Future<int> loadCollectedSigunguCount() =>
      Future<int>.value(collectedSigunguCount);

  @override
  Future<CollectStampResult> collect(CollectStampRequest request) {
    final existing = _stampsByContentId[request.contentId];
    if (existing != null) {
      return Future<CollectStampResult>.value(
        CollectStampResult.duplicate(existing),
      );
    }

    final record = CollectedStamp(
      contentId: request.contentId,
      title: request.title,
      kind: request.kind,
      verificationFix: request.verificationFix,
      collectedAt: _clock(),
    );
    _stampsByContentId[record.contentId] = record;

    return Future<CollectStampResult>.value(CollectStampResult.success(record));
  }
}
