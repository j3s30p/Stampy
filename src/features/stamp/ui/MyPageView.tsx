import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Mascot, Progress, Surface, colors, spacing } from '@shared/ui';

export interface MyStampSummary {
  readonly contentId: string;
  readonly title: string;
  readonly collected: boolean;
  readonly collectedAt?: string;
}

interface MyPageViewProps {
  readonly stamps: readonly MyStampSummary[];
  readonly nickname: string;
  readonly onSelectStamp?: (contentId: string) => void;
}

export function MyPageView({ stamps, nickname, onSelectStamp }: MyPageViewProps) {
  const [selectedSetting, setSelectedSetting] = useState<string>('설정을 눌러 보세요');
  const collectedCount = stamps.filter((stamp) => stamp.collected).length;
  const totalCount = stamps.length;
  const remainingCount = totalCount - collectedCount;
  const expPercent = 62;
  const latestStamp = useMemo(
    () =>
      [...stamps]
        .filter((stamp) => stamp.collected)
        .sort((a, b) => (b.collectedAt ?? '').localeCompare(a.collectedAt ?? ''))[0] ?? null,
    [stamps],
  );
  const currentMonth = '2026.06';

  // Hero entrance
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(8);
  // eslint-disable-next-line react-hooks/immutability -- SharedValue refs for entrance animation
  const heroOpacityRef = useRef(heroOpacity);
  // eslint-disable-next-line react-hooks/immutability -- SharedValue refs for entrance animation
  const heroTranslateYRef = useRef(heroTranslateY);

  const heroAnimStyle = useAnimatedStyle(() => ({
    opacity: heroOpacityRef.current.value,
    transform: [{ translateY: heroTranslateYRef.current.value }],
  }));

  useEffect(() => {
    heroOpacityRef.current.value = withTiming(1, { duration: 350 });
    heroTranslateYRef.current.value = withTiming(0, { duration: 350 });
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="h1">마이페이지</AppText>
            <AppText variant="caption" tone="inkMuted">
              내 여행 기록과 성장 정보
            </AppText>
          </View>
          <View style={styles.avatar}>
            <Mascot size={40} mood="happy" />
          </View>
        </View>

        {/* Hero — typographic, white background, no gradient */}
        <Animated.View style={[styles.hero, heroAnimStyle]}>
          <View style={styles.heroIdentity}>
            <View style={styles.bigAvatar}>
              <AppText variant="h2" tone="onDark">
                {nickname.slice(0, 1)}
              </AppText>
            </View>
            <View style={styles.heroText}>
              <AppText variant="micro" tone="inkMuted">
                스탬피 여행자
              </AppText>
              <AppText variant="h1" tone="ink">
                Lv.3 지역 탐험가
              </AppText>
            </View>
          </View>

          <Progress value={expPercent} tone="reward" />
          <View style={styles.heroFootRow}>
            <AppText variant="caption" tone="inkMuted">
              다음 레벨까지 380 EXP
            </AppText>
            <AppText variant="captionBold" tone="ink">
              620 / 1000
            </AppText>
          </View>
        </Animated.View>

        <View style={styles.sectionHead}>
          <AppText variant="h2">나의 여행 요약</AppText>
          <AppText variant="caption" tone="brand">
            {currentMonth}
          </AppText>
        </View>

        <View style={styles.statsRow}>
          <Surface elevation="e1" radius="md" style={styles.statCard}>
            <AppText variant="h1" style={styles.statValue}>
              {collectedCount}
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              획득 스탬프
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="md" style={styles.statCard}>
            <AppText variant="h1" style={styles.statValue}>
              {totalCount}
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              전체 스팟
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="md" style={styles.statCard}>
            <AppText variant="h1" style={styles.statValue}>
              {remainingCount}
            </AppText>
            <AppText variant="caption" tone="inkMuted">
              남은 스팟
            </AppText>
          </Surface>
        </View>

        <Surface elevation="e1" radius="lg" style={styles.activityCard}>
          <AppText variant="h3">최근 활동</AppText>
          {latestStamp ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${latestStamp.title} 도장 상세 보기`}
              onPress={() => onSelectStamp?.(latestStamp.contentId)}
              style={({ pressed }) => [styles.activityRow, pressed ? styles.pressed : null]}
            >
              <View style={styles.activityStamp}>
                <AppText style={styles.activityStampText}>🏯</AppText>
              </View>
              <View style={styles.activityText}>
                <AppText variant="bodyBold">{latestStamp.title} 스탬프 획득</AppText>
                <AppText variant="caption" tone="inkMuted">
                  {latestStamp.collectedAt
                    ? `오늘 ${formatTime(latestStamp.collectedAt)}`
                    : '방문 기록 없음'}{' '}
                  · +10 EXP
                </AppText>
              </View>
            </Pressable>
          ) : (
            <AppText variant="caption" tone="inkMuted">
              아직 최근 활동이 없습니다.
            </AppText>
          )}
        </Surface>

        <View style={styles.sectionHead}>
          <AppText variant="h2">대표 배지</AppText>
          <AppText variant="caption" tone="brand">
            전체 보기
          </AppText>
        </View>

        <View style={styles.badgeGrid}>
          <Surface elevation="e1" radius="lg" style={styles.badgeCard}>
            <View style={styles.badgeCircle}>
              <AppText style={styles.badgeCircleText}>🏯</AppText>
            </View>
            <AppText variant="bodyBold">궁궐 탐험가</AppText>
            <AppText variant="caption" tone="inkMuted" style={styles.badgeMeta}>
              대표 테마 배지
            </AppText>
          </Surface>

          <Surface elevation="e1" radius="lg" style={styles.badgeCard}>
            <View style={styles.badgeCircle}>
              <AppText style={styles.badgeCircleText}>🎪</AppText>
            </View>
            <AppText variant="bodyBold">행사 참여러</AppText>
            <AppText variant="caption" tone="inkMuted" style={styles.badgeMeta}>
              최근 활동 기준
            </AppText>
          </Surface>
        </View>

        <View style={styles.sectionHead}>
          <AppText variant="h2">도장 보관함</AppText>
          <AppText variant="caption" tone="brand">
            전체 보기
          </AppText>
        </View>

        <View style={styles.collectionList}>
          {stamps.map((stamp) => (
            <Pressable
              key={stamp.contentId}
              accessibilityRole="button"
              accessibilityLabel={`${stamp.title} 상세 보기`}
              onPress={() => onSelectStamp?.(stamp.contentId)}
              style={({ pressed }) => [pressed ? styles.pressed : null]}
            >
              <Surface elevation="e1" radius="md" style={styles.collectionRow}>
                <View
                  style={[
                    styles.collectionIcon,
                    stamp.collected ? styles.collectionIconDone : styles.collectionIconTodo,
                  ]}
                >
                  <AppText
                    variant="h3"
                    style={
                      stamp.collected
                        ? styles.collectionIconTextDone
                        : styles.collectionIconTextTodo
                    }
                  >
                    {stamp.collected ? '✓' : '·'}
                  </AppText>
                </View>
                <View style={styles.collectionText}>
                  <AppText variant="bodyBold">{stamp.title}</AppText>
                  <AppText variant="caption" tone="inkMuted">
                    {stamp.collected
                      ? `수집 완료 · ${formatCollectedAt(stamp.collectedAt)}`
                      : '아직 방문 전'}
                  </AppText>
                </View>
              </Surface>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <AppText variant="h2">설정</AppText>
        </View>

        <View style={styles.settingsList}>
          {settingsRows.map((row) => (
            <Pressable
              key={row.label}
              accessibilityRole="button"
              accessibilityLabel={row.label}
              onPress={() => setSelectedSetting(row.feedback)}
              style={({ pressed }) => [pressed ? styles.pressed : null]}
            >
              <Surface elevation="e1" radius="md" style={styles.settingRow}>
                <AppText variant="bodyBold">{row.label}</AppText>
                <AppText variant="h2" tone="inkMuted">
                  ›
                </AppText>
              </Surface>
            </Pressable>
          ))}
        </View>

        <Surface elevation="none" radius="md" style={styles.feedbackCard}>
          <AppText variant="caption" tone="inkMuted">
            선택 상태
          </AppText>
          <AppText variant="bodyBold">{selectedSetting}</AppText>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const formatTime = (value?: string) => {
  if (!value) {
    return '날짜 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatCollectedAt = (value?: string) => {
  if (!value) {
    return '날짜 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
};

const settingsRows = [
  { label: '위치 권한 관리', feedback: '위치 권한 관리가 선택되었습니다.' },
  { label: '알림 설정', feedback: '알림 설정이 선택되었습니다.' },
  { label: '계정 정보', feedback: '계정 정보가 선택되었습니다.' },
] as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandBlock: { flex: 1, minWidth: 0, gap: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingVertical: spacing.xl,
    gap: spacing.sm + 2,
  },
  heroIdentity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, minWidth: 0, gap: spacing.xs },
  heroFootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm + 2 },
  statCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  statValue: { fontSize: 24 },
  activityCard: {
    padding: spacing.lg,
    gap: spacing.sm + 2,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  activityStamp: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.rewardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityStampText: { fontSize: 20 },
  activityText: { flex: 1, minWidth: 0, gap: 2 },
  badgeGrid: { flexDirection: 'row', gap: spacing.sm + 2 },
  badgeCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    gap: spacing.sm - 2,
  },
  badgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircleText: { fontSize: 22 },
  badgeMeta: { textAlign: 'center' },
  collectionList: { gap: spacing.sm + 2 },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  collectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionIconDone: { backgroundColor: colors.ink },
  collectionIconTodo: { backgroundColor: colors.surfaceSink },
  collectionIconTextDone: { color: colors.surface },
  collectionIconTextTodo: { color: colors.inkSoft },
  collectionText: { flex: 1, minWidth: 0, gap: 3 },
  settingsList: { gap: spacing.sm },
  settingRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedbackCard: {
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surfaceSink,
  },
  pressed: { opacity: 0.85 },
});
