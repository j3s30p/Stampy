import 'stamp.dart';

abstract interface class StampRepository {
  Future<List<CollectedStamp>> loadCollected();

  Future<int> loadCollectedSigunguCount();

  Future<CollectStampResult> collect(CollectStampRequest request);
}

final class StampRepositoryException implements Exception {
  const StampRepositoryException(this.message);

  final String message;

  @override
  String toString() => 'StampRepositoryException: $message';
}
