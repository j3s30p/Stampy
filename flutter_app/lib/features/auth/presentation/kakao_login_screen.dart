import 'package:flutter/material.dart';
import 'package:stampy/app/theme/app_colors.dart';
import 'package:stampy/core/widgets/field_journal.dart';

class KakaoLoginScreen extends StatelessWidget {
  const KakaoLoginScreen({
    required this.onSignIn,
    this.isLoading = false,
    this.errorMessage,
    super.key,
  });

  final Future<void> Function() onSignIn;
  final bool isLoading;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    return FieldJournalPage(
      eyebrow: '여행 기록의 시작',
      title: '발걸음마다\n도장을 남겨요',
      description: '카카오 계정으로 로그인하고, 직접 방문한 여행지를 나만의 도장으로 모아보세요.',
      trailing: const JournalBadge(label: 'LOGIN'),
      children: [
        JournalSection(
          index: '01',
          title: '계정 연결',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (errorMessage case final message?) ...[
                JournalNotice(
                  number: 'AUTH',
                  title: '로그인을 시작하지 못했어요',
                  description: message,
                ),
                const SizedBox(height: 14),
              ],
              FilledButton.icon(
                onPressed: isLoading ? null : onSignIn,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFFEE500),
                  disabledBackgroundColor: const Color(0xFFF2E98D),
                  foregroundColor: const Color(0xFF191919),
                  disabledForegroundColor: StampyColors.mutedInk,
                ),
                icon: isLoading
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.chat_bubble_rounded, size: 19),
                label: Text(isLoading ? '세션 확인 중' : '카카오로 시작하기'),
              ),
              const SizedBox(height: 12),
              Text(
                '처음 로그인하면 회원가입이 함께 완료됩니다.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
