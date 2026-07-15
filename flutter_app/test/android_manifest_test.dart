import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Android release manifest grants internet access', () {
    final manifest = File(
      'android/app/src/main/AndroidManifest.xml',
    ).readAsStringSync();
    final internetPermissions = RegExp(
      r'<uses-permission\b[^>]*android:name="android\.permission\.INTERNET"[^>]*/?>',
    ).allMatches(manifest);

    expect(internetPermissions, hasLength(1));
  });
}
