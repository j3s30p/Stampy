import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stampy/core/geo/geo.dart';
import 'package:stampy/core/location/location_state.dart';
import 'package:stampy/features/stamp/data/fake_stamp_repository.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

void main() {
  final collectedAt = DateTime.utc(2026, 7, 13, 12);
  final request = CollectStampRequest(
    contentId: 'tour-126508',
    title: '경복궁',
    kind: StampCandidateKind.spot,
    verificationFix: LocationFix(
      coordinates: Coordinates(
        latitude: Latitude(37.579617),
        longitude: Longitude(126.977041),
      ),
      accuracyMeters: 6,
      timestamp: DateTime.utc(2026, 7, 13, 11, 59),
    ),
  );

  test(
    'collect updates session state and duplicate remains one record',
    () async {
      final repository = FakeStampRepository(clock: () => collectedAt);
      final container = ProviderContainer(
        overrides: [stampRepositoryProvider.overrideWithValue(repository)],
      );
      addTearDown(container.dispose);

      final controller = container.read(stampSessionProvider.notifier);
      final first = await controller.collect(request);
      final second = await controller.collect(request);

      expect(first, isA<CollectStampSuccess>());
      expect(second, isA<CollectStampDuplicate>());
      expect(controller.isCollected(request.contentId), isTrue);
      expect(
        container.read(stampSessionProvider).collectedStamps,
        hasLength(1),
      );
      expect(
        () => container.read(stampSessionProvider).collectedStamps.clear(),
        throwsUnsupportedError,
      );
      expect(container.read(stampSessionProvider).isCollecting, isFalse);
      expect(container.read(stampSessionProvider).error, isNull);
    },
  );

  test(
    'keeps collected state when a tab unsubscribes and subscribes again',
    () async {
      final repository = FakeStampRepository(clock: () => collectedAt);
      final container = ProviderContainer(
        overrides: [stampRepositoryProvider.overrideWithValue(repository)],
      );
      addTearDown(container.dispose);

      final firstTab = container.listen<StampSessionState>(
        stampSessionProvider,
        (previous, next) {},
        fireImmediately: true,
      );
      await container.read(stampSessionProvider.notifier).collect(request);
      firstTab.close();
      await Future<void>.delayed(Duration.zero);

      final secondTab = container.listen<StampSessionState>(
        stampSessionProvider,
        (previous, next) {},
        fireImmediately: true,
      );
      addTearDown(secondTab.close);

      expect(
        container.read(stampSessionProvider).collectedStamps,
        hasLength(1),
      );
      expect(
        container
            .read(stampSessionProvider.notifier)
            .isCollected(' tour-126508 '),
        isTrue,
      );
    },
  );
}
