import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/app/stamp_collect_success_policy.dart';

void main() {
  test('allows presentation only for a visible route in a resumed app', () {
    expect(
      shouldPresentStampCollectSuccess(
        isRouteVisible: true,
        lifecycleState: AppLifecycleState.resumed,
      ),
      isTrue,
    );
    expect(
      shouldPresentStampCollectSuccess(
        isRouteVisible: false,
        lifecycleState: AppLifecycleState.resumed,
      ),
      isFalse,
    );
  });

  test('blocks every inactive or background lifecycle state', () {
    for (final lifecycleState in <AppLifecycleState?>[
      null,
      AppLifecycleState.inactive,
      AppLifecycleState.hidden,
      AppLifecycleState.paused,
      AppLifecycleState.detached,
    ]) {
      expect(
        shouldPresentStampCollectSuccess(
          isRouteVisible: true,
          lifecycleState: lifecycleState,
        ),
        isFalse,
        reason: '$lifecycleState must not open a success route',
      );
    }
  });
}
