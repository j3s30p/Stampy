import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/location/location.dart';
import 'package:stampy/core/widgets/field_journal.dart';
import 'package:stampy/features/stamp/presentation/stamp_session.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(currentAuthUserProvider);
    final location = ref.watch(currentLocationProvider);
    final stampSession = ref.watch(stampSessionProvider);
    final presentation = session.when(
      data: (user) => _presentationForUser(user, stampSession),
      error: (error, _) {
        final isRetryable =
            error is! AuthRepositoryException || error.isRetryable;
        return _ProfileSessionPresentation(
          badge: 'OFFLINE',
          title: '세션 연결 실패',
          description: isRetryable
              ? '연결 상태를 확인한 뒤 다시 시도해 주세요.'
              : 'Supabase 설정을 확인한 뒤 앱을 다시 실행해 주세요.',
          retryTarget: isRetryable ? _ProfileRetryTarget.auth : null,
        );
      },
      loading: () => const _ProfileSessionPresentation(
        badge: 'SESSION',
        title: '세션 준비 중',
        description: '안전한 여행 기록 공간을 준비하고 있습니다.',
      ),
    );
    final retryTarget = presentation.retryTarget;
    final canSignOut = switch (session) {
      AsyncData(:final value) => !value.isSignedOut,
      _ => false,
    };

    return FieldJournalPage(
      eyebrow: '마이 페이지',
      title: '나의 탐험 정보를\n확인하세요',
      description: '계정과 위치 권한 등 현재 앱 상태를 한곳에서 확인할 수 있습니다.',
      trailing: JournalBadge(
        label: presentation.badge,
        emphasized: presentation.emphasized,
      ),
      children: [
        JournalSection(
          index: '01',
          title: '프로필',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              JournalNotice(
                number: 'ID',
                title: presentation.title,
                description: presentation.description,
              ),
              if (retryTarget != null) ...[
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () async {
                    switch (retryTarget) {
                      case _ProfileRetryTarget.auth:
                        ref.invalidate(currentAuthUserProvider);
                      case _ProfileRetryTarget.stamps:
                        await ref
                            .read(stampSessionProvider.notifier)
                            .retryLoad();
                    }
                  },
                  icon: const Icon(Icons.refresh),
                  label: Text(switch (retryTarget) {
                    _ProfileRetryTarget.auth => '다시 시도',
                    _ProfileRetryTarget.stamps => '여행 기록 다시 불러오기',
                  }),
                ),
              ],
            ],
          ),
        ),
        JournalSection(
          index: '02',
          title: '앱 상태',
          child: Column(
            children: [
              _SettingsRow(
                label: '위치 권한',
                value: _locationSettingValue(location),
              ),
              const _SettingsRow(label: '알림', value: '연결 전'),
              const _SettingsRow(label: '개인정보', value: '준비 중'),
            ],
          ),
        ),
        if (canSignOut)
          JournalSection(
            index: '03',
            title: '계정',
            child: OutlinedButton.icon(
              onPressed: () => _signOut(context, ref),
              icon: const Icon(Icons.logout),
              label: const Text('로그아웃'),
            ),
          ),
      ],
    );
  }
}

Future<void> _signOut(BuildContext context, WidgetRef ref) async {
  try {
    await ref.read(currentAuthUserProvider.notifier).signOut();
  } on Object {
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('로그아웃하지 못했어요. 다시 시도해 주세요.')));
  }
}

String _locationSettingValue(AsyncValue<LocationState> location) =>
    location.when(
      skipLoadingOnRefresh: false,
      skipLoadingOnReload: false,
      data: (state) => switch (state.status) {
        LocationStatus.loading => '확인 중',
        LocationStatus.available => '연결됨',
        LocationStatus.serviceDisabled => '서비스 꺼짐',
        LocationStatus.permissionDenied => '권한 필요',
        LocationStatus.permissionDeniedForever => '설정 필요',
        LocationStatus.unavailable => '확인 불가',
      },
      error: (error, stackTrace) => '확인 불가',
      loading: () => '확인 중',
    );

_ProfileSessionPresentation _presentationForUser(
  AuthUser user,
  StampSessionState stampSession,
) {
  if (user.isSignedOut) {
    return const _ProfileSessionPresentation(
      badge: 'SIGNED OUT',
      title: '로그인이 필요해요',
      description: '카카오 로그인 후 여행 기록을 확인할 수 있습니다.',
    );
  }

  final description = switch (stampSession.loadStatus) {
    StampSessionLoadStatus.loading => '여행 기록을 동기화하고 있습니다.',
    StampSessionLoadStatus.loaded =>
      '여행 기록이 연결됐습니다. 수집한 도장 ${stampSession.collectedStamps.length}개를 불러왔습니다.',
    StampSessionLoadStatus.failed =>
      '여행 기록 동기화에 실패했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.',
  };
  final retryTarget = stampSession.loadStatus == StampSessionLoadStatus.failed
      ? _ProfileRetryTarget.stamps
      : null;

  if (user.isAnonymous) {
    return _ProfileSessionPresentation(
      badge: 'ANONYMOUS',
      title: '익명 세션 연결',
      description: description,
      emphasized: stampSession.loadStatus == StampSessionLoadStatus.loaded,
      retryTarget: retryTarget,
    );
  }

  return _ProfileSessionPresentation(
    badge: 'MEMBER',
    title: '계정 연결',
    description: description,
    emphasized: stampSession.loadStatus == StampSessionLoadStatus.loaded,
    retryTarget: retryTarget,
  );
}

enum _ProfileRetryTarget { auth, stamps }

final class _ProfileSessionPresentation {
  const _ProfileSessionPresentation({
    required this.badge,
    required this.title,
    required this.description,
    this.emphasized = false,
    this.retryTarget,
  });

  final String badge;
  final String title;
  final String description;
  final bool emphasized;
  final _ProfileRetryTarget? retryTarget;
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 58),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: StampyColors.hairline)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
          ),
          Text(value, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
