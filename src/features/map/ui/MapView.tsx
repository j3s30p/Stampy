import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface MapSpotPin {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
}

interface MapViewProps {
  readonly spots: readonly MapSpotPin[];
}

export function MapView({ spots }: MapViewProps) {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>지도</Text>
          <Text style={styles.title}>오늘의 스팟 위치</Text>
          <Text style={styles.subtitle}>
            Kakao WebView 연결 전, 같은 mock 스팟을 지도 shell로 표시합니다.
          </Text>
        </View>

        <View style={styles.mapShell}>
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
          {spots.map((spot, index) => (
            <View
              key={spot.contentId}
              style={[
                styles.pin,
                index === 0 ? styles.pinPrimary : null,
                { left: `${18 + index * 26}%`, top: `${28 + (index % 2) * 26}%` },
              ]}
            >
              <Text style={styles.pinText}>{index + 1}</Text>
            </View>
          ))}
          <View style={styles.currentLocation}>
            <Text style={styles.currentLocationText}>현재 위치</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>스팟 목록</Text>
          <Text style={styles.sectionMeta}>홈과 도장 탭의 동일한 mock 데이터</Text>
        </View>

        {spots.map((spot, index) => (
          <View key={spot.contentId} style={styles.card}>
            <Text style={styles.cardIndex}>{index + 1}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{spot.title}</Text>
              <Text style={styles.cardMeta}>{spot.address}</Text>
              <Text style={styles.cardDistance}>{spot.distanceMeters}m 떨어짐</Text>
            </View>
            <View style={[styles.badge, spot.collected ? styles.badgeDone : styles.badgeTodo]}>
              <Text
                style={[
                  styles.badgeText,
                  spot.collected ? styles.badgeDoneText : styles.badgeTodoText,
                ]}
              >
                {spot.collected ? '완료' : '대기'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  header: { gap: 8, paddingTop: 8 },
  eyebrow: { color: '#315D9A', fontSize: 13, fontWeight: '800' },
  title: { color: '#18202A', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#66717F', fontSize: 15, lineHeight: 22 },
  mapShell: {
    height: 300,
    borderRadius: 8,
    backgroundColor: '#DDE9E4',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C5D5D0',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '52%',
    height: 2,
    backgroundColor: '#C0D1CB',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 2,
    backgroundColor: '#C0D1CB',
  },
  pin: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#315D9A',
  },
  pinPrimary: { borderColor: '#14806F', backgroundColor: '#E1F1ED' },
  pinText: { color: '#18202A', fontSize: 14, fontWeight: '900' },
  currentLocation: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    backgroundColor: '#18202A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  currentLocationText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  sectionHeader: { gap: 4 },
  sectionTitle: { color: '#18202A', fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: '#66717F', fontSize: 13 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E7EA',
  },
  cardIndex: { width: 26, color: '#315D9A', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  cardText: { flex: 1, minWidth: 0, gap: 3 },
  cardTitle: { color: '#18202A', fontSize: 16, fontWeight: '800' },
  cardMeta: { color: '#66717F', fontSize: 13 },
  cardDistance: { color: '#14806F', fontSize: 13, fontWeight: '700' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  badgeDone: { backgroundColor: '#E6F6EA' },
  badgeTodo: { backgroundColor: '#EEF3FA' },
  badgeText: { fontSize: 12, fontWeight: '800' },
  badgeDoneText: { color: '#207A3C' },
  badgeTodoText: { color: '#315D9A' },
});
