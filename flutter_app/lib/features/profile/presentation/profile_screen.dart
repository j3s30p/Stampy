import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/auth/auth.dart';
import 'package:stampy/core/widgets/field_journal.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(currentAuthUserProvider);
    final presentation = session.when(
      data: _presentationForUser,
      error: (error, _) {
        final isRetryable =
            error is! AuthRepositoryException || error.isRetryable;
        return _ProfileSessionPresentation(
          badge: 'OFFLINE',
          title: '세션 연결 실패',
          description: isRetryable
              ? '연결 상태를 확인한 뒤 다시 시도해 주세요.'
              : 'Supabase 설정을 확인한 뒤 앱을 다시 실행해 주세요.',
          isRetryable: isRetryable,
        );
      },
      loading: () => const _ProfileSessionPresentation(
        badge: 'SESSION',
        title: '세션 준비 중',
        description: '안전한 여행 기록 공간을 준비하고 있습니다.',
      ),
    );

    return FieldJournalPage(
      eyebrow: '마이 페이지',
      title: '나의 탐험 정보를\n관리하세요',
      description: '계정, 위치 권한, 알림과 개인정보 설정을 한곳에서 확인할 수 있습니다.',
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
              if (presentation.isRetryable) ...[
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => ref.invalidate(currentAuthUserProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('다시 시도'),
                ),
              ],
            ],
          ),
        ),
        JournalSection(
          index: '02',
          title: '앱 설정',
          child: Column(
            children: const [
              _SettingsRow(label: '위치 권한', value: '연결 전'),
              _SettingsRow(label: '알림', value: '연결 전'),
              _SettingsRow(label: '개인정보', value: '보기'),
            ],
          ),
        ),
      ],
    );
  }
}

_ProfileSessionPresentation _presentationForUser(AuthUser user) {
  if (user.isGuest) {
    return const _ProfileSessionPresentation(
      badge: 'GUEST',
      title: '개발용 게스트 모드',
      description: 'Supabase 설정 없이 기기 안에서 Stampy를 둘러보고 있습니다.',
    );
  }

  if (user.isAnonymous) {
    return const _ProfileSessionPresentation(
      badge: 'ANONYMOUS',
      title: '익명 세션 연결',
      description: 'Supabase 익명 사용자 ID가 연결됐습니다. 여행 기록 동기화는 준비 중입니다.',
      emphasized: true,
    );
  }

  return const _ProfileSessionPresentation(
    badge: 'MEMBER',
    title: '계정 연결',
    description: '계정 ID가 연결됐습니다. 여행 기록 동기화는 준비 중입니다.',
    emphasized: true,
  );
}

final class _ProfileSessionPresentation {
  const _ProfileSessionPresentation({
    required this.badge,
    required this.title,
    required this.description,
    this.emphasized = false,
    this.isRetryable = false,
  });

  final String badge;
  final String title;
  final String description;
  final bool emphasized;
  final bool isRetryable;
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
          const SizedBox(width: 8),
          const Icon(
            Icons.chevron_right,
            color: StampyColors.mutedInk,
            size: 18,
          ),
        ],
      ),
    );
  }
}
