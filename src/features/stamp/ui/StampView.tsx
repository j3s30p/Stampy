import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Badge, StampDrop, colors, radius, shadow, spacing } from '@shared/ui';

export interface StampCandidate {
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly collected: boolean;
}

export type StampLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

interface StampViewProps {
  readonly candidate: StampCandidate | null;
  readonly collectedCount?: number;
  readonly totalCount?: number;
  readonly locationAvailable: boolean;
  readonly locationAccuracyMeters: number | null;
  readonly locationStatus: StampLocationStatus;
  readonly recentStamps?: readonly {
    readonly contentId: string;
    readonly title: string;
    readonly collected: boolean;
  }[];
  readonly onCollect?: () => void;
}

export function StampView(props: StampViewProps) {
  const { candidate, locationAvailable, locationAccuracyMeters, locationStatus, onCollect } = props;
  const canVerify = candidate
    ? locationAvailable &&
      locationAccuracyMeters !== null &&
      locationAccuracyMeters <= STAMP_RADIUS_METERS &&
      candidate.distanceMeters <= STAMP_RADIUS_METERS &&
      !candidate.collected
    : false;

  const [stampBurstKey, setStampBurstKey] = useState(0);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setStampBurstKey(0);
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
        burstTimerRef.current = null;
      }
      return () => {
        if (burstTimerRef.current) {
          clearTimeout(burstTimerRef.current);
          burstTimerRef.current = null;
        }
      };
    }, []),
  );

  useEffect(
    () => () => {
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
      }
    },
    [],
  );

  const statusLabel = getStatusLabel({ candidate, canVerify });
  const statusTone = getStatusTone({ candidate, canVerify });
  const statusHint = getStatusHint({
    candidate,
    canVerify,
    locationAccuracyMeters,
    locationAvailable,
    locationStatus,
  });
  const accessibilityHint = canVerify
    ? '길게 눌러 도장을 찍습니다.'
    : (statusHint ?? '도장을 찍을 수 없는 상태입니다.');

  const handleLongPress = useCallback(() => {
    if (!candidate || !canVerify || !onCollect) {
      return;
    }

    setStampBurstKey((current) => current + 1);
    onCollect();

    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
    }

    burstTimerRef.current = setTimeout(() => {
      setStampBurstKey(0);
      burstTimerRef.current = null;
    }, 680);
  }, [canVerify, candidate, onCollect]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Badge tone="brand" size="sm">
              도장
            </Badge>
            <AppText variant="h1" tone="ink" numberOfLines={1}>
              도장 찍기
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
              장소에 도착하면 길게 눌러 실제 도장을 찍듯 인증합니다.
            </AppText>
          </View>

          <View style={styles.headerState}>
            <Badge tone={statusTone} size="sm">
              {statusLabel}
            </Badge>
          </View>
        </View>

        <View style={styles.stage}>
          <View style={styles.stageMeta}>
            <AppText variant="h2" tone="ink" numberOfLines={1} style={styles.placeTitle}>
              {candidate?.title ?? '주변 도장을 찾는 중'}
            </AppText>
            <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
              {candidate ? statusHint : '가까운 장소가 잡히면 도장 영역이 나타납니다.'}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={candidate ? `${candidate.title} 도장 영역` : '도장 대기 영역'}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: !canVerify }}
            delayLongPress={420}
            disabled={!canVerify}
            onLongPress={handleLongPress}
            style={({ pressed }) => [
              styles.stampTarget,
              pressed && canVerify && styles.stampTargetPressed,
              !canVerify && styles.stampTargetDisabled,
            ]}
          >
            <View style={styles.stampRing}>
              <View style={styles.stampCore}>
                {stampBurstKey > 0 ? (
                  <View style={styles.stampDropLayer}>
                    <StampDrop key={stampBurstKey} />
                  </View>
                ) : (
                  <>
                    <AppText
                      variant="title"
                      tone={canVerify ? 'brand' : 'inkMuted'}
                      numberOfLines={1}
                    >
                      꾹~
                    </AppText>
                    <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
                      {getTargetPrompt({ candidate, canVerify })}
                    </AppText>
                  </>
                )}
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusTone = ({
  candidate,
  canVerify,
}: {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
}): 'done' | 'ready' | 'neutral' => {
  if (candidate?.collected) {
    return 'done';
  }

  return canVerify ? 'ready' : 'neutral';
};

const getStatusLabel = ({
  candidate,
  canVerify,
}: {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
}) => {
  if (!candidate) {
    return '대기 중';
  }

  if (candidate.collected) {
    return '수집 완료';
  }

  return canVerify ? '도장 가능' : '이동 필요';
};

const getStatusHint = ({
  candidate,
  canVerify,
  locationAccuracyMeters,
  locationAvailable,
  locationStatus,
}: {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
  readonly locationAccuracyMeters: number | null;
  readonly locationAvailable: boolean;
  readonly locationStatus: StampLocationStatus;
}) => {
  if (!candidate) {
    return '주변 장소를 찾고 있어요.';
  }

  if (candidate.collected) {
    return '이미 이 장소의 도장을 찍었습니다.';
  }

  if (canVerify) {
    return '길게 눌러 도장을 찍으세요.';
  }

  if (locationStatus === 'denied') {
    return '위치 권한을 허용해야 도장을 찍을 수 있어요.';
  }

  if (locationStatus === 'loading' || locationStatus === 'unavailable' || !locationAvailable) {
    return 'GPS 확인 중';
  }

  if (locationAccuracyMeters === null) {
    return 'GPS 확인 중';
  }

  if (candidate.distanceMeters > STAMP_RADIUS_METERS) {
    return `반경 ${STAMP_RADIUS_METERS}m 안으로 이동하세요.`;
  }

  if (locationAccuracyMeters > STAMP_RADIUS_METERS) {
    return '위치 정확도가 아직 부족해요.';
  }

  return '상태를 확인하는 중이에요.';
};

const getTargetPrompt = ({
  candidate,
  canVerify,
}: {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
}) => {
  if (!candidate) {
    return '주변 도장을 기다리는 중';
  }

  if (candidate.collected) {
    return '이미 찍은 도장';
  }

  return canVerify ? '길게 눌러 도장 찍기' : '도장 불가';
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  headerState: {
    alignSelf: 'flex-start',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  stageMeta: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  placeTitle: {
    textAlign: 'center',
  },
  stampTarget: {
    width: '100%',
    maxWidth: 296,
    aspectRatio: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...shadow.e2,
  },
  stampTargetPressed: {
    transform: [{ scale: 0.985 }],
  },
  stampTargetDisabled: {
    opacity: 0.62,
  },
  stampRing: {
    width: '74%',
    aspectRatio: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 12,
    borderColor: colors.brandSoft,
    backgroundColor: colors.surfaceSink,
  },
  stampCore: {
    width: '72%',
    aspectRatio: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  stampDropLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
