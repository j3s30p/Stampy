import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            <Text style={styles.brand}>{getTabLabel(selectedTab)}</Text>
            <Text style={styles.brandCaption}>{getTabCaption(selectedTab)}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>★</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>내 현재 순위</Text>
          <Text style={styles.heroTitle}>{getHeroTitle(selectedTab)}</Text>
          <View style={styles.heroBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>12 stamps</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>620 EXP</Text>
            </View>
          </View>
        </View>

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
                <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedEntry ? (
          <View style={styles.selectedPanel}>
            <Text style={styles.selectedLabel}>선택한 참여자</Text>
            <Text style={styles.selectedTitle}>{selectedEntry.nickname}</Text>
            <Text style={styles.selectedMeta}>현재 수집 도장 {selectedEntry.stampCount}개</Text>
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
                <Text style={styles.rank}>{index + 1}</Text>
              </View>
              <View style={styles.member}>
                <Text style={styles.nickname}>{entry.nickname}</Text>
                <Text style={styles.meta}>{getRowMeta(selectedTab, entry)}</Text>
              </View>
              <Text style={styles.score}>{getScoreLabel(index, selectedTab)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>오늘의 미션</Text>
          <Text style={styles.missionBody}>{getMissionText(selectedTab)}</Text>
        </View>
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
  root: { flex: 1, backgroundColor: '#EEF3F8' },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28, gap: 14 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandBlock: { flex: 1, minWidth: 0, gap: 2 },
  brand: { color: '#172033', fontSize: 26, fontWeight: '900', letterSpacing: -0.6 },
  brandCaption: { color: '#657084', fontSize: 13 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#173C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  hero: {
    borderRadius: 24,
    backgroundColor: '#D97706',
    padding: 18,
    gap: 10,
  },
  heroLabel: { color: '#FFF8DF', fontSize: 13, fontWeight: '800' },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
  tabActive: {
    backgroundColor: '#173C35',
    borderColor: '#173C35',
  },
  tabText: { color: '#657084', fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: '#FFFFFF' },
  pressed: { opacity: 0.82 },
  selectedPanel: {
    backgroundColor: '#172033',
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  selectedLabel: { color: '#C9B8EA', fontSize: 12, fontWeight: '800' },
  selectedTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  selectedMeta: { color: '#E7DDF7', fontSize: 14, lineHeight: 20 },
  rows: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
  meRow: { borderColor: '#14806F', backgroundColor: '#F0FDF9' },
  rowSelected: { borderColor: '#C4972E' },
  rankBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBoxTop: { backgroundColor: '#FFF8DC' },
  rank: { color: '#334155', fontSize: 14, fontWeight: '900' },
  member: { flex: 1, minWidth: 0, gap: 3 },
  nickname: { color: '#172033', fontSize: 16, fontWeight: '900' },
  meta: { color: '#657084', fontSize: 12, lineHeight: 18 },
  score: { color: '#14806F', fontSize: 13, fontWeight: '900' },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 6,
  },
  missionTitle: { color: '#172033', fontSize: 16, fontWeight: '900' },
  missionBody: { color: '#657084', fontSize: 13, lineHeight: 20 },
});
