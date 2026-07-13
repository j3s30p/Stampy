import 'package:stampy/core/geo/coordinates.dart';

import 'recommendation.dart';

abstract interface class RecommendationRepository {
  Future<Recommendation?> loadRecommendation(Coordinates currentLocation);
}

final class RecommendationRepositoryException implements Exception {
  const RecommendationRepositoryException(this.message);

  final String message;

  @override
  String toString() => 'RecommendationRepositoryException: $message';
}
