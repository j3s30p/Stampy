import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';

void main() {
  final location = Coordinates(
    latitude: Latitude(37.579617),
    longitude: Longitude(126.977041),
  );
  final collectedAt = DateTime.utc(2026, 7, 13, 12);
  final verificationFix = LocationFix(
    coordinates: location,
    accuracyMeters: 7.5,
    timestamp: DateTime.utc(2026, 7, 13, 11, 59),
  );
  final request = CollectStampRequest(
    contentId: 'tour-126508',
    title: '경복궁',
    kind: StampCandidateKind.spot,
    verificationFix: verificationFix,
  );

  test('uses the injected clock and returns an immutable snapshot', () async {
    final repository = FakeStampRepository(clock: () => collectedAt);

    final result = await repository.collect(request);
    final stamps = await repository.loadCollected();

    expect(
      result,
      isA<CollectStampSuccess>().having(
        (success) => success.record.collectedAt,
        'collectedAt',
        collectedAt,
      ),
    );
    expect(stamps, hasLength(1));
    expect(stamps.single.verificationFix, verificationFix);
    expect(stamps.single.location, verificationFix.coordinates);
    expect(() => stamps.clear(), throwsUnsupportedError);
  });

  test('atomically rejects concurrent duplicate content ids', () async {
    var clockCalls = 0;
    final repository = FakeStampRepository(
      clock: () {
        clockCalls += 1;
        return collectedAt;
      },
    );

    final results = await Future.wait(<Future<CollectStampResult>>[
      repository.collect(request),
      repository.collect(request),
    ]);
    final stamps = await repository.loadCollected();

    expect(results.whereType<CollectStampSuccess>(), hasLength(1));
    expect(results.whereType<CollectStampDuplicate>(), hasLength(1));
    expect(stamps, hasLength(1));
    expect(clockCalls, 1);
    expect(
      (results.whereType<CollectStampDuplicate>().single).existing,
      stamps.single,
    );
  });

  test('rejects duplicate content ids in initial data', () {
    final stamp = CollectedStamp(
      contentId: request.contentId,
      title: request.title,
      kind: request.kind,
      verificationFix: request.verificationFix,
      collectedAt: collectedAt,
    );

    expect(
      () => FakeStampRepository(initialStamps: <CollectedStamp>[stamp, stamp]),
      throwsArgumentError,
    );
  });
}
