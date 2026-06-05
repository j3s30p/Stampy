import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Gradient, Surface, colors, radius, spacing } from '@shared/ui';

export interface RankingEntry {
  readonly id: string;
  readonly nickname: string;
  readonly stampCount: number;
  readonly isMe?: boolean;
}

interface RankingViewProps {
  readonly entries: readonly RankingEntry[];
}

type RankingTab = 'weekly' | 'region' | 'friends';

export function RankingView({ entries }: RankingViewProps) {
  const [selectedTab, setSelectedTab] = useState<RankingTab>('weekly');
  const tabRows = useMemo(() => buildRows(selectedTab, entries), [entries, selectedTab]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(tabRows[0]?.id ?? null);

  const resolvedSelectedEntryId = tabRows.some((entry) => entry.id === selectedEntryId)
    ? selectedEntryId
    : (tabRows.find((entry) => entry.isMe)?.id ?? tabRows[0]?.id ?? null);

  const selectedEntry =
    tabRows.find((entry) => entry.id === resolvedSelectedEntryId) ??
    tabRows.find((entry) => entry.isMe) ??
    tabRows[0] ??
    null;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <AppText variant="h1">{getTabLabel(selectedTab)}</AppText>
            <AppText variant="caption" tone="inkSoft">
              {getTabCaption(selectedTab)}
            </AppText>
          </View>
          <View style={styles.avatar}>
            <AppText variant="h3" tone="onDark">
              스
            </AppText>
          </View>
        </View>

        <Gradient variant="coral" style={styles.hero}>
          <AppText variant="caption" tone="onDark" style={styles.heroLabel}>
            내 현재 순위
          </AppText>
          <AppText variant="h1" tone="onDark" style={styles.heroTitle}>
            {getHeroTitle(selectedTab)}
          </AppText>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <AppText variant="micro" tone="onDark">
                12 stamps
              </AppText>
            </View>
            <View style={styles.heroBadge}>
              <AppText variant="micro" tone="onDark">
                620 EXP
              </AppText>
            </View>
          </View>
        </Gradient>

        <View style={styles.tabs}>
          {rankingTabs.map((tab) => {
            const isActive = tab.key === selectedTab;

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityLabel={`${tab.label} 랭킹 보기`}
                accessibilityState={{ selected: isActive }}
                onPress={() => setSelectedTab(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  isActive ? styles.tabActive : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppText
                  variant="caption"
                  style={isActive ? styles.tabTextActive : styles.tabTextInactive}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {selectedEntry ? (
          <View style={styles.selectedPanel}>
            <AppText variant="micro" style={styles.selectedLabel}>
              선택한 참여자
            </AppText>
            <AppText variant="h1" tone="onDark">
              {selectedEntry.nickname}
            </AppText>
            <AppText variant="body" tone="onDark" style={styles.selectedMeta}>
              현재 수집 도장 {selectedEntry.stampCount}개
            </AppText>
          </View>
        ) : null}

        <View style={styles.rows}>
          {tabRows.map((entry, index) => (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={`${entry.nickname} 랭킹 선택`}
              accessibilityState={{ selected: entry.id === selectedEntry?.id }}
              onPress={() => setSelectedEntryId(entry.id)}
              style={({ pressed }) => [
                styles.row,
                entry.isMe ? styles.meRow : null,
                entry.id === selectedEntry?.id ? styles.rowSelected : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={[styles.rankBox, index === 0 ? styles.rankBoxTop : null]}>
                <AppText
                  variant="caption"
                  style={[styles.rank, index === 0 ? styles.rankTop : null]}
                >
                  {index + 1}
                </AppText>
              </View>
              <View style={styles.member}>
                <AppText variant="h3">{entry.nickname}</AppText>
                <AppText variant="caption" tone="inkSoft">
                  {getRowMeta(selectedTab, entry)}
                </AppText>
              </View>
              <AppText variant="caption" tone="brand" style={styles.score}>
                {getScoreLabel(index, selectedTab)}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Surface elevation="e1" radius="lg" style={styles.missionCard}>
          <AppText variant="h3">오늘의 미션</AppText>
          <AppText variant="body" tone="inkSoft">
            {getMissionText(selectedTab)}
          </AppText>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const rankingTabs: readonly { readonly key: RankingTab; readonly label: string }[] = [
  { key: 'weekly', label: '주간' },
  { key: 'region', label: '지역' },
  { key: 'friends', label: '친구' },
];

const buildRows = (tab: RankingTab, entries: readonly RankingEntry[]) => {
  const meEntry =
    entries.find((entry) => entry.isMe) ??
    ({ id: 'mock-user-1', nickname: '스탬피 테스터', stampCount: 12, isMe: true } as RankingEntry);

  if (tab === 'region') {
    return [
      { id: 'region-1', nickname: '종로궁궐러', stampCount: 18 },
      { id: 'region-2', nickname: '서울산책러', stampCount: 16 },
      { id: 'region-3', nickname: '행사수집가', stampCount: 15 },
      {
        ...meEntry,
        id: 'mock-user-1',
        nickname: meEntry.nickname,
        stampCount: Math.max(meEntry.stampCount, 12),
        isMe: true,
      },
    ] as RankingEntry[];
  }

  if (tab === 'friends') {
    return [
      { id: 'friend-1', nickname: '한강러너', stampCount: 14 },
      {
        ...meEntry,
        id: 'mock-user-1',
        nickname: meEntry.nickname,
        stampCount: Math.max(meEntry.stampCount, 12),
        isMe: true,
      },
      { id: 'friend-2', nickname: '궁궐수집가', stampCount: 11 },
      { id: 'friend-3', nickname: '골목여행자', stampCount: 9 },
    ] as RankingEntry[];
  }

  return [
    { id: 'weekly-1', nickname: '스탬프마스터', stampCount: 28 },
    { id: 'weekly-2', nickname: '축제러버', stampCount: 24 },
    { id: 'weekly-3', nickname: '궁궐탐험가', stampCount: 20 },
    { id: 'weekly-4', nickname: '도심휴식러', stampCount: 18 },
    { id: 'weekly-5', nickname: '골목수집가', stampCount: 16 },
    { id: 'weekly-6', nickname: '사진여행자', stampCount: 14 },
    { id: 'weekly-7', nickname: '행사탐방러', stampCount: 13 },
    {
      ...meEntry,
      id: 'mock-user-1',
      nickname: meEntry.nickname,
      stampCount: Math.max(meEntry.stampCount, 12),
      isMe: true,
    },
  ] as RankingEntry[];
};

const getTabLabel = (tab: RankingTab) => {
  if (tab === 'region') {
    return '지역 랭킹';
  }

  if (tab === 'friends') {
    return '친구 랭킹';
  }

  return '주간 랭킹';
};

const getTabCaption = (tab: RankingTab) => {
  if (tab === 'region') {
    return '이번 지역에서 가장 많이 찍은 참여자';
  }

  if (tab === 'friends') {
    return '친구들과 비교하는 스탬프 경쟁';
  }

  return '이번 주 가장 많이 걸은 여행자';
};

const getHeroTitle = (tab: RankingTab) => {
  if (tab === 'region') {
    return '종로권 4위\n오늘은 지역 랭킹 2칸 상승';
  }

  if (tab === 'friends') {
    return '친구 중 2위\n한 명만 더 찍으면 1위';
  }

  return `이번 주 8위\n스탬프 2개만 더 찍으면 TOP 5`;
};

const getRowMeta = (tab: RankingTab, entry: RankingEntry) => {
  if (tab === 'region') {
    return `종로 루트 · 스탬프 ${entry.stampCount}개`;
  }

  if (tab === 'friends') {
    return `${entry.isMe ? '나의 현재 순위' : '친구 비교'} · ${entry.stampCount}개`;
  }

  return `${entry.stampCount} stamps · ${entry.stampCount * 50 + 20} EXP`;
};

const getScoreLabel = (index: number, tab: RankingTab) => {
  if (tab === 'friends' && index === 0) {
    return '1위';
  }

  if (index === 0) {
    return '🏆';
  }

  return `${index + 1}위`;
};

const getMissionText = (tab: RankingTab) => {
  if (tab === 'region') {
    return '같은 지역 스팟 1곳에서 도장을 받으면 지역 랭킹 점수 +20점을 받을 수 있어요.';
  }

  if (tab === 'friends') {
    return '친구보다 먼저 도장 탭에서 스탬프를 찍으면 친구 랭킹 순위가 바뀝니다.';
  }

  return '가운데 도장 탭에서 관광지 스탬프 1개를 획득하면 주간 랭킹 점수 +20점을 받을 수 있어요.';
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceAlt },
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
    backgroundColor: colors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    gap: spacing.sm + 2,
  },
  heroLabel: { opacity: 0.9 },
  heroTitle: {},
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2 },
  heroBadge: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: spacing.xs + 1,
  },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  tabTextInactive: { color: colors.inkSoft },
  tabTextActive: { color: colors.surface },
  pressed: { opacity: 0.85 },
  selectedPanel: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  selectedLabel: { color: colors.onDarkMuted, letterSpacing: 0.4 },
  selectedMeta: { opacity: 0.85 },
  rows: { gap: spacing.sm + 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  meRow: { borderColor: colors.brand, backgroundColor: colors.successSoft },
  rowSelected: { borderColor: colors.gold },
  rankBox: {
    width: 36,
    height: 36,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceSink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBoxTop: { backgroundColor: colors.gold },
  rank: { color: colors.ink },
  rankTop: { color: colors.surface },
  member: { flex: 1, minWidth: 0, gap: 3 },
  score: { fontWeight: '900' },
  missionCard: {
    padding: spacing.lg,
    gap: spacing.sm - 2,
  },
});
