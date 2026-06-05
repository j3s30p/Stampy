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
  const collectedCount = stamps.filter((stamp) => stamp.collected).length;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nickname.slice(0, 1)}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.eyebrow}>MY</Text>
            <Text style={styles.title}>{nickname}</Text>
            <Text style={styles.subtitle}>오늘 루트 도장 {collectedCount}개를 수집했어요</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{collectedCount}</Text>
            <Text style={styles.statLabel}>수집 도장</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stamps.length - collectedCount}</Text>
            <Text style={styles.statLabel}>남은 스팟</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>도장 보관함</Text>
          <Text style={styles.sectionMeta}>홈과 도장 탭의 상태가 이어집니다</Text>
        </View>

        {stamps.map((stamp) => (
          <Pressable
            key={stamp.contentId}
            accessibilityLabel={`${stamp.title} 도장 상세 열기`}
            accessibilityRole="button"
            onPress={() => onSelectStamp?.(stamp.contentId)}
            style={({ pressed }) => [styles.stampCard, pressed ? styles.pressed : null]}
          >
            <View
              style={[
                styles.stampSeal,
                stamp.collected ? styles.stampSealDone : styles.stampSealTodo,
              ]}
            >
              <Text
                style={[
                  styles.stampSealText,
                  stamp.collected ? styles.stampSealTextDone : styles.stampSealTextTodo,
                ]}
              >
                {stamp.collected ? '✓' : '·'}
              </Text>
            </View>
            <View style={styles.stampText}>
              <Text style={styles.stampTitle}>{stamp.title}</Text>
              <Text style={styles.stampMeta}>
                {stamp.collected ? `수집 완료 · ${formatDate(stamp.collectedAt)}` : '아직 방문 전'}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const formatDate = (value?: string) => {
  if (!value) return '날짜 없음';
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(
    new Date(value),
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F5F0' },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 8 },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#173C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  profileText: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { color: '#14806F', fontSize: 13, fontWeight: '800' },
  title: { color: '#1D2522', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#68736E', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E0D9',
  },
  statValue: { color: '#1D2522', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#68736E', fontSize: 13, marginTop: 4 },
  sectionHeader: { gap: 4 },
  sectionTitle: { color: '#1D2522', fontSize: 20, fontWeight: '900' },
  sectionMeta: { color: '#68736E', fontSize: 13 },
  stampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E0D9',
  },
  pressed: { opacity: 0.78 },
  stampSeal: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampSealDone: { backgroundColor: '#173C35' },
  stampSealTodo: { backgroundColor: '#EFECE3' },
  stampSealText: { fontSize: 22, fontWeight: '900' },
  stampSealTextDone: { color: '#FFFFFF' },
  stampSealTextTodo: { color: '#9B9488' },
  stampText: { flex: 1, minWidth: 0, gap: 3 },
  stampTitle: { color: '#1D2522', fontSize: 16, fontWeight: '800' },
  stampMeta: { color: '#68736E', fontSize: 13 },
});
