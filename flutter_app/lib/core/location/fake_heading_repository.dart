import 'heading_degrees.dart';
import 'heading_repository.dart';

typedef FakeHeadingStreamFactory = Stream<HeadingDegrees?> Function();

final class FakeHeadingRepository implements HeadingRepository {
  factory FakeHeadingRepository({
    required FakeHeadingStreamFactory headingStreamFactory,
  }) => FakeHeadingRepository._(headingStreamFactory);

  FakeHeadingRepository._(this._headingStreamFactory);

  factory FakeHeadingRepository.fromValues(Iterable<HeadingDegrees?> headings) {
    final values = List<HeadingDegrees?>.unmodifiable(headings);
    return FakeHeadingRepository(
      headingStreamFactory: () => Stream<HeadingDegrees?>.fromIterable(values),
    );
  }

  final FakeHeadingStreamFactory _headingStreamFactory;

  int watchCount = 0;

  @override
  Stream<HeadingDegrees?> watchHeading() {
    watchCount += 1;
    return _headingStreamFactory();
  }
}
