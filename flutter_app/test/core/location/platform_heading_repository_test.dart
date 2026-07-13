import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/location/event_channel_heading_platform_adapter.dart';
import 'package:stampy/core/location/heading_platform_adapter.dart';
import 'package:stampy/core/location/platform_heading_repository.dart';

void main() {
  group('EventChannelHeadingPlatformAdapter', () {
    test('passes valid headings and normalizes 360 to north', () async {
      final adapter = EventChannelHeadingPlatformAdapter(
        rawHeadingStreamFactory: () =>
            Stream<Object?>.fromIterable(<Object?>[0, 45.5, 359.999, 360]),
      );

      expect(await adapter.headingStream!.toList(), <double?>[
        0,
        45.5,
        359.999,
        0,
      ]);
    });

    test('maps malformed platform readings to null', () async {
      final adapter = EventChannelHeadingPlatformAdapter(
        rawHeadingStreamFactory: () => Stream<Object?>.fromIterable(<Object?>[
          null,
          'north',
          -0.001,
          360.001,
          double.nan,
          double.infinity,
        ]),
      );

      expect(
        await adapter.headingStream!.toList(),
        List<double?>.filled(6, null),
      );
    });

    test('preserves an unavailable injected stream as null', () {
      final adapter = EventChannelHeadingPlatformAdapter(
        rawHeadingStreamFactory: () => null,
      );

      expect(adapter.headingStream, isNull);
    });
  });

  group('PlatformHeadingRepository', () {
    test('converts valid platform values to immutable headings', () async {
      final repository = PlatformHeadingRepository(
        platformAdapter: _TestHeadingPlatformAdapter(
          Stream<double?>.fromIterable(<double?>[0, 91.25, 359.9]),
        ),
      );

      final headings = await repository.watchHeading().toList();

      expect(headings.map((heading) => heading?.value), <double?>[
        0,
        91.25,
        359.9,
      ]);
    });

    test('does not fabricate values for null or invalid readings', () async {
      final repository = PlatformHeadingRepository(
        platformAdapter: _TestHeadingPlatformAdapter(
          Stream<double?>.fromIterable(<double?>[
            null,
            -1,
            360,
            double.nan,
            double.infinity,
          ]),
        ),
      );

      expect(
        await repository.watchHeading().toList(),
        List<Object?>.filled(5, null),
      );
    });

    test('emits null when the platform exposes no stream', () async {
      final repository = PlatformHeadingRepository(
        platformAdapter: const _TestHeadingPlatformAdapter(null),
      );

      expect(await repository.watchHeading().toList(), <Object?>[null]);
    });

    test('emits null when the platform stream closes without data', () async {
      final repository = PlatformHeadingRepository(
        platformAdapter: _TestHeadingPlatformAdapter(Stream<double?>.empty()),
      );

      expect(await repository.watchHeading().toList(), <Object?>[null]);
    });

    test('maps a platform stream error to null and closes', () async {
      final repository = PlatformHeadingRepository(
        platformAdapter: _TestHeadingPlatformAdapter(
          Stream<double?>.error(StateError('sensor failed')),
        ),
      );

      expect(await repository.watchHeading().toList(), <Object?>[null]);
    });
  });
}

final class _TestHeadingPlatformAdapter implements HeadingPlatformAdapter {
  const _TestHeadingPlatformAdapter(this.headingStream);

  @override
  final Stream<double?>? headingStream;
}
