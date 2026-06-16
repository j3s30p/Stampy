import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, colors, radius, spacing } from '@shared/ui';

export interface MyStampSummary {
  readonly contentId: string;
  readonly title: string;
  readonly collected: boolean;
  readonly collectedAt?: string;
  readonly thumbnailUrl?: string;
}

interface MyPageViewProps {
  readonly stamps: readonly MyStampSummary[];
  readonly nickname: string;
  readonly onSelectStamp?: (contentId: string) => void;
}

const kakaoBadgePalette = {
  background: '#FAE54D',
  ink: '#3C2A00',
} as const;

export function MyPageView({ stamps, nickname, onSelectStamp }: MyPageViewProps) {
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  const collectedCount = stamps.filter((stamp) => stamp.collected).length;
  const totalCount = stamps.length;
  const visitedRegions = Math.min(2, Math.max(1, collectedCount));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <AppText variant="h1" tone="ink" numberOfLines={1}>
            마이
          </AppText>
          <View style={styles.profileRow}>
            <Avatar label={nickname} size={60} />
            <View style={styles.profileText}>
              <View style={styles.nameRow}>
                <AppText variant="h3" tone="ink" numberOfLines={1}>
                  {nickname}
                </AppText>
                <View style={styles.kakaoBadge}>
                  <AppText variant="micro" style={styles.kakaoText} numberOfLines={1}>
                    카카오 연동
                  </AppText>
                </View>
              </View>
              <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                2026년 5월부터 도장 수집 중
              </AppText>
            </View>
            <Ionicons name="create-outline" size={20} color={colors.inkSubtle} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="수집한 도장" value={String(collectedCount)} accent />
          <StatCard label="방문 지역" value={String(visitedRegions)} />
          <StatCard label="이번 주 랭킹" value="12위" />
        </View>

        <View style={styles.menu}>
          {primaryRows.map((row) => (
            <MenuRow
              key={row.label}
              row={row}
              onPress={() => {
                setSelectedSetting(row.feedback);
                if (row.contentId) {
                  onSelectStamp?.(row.contentId);
                }
              }}
            />
          ))}
        </View>

        <View style={styles.menu}>
          {secondaryRows.map((row) => (
            <MenuRow key={row.label} row={row} onPress={() => setSelectedSetting(row.feedback)} />
          ))}
        </View>

        <View style={styles.recentBlock}>
          <View style={styles.sectionHead}>
            <AppText variant="h3" tone="ink" numberOfLines={1}>
              최근 도장
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
              {totalCount}개 스팟
            </AppText>
          </View>
          {stamps.slice(0, 3).map((stamp) => (
            <Pressable
              key={stamp.contentId}
              accessibilityRole="button"
              accessibilityLabel={`${stamp.title} 상세 보기`}
              onPress={() => onSelectStamp?.(stamp.contentId)}
              style={({ pressed }) => [styles.stampRow, pressed ? styles.pressed : null]}
            >
              <View style={[styles.stampDot, stamp.collected ? styles.stampDotDone : null]}>
                <Ionicons
                  name={stamp.collected ? 'checkmark' : 'lock-closed'}
                  size={16}
                  color={stamp.collected ? colors.surface : colors.inkSubtle}
                />
              </View>
              <View style={styles.stampText}>
                <AppText variant="bodyBold" tone="ink" numberOfLines={1}>
                  {stamp.title}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                  {stamp.collected
                    ? `수집 완료 · ${formatCollectedAt(stamp.collectedAt)}`
                    : '아직 방문 전'}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>

        <AppText variant="caption" tone="inkMuted" style={styles.logout} numberOfLines={1}>
          로그아웃
        </AppText>

        {selectedSetting ? (
          <View style={styles.feedback}>
            <AppText variant="captionBold" tone="ink" numberOfLines={2}>
              {selectedSetting}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Avatar({ label, size }: { readonly label: string; readonly size: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <AppText variant="h3" style={styles.avatarText} numberOfLines={1}>
        {label.slice(0, 2)}
      </AppText>
    </View>
  );
}

function StatCard({
  accent = false,
  label,
  value,
}: {
  readonly accent?: boolean;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <View style={styles.statCard}>
      <AppText variant="micro" tone="inkMuted" numberOfLines={1} style={styles.centerText}>
        {label}
      </AppText>
      <AppText variant="h1" style={accent ? styles.statAccent : styles.statValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

function MenuRow({ onPress, row }: { readonly onPress: () => void; readonly row: MenuItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed ? styles.pressed : null]}
    >
      <Ionicons name={row.icon} size={20} color={row.color ?? colors.ink} />
      <AppText variant="body" tone="ink" style={styles.menuLabel} numberOfLines={1}>
        {row.label}
      </AppText>
      {row.trailing ? (
        <AppText
          variant="captionBold"
          style={row.trailingTone === 'green' ? styles.trailingGreen : styles.trailing}
          numberOfLines={1}
        >
          {row.trailing}
        </AppText>
      ) : null}
      {row.toggle ? (
        <View style={styles.toggle} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.borderMuted} />
      )}
    </Pressable>
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  readonly label: string;
  readonly icon: IoniconName;
  readonly feedback: string;
  readonly color?: string;
  readonly trailing?: string;
  readonly trailingTone?: 'green';
  readonly toggle?: boolean;
  readonly contentId?: string;
}

const primaryRows: readonly MenuItem[] = [
  {
    label: '내 도장 수집 내역',
    icon: 'ribbon-outline',
    color: colors.brand,
    feedback: '내 도장 수집 내역이 선택되었습니다.',
  },
  {
    label: '위치 권한',
    icon: 'location-outline',
    color: colors.locationDot,
    trailing: '항상 허용',
    trailingTone: 'green',
    feedback: '위치 권한이 선택되었습니다.',
  },
  {
    label: '근처 스팟 알림',
    icon: 'notifications-outline',
    toggle: true,
    feedback: '근처 스팟 알림이 선택되었습니다.',
  },
  {
    label: '언어',
    icon: 'language-outline',
    trailing: '한국어',
    feedback: '언어 설정이 선택되었습니다.',
  },
];

const secondaryRows: readonly MenuItem[] = [
  {
    label: '자주 묻는 질문',
    icon: 'help-circle-outline',
    feedback: '자주 묻는 질문이 선택되었습니다.',
  },
  {
    label: '약관 및 개인정보 처리방침',
    icon: 'document-text-outline',
    feedback: '약관 및 개인정보 처리방침이 선택되었습니다.',
  },
  {
    label: '앱 정보',
    icon: 'information-circle-outline',
    trailing: 'v1.0.0',
    feedback: '앱 정보가 선택되었습니다.',
  },
];

const formatCollectedAt = (value?: string) => {
  if (!value) {
    return '날짜 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  avatarText: {
    color: colors.brandInk,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kakaoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: kakaoBadgePalette.background,
  },
  kakaoText: {
    color: kakaoBadgePalette.ink,
  },
  statsRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  centerText: {
    textAlign: 'center',
  },
  statValue: {
    color: colors.ink,
  },
  statAccent: {
    color: colors.brand,
  },
  menu: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  menuRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.rowDivider,
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
  },
  trailing: {
    color: colors.inkMuted,
  },
  trailingGreen: {
    color: colors.stamp,
  },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.stamp,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  recentBlock: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  stampRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stampDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  stampDotDone: {
    backgroundColor: colors.stamp,
  },
  stampText: {
    flex: 1,
    minWidth: 0,
  },
  logout: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  feedback: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.86,
  },
});
