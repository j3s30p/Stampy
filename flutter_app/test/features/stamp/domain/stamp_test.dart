import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';

void main() {
  final location = Coordinates(
    latitude: Latitude(37.579617),
    longitude: Longitude(126.977041),
  );
  final verificationFix = LocationFix(
    coordinates: location,
    accuracyMeters: 8.5,
    timestamp: DateTime.utc(2026, 7, 13, 11, 59),
  );

  test('normalizes immutable collection request fields', () {
    final request = CollectStampRequest(
      contentId: ' tour-126508 ',
      title: ' 경복궁 ',
      kind: StampCandidateKind.spot,
      verificationFix: verificationFix,
    );

    expect(request.contentId, 'tour-126508');
    expect(request.title, '경복궁');
    expect(request.kind, StampCandidateKind.spot);
    expect(request.verificationFix, verificationFix);
  });

  test('uses the LocationFix value in request equality and hash code', () {
    CollectStampRequest request(LocationFix fix) => CollectStampRequest(
      contentId: 'tour-126508',
      title: '경복궁',
      kind: StampCandidateKind.spot,
      verificationFix: fix,
    );

    final equalFix = LocationFix(
      coordinates: location,
      accuracyMeters: verificationFix.accuracyMeters,
      timestamp: verificationFix.timestamp,
    );
    final differentAccuracy = LocationFix(
      coordinates: location,
      accuracyMeters: verificationFix.accuracyMeters + 1,
      timestamp: verificationFix.timestamp,
    );

    expect(request(verificationFix), request(equalFix));
    expect(request(verificationFix).hashCode, request(equalFix).hashCode);
    expect(request(verificationFix), isNot(request(differentAccuracy)));
  });

  test('keeps verification evidence and collection time on the record', () {
    final collectedAt = DateTime.utc(2026, 7, 13, 12);
    final stamp = CollectedStamp(
      contentId: 'event-seoul-plaza',
      title: '서울거리예술축제',
      kind: StampCandidateKind.event,
      verificationFix: verificationFix,
      collectedAt: collectedAt,
    );

    expect(stamp.verificationFix, verificationFix);
    expect(stamp.location, verificationFix.coordinates);
    expect(stamp.collectedAt, collectedAt);
    expect(
      CollectStampResult.success(stamp),
      isA<CollectStampSuccess>().having(
        (result) => result.record,
        'record',
        stamp,
      ),
    );
    expect(
      CollectStampResult.duplicate(stamp),
      isA<CollectStampDuplicate>().having(
        (result) => result.existing,
        'existing',
        stamp,
      ),
    );
  });

  test('rejects blank content ids and titles', () {
    expect(
      () => CollectStampRequest(
        contentId: ' ',
        title: '경복궁',
        kind: StampCandidateKind.spot,
        verificationFix: verificationFix,
      ),
      throwsArgumentError,
    );
    expect(
      () => CollectStampRequest(
        contentId: 'tour-126508',
        title: ' ',
        kind: StampCandidateKind.spot,
        verificationFix: verificationFix,
      ),
      throwsArgumentError,
    );
    expect(
      () => LocationFix(
        coordinates: location,
        accuracyMeters: -1,
        timestamp: verificationFix.timestamp,
      ),
      throwsRangeError,
    );
  });
}
