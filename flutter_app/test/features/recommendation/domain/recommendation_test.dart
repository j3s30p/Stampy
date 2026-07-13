import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/features/recommendation/domain/recommendation_domain.dart';

void main() {
  test('keeps normalized server display fields and one reason', () {
    final generatedAt = DateTime.utc(2026, 7, 13);
    final location = _location();
    final recommendation = Recommendation(
      contentId: ' spot-123 ',
      title: ' 경복궁 ',
      contentKind: RecommendationContentKind.spot,
      location: location,
      distanceMeters: 218.5,
      score: 78.15,
      reason: RecommendationReason.nearbyUncollected,
      generatedAt: generatedAt,
    );

    expect(recommendation.contentId, 'spot-123');
    expect(recommendation.title, '경복궁');
    expect(recommendation.contentKind, RecommendationContentKind.spot);
    expect(recommendation.location, location);
    expect(recommendation.distanceMeters, 218.5);
    expect(recommendation.score, 78.15);
    expect(recommendation.reason, RecommendationReason.nearbyUncollected);
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

  test('rejects empty server identifiers and titles', () {
    expect(() => _recommendation(contentId: '  '), throwsArgumentError);
    expect(() => _recommendation(title: '  '), throwsArgumentError);
  });

  test('accepts the inclusive distance and score boundaries', () {
    expect(_recommendation(distanceMeters: 0, score: 100).score, 100);
    expect(
      _recommendation(distanceMeters: 1000, score: 0).distanceMeters,
      1000,
    );
  });

  test('rejects invalid distances', () {
    for (final distance in <double>[
      -0.1,
      1000.1,
      double.nan,
      double.infinity,
      double.negativeInfinity,
    ]) {
      expect(() => _recommendation(distanceMeters: distance), throwsRangeError);
    }
  });

  test('rejects scores outside 0–100 and non-finite scores', () {
    for (final score in <double>[
      -0.1,
      100.1,
      double.nan,
      double.infinity,
      double.negativeInfinity,
    ]) {
      expect(() => _recommendation(score: score), throwsRangeError);
    }
  });

  test('requires a UTC server timestamp', () {
    expect(
      () => _recommendation(generatedAt: DateTime(2026, 7, 13)),
      throwsArgumentError,
    );
  });
}

Recommendation _recommendation({
  String contentId = 'spot-123',
  String title = '경복궁',
  double distanceMeters = 218.5,
  double score = 78.15,
  DateTime? generatedAt,
}) => Recommendation(
  contentId: contentId,
  title: title,
  contentKind: RecommendationContentKind.spot,
  location: _location(),
  distanceMeters: distanceMeters,
  score: score,
  reason: RecommendationReason.nearbyUncollected,
  generatedAt: generatedAt ?? DateTime.utc(2026, 7, 13),
);

Coordinates _location() => Coordinates(
  latitude: Latitude(37.579617),
  longitude: Longitude(126.977041),
);
