import 'package:stampy/core/geo/coordinates.dart';

import '../domain/recommendation_domain.dart';

final class FakeRecommendationRepository implements RecommendationRepository {
  const FakeRecommendationRepository({this.recommendation});

  final Recommendation? recommendation;

  @override
  Future<Recommendation?> loadRecommendation(Coordinates currentLocation) =>
      Future<Recommendation?>.value(recommendation);
}
