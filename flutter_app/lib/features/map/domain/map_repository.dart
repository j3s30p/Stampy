import 'map_models.dart';

abstract interface class MapRepository {
  Future<MapSnapshot> loadSnapshot();
}
