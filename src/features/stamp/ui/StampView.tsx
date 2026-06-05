import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';

export interface StampCandidate {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
}

export type StampLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

interface RecentStampItem {
  readonly contentId: string;
  readonly title: string;
  readonly collected: boolean;
}

interface StampViewProps {
  readonly candidate: StampCandidate | null;
  readonly collectedCount: number;
  readonly totalCount: number;
  readonly locationAvailable: boolean;
  readonly locationStatus: StampLocationStatus;
  readonly recentStamps?: readonly RecentStampItem[];
  readonly onCollect?: () => void;
}

export function StampView({
  candidate,
  collectedCount,
  totalCount,
  locationAvailable,
  locationStatus,
  recentStamps = [],
  onCollect,
}: StampViewProps) {
  const canVerify = candidate
    ? locationAvailable && candidate.distanceMeters <= STAMP_RADIUS_METERS && !candidate.collected
    : false;
  const progressPercent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;
  const ctaLabel = getCtaLabel({ candidate, canVerify, locationAvailable, locationStatus });
  const latestStamps = recentStamps.filter((stamp) => stamp.collected).slice(0, 3);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>도장 찍기</Text>
            <Text style={styles.brandCaption}>현장 인증 후 스탬프를 눌러요</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>◎</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>오늘 루트 수집 현황</Text>
          <Text style={styles.summaryValue}>
            {collectedCount} / {totalCount}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {candidate ? (
          <View style={styles.candidateCard}>
            <View style={styles.candidateRow}>
              <View style={styles.thumb}>
                <Text style={styles.thumbText}>🏯</Text>
              </View>
              <View style={styles.candidateText}>
                <Text style={styles.cardLabel}>현재 추천 인증 스팟</Text>
                <Text style={styles.cardTitle}>{candidate.title}</Text>
                <Text style={styles.cardAddress}>{candidate.address}</Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{locationAvailable ? 'GPS 확인' : 'GPS 대기'}</Text>
              </View>
              <View style={[styles.badge, styles.badgeAccent]}>
                <Text style={styles.badgeText}>{candidate.distanceMeters}m</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>중복 없음</Text>
              </View>
            </View>

            <View style={styles.actionShell}>
              <View style={styles.stampHandle} />
              <View style={styles.stampTarget}>
                <Text style={styles.stampTargetText}>{candidate.title}</Text>
              </View>
              <Text style={styles.actionTitle}>스탬프를 꾹 눌러주세요</Text>
              <Text style={styles.actionBody}>
                도장은 이 화면에서만 찍을 수 있어요. 지도와 상세 화면에서는 위치와 정보를
                확인합니다.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${candidate.title} 도장 찍기`}
                accessibilityHint={
                  canVerify
                    ? '현재 위치가 인증 조건을 만족하면 도장을 받습니다.'
                    : '위치와 거리 조건을 충족하면 활성화됩니다.'
                }
                accessibilityState={{ disabled: !canVerify }}
                disabled={!canVerify}
                onPress={onCollect}
                style={({ pressed }) => [
                  styles.cta,
                  canVerify ? styles.ctaReady : styles.ctaBlocked,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text
                  style={[styles.ctaText, canVerify ? styles.ctaReadyText : styles.ctaBlockedText]}
                >
                  {ctaLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>추천 스팟이 없습니다</Text>
          </View>
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>최근 획득 도장</Text>
          <Text style={styles.sectionMeta}>도장함 보기</Text>
        </View>

        <View style={styles.miniGrid}>
          {latestStamps.length > 0 ? (
            latestStamps.map((stamp, index) => (
              <View key={stamp.contentId} style={styles.miniStamp}>
                <Text style={styles.miniStampIcon}>{getRecentIcon(index)}</Text>
                <Text style={styles.miniStampTitle}>{stamp.title}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.miniStamp}>
                <Text style={styles.miniStampIcon}>🏯</Text>
                <Text style={styles.miniStampTitle}>경복궁</Text>
              </View>
              <View style={styles.miniStamp}>
                <Text style={styles.miniStampIcon}>🎪</Text>
                <Text style={styles.miniStampTitle}>봄빛 행사</Text>
              </View>
              <View style={styles.miniStamp}>
                <Text style={styles.miniStampIcon}>🌉</Text>
                <Text style={styles.miniStampTitle}>한강 야경</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.collectionCard}>
          <Text style={styles.collectionTitle}>서울 5대 궁궐 컬렉션</Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.min(60 + collectedCount * 6, 100)}%` }]}
            />
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{Math.min(collectedCount + 2, 5)} / 5 완료</Text>
            </View>
            <View style={[styles.badge, styles.badgeAccent]}>
              <Text style={styles.badgeText}>완성까지 2개</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getRecentIcon = (index: number) => {
  if (index === 0) {
    return '🏯';
  }

  if (index === 1) {
    return '🎪';
  }

  return '🌉';
};

