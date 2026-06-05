import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import type { HomeTourSpot } from './HomeView';

interface TourSpotDetailViewProps {
  readonly spot: HomeTourSpot | null;
  readonly onBack?: () => void;
  readonly onOpenStamp?: () => void;
  readonly onOpenDirections?: () => void;
}

export function TourSpotDetailView({
  spot,
  onBack,
  onOpenStamp,
  onOpenDirections,
}: TourSpotDetailViewProps) {
  const [message, setMessage] = useState('카카오 길찾기 준비 중');

  const accent = useMemo(() => getAccent(spot?.theme), [spot?.theme]);

  if (!spot) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>선택된 관광지가 없습니다</Text>
          <Text style={styles.emptySubtitle}>
            홈, 지도, MY 화면의 카드에서 관광지를 골라보세요.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 이동"
            onPress={onBack}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.secondaryButtonText}>뒤로 가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const intro = getIntroText(spot.title, spot.theme);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, accent.hero]}>
          <View style={styles.heroTopRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 화면으로 이동"
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </Pressable>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{getSpotStatusLabel(spot)}</Text>
            </View>
          </View>

          <View style={styles.heroArtwork}>
            <View style={[styles.artCircle, accent.artPrimary]} />
            <View style={[styles.artCircleSmall, accent.artSecondary]} />
            <Text style={styles.heroArtworkLabel}>{spot.title}</Text>
            <Text style={styles.heroArtworkMeta}>{spot.theme}</Text>
          </View>
        </View>

        <View style={styles.titleCard}>
          <Text style={styles.title}>{spot.title}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{spot.theme}</Text>
            </View>
            <View style={[styles.badge, getSpotStatusStyle(spot)]}>
              <Text style={[styles.badgeText, getSpotStatusTextStyle(spot)]}>
                {getSpotStatusLabel(spot)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoValue}>{spot.distanceMeters}m</Text>
            <Text style={styles.infoLabel}>현재 거리</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoValue}>+10</Text>
            <Text style={styles.infoLabel}>획득 EXP</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoValue}>1회</Text>
            <Text style={styles.infoLabel}>획득 제한</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>관광지 소개</Text>
          <Text style={styles.cardBody}>{intro}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>주소</Text>
          <Text style={styles.cardBody}>{spot.address}</Text>
        </View>

        <View style={[styles.card, styles.noticeCard]}>
          <Text style={[styles.cardTitle, styles.noticeTitle]}>도장 인증 안내</Text>
          <Text style={styles.cardBody}>
            실제 도장은 하단 가운데 도장 탭에서만 진행됩니다. 관광지 반경 {STAMP_RADIUS_METERS}m
            이내에서 도장 화면을 열면 인증할 수 있어요.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${spot.title} 도장 화면으로 이동`}
          onPress={onOpenStamp}
          style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.primaryButtonText}>도장 화면으로 이동</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${spot.title} 카카오맵으로 길찾기`}
          onPress={() => {
            setMessage(`${spot.title} 길찾기 준비 중`);
            onOpenDirections?.();
          }}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.secondaryButtonText}>카카오맵으로 길찾기</Text>
        </Pressable>

        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackLabel}>선택 상태</Text>
          <Text style={styles.feedbackText}>{message}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getIntroText = (title: string, theme: string) => {
  const introByTheme: Record<string, string> = {
    '궁궐 산책':
      '조선 왕조의 중심 궁궐로, 서울을 대표하는 역사 관광지입니다. 관광공사 API의 소개, 이미지, 주소 데이터를 기반으로 상세 정보를 제공합니다.',
    '골목 여행':
      '오래된 골목과 한옥 풍경이 이어지는 도심 산책 코스입니다. 걷는 재미와 사진 찍는 재미를 함께 담은 스팟으로 보여줍니다.',
    '도심 휴식':
      '도심 속 물길과 녹지, 산책 동선을 함께 즐길 수 있는 휴식형 스팟입니다. 짧게 들러도 분위기를 바꿔주는 곳으로 소개합니다.',
  };

  return introByTheme[theme] ?? `${title}는 여행 중 잠시 멈춰 보기 좋은 관광지입니다.`;
};

