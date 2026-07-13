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
    required RecommendationContentKind contentKind,
    required double score,
    required RecommendationReason reason,
    required DateTime generatedAt,
  }) {
    final normalizedContentId = contentId.trim();
    if (normalizedContentId.isEmpty) {
      throw ArgumentError.value(contentId, 'contentId', 'Must not be empty');
    }
    if (!score.isFinite) {
      throw ArgumentError.value(score, 'score', 'Must be finite');
    }

    return Recommendation._(
      contentId: normalizedContentId,
      contentKind: contentKind,
      score: score,
      reason: reason,
      generatedAt: generatedAt,
    );
  }

  const Recommendation._({
    required this.contentId,
    required this.contentKind,
    required this.score,
    required this.reason,
    required this.generatedAt,
  });

  final String contentId;
  final RecommendationContentKind contentKind;
  final double score;
  final RecommendationReason reason;
  final DateTime generatedAt;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Recommendation &&
          contentId == other.contentId &&
          contentKind == other.contentKind &&
          score == other.score &&
          reason == other.reason &&
          generatedAt == other.generatedAt;

  @override
  int get hashCode =>
      Object.hash(contentId, contentKind, score, reason, generatedAt);
}
