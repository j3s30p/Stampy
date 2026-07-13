import '../../../core/geo/coordinates.dart';
import '../../../core/location/location_state.dart';
import 'collect_eligibility.dart';

final class CollectedStamp {
  factory CollectedStamp({
    required String contentId,
    required String title,
    required StampCandidateKind kind,
    required LocationFix verificationFix,
    required DateTime collectedAt,
  }) => CollectedStamp._(
    contentId: _nonEmpty(contentId, 'contentId'),
    title: _nonEmpty(title, 'title'),
    kind: kind,
    verificationFix: verificationFix,
    collectedAt: collectedAt,
  );

  const CollectedStamp._({
    required this.contentId,
    required this.title,
    required this.kind,
    required this.verificationFix,
    required this.collectedAt,
  });

  final String contentId;
  final String title;
  final StampCandidateKind kind;
  final LocationFix verificationFix;
  final DateTime collectedAt;

  Coordinates get location => verificationFix.coordinates;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CollectedStamp &&
          contentId == other.contentId &&
          title == other.title &&
          kind == other.kind &&
          verificationFix == other.verificationFix &&
          collectedAt == other.collectedAt;

  @override
  int get hashCode =>
      Object.hash(contentId, title, kind, verificationFix, collectedAt);
}

final class CollectStampRequest {
  factory CollectStampRequest({
    required String contentId,
    required String title,
    required StampCandidateKind kind,
    required LocationFix verificationFix,
  }) => CollectStampRequest._(
    contentId: _nonEmpty(contentId, 'contentId'),
    title: _nonEmpty(title, 'title'),
    kind: kind,
    verificationFix: verificationFix,
  );

  const CollectStampRequest._({
    required this.contentId,
    required this.title,
    required this.kind,
    required this.verificationFix,
  });

  final String contentId;
  final String title;
  final StampCandidateKind kind;
  final LocationFix verificationFix;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CollectStampRequest &&
          contentId == other.contentId &&
          title == other.title &&
          kind == other.kind &&
          verificationFix == other.verificationFix;

  @override
  int get hashCode => Object.hash(contentId, title, kind, verificationFix);
}

sealed class CollectStampResult {
  const CollectStampResult();

  const factory CollectStampResult.success(CollectedStamp record) =
      CollectStampSuccess;

  const factory CollectStampResult.duplicate(CollectedStamp existing) =
      CollectStampDuplicate;
}

final class CollectStampSuccess extends CollectStampResult {
  const CollectStampSuccess(this.record);

  final CollectedStamp record;
}

final class CollectStampDuplicate extends CollectStampResult {
  const CollectStampDuplicate(this.existing);

  final CollectedStamp existing;
}

String _nonEmpty(String value, String name) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    throw ArgumentError.value(value, name, 'Must not be empty');
  }

  return trimmed;
}
