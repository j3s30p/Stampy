import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:stampy/app/stamp_collect_coordinator.dart';
import 'package:stampy/app/stamp_collect_success_policy.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/core/widgets/stampy_bottom_navigation.dart';
import 'package:stampy/features/home/presentation/home_screen.dart';
import 'package:stampy/features/map/domain/map_collect.dart';
import 'package:stampy/features/map/domain/map_models.dart';
import 'package:stampy/features/map/presentation/map_screen.dart';
import 'package:stampy/features/profile/presentation/profile_screen.dart';
import 'package:stampy/features/ranking/presentation/ranking_screen.dart';
import 'package:stampy/features/stamp/domain/stamp_domain.dart';
import 'package:stampy/features/stamp/presentation/stamp_collection_screen.dart';
import 'package:stampy/features/stamp/presentation/stamp_collect_success_screen.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return StampyAppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                name: 'home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/map',
                name: 'map',
                builder: (context, state) => const _MapStampCollectionRoute(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/stamps',
                name: 'stamps',
                builder: (context, state) => const StampCollectionScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/ranking',
                name: 'ranking',
                builder: (context, state) => const RankingScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});

class _MapStampCollectionRoute extends ConsumerStatefulWidget {
  const _MapStampCollectionRoute();

  @override
  ConsumerState<_MapStampCollectionRoute> createState() =>
      _MapStampCollectionRouteState();
}

class _MapStampCollectionRouteState
    extends ConsumerState<_MapStampCollectionRoute> {
  bool _isSuccessScreenOpen = false;

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(stampSessionProvider);
    final collectedContentIds = Set<String>.unmodifiable(
      session.collectedStamps.map((stamp) => stamp.contentId),
    );

    return MapScreen(
      collectedContentIds: collectedContentIds,
      resolveCollectAvailability: (pin, locationState) =>
          resolveStampCollectAvailability(
            pin: pin,
            locationState: locationState,
            isSessionCollected: collectedContentIds.contains(pin.contentId),
          ),
      onCollectRequested: _requestCollection,
      onCollectSucceeded: _showCollectionSuccess,
    );
  }

  Future<MapCollectResult> _requestCollection(MapPin pin) async {
    final controller = ref.read(stampSessionProvider.notifier);
    final coordinator = StampCollectCoordinator(
      locationRepository: ref.read(locationRepositoryProvider),
      isCollected: controller.isCollected,
      collect: controller.collect,
    );

    try {
      return await coordinator.request(pin);
    } finally {
      if (mounted) {
        ref.invalidate(currentLocationProvider);
      }
    }
  }

  void _showCollectionSuccess(MapPin pin) {
    if (_isSuccessScreenOpen ||
        !shouldPresentStampCollectSuccess(
          isRouteVisible: TickerMode.valuesOf(context).enabled,
          lifecycleState: WidgetsBinding.instance.lifecycleState,
        )) {
      return;
    }

    final stamps = ref.read(stampSessionProvider).collectedStamps;
    final stamp = _stampByContentId(stamps, pin.contentId);
    if (stamp == null) {
      return;
    }

    _isSuccessScreenOpen = true;
    final navigator = Navigator.of(context, rootNavigator: true);
    unawaited(
      navigator
          .push<void>(
            MaterialPageRoute<void>(
              builder: (_) => StampCollectSuccessScreen(
                stamp: stamp,
                collectedCount: stamps.length,
                onViewCollection: () {
                  navigator.pop();
                  if (mounted) {
                    context.go('/stamps');
                  }
                },
                onContinueTravel: () => navigator.pop(),
              ),
            ),
          )
          .whenComplete(() {
            if (mounted) {
              _isSuccessScreenOpen = false;
            }
          }),
    );
  }
}

CollectedStamp? _stampByContentId(
  Iterable<CollectedStamp> stamps,
  String contentId,
) {
  for (final stamp in stamps) {
    if (stamp.contentId == contentId) {
      return stamp;
    }
  }

  return null;
}

class StampyAppShell extends StatelessWidget {
  const StampyAppShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: StampyColors.canvas,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: StampyColors.paper,
        systemNavigationBarIconBrightness: Brightness.dark,
        systemNavigationBarDividerColor: StampyColors.hairline,
      ),
      child: Scaffold(
        body: ColoredBox(color: StampyColors.canvas, child: navigationShell),
        bottomNavigationBar: StampyBottomNavigation(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: (index) {
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          },
        ),
      ),
    );
  }
}
