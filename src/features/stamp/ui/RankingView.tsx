import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Surface, colors, radius, spacing } from '@shared/ui';

export interface RankingEntry {
  readonly id: string;
  readonly nickname: string;
  readonly stampCount: number;
  readonly isMe?: boolean;
}

interface RankingViewProps {
  readonly entries: readonly RankingEntry[];
}

export function RankingView({ entries }: RankingViewProps) {
  const [activeRange, setActiveRange] = useState<RankingRange>('week');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const rows = useMemo(() => buildLeaderboard(entries), [entries]);
  const podium = rows.slice(0, 3);
  const restRows = rows.slice(3, 7);
  const meRow = rows.find((entry) => entry.isMe) ?? rows[rows.length - 1] ?? null;
  const selectedEntry = rows.find((entry) => entry.id === selectedEntryId) ?? rows[0] ?? null;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="h1" tone="ink" numberOfLines={1}>
            랭킹
          </AppText>
          <View style={styles.segment}>
            {rankingRanges.map((range) => (
              <Pressable
                key={range.key}
                accessibilityRole="button"
                accessibilityLabel={`${range.label} 랭킹 보기`}
                accessibilityState={{ selected: activeRange === range.key }}
                onPress={() => setActiveRange(range.key)}
                style={({ pressed }) => [
                  styles.segmentItem,
                  activeRange === range.key ? styles.segmentActive : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppText
                  variant="captionBold"
                  tone={activeRange === range.key ? 'ink' : 'inkMuted'}
                  numberOfLines={1}
                >
                  {range.label}
                </AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
            {rankingRanges.find((range) => range.key === activeRange)?.subtitle ?? ''}
          </AppText>
        </View>

        <View style={styles.podiumRow}>
          <PodiumCard
            entry={podium[1]}
            rank={2}
            selected={selectedEntry?.id === podium[1]?.id}
            onPress={() => {
              if (podium[1]) {
                setSelectedEntryId(podium[1].id);
              }
            }}
            tone="blue"
          />
          <PodiumCard
            entry={podium[0]}
            rank={1}
            selected={selectedEntry?.id === podium[0]?.id}
            onPress={() => {
              if (podium[0]) {
                setSelectedEntryId(podium[0].id);
              }
            }}
            tone="orange"
            featured
          />
          <PodiumCard
            entry={podium[2]}
            rank={3}
            selected={selectedEntry?.id === podium[2]?.id}
            onPress={() => {
              if (podium[2]) {
                setSelectedEntryId(podium[2].id);
              }
            }}
            tone="green"
          />
        </View>

        <View style={styles.list}>
          {restRows.map((entry, index) => (
            <RankingRow
              key={entry.id}
              entry={entry}
              rank={index + 4}
              selected={selectedEntry?.id === entry.id}
              onPress={() => setSelectedEntryId(entry.id)}
            />
          ))}
        </View>

        {selectedEntry ? (
          <Surface elevation="none" radius="md" style={styles.selectionCard}>
            <View style={styles.selectionCardRow}>
              <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                선택됨
              </AppText>
              <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                {rangeLabel(activeRange)}
              </AppText>
            </View>
            <AppText variant="bodyBold" tone="ink" numberOfLines={1}>
              {selectedEntry.nickname}
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
              도장 {selectedEntry.stampCount}개 · {getRank(rows, selectedEntry)}
            </AppText>
          </Surface>
        ) : null}

        {meRow ? (
          <View style={styles.myRankRow}>
            <AppText variant="captionBold" tone="onDark" style={styles.rankCell} numberOfLines={1}>
              {getRank(rows, meRow)}
            </AppText>
            <Avatar label={meRow.nickname} tone="orangeDark" size={36} />
            <View style={styles.myRankText}>
              <AppText variant="captionBold" tone="onDark" numberOfLines={1}>
                {meRow.nickname} · 나
              </AppText>
              <AppText variant="micro" style={styles.myRankHint} numberOfLines={1}>
                5위까지 도장 {Math.max(0, meRow.stampCount - 4)}개
              </AppText>
            </View>
            <AppText variant="captionBold" tone="onDark" numberOfLines={1}>
              도장 {meRow.stampCount}개
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PodiumCard({
  entry,
  featured = false,
  onPress,
  rank,
  selected = false,
  tone,
}: {
  readonly entry: RankingEntry | undefined;
  readonly featured?: boolean;
  readonly onPress: () => void;
  readonly rank: number;
  readonly selected?: boolean;
  readonly tone: AvatarTone;
}) {
  const resolved = entry ?? { id: `empty-${rank}`, nickname: '대기 중', stampCount: 0 };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${resolved.nickname} ${rank}위 랭킹`}
      accessibilityState={{ selected }}
      disabled={!entry}
      onPress={onPress}
      style={({ pressed }) => [
        styles.podiumPressable,
        pressed && entry ? styles.pressed : null,
        !entry ? styles.disabled : null,
      ]}
    >
      <Surface
        elevation="none"
        radius="md"
        style={[
          styles.podiumCard,
          featured ? styles.podiumFeatured : null,
          selected ? styles.podiumSelected : null,
        ]}
      >
        {featured ? <Ionicons name="trophy" size={18} color={colors.brand} /> : null}
        <Avatar label={resolved.nickname} tone={tone} size={featured ? 56 : 48} />
        <AppText
          variant={featured ? 'captionBold' : 'caption'}
          tone="ink"
          numberOfLines={1}
          style={styles.centerText}
        >
          {resolved.nickname}
        </AppText>
        <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
          도장 {resolved.stampCount}개
        </AppText>
        <View style={[styles.rankPill, featured ? styles.rankPillFeatured : null]}>
          <AppText variant="captionBold" tone={featured ? 'onDark' : 'inkSoft'} numberOfLines={1}>
            {rank}위
          </AppText>
        </View>
      </Surface>
    </Pressable>
  );
}

function RankingRow({
  entry,
  onPress,
  rank,
  selected = false,
}: {
  readonly entry: RankingEntry;
  readonly onPress: () => void;
  readonly rank: number;
  readonly selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.nickname} 랭킹`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.rowPressable, pressed ? styles.pressed : null]}
    >
      <View style={[styles.row, selected ? styles.rowSelected : null]}>
        <AppText variant="captionBold" tone="inkSoft" style={styles.rankCell} numberOfLines={1}>
          {rank}
        </AppText>
        <Avatar
          label={entry.nickname}
          tone={rowTones[rank % rowTones.length] ?? 'blue'}
          size={36}
        />
        <AppText variant="captionBold" tone="ink" style={styles.rowName} numberOfLines={1}>
          {entry.nickname}
        </AppText>
        <AppText variant="captionBold" tone="ink" numberOfLines={1}>
          도장 {entry.stampCount}개
        </AppText>
      </View>
    </Pressable>
  );
}

type AvatarTone = 'blue' | 'green' | 'pink' | 'purple' | 'yellow' | 'orange' | 'orangeDark';
type RankingRange = 'week' | 'month' | 'all';

function Avatar({
  label,
  size,
  tone,
}: {
  readonly label: string;
  readonly size: number;
  readonly tone: AvatarTone;
}) {
  const toneStyle = avatarToneStyles[tone];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: toneStyle.backgroundColor,
        },
      ]}
    >
      <AppText
        variant="captionBold"
        style={[styles.avatarText, { color: toneStyle.color }]}
        numberOfLines={1}
      >
        {label.slice(0, 2)}
      </AppText>
    </View>
  );
}

const buildLeaderboard = (entries: readonly RankingEntry[]) => {
  const meEntry =
    entries.find((entry) => entry.isMe) ??
    ({ id: 'mock-user-1', nickname: '재선', stampCount: 3, isMe: true } as RankingEntry);
  const demoRows: RankingEntry[] = [
    { id: 'weekly-1', nickname: '도장왕준호', stampCount: 12 },
    { id: 'weekly-2', nickname: '서울탐험가', stampCount: 9 },
    { id: 'weekly-3', nickname: '하늘바람', stampCount: 8 },
    { id: 'weekly-4', nickname: '한옥러버', stampCount: 7 },
    { id: 'weekly-5', nickname: '길따라도윤', stampCount: 7 },
    { id: 'weekly-6', nickname: '궁궐지기', stampCount: 6 },
    { id: 'weekly-7', nickname: '주말여행자', stampCount: 5 },
  ];

  return [...demoRows, { ...meEntry, nickname: meEntry.nickname.replace('스탬피 테스터', '재선') }]
    .sort((a, b) => b.stampCount - a.stampCount)
    .map((entry, index) => ({
      ...entry,
      id: entry.isMe ? 'mock-user-1' : entry.id || `rank-${index}`,
    }));
};

const getRank = (rows: readonly RankingEntry[], entry: RankingEntry) => {
  const index = rows.findIndex((row) => row.id === entry.id);
  return index >= 0 ? String(index + 1) : '-';
};

const avatarToneStyles: Record<
  AvatarTone,
  { readonly backgroundColor: string; readonly color: string }
> = {
  blue: { backgroundColor: '#E6F1FB', color: '#185FA5' },
  green: { backgroundColor: '#E7F7EE', color: colors.stampInk },
  pink: { backgroundColor: '#FBEAF0', color: '#993556' },
  purple: { backgroundColor: '#EEEDFE', color: '#534AB7' },
  yellow: { backgroundColor: '#FAEEDA', color: '#854F0B' },
  orange: { backgroundColor: colors.brandSoft, color: colors.brandInk },
  orangeDark: { backgroundColor: colors.brand, color: colors.surface },
};

const rowTones: readonly AvatarTone[] = ['pink', 'purple', 'yellow', 'green'];
const rankingRanges: readonly { key: RankingRange; label: string; subtitle: string }[] = [
  { key: 'week', label: '이번 주', subtitle: '이번 주 활동 기준으로 보여줘요.' },
  { key: 'month', label: '이번 달', subtitle: '이번 달 누적 도장 수를 보여줘요.' },
  { key: 'all', label: '전체', subtitle: '전체 누적 순위를 보여줘요.' },
];

const rangeLabel = (range: RankingRange) =>
  rankingRanges.find((item) => item.key === range)?.label ?? '전체';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
  },
  segmentItem: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  podiumRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  podiumPressable: {
    flex: 1,
    minWidth: 0,
  },
  podiumCard: {
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  podiumFeatured: {
    flex: 1.15,
    paddingVertical: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  podiumSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.brandSoft,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    maxWidth: 40,
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  rankPill: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.canvas,
  },
  rankPillFeatured: {
    backgroundColor: colors.brand,
  },
  list: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F6',
    backgroundColor: colors.surface,
  },
  rowSelected: {
    backgroundColor: colors.brandSoft,
  },
  rowPressable: {
    minWidth: 0,
  },
  rankCell: {
    width: 24,
    textAlign: 'center',
  },
  rowName: {
    flex: 1,
    minWidth: 0,
  },
  selectionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  myRankRow: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.ink,
  },
  myRankText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  myRankHint: {
    color: '#FF9C73',
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.55,
  },
});
