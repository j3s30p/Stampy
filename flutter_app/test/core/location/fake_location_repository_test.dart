import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/location/fake_location_repository.dart';
import 'package:stampy/core/location/location_providers.dart';
import 'package:stampy/core/location/location_state.dart';

void main() {
  test(
    'fake repository returns and updates the same location contract',
    () async {
      final repository = FakeLocationRepository(
        state: const LocationState.permissionDenied(),
      );

      expect(
        await repository.getCurrentLocation(),
        const LocationState.permissionDenied(),
      );

      repository.setState(const LocationState.serviceDisabled());

      expect(
        await repository.getCurrentLocation(),
        const LocationState.serviceDisabled(),
      );
      expect(repository.requestCount, 2);
    },
  );

  test('currentLocationProvider uses an overridden repository', () async {
    final repository = FakeLocationRepository(
      state: const LocationState.permissionDeniedForever(),
    );
    final container = ProviderContainer(
      overrides: [locationRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);

    expect(
      await container.read(currentLocationProvider.future),
      const LocationState.permissionDeniedForever(),
    );
    expect(repository.requestCount, 1);
  });
}
