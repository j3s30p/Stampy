import 'package:stampy/core/geo/coordinates.dart';

import '../domain/map_models.dart';
import '../domain/map_repository.dart';

final class FakeMapRepository implements MapRepository {
  const FakeMapRepository();

  @override
  Future<MapSnapshot> loadSnapshot() async => MapSnapshot(
    center: _coordinate(37.579617, 126.977041),
    currentLocation: null,
    selectedContentId: 'tour-126508',
    pins: <MapPin>[
      MapPin(
        contentId: 'tour-126508',
        title: '경복궁',
        kind: MapPinKind.place,
        location: _coordinate(37.579617, 126.977041),
      ),
      MapPin(
        contentId: 'tour-bukchon',
        title: '북촌한옥마을',
        kind: MapPinKind.place,
        location: _coordinate(37.582604, 126.983684),
      ),
      MapPin(
        contentId: 'tour-changdeokgung',
        title: '창덕궁',
        kind: MapPinKind.place,
        location: _coordinate(37.579431, 126.991042),
        collected: true,
      ),
      MapPin(
        contentId: 'event-seoul-plaza',
        title: '서울거리예술축제',
        kind: MapPinKind.event,
        location: _coordinate(37.566295, 126.977945),
      ),
    ],
  );
}

Coordinates _coordinate(double latitude, double longitude) =>
    Coordinates(latitude: Latitude(latitude), longitude: Longitude(longitude));