const getCtaLabel = ({
  candidate,
  canVerify,
  locationAvailable,
  locationStatus,
}: {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
  readonly locationAvailable: boolean;
  readonly locationStatus: StampLocationStatus;
}) => {
  if (!candidate) {
    return '추천 스팟 없음';
  }

  if (candidate.collected) {
    return '이미 수집한 도장입니다';
  }

  if (canVerify) {
    return `${candidate.title} 도장 찍기`;
  }

  if (!locationAvailable) {
    return locationStatus === 'denied' ? '위치 권한을 허용하면 인증 가능' : '현재 위치 확인 중';
  }

  return `${STAMP_RADIUS_METERS}m 안으로 이동하면 인증 가능`;
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF9' },
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDF2EC',
    gap: 8,
  },
  summaryLabel: { color: '#6A766F', fontSize: 13, fontWeight: '800' },
  summaryValue: { color: '#172033', fontSize: 24, fontWeight: '900' },
  progressTrack: {
    height: 8,
    backgroundColor: '#E8F3EF',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#14806F', borderRadius: 999 },
  candidateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B7EFE5',
    gap: 14,
    shadowColor: '#0F766E',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  candidateRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#E6F6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: { fontSize: 24 },
  candidateText: { flex: 1, minWidth: 0, gap: 4 },
  cardLabel: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  cardTitle: { color: '#172033', fontSize: 20, fontWeight: '900' },
  cardAddress: { color: '#657084', fontSize: 13, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    borderRadius: 999,
    backgroundColor: '#EEF3F8',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeAccent: { backgroundColor: '#FFF3D5' },
  badgeText: { color: '#465466', fontSize: 11, fontWeight: '800' },
  statusDoneText: { color: '#207A3C' },
  statusTodoText: { color: '#8A6400' },
  actionShell: {
    alignItems: 'center',
    backgroundColor: '#F6FFFD',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#CFF5EC',
  },
  stampHandle: {
    width: 86,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#0F766E',
    marginBottom: -16,
  },
  stampTarget: {
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: '#FFFFFF',
    borderWidth: 5,
    borderColor: '#2DD4BF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stampTargetText: {
    color: '#14806F',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  actionTitle: { color: '#172033', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  actionBody: {
    color: '#657084',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  cta: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaReady: { backgroundColor: '#173C35' },
  ctaBlocked: { backgroundColor: '#E9F0EC' },
  ctaText: { fontSize: 15, fontWeight: '900' },
  ctaReadyText: { color: '#FFFFFF' },
  ctaBlockedText: { color: '#5F6B67' },
  pressed: { opacity: 0.82 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#172033', fontSize: 18, fontWeight: '900' },
  sectionMeta: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  miniGrid: { flexDirection: 'row', gap: 8 },
  miniStamp: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
  miniStampIcon: { fontSize: 22, marginBottom: 4 },
  miniStampTitle: {
    color: '#657084',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 10,
  },
  collectionTitle: { color: '#172033', fontSize: 16, fontWeight: '900' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
});
