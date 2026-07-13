import 'event_channel_heading_platform_adapter.dart';
import 'heading_degrees.dart';
import 'heading_platform_adapter.dart';
import 'heading_repository.dart';

final class PlatformHeadingRepository implements HeadingRepository {
  PlatformHeadingRepository({HeadingPlatformAdapter? platformAdapter})
    : _platformAdapter =
          platformAdapter ?? EventChannelHeadingPlatformAdapter();

  final HeadingPlatformAdapter _platformAdapter;

  @override
  Stream<HeadingDegrees?> watchHeading() async* {
    final headingStream = _platformAdapter.headingStream;
    if (headingStream == null) {
      yield null;
      return;
    }

    var emitted = false;
    try {
      await for (final value in headingStream) {
        emitted = true;
        yield _toHeading(value);
      }
      if (!emitted) {
        yield null;
      }
    } on Object {
      yield null;
    }
  }
}

HeadingDegrees? _toHeading(double? value) {
  if (value == null) {
    return null;
  }

  try {
    return HeadingDegrees(value);
  } on RangeError {
    return null;
  }
}
