import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/location/fake_heading_repository.dart';
import 'package:stampy/core/location/heading_degrees.dart';
import 'package:stampy/core/location/location_providers.dart';

void main() {
  test('fake repository returns the configured heading stream', () async {
    final repository = FakeHeadingRepository.fromValues(<HeadingDegrees?>[
      HeadingDegrees(12),
      null,
      HeadingDegrees(270),
    ]);

    expect(await repository.watchHeading().toList(), <HeadingDegrees?>[
      HeadingDegrees(12),
      null,
      HeadingDegrees(270),
    ]);
    expect(await repository.watchHeading().toList(), <HeadingDegrees?>[
      HeadingDegrees(12),
      null,
      HeadingDegrees(270),
    ]);
    expect(repository.watchCount, 2);
  });

  test('currentHeadingProvider uses an overridden repository', () async {
    final repository = FakeHeadingRepository.fromValues(<HeadingDegrees?>[
      HeadingDegrees(182.5),
    ]);
    final container = ProviderContainer(
      overrides: [headingRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
    final subscription = container.listen(currentHeadingProvider, (_, _) {});
    addTearDown(subscription.close);

    expect(
      await container.read(currentHeadingProvider.future),
      HeadingDegrees(182.5),
    );
    expect(repository.watchCount, 1);
  });
}
