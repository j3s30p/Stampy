import 'package:flutter/material.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/widgets/field_journal.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return FieldJournalPage(
      eyebrow: '마이 페이지',
      title: '나의 탐험 정보를\n관리하세요',
      description: '계정, 위치 권한, 알림과 개인정보 설정을 한곳에서 확인할 수 있습니다.',
      trailing: const JournalBadge(label: 'GUEST'),
      children: [
        const JournalSection(
          index: '01',
          title: '프로필',
          child: JournalNotice(
            number: 'ID',
            title: '여행 기록을 보관하려면\n로그인이 필요해요',
            description: 'Supabase 계정 연결이 준비되면 수집한 도장과 선호 기록을 안전하게 동기화합니다.',
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
