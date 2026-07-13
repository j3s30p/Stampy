import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/coordinates.dart';
import 'package:stampy/features/recommendation/data/fake_recommendation_repository.dart';
import 'package:stampy/features/recommendation/domain/recommendation_domain.dart';

void main() {
  test('returns no recommendation by default', () async {
    final result = await const FakeRecommendationRepository()
        .loadRecommendation(_location());

    expect(result, isNull);
  });

  test('returns the injected recommendation', () async {
    final recommendation = Recommendation(
      contentId: 'tour-126508',
      title: '경복궁',
      contentKind: RecommendationContentKind.spot,
      location: _location(),
      distanceMeters: 250,
      score: 75,
      reason: RecommendationReason.nearbyUncollected,
      generatedAt: DateTime.utc(2026, 7, 13),
    );

    final result = await FakeRecommendationRepository(
      recommendation: recommendation,
    ).loadRecommendation(_location());

    expect(result, same(recommendation));
  });
}

Coordinates _location() => Coordinates(
  latitude: Latitude(37.579617),
  longitude: Longitude(126.977041),
);
