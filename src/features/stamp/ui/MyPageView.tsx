import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Badge, Gauge, Mascot, Surface, colors, radius, spacing } from '@shared/ui';

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

  useFocusEffect(
    useCallback(() => {
      heroOpacityRef.current.value = 0;
      heroTranslateYRef.current.value = 8;
      heroOpacityRef.current.value = withTiming(1, { duration: 320 });
      heroTranslateYRef.current.value = withTiming(0, { duration: 320 });
    }, []),
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="micro" tone="brand" numberOfLines={1}>
              MY
            </AppText>
            <AppText variant="h1" tone="ink" numberOfLines={1}>
              도장 보관함
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
              내 여행 기록과 성장 정보를 한 번에 확인합니다.
            </AppText>
          </View>
          <View style={styles.avatar}>
            <Mascot size={42} mood="happy" />
          </View>
        </View>

        <Animated.View style={heroAnimStyle}>
          <Surface elevation="e1" radius="lg" style={styles.hero}>
            <View style={styles.heroIdentity}>
              <View style={styles.bigAvatar}>
                <AppText variant="h2" tone="onDark" numberOfLines={1}>
                  {nickname.slice(0, 1)}
                </AppText>
              </View>
              <View style={styles.heroText}>
                <Badge tone="brand" size="sm">
                  스탬피 여행자
                </Badge>
                <AppText variant="h2" tone="ink" numberOfLines={1}>
                  {nickname}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
                  LV.3 지역 탐험가 · 이번 달 도장 {collectedCount}개
                </AppText>
              </View>
            </View>

            <Gauge value={expPercent} tone="reward" />

            <View style={styles.heroFootRow}>
              <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                다음 레벨까지 380 EXP
              </AppText>
              <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                620 / 1000
              </AppText>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <AppText variant="title" tone="ink" numberOfLines={1}>
                  {collectedCount}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  획득 스탬프
                </AppText>
              </View>
              <View style={styles.heroStat}>
                <AppText variant="title" tone="ink" numberOfLines={1}>
                  {totalCount}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  전체 스팟
                </AppText>
              </View>
              <View style={styles.heroStat}>
                <AppText variant="title" tone="ink" numberOfLines={1}>
                  {remainingCount}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  남은 스팟
                </AppText>
              </View>
            </View>
          </Surface>
        </Animated.View>

        <View style={styles.sectionHead}>
          <AppText variant="h2" tone="ink" numberOfLines={1}>
            나의 여행 요약
          </AppText>
          <Badge tone="neutral" size="sm">
            {currentMonth}
          </Badge>
        </View>

        <View style={styles.statsRow}>
          <Surface elevation="e1" radius="lg" style={styles.statCard}>
            <AppText variant="h1" tone="ink" numberOfLines={1}>
              {collectedCount}
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
              획득 스탬프
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="lg" style={styles.statCard}>
            <AppText variant="h1" tone="ink" numberOfLines={1}>
              {totalCount}
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
              전체 스팟
            </AppText>
          </Surface>
          <Surface elevation="e1" radius="lg" style={styles.statCard}>
            <AppText variant="h1" tone="ink" numberOfLines={1}>
              {remainingCount}
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
              남은 스팟
            </AppText>
          </Surface>
        </View>

        <Surface elevation="e1" radius="lg" style={styles.activityCard}>
          <View style={styles.sectionHead}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              최근 활동
            </AppText>
            <Badge tone="neutral" size="sm">
              최신 1건
            </Badge>
          </View>

          {latestStamp ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${latestStamp.title} 도장 상세 보기`}
              onPress={() => onSelectStamp?.(latestStamp.contentId)}
              style={({ pressed }) => [styles.activityRow, pressed ? styles.pressed : null]}
            >
              <View style={styles.activityStamp}>
                <AppText variant="captionBold" tone="onDark" numberOfLines={1}>
                  01
                </AppText>
              </View>
              <View style={styles.activityText}>
                <AppText variant="bodyBold" tone="ink" numberOfLines={1}>
                  {latestStamp.title} 스탬프 획득
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
                  {latestStamp.collectedAt
                    ? `오늘 ${formatTime(latestStamp.collectedAt)} · +10 EXP`
                    : '방문 기록 없음'}
                </AppText>
              </View>
            </Pressable>
          ) : (
            <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
              아직 최근 활동이 없습니다.
            </AppText>
          )}
        </Surface>

        <View style={styles.sectionHead}>
          <AppText variant="h2" tone="ink" numberOfLines={1}>
            대표 배지
          </AppText>
          <Badge tone="neutral" size="sm">
            2개
          </Badge>
        </View>

        <View style={styles.badgeGrid}>
          <Surface elevation="e1" radius="lg" style={styles.badgeCard}>
            <View style={styles.badgeCircle}>
              <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                01
              </AppText>
            </View>
            <AppText variant="bodyBold" tone="ink" numberOfLines={1}>
              궁궐 탐험가
            </AppText>
            <AppText variant="caption" tone="inkMuted" style={styles.badgeMeta} numberOfLines={2}>
              대표 테마 배지
            </AppText>
          </Surface>

          <Surface elevation="e1" radius="lg" style={styles.badgeCard}>
            <View style={styles.badgeCircle}>
              <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                02
              </AppText>
            </View>
            <AppText variant="bodyBold" tone="ink" numberOfLines={1}>
              행사 참여러
            </AppText>
            <AppText variant="caption" tone="inkMuted" style={styles.badgeMeta} numberOfLines={2}>
              최근 활동 기준
            </AppText>
          </Surface>
        </View>

        <View style={styles.sectionHead}>
          <AppText variant="h2" tone="ink" numberOfLines={1}>
            도장 보관함
          </AppText>
          <Badge tone="brand" size="sm">
            전체 보기
          </Badge>
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
              <Surface elevation="e1" radius="lg" style={styles.collectionRow}>
                <View
                  style={[
                    styles.collectionIcon,
                    stamp.collected ? styles.collectionIconDone : styles.collectionIconTodo,
                  ]}
                >
                  <AppText
                    variant="captionBold"
                    style={
                      stamp.collected
                        ? styles.collectionIconTextDone
                        : styles.collectionIconTextTodo
                    }
                    numberOfLines={1}
                  >
                    {stamp.collected ? '✓' : '·'}
                  </AppText>
                </View>
                <View style={styles.collectionText}>
                  <AppText variant="bodyBold" tone="ink" numberOfLines={1}>
                    {stamp.title}
                  </AppText>
                  <View style={styles.collectionMetaRow}>
                    <Badge tone={stamp.collected ? 'done' : 'neutral'} size="sm">
                      {stamp.collected ? '수집 완료' : '아직 방문 전'}
                    </Badge>
                    <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                      {stamp.collected
                        ? `수집 완료 · ${formatCollectedAt(stamp.collectedAt)}`
                        : '위치 확인 중'}
                    </AppText>
                  </View>
                </View>
              </Surface>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <AppText variant="h2" tone="ink" numberOfLines={1}>
            설정
          </AppText>
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
              <Surface elevation="e1" radius="lg" style={styles.settingRow}>
                <AppText variant="bodyBold" tone="ink" numberOfLines={1}>
                  {row.label}
                </AppText>
                <AppText variant="h2" tone="inkMuted" numberOfLines={1}>
                  ›
                </AppText>
              </Surface>
            </Pressable>
          ))}
        </View>

        <Surface elevation="none" radius="md" style={styles.feedbackCard}>
          <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
            선택 상태
          </AppText>
          <AppText variant="bodyBold" tone="ink" numberOfLines={2}>
            {selectedSetting}
          </AppText>
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
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  heroFootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroStat: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSink,
    gap: 2,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  activityCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityStamp: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.rewardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  badgeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badgeCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMeta: {
    textAlign: 'center',
  },
  collectionList: {
    gap: spacing.sm,
  },
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
  collectionIconDone: {
    backgroundColor: colors.ink,
  },
  collectionIconTodo: {
    backgroundColor: colors.surfaceSink,
  },
  collectionIconTextDone: {
    color: colors.surface,
  },
  collectionIconTextTodo: {
    color: colors.inkSoft,
  },
  collectionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  collectionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  settingsList: {
    gap: spacing.sm,
  },
  settingRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  feedbackCard: {
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surfaceSink,
  },
  pressed: {
    opacity: 0.85,
  },
});
