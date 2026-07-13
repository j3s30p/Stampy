import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/location/heading_degrees.dart';

void main() {
  group('HeadingDegrees', () {
    test('accepts the inclusive zero and exclusive 360 degree bounds', () {
      expect(HeadingDegrees(0).value, 0);
      expect(HeadingDegrees(359.999).value, 359.999);
    });

    test('rejects non-finite and out-of-range values', () {
      for (final value in <double>[
        -0.001,
        360,
        720,
        double.nan,
        double.infinity,
        double.negativeInfinity,
      ]) {
        expect(() => HeadingDegrees(value), throwsRangeError);
      }
    });

    test('supports value equality, hash codes, and readable output', () {
      final first = HeadingDegrees(123.5);
      final second = HeadingDegrees(123.5);

      expect(first, second);
      expect(first.hashCode, second.hashCode);
      expect(first.toString(), 'HeadingDegrees(123.5)');
    });
  });
}
