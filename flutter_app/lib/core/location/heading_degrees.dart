final class HeadingDegrees {
  factory HeadingDegrees(double value) {
    if (!value.isFinite || value < 0 || value >= 360) {
      throw RangeError.value(
        value,
        'value',
        'Heading must be finite and in the range [0, 360)',
      );
    }

    return HeadingDegrees._(value);
  }

  const HeadingDegrees._(this.value);

  final double value;

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is HeadingDegrees && value == other.value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => 'HeadingDegrees($value)';
}
