import 'package:stampy/core/geo/coordinates.dart';

enum RecommendationContentKind { spot, event }

enum RecommendationReason {
  categoryAffinity,
  repeatInterest,
  nearbyUncollected,
  collectionCompletion,
  exploration,
}

final class Recommendation {
  factory Recommendation({
    required String contentId,
    required String title,
    required RecommendationContentKind contentKind,
    required Coordinates location,
    required double distanceMeters,
    required double score,
    required RecommendationReason reason,
    required DateTime generatedAt,
  }) {
    final normalizedContentId = contentId.trim();
    final normalizedTitle = title.trim();
    if (normalizedContentId.isEmpty) {
      throw ArgumentError.value(contentId, 'contentId', 'Must not be empty');
    }
    if (normalizedTitle.isEmpty) {
      throw ArgumentError.value(title, 'title', 'Must not be empty');
    }
    if (!distanceMeters.isFinite ||
        distanceMeters < 0 ||
        distanceMeters > 1000) {
      throw RangeError.range(
        distanceMeters,
        0,
        1000,
        'distanceMeters',
        'Must be within the recommendation radius',
      );
    }
    if (!score.isFinite || score < 0 || score > 100) {
      throw RangeError.range(score, 0, 100, 'score', 'Must be within 0–100');
    }
    if (!generatedAt.isUtc) {
      throw ArgumentError.value(generatedAt, 'generatedAt', 'Must be UTC');
    }

    return Recommendation._(
      contentId: normalizedContentId,
      title: normalizedTitle,
      contentKind: contentKind,
      location: location,
      distanceMeters: distanceMeters,
      score: score,
      reason: reason,
      generatedAt: generatedAt,
    );
  }

  const Recommendation._({
    required this.contentId,
    required this.title,
    required this.contentKind,
    required this.location,
    required this.distanceMeters,
    required this.score,
    required this.reason,
    required this.generatedAt,
  });

  final String contentId;
  final String title;
  final RecommendationContentKind contentKind;
  final Coordinates location;
  final double distanceMeters;
  final double score;
  final RecommendationReason reason;
  final DateTime generatedAt;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Recommendation &&
          contentId == other.contentId &&
          title == other.title &&
          contentKind == other.contentKind &&
          location == other.location &&
          distanceMeters == other.distanceMeters &&
          score == other.score &&
          reason == other.reason &&
          generatedAt == other.generatedAt;

  @override
  int get hashCode => Object.hash(
    contentId,
    title,
    contentKind,
    location,
    distanceMeters,
    score,
    reason,
    generatedAt,
  );
}
