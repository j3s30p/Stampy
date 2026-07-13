import 'package:flutter/services.dart';

import 'heading_platform_adapter.dart';

typedef RawHeadingStreamFactory = Stream<Object?>? Function();

final class EventChannelHeadingPlatformAdapter
    implements HeadingPlatformAdapter {
  EventChannelHeadingPlatformAdapter({
    RawHeadingStreamFactory? rawHeadingStreamFactory,
  }) : _rawHeadingStreamFactory =
           rawHeadingStreamFactory ?? _createPlatformHeadingStream;

  final RawHeadingStreamFactory _rawHeadingStreamFactory;

  @override
  Stream<double?>? get headingStream =>
      _rawHeadingStreamFactory()?.map(_normalizeHeading);
}

const _headingChannel = EventChannel('stampy/heading');

Stream<Object?> _createPlatformHeadingStream() =>
    _headingChannel.receiveBroadcastStream();

double? _normalizeHeading(Object? value) {
  if (value is! num) {
    return null;
  }

  final degrees = value.toDouble();
  if (!degrees.isFinite || degrees < 0 || degrees > 360) {
    return null;
  }

  return degrees == 360 ? 0 : degrees;
}
