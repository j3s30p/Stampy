import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/router.dart';
import 'package:stampy/app/theme/app_theme.dart';

class StampyApp extends ConsumerWidget {
  const StampyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Stampy',
      debugShowCheckedModeBanner: false,
      theme: StampyTheme.light(),
      routerConfig: router,
    );
  }
}
