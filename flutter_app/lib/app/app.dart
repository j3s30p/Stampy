import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/router.dart';
import 'package:stampy/app/theme/app_theme.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/widgets/field_journal.dart';

class StampyApp extends ConsumerWidget {
  const StampyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authUser = ref.watch(currentAuthUserProvider);
    if (authUser case AsyncError(
      :final error,
    ) when error is AuthRepositoryException && !error.isRetryable) {
      return const StampyBootstrapFailureApp();
    }

    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Stampy',
      debugShowCheckedModeBanner: false,
      theme: StampyTheme.light(),
      routerConfig: router,
    );
  }
}

class StampyBootstrapFailureApp extends StatelessWidget {
  const StampyBootstrapFailureApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Stampy',
    debugShowCheckedModeBanner: false,
    theme: StampyTheme.light(),
    home: const Scaffold(
      body: FieldJournalPage(
        eyebrow: '서비스 연결',
        title: '앱을 시작하지\n못했어요',
        description: '필수 서비스 연결 설정을 확인한 뒤 앱을 다시 실행해 주세요.',
        trailing: JournalBadge(label: '연결 필요'),
        children: [
          JournalSection(
            index: '01',
            title: '시작 안내',
            child: JournalNotice(
              number: 'START',
              title: '필수 연결을 준비하지 못했어요',
              description: '문제가 계속되면 앱 관리자에게 문의해 주세요.',
            ),
          ),
        ],
      ),
    ),
  );
}
