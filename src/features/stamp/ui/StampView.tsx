import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';

export interface StampCandidate {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
}

interface StampViewProps {
  readonly candidate: StampCandidate | null;
  readonly collectedCount: number;
  readonly totalCount: number;
}

export function StampView({ candidate, collectedCount, totalCount }: StampViewProps) {
  const canVerify = candidate
    ? candidate.distanceMeters <= STAMP_RADIUS_METERS && !candidate.collected
    : false;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>도장 인증</Text>
          <Text style={styles.title}>현장에 도착하면 도장을 받을 수 있어요</Text>
          <Text style={styles.subtitle}>
            인증 반경은 항상 {STAMP_RADIUS_METERS}m 입니다. 위치 기준은 모든 화면에서 동일합니다.
          </Text>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressValue}>
            {collectedCount} / {totalCount}
          </Text>
          <Text style={styles.progressLabel}>오늘 루트 수집 현황</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round((collectedCount / totalCount) * 100)}%` },
              ]}
            />
          </View>
        </View>

        {candidate ? (
          <View style={styles.candidateCard}>
            <Text style={styles.cardLabel}>현재 추천 인증 스팟</Text>
            <Text style={styles.cardTitle}>{candidate.title}</Text>
            <Text style={styles.cardAddress}>{candidate.address}</Text>

            <View style={styles.distanceRow}>
              <Text style={styles.distanceValue}>{candidate.distanceMeters}m</Text>
              <Text style={styles.distanceLabel}>현재 위치와의 거리</Text>
            </View>

            <View style={[styles.cta, canVerify ? styles.ctaReady : styles.ctaBlocked]}>
              <Text
                style={[styles.ctaText, canVerify ? styles.ctaReadyText : styles.ctaBlockedText]}
              >
                {candidate.collected
                  ? '이미 수집한 도장입니다'
                  : canVerify
                    ? '도장 받기 준비 완료'
                    : `${STAMP_RADIUS_METERS}m 안으로 이동하면 인증 가능`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>추천 스팟이 없습니다</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF8EC' },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  header: { gap: 8, paddingTop: 8 },
  eyebrow: { color: '#9A6B00', fontSize: 13, fontWeight: '800' },
  title: { color: '#271F12', fontSize: 28, fontWeight: '800', lineHeight: 36 },
  subtitle: { color: '#746B5C', fontSize: 15, lineHeight: 22 },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0E1C2',
    gap: 8,
  },
  progressValue: { color: '#271F12', fontSize: 26, fontWeight: '900' },
  progressLabel: { color: '#746B5C', fontSize: 14 },
  progressTrack: {
    height: 10,
    backgroundColor: '#F4E8D1',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#D99A18', borderRadius: 999 },
  candidateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0E1C2',
    gap: 12,
  },
  cardLabel: { color: '#9A6B00', fontSize: 13, fontWeight: '800' },
  cardTitle: { color: '#271F12', fontSize: 24, fontWeight: '900' },
  cardAddress: { color: '#746B5C', fontSize: 14, lineHeight: 20 },
  distanceRow: { backgroundColor: '#FFF3D5', borderRadius: 8, padding: 14, gap: 2 },
  distanceValue: { color: '#8A6400', fontSize: 24, fontWeight: '900' },
  distanceLabel: { color: '#746B5C', fontSize: 13 },
  cta: { borderRadius: 8, padding: 16, alignItems: 'center' },
  ctaReady: { backgroundColor: '#173C35' },
  ctaBlocked: { backgroundColor: '#F3F0E8' },
  ctaText: { fontSize: 15, fontWeight: '900' },
  ctaReadyText: { color: '#FFFFFF' },
  ctaBlockedText: { color: '#5F574B' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20 },
});
