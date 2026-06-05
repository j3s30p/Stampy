import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

export function RankingView({ entries }: RankingViewProps) {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>랭킹</Text>
          <Text style={styles.title}>오늘의 도장 경쟁</Text>
          <Text style={styles.subtitle}>
            MY 화면의 수집 수가 랭킹에도 반영되는 mock 흐름입니다.
          </Text>
        </View>

        {entries.map((entry, index) => (
          <View key={entry.id} style={[styles.row, entry.isMe ? styles.myRow : null]}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={styles.member}>
              <Text style={styles.nickname}>{entry.nickname}</Text>
              <Text style={styles.meta}>{entry.isMe ? '나의 현재 순위' : '서울 루트 참여자'}</Text>
            </View>
            <Text style={styles.score}>{entry.stampCount}개</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F7FB' },
  content: { padding: 20, paddingBottom: 32, gap: 12 },
  header: { gap: 8, paddingTop: 8, marginBottom: 4 },
  eyebrow: { color: '#7050A8', fontSize: 13, fontWeight: '800' },
  title: { color: '#211D28', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#706A78', fontSize: 15, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E0EF',
  },
  myRow: { borderColor: '#7050A8', backgroundColor: '#F1ECFA' },
  rank: { width: 30, color: '#7050A8', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  member: { flex: 1, minWidth: 0, gap: 3 },
  nickname: { color: '#211D28', fontSize: 17, fontWeight: '900' },
  meta: { color: '#706A78', fontSize: 13 },
  score: { color: '#211D28', fontSize: 18, fontWeight: '900' },
});
