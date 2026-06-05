import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const latestStamp = useMemo(
    () =>
      [...stamps]
        .filter((stamp) => stamp.collected)
        .sort((a, b) => (b.collectedAt ?? '').localeCompare(a.collectedAt ?? ''))[0] ?? null,
    [stamps],
  );
  const currentMonth = '2026.06';

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>마이페이지</Text>
            <Text style={styles.brandCaption}>내 여행 기록과 성장 정보</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nickname.slice(0, 1)}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIdentity}>
            <View style={styles.bigAvatar}>
              <Text style={styles.bigAvatarText}>{nickname.slice(0, 1)}</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroLabel}>스탬피 여행자</Text>
              <Text style={styles.heroTitle}>Lv.3 지역 탐험가</Text>
            </View>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>다음 레벨까지 380 EXP</Text>
              <Text style={styles.progressText}>620 / 1000</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>나의 여행 요약</Text>
          <Text style={styles.sectionAction}>{currentMonth}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{collectedCount}</Text>
            <Text style={styles.statLabel}>획득 스탬프</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>전체 스팟</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{remainingCount}</Text>
            <Text style={styles.statLabel}>남은 스팟</Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <Text style={styles.cardTitle}>최근 활동</Text>
          {latestStamp ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${latestStamp.title} 도장 상세 보기`}
              onPress={() => onSelectStamp?.(latestStamp.contentId)}
              style={({ pressed }) => [styles.activityRow, pressed ? styles.pressed : null]}
            >
              <View style={styles.activityStamp}>
                <Text style={styles.activityStampText}>🏯</Text>
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>{latestStamp.title} 스탬프 획득</Text>
                <Text style={styles.activityMeta}>
                  {latestStamp.collectedAt
                    ? `오늘 ${formatTime(latestStamp.collectedAt)}`
                    : '방문 기록 없음'}{' '}
                  · +10 EXP
                </Text>
              </View>
            </Pressable>
          ) : (
            <Text style={styles.activityMeta}>아직 최근 활동이 없습니다.</Text>
          )}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>대표 배지</Text>
          <Text style={styles.sectionAction}>전체 보기</Text>
        </View>

        <View style={styles.badgeGrid}>
          <View style={styles.badgeCard}>
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeCircleText}>🏯</Text>
            </View>
            <Text style={styles.badgeTitle}>궁궐 탐험가</Text>
            <Text style={styles.badgeMeta}>대표 테마 배지</Text>
          </View>

          <View style={styles.badgeCard}>
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeCircleText}>🎪</Text>
            </View>
            <Text style={styles.badgeTitle}>행사 참여러</Text>
            <Text style={styles.badgeMeta}>최근 활동 기준</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>도장 보관함</Text>
          <Text style={styles.sectionAction}>전체 보기</Text>
        </View>

        <View style={styles.collectionList}>
          {stamps.map((stamp) => (
            <Pressable
              key={stamp.contentId}
              accessibilityRole="button"
              accessibilityLabel={`${stamp.title} 상세 보기`}
              onPress={() => onSelectStamp?.(stamp.contentId)}
              style={({ pressed }) => [styles.collectionRow, pressed ? styles.pressed : null]}
            >
              <View
                style={[
                  styles.collectionIcon,
                  stamp.collected ? styles.collectionIconDone : styles.collectionIconTodo,
                ]}
              >
                <Text
                  style={[
                    styles.collectionIconText,
                    stamp.collected ? styles.collectionIconTextDone : styles.collectionIconTextTodo,
                  ]}
                >
                  {stamp.collected ? '✓' : '·'}
                </Text>
              </View>
              <View style={styles.collectionText}>
                <Text style={styles.collectionTitle}>{stamp.title}</Text>
                <Text style={styles.collectionMeta}>
                  {stamp.collected
                    ? `수집 완료 · ${formatCollectedAt(stamp.collectedAt)}`
                    : '아직 방문 전'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>설정</Text>
        </View>

        <View style={styles.settingsList}>
          {settingsRows.map((row) => (
            <Pressable
              key={row.label}
              accessibilityRole="button"
              accessibilityLabel={row.label}
              onPress={() => setSelectedSetting(row.feedback)}
              style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
            >
              <Text style={styles.settingLabel}>{row.label}</Text>
              <Text style={styles.settingChevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackLabel}>선택 상태</Text>
          <Text style={styles.feedbackText}>{selectedSetting}</Text>
        </View>
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
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  hero: {
    borderRadius: 24,
    backgroundColor: '#0F766E',
    padding: 18,
    gap: 14,
  },
  heroIdentity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAvatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  heroText: { flex: 1, minWidth: 0, gap: 4 },
  heroLabel: { color: '#D5F6F1', fontSize: 13, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
  progressBlock: { gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressText: { color: '#E7F8F4', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { width: '62%', height: '100%', backgroundColor: '#F0C95A', borderRadius: 999 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#172033', fontSize: 18, fontWeight: '900' },
  sectionAction: { color: '#14806F', fontSize: 12, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 4,
  },
  statValue: { color: '#172033', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#657084', fontSize: 12 },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 10,
  },
  cardTitle: { color: '#172033', fontSize: 16, fontWeight: '900' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityStamp: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityStampText: { fontSize: 20 },
  activityText: { flex: 1, minWidth: 0, gap: 2 },
  activityTitle: { color: '#172033', fontSize: 14, fontWeight: '900' },
  activityMeta: { color: '#657084', fontSize: 12, lineHeight: 18 },
  badgeGrid: { flexDirection: 'row', gap: 10 },
  badgeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 6,
  },
  badgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F0FDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircleText: { fontSize: 22 },
  badgeTitle: { color: '#172033', fontSize: 14, fontWeight: '900' },
  badgeMeta: { color: '#657084', fontSize: 12, textAlign: 'center' },
  collectionList: { gap: 10 },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
  collectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionIconDone: { backgroundColor: '#173C35' },
  collectionIconTodo: { backgroundColor: '#EEF3F8' },
  collectionIconText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  collectionIconTextDone: { color: '#FFFFFF' },
  collectionIconTextTodo: { color: '#657084' },
  collectionText: { flex: 1, minWidth: 0, gap: 3 },
  collectionTitle: { color: '#172033', fontSize: 15, fontWeight: '900' },
  collectionMeta: { color: '#657084', fontSize: 12, lineHeight: 18 },
  settingsList: { gap: 8 },
  settingRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: { color: '#172033', fontSize: 14, fontWeight: '900' },
  settingChevron: { color: '#94A3B8', fontSize: 20, fontWeight: '900' },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 4,
  },
  feedbackLabel: { color: '#657084', fontSize: 12, fontWeight: '800' },
  feedbackText: { color: '#172033', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
