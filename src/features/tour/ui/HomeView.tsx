import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
}

export function HomeView({ spots, collectedCount }: HomeViewProps) {
  const nearest = [...spots].sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>오늘의 스탬피 루트</Text>
          <Text style={styles.title}>가까운 관광지를 돌며 도장을 모아보세요</Text>
          <Text style={styles.subtitle}>
            같은 mock 데이터가 홈, 지도, 도장, MY 화면에 이어집니다.
          </Text>
        </View>

        {nearest ? (
          <View style={styles.hero}>
            <View>
              <Text style={styles.heroLabel}>가장 가까운 스팟</Text>
              <Text style={styles.heroTitle}>{nearest.title}</Text>
              <Text style={styles.heroMeta}>
                현재 위치에서 {nearest.distanceMeters}m · 인증 반경 {STAMP_RADIUS_METERS}m
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{nearest.collected ? '완료' : '대기'}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{spots.length}</Text>
            <Text style={styles.summaryLabel}>추천 스팟</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{collectedCount}</Text>
            <Text style={styles.summaryLabel}>수집 완료</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{STAMP_RADIUS_METERS}m</Text>
            <Text style={styles.summaryLabel}>인증 반경</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>추천 관광지</Text>
          <Text style={styles.sectionMeta}>지도와 도장 탭에서 같은 순서로 표시됩니다</Text>
        </View>

        {spots.map((spot) => (
          <View key={spot.contentId} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.marker}>
                <Text style={styles.markerText}>{spot.title.slice(0, 1)}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{spot.title}</Text>
                <Text style={styles.cardMeta}>{spot.theme}</Text>
              </View>
              <Text style={[styles.status, spot.collected ? styles.statusDone : styles.statusTodo]}>
                {spot.collected ? '수집됨' : '방문 전'}
              </Text>
            </View>
            <Text style={styles.address}>{spot.address}</Text>
            <Text style={styles.distance}>현재 위치에서 {spot.distanceMeters}m</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F8F5' },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  header: { gap: 8, paddingTop: 8 },
  eyebrow: { color: '#14806F', fontSize: 13, fontWeight: '700' },
  title: { color: '#17211F', fontSize: 28, fontWeight: '800', lineHeight: 36 },
  subtitle: { color: '#66736F', fontSize: 15, lineHeight: 22 },
  hero: {
    backgroundColor: '#173C35',
    borderRadius: 8,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroLabel: { color: '#A6D8CE', fontSize: 13, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 6 },
  heroMeta: { color: '#D8EFE9', fontSize: 14, marginTop: 8 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0C95A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: { color: '#2A2100', fontSize: 13, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8E5',
  },
  summaryValue: { color: '#17211F', fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: '#69736F', fontSize: 12, marginTop: 4 },
  sectionHeader: { gap: 4, marginTop: 2 },
  sectionTitle: { color: '#17211F', fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: '#7A8580', fontSize: 13 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8E5',
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  marker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E1F1ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: { color: '#14806F', fontSize: 18, fontWeight: '800' },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { color: '#17211F', fontSize: 17, fontWeight: '800' },
  cardMeta: { color: '#66736F', fontSize: 13, marginTop: 3 },
  status: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '800',
  },
  statusDone: { backgroundColor: '#E6F6EA', color: '#207A3C' },
  statusTodo: { backgroundColor: '#FFF3D5', color: '#8A6400' },
  address: { color: '#4D5A56', fontSize: 14, lineHeight: 20 },
  distance: { color: '#14806F', fontSize: 13, fontWeight: '700' },
});
