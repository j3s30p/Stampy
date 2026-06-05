import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';

export interface HomeTourSpot {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly theme: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
}

interface HomeViewProps {
  readonly spots: readonly HomeTourSpot[];
  readonly collectedCount: number;
  readonly onSelectSpot?: (contentId: string) => void;
}

export function HomeView({ spots, collectedCount, onSelectSpot }: HomeViewProps) {
  const topSpots = spots.slice(0, 2);
  const level = 3;
  const exp = 620;
  const nextExp = 1000;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>스탬피</Text>
            <Text style={styles.brandCaption}>오늘은 어디서 스탬프를 찍어볼까요?</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>J</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Lv.{level} 지역 탐험가</Text>
          <Text style={styles.heroTitle}>이번 주 2개만 더 찍으면{'\n'}서울 컬렉션 완성!</Text>

          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                EXP {exp} / {nextExp}
              </Text>
              <Text style={styles.progressText}>{Math.round((exp / nextExp) * 100)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>근처에서 찍을 수 있어요</Text>
          <Text style={styles.sectionAction}>지도 보기</Text>
        </View>

        <View style={styles.nearbyList}>
          {topSpots.map((spot, index) => (
            <Pressable
              key={spot.contentId}
              accessibilityRole="button"
              accessibilityLabel={`${spot.title} 상세 보기`}
              onPress={() => onSelectSpot?.(spot.contentId)}
              style={({ pressed }) => [styles.spotCard, pressed ? styles.pressed : null]}
            >
              <View style={[styles.thumb, getThumbStyle(index)]}>
                <Text style={styles.thumbText}>{getSpotIcon(index)}</Text>
              </View>
              <View style={styles.spotCopy}>
                <Text style={styles.spotTitle}>{spot.title}</Text>
                <Text style={styles.spotMeta}>
                  {spot.address} · 현재 위치에서 {spot.distanceMeters}m
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, getStatusBadgeStyle(spot)]}>
                    <Text style={styles.badgeText}>{getStatusLabel(spot)}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{spot.theme}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>추천 컬렉션</Text>
          <Text style={styles.sectionAction}>전체</Text>
        </View>

        <View style={styles.collectionCard}>
          <Text style={styles.collectionTitle}>서울 5대 궁궐 컬렉션</Text>
          <View style={styles.collectionTrack}>
            <View style={styles.collectionFill} />
          </View>
          <View style={styles.collectionBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{Math.min(collectedCount + 2, 5)} / 5 완료</Text>
            </View>
            <View style={[styles.badge, styles.badgeReady]}>
              <Text style={styles.badgeText}>보상 +50EXP</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>오늘의 목표</Text>
          <Text style={styles.sectionAction}>{STAMP_RADIUS_METERS}m 반경</Text>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>근처 관광지 2곳에서 도장 수집</Text>
          <Text style={styles.goalMeta}>
            홈에서 스팟을 열고, 상세에서 도장 화면으로 이어가 보세요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getThumbStyle = (index: number) => {
  if (index === 0) {
    return styles.thumbPalace;
  }

  return styles.thumbEvent;
};

const getSpotIcon = (index: number) => {
  if (index === 0) {
    return '🏯';
  }

  return '🎪';
};

const getStatusLabel = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return '도장 가능';
  }

  return '방문 전';
};

const getStatusBadgeStyle = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return styles.badgeDone;
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return styles.badgeReady;
  }

  return styles.badgePending;
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
  brand: { color: '#172033', fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
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
    backgroundColor: '#173C35',
    padding: 18,
    overflow: 'hidden',
  },
  heroLabel: { color: '#A7D8CF', fontSize: 13, fontWeight: '800' },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: 8,
    letterSpacing: -0.6,
  },
  progressBlock: { marginTop: 14, gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { color: '#E8F4F0', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: { width: '62%', height: '100%', backgroundColor: '#F0C95A', borderRadius: 999 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: { color: '#172033', fontSize: 18, fontWeight: '900' },
  sectionAction: { color: '#14806F', fontSize: 12, fontWeight: '800' },
  nearbyList: { gap: 10 },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
  pressed: { opacity: 0.82 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPalace: { backgroundColor: '#EFC9A3' },
  thumbEvent: { backgroundColor: '#FFD0DA' },
  thumbText: { fontSize: 24 },
  spotCopy: { flex: 1, minWidth: 0, gap: 4 },
  spotTitle: { color: '#172033', fontSize: 16, fontWeight: '900' },
  spotMeta: { color: '#657084', fontSize: 13, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: {
    borderRadius: 999,
    backgroundColor: '#EEF3F8',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeReady: { backgroundColor: '#FFF3D5' },
  badgeDone: { backgroundColor: '#E6F6EA' },
  badgePending: { backgroundColor: '#E8EEF5' },
  badgeText: { color: '#465466', fontSize: 11, fontWeight: '800' },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 10,
  },
  collectionTitle: { color: '#172033', fontSize: 16, fontWeight: '900' },
  collectionTrack: {
    height: 8,
    backgroundColor: '#EDF3F8',
    borderRadius: 999,
    overflow: 'hidden',
  },
  collectionFill: { width: '60%', height: '100%', backgroundColor: '#14806F', borderRadius: 999 },
  collectionBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    gap: 6,
  },
  goalTitle: { color: '#172033', fontSize: 15, fontWeight: '900' },
  goalMeta: { color: '#657084', fontSize: 13, lineHeight: 18 },
});
