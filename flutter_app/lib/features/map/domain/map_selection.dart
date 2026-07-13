import 'map_models.dart';

final class MapSelectionRequest {
  MapSelectionRequest({required String contentId, required this.revision})
    : contentId = _nonEmpty(contentId) {
    if (revision < 1) {
      throw RangeError.range(revision, 1, null, 'revision');
    }
  }

  final String contentId;
  final int revision;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MapSelectionRequest &&
          contentId == other.contentId &&
          revision == other.revision;

  @override
  int get hashCode => Object.hash(contentId, revision);
}

MapSnapshot applyMapSelectionRequest(
  MapSnapshot snapshot,
  MapSelectionRequest? request,
) => request == null
    ? snapshot
    : snapshot.withFocusedSelection(request.contentId);

String _nonEmpty(String value) {
  final normalized = value.trim();
  if (normalized.isEmpty) {
    throw ArgumentError.value(value, 'contentId', 'must not be empty');
  }
  return normalized;
}
