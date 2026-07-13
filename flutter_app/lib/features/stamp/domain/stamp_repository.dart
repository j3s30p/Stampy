import 'stamp.dart';

abstract interface class StampRepository {
  Future<List<CollectedStamp>> loadCollected();

  Future<CollectStampResult> collect(CollectStampRequest request);
}
