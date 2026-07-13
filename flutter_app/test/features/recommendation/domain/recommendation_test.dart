import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/features/recommendation/domain/recommendation_domain.dart';

void main() {
  test('keeps the content, score, and single recommendation reason', () {
    final generatedAt = DateTime.utc(2026, 7, 13);
    final recommendation = Recommendation(
      contentId: ' spot-123 ',
      contentKind: RecommendationContentKind.spot,
      score: 82,
      reason: RecommendationReason.categoryAffinity,
      generatedAt: generatedAt,
    );

    expect(recommendation.contentId, 'spot-123');
    expect(recommendation.contentKind, RecommendationContentKind.spot);
    expect(recommendation.score, 82);
    expect(recommendation.reason, RecommendationReason.categoryAffinity);
    expect(recommendation.generatedAt, generatedAt);
  });

  test('defines the agreed recommendation reason contract', () {
    expect(RecommendationReason.values, <RecommendationReason>[
      RecommendationReason.categoryAffinity,
      RecommendationReason.repeatInterest,
      RecommendationReason.nearbyUncollected,
      RecommendationReason.collectionCompletion,
      RecommendationReason.exploration,
    ]);
  });

  test('rejects an empty content id', () {
    expect(
      () => Recommendation(
        contentId: '  ',
        contentKind: RecommendationContentKind.event,
        score: 10,
        reason: RecommendationReason.repeatInterest,
        generatedAt: DateTime.utc(2026, 7, 13),
      ),
      throwsArgumentError,
    );
  });

  test('rejects non-finite scores', () {
    for (final score in <double>[
      double.nan,
      double.infinity,
      double.negativeInfinity,
    ]) {
      expect(
        () => Recommendation(
          contentId: 'event-1',
          contentKind: RecommendationContentKind.event,
          score: score,
          reason: RecommendationReason.repeatInterest,
          generatedAt: DateTime.utc(2026, 7, 13),
        ),
        throwsArgumentError,
      );
    }
  });
}