const getAccent = (theme?: string) => {
  switch (theme) {
    case '궁궐 산책':
      return {
        hero: { backgroundColor: '#8F5A3C' },
        artPrimary: { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
        artSecondary: { backgroundColor: 'rgba(255, 255, 255, 0.28)' },
      };
    case '골목 여행':
      return {
        hero: { backgroundColor: '#40507A' },
        artPrimary: { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
        artSecondary: { backgroundColor: 'rgba(255, 221, 170, 0.28)' },
      };
    default:
      return {
        hero: { backgroundColor: '#116D63' },
        artPrimary: { backgroundColor: 'rgba(255, 255, 255, 0.14)' },
        artSecondary: { backgroundColor: 'rgba(145, 232, 218, 0.3)' },
      };
  }
};

const getSpotStatusLabel = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return '수집 완료';
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return '도장 가능';
  }

  return '가까이 이동 필요';
};

const getSpotStatusStyle = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return styles.badgeDone;
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return styles.badgeReady;
  }

  return styles.badgePending;
};

const getSpotStatusTextStyle = (spot: HomeTourSpot) => {
  if (spot.collected) {
    return styles.badgeDoneText;
  }

  if (spot.distanceMeters <= STAMP_RADIUS_METERS) {
    return styles.badgeReadyText;
  }

  return styles.badgePendingText;
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF3F8' },
  content: { paddingBottom: 24 },
  hero: {
    height: 290,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: '#1C2430', fontSize: 26, fontWeight: '700', marginTop: -3 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: { color: '#24313D', fontSize: 12, fontWeight: '800' },
  heroArtwork: {
    marginTop: 30,
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -28,
    right: -18,
  },
  artCircleSmall: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    bottom: -12,
    left: -10,
  },
  heroArtworkLabel: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  heroArtworkMeta: { color: 'rgba(255,255,255,0.86)', fontSize: 14, marginTop: 6 },
  titleCard: {
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 10,
  },
  title: { color: '#172033', fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    borderRadius: 999,
    backgroundColor: '#EEF3F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: '#465466', fontSize: 12, fontWeight: '800' },
  badgeDone: { backgroundColor: '#E6F6EA' },
  badgeReady: { backgroundColor: '#FFF3D5' },
  badgePending: { backgroundColor: '#E8EEF5' },
  badgeDoneText: { color: '#1E7A38' },
  badgeReadyText: { color: '#A06A00' },
  badgePendingText: { color: '#48607A' },
  infoGrid: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  infoValue: { color: '#172033', fontSize: 18, fontWeight: '900' },
  infoLabel: { color: '#6C7581', fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EDF4',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: { color: '#172033', fontSize: 16, fontWeight: '900' },
  cardBody: { color: '#5B6570', fontSize: 13, lineHeight: 21 },
  noticeCard: {
    backgroundColor: '#F0FDF9',
    borderColor: '#B7EFE5',
  },
  noticeTitle: { color: '#0F766E' },
  primaryButton: {
    marginHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#173C35',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 2,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  secondaryButton: {
    marginHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7E0E8',
    marginTop: 10,
  },
  secondaryButtonText: { color: '#173C35', fontSize: 15, fontWeight: '900' },
  feedbackCard: {
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7EDF4',
  },
  feedbackLabel: { color: '#6C7581', fontSize: 12, fontWeight: '800' },
  feedbackText: { color: '#172033', fontSize: 14, fontWeight: '800', marginTop: 4 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: { color: '#172033', fontSize: 22, fontWeight: '900' },
  emptySubtitle: { color: '#6C7581', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  pressed: { opacity: 0.8 },
});
