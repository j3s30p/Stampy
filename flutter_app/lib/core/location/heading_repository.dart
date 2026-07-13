import 'heading_degrees.dart';

abstract interface class HeadingRepository {
  Stream<HeadingDegrees?> watchHeading();
}
