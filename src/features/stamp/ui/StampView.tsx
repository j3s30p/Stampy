import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Gauge, StampDrop, colors, radius, shadow, spacing } from '@shared/ui';

export interface StampCandidate {
  readonly kind: 'spot' | 'event';
  readonly contentId: string;
  readonly title: string;
  readonly address: string;
  readonly distanceMeters: number;
  readonly verificationDistanceMeters: number | null;
  readonly collected: boolean;
}

export type StampLocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

interface StampViewProps {
  readonly candidate: StampCandidate | null;
  readonly mode?: 'collection' | 'capture';
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
  readonly onBack?: () => void;
  readonly onCollect?: () => void | Promise<void>;
}

const HOLD_DURATION_MS = 1500;
const HOLD_RING_SIZE = 192;
const HOLD_RING_RADIUS = 86;
const HOLD_RING_CIRCUMFERENCE = 2 * Math.PI * HOLD_RING_RADIUS;

export function StampView(props: StampViewProps) {
  const {
    candidate,
    collectedCount = 0,
    locationAccuracyMeters,
    locationAvailable,
    locationStatus,
    mode = 'collection',
    onBack,
    onCollect,
    recentStamps = [],
    totalCount = 0,
  } = props;
  const displayTotalCount = Math.max(totalCount, collectedCount, 1);
  const canVerify = candidate
    ? locationAvailable &&
      locationAccuracyMeters !== null &&
      locationAccuracyMeters <= STAMP_RADIUS_METERS &&
      candidate.verificationDistanceMeters !== null &&
      candidate.verificationDistanceMeters <= STAMP_RADIUS_METERS &&
      !candidate.collected
    : false;
  const progressPercent = Math.round((collectedCount / displayTotalCount) * 100);

  const [stampBurstKey, setStampBurstKey] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [successSpotTitle, setSuccessSpotTitle] = useState<string | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number>(0);
  const holdCompletedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setStampBurstKey(0);
      setHoldProgress(0);
      setSuccessSpotTitle(null);
      clearHoldTimer(holdTimerRef);
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
        burstTimerRef.current = null;
      }
      return () => {
        clearHoldTimer(holdTimerRef);
        if (burstTimerRef.current) {
          clearTimeout(burstTimerRef.current);
          burstTimerRef.current = null;
        }
      };
    }, []),
  );

  useEffect(
    () => () => {
      clearHoldTimer(holdTimerRef);
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
      }
    },
    [],
  );

  const statusHint = getStatusHint({
    candidate,
    canVerify,
    locationAccuracyMeters,
    locationAvailable,
    locationStatus,
  });

  const finishCollect = useCallback(() => {
    if (!candidate || !canVerify || !onCollect) {
      return;
    }

    holdCompletedRef.current = true;
    clearHoldTimer(holdTimerRef);
    setHoldProgress(1);
    setStampBurstKey((current) => current + 1);
    setSuccessSpotTitle(candidate.title);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    void onCollect();

    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
    }

    burstTimerRef.current = setTimeout(() => {
      setStampBurstKey(0);
      burstTimerRef.current = null;
    }, 760);
  }, [canVerify, candidate, onCollect]);

  const startHold = useCallback(() => {
    if (!candidate || !canVerify || !onCollect) {
      return;
    }

    clearHoldTimer(holdTimerRef);
    holdCompletedRef.current = false;
    holdStartRef.current = Date.now();
    setHoldProgress(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

    holdTimerRef.current = setInterval(() => {
      const nextProgress = Math.min((Date.now() - holdStartRef.current) / HOLD_DURATION_MS, 1);
      setHoldProgress(nextProgress);

      if (nextProgress >= 1) {
        finishCollect();
      }
    }, 50);
  }, [canVerify, candidate, finishCollect, onCollect]);

  const cancelHold = useCallback(() => {
    if (holdCompletedRef.current) {
      return;
    }

    clearHoldTimer(holdTimerRef);
    setHoldProgress(0);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'capture' ? (
          <View style={styles.captureHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" onPress={onBack}>
              <Ionicons name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
            <View style={styles.captureTitleBlock}>
              <AppText variant="h3" tone="ink" numberOfLines={1}>
                도장 찍기
              </AppText>
              <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                {candidate
                  ? `${candidate.title} · ${candidate.kind === 'event' ? '행사' : '관광지'}`
                  : '주변 도장 후보 확인 중'}
              </AppText>
            </View>
            <View style={canVerify ? styles.captureBadgeReady : styles.captureBadge}>
              <AppText variant="micro" tone={canVerify ? 'ink' : 'inkMuted'} numberOfLines={1}>
                {candidate ? `${candidate.distanceMeters}m` : 'GPS'} ·{' '}
                {canVerify ? '인증됨' : '확인 중'}
              </AppText>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <AppText variant="h1" tone="ink" numberOfLines={1}>
                  도장 컬렉션
                </AppText>
                <Ionicons name="search-outline" size={20} color={colors.ink} />
              </View>
              <View style={styles.progressPanel}>
                <View style={styles.progressHead}>
                  <AppText variant="caption" tone="inkSoft" numberOfLines={1}>
                    서울 스탬프 투어 진행률
                  </AppText>
                  <AppText variant="captionBold" tone="brand" numberOfLines={1}>
                    {collectedCount}/{displayTotalCount} · {progressPercent}%
                  </AppText>
                </View>
                <Gauge value={progressPercent} tone="reward" />
              </View>
              <View style={styles.chipRow}>
                {['전체', '수집 완료', '종로구', '중구'].map((label, index) => (
                  <View key={label} style={[styles.chip, index === 0 ? styles.chipActive : null]}>
                    <AppText
                      variant="captionBold"
                      tone={index === 0 ? 'onDark' : 'ink'}
                      numberOfLines={1}
                    >
                      {label}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.grid}>
              {buildGridItems(recentStamps, candidate).map((stamp, index) => (
                <View key={`${stamp.contentId}-${index}`} style={styles.gridItem}>
                  <StampIcon label={getStampGlyph(index)} collected={stamp.collected} />
                  <AppText
                    variant="captionBold"
                    tone="ink"
                    numberOfLines={1}
                    style={styles.centerText}
                  >
                    {stamp.title}
                  </AppText>
                  <AppText
                    variant="micro"
                    tone={stamp.collected ? 'brand' : 'inkMuted'}
                    numberOfLines={1}
                    style={styles.centerText}
                  >
                    {stamp.collected ? '수집 완료' : getStampMeta(stamp, candidate)}
                  </AppText>
                </View>
              ))}
            </View>
          </>
        )}

        {mode === 'capture' ? (
          <>
            <View style={styles.paper}>
              <View style={styles.paperStripe} />
              <AppText variant="micro" style={styles.paperKicker} numberOfLines={1}>
                서울 스탬프 투어
              </AppText>
              <AppText variant="title" tone="ink" numberOfLines={1} style={styles.paperTitle}>
                {candidate?.title ?? '주변 도장을 찾는 중'}
              </AppText>
              <AppText variant="caption" style={styles.paperMeta} numberOfLines={2}>
                {candidate ? candidate.address : '가까운 인증 스팟이 잡히면 도장 영역이 열립니다.'}
              </AppText>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={candidate ? `${candidate.title} 도장 찍기` : '도장 대기 영역'}
                accessibilityHint={canVerify ? '길게 눌러 도장을 찍습니다.' : statusHint}
                accessibilityState={{ disabled: !canVerify }}
                disabled={!canVerify}
                onPressIn={startHold}
                onPressOut={cancelHold}
                style={({ pressed }) => [
                  styles.stampTarget,
                  pressed && canVerify ? styles.stampTargetPressed : null,
                  !canVerify ? styles.stampTargetDisabled : null,
                ]}
              >
                <Svg width={HOLD_RING_SIZE} height={HOLD_RING_SIZE} style={styles.holdRing}>
                  <Circle
                    cx={HOLD_RING_SIZE / 2}
                    cy={HOLD_RING_SIZE / 2}
                    r={HOLD_RING_RADIUS}
                    fill="none"
                    stroke="#D9CDB4"
                    strokeDasharray="6 6"
                    strokeWidth={1.5}
                  />
                  <Circle
                    cx={HOLD_RING_SIZE / 2}
                    cy={HOLD_RING_SIZE / 2}
                    r={HOLD_RING_RADIUS}
                    fill="none"
                    stroke={colors.brand}
                    strokeDasharray={HOLD_RING_CIRCUMFERENCE}
                    strokeDashoffset={HOLD_RING_CIRCUMFERENCE * (1 - holdProgress)}
                    strokeLinecap="round"
                    strokeWidth={6}
                    originX={HOLD_RING_SIZE / 2}
                    originY={HOLD_RING_SIZE / 2}
                    rotation={-90}
                  />
                </Svg>
                {stampBurstKey > 0 ? (
                  <View style={styles.stampDropLayer}>
                    <StampDrop key={stampBurstKey} />
                  </View>
                ) : (
                  <>
                    <Ionicons
                      name="hand-left-outline"
                      size={34}
                      color={canVerify ? colors.brand : '#9C8E72'}
                    />
                    <AppText
                      variant="captionBold"
                      style={canVerify ? styles.holdTextActive : styles.holdText}
                      numberOfLines={1}
                    >
                      여기를 꾹 누르세요
                    </AppText>
                    <AppText variant="micro" style={styles.holdSub} numberOfLines={2}>
                      {holdProgress > 0
                        ? `${Math.round(holdProgress * 100)}%`
                        : canVerify
                          ? '길게 누르면 도장이 찍혀요'
                          : '인증 가능 상태가 아니에요'}
                    </AppText>
                  </>
                )}
              </Pressable>

              <AppText variant="caption" style={styles.paperHint} numberOfLines={2}>
                {statusHint}
              </AppText>
            </View>

            <View style={canVerify ? styles.verifyPanelReady : styles.verifyPanel}>
              <View style={styles.verifyIcon}>
                <Ionicons
                  name={canVerify ? 'checkmark' : 'navigate'}
                  size={18}
                  color={colors.surface}
                />
              </View>
              <View style={styles.verifyCopy}>
                <AppText variant="bodyBold" tone={canVerify ? 'ink' : 'inkSoft'} numberOfLines={1}>
                  {canVerify ? '도장 찍기 준비 완료' : '위치 인증 대기 중'}
                </AppText>
                <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
                  {canVerify
                    ? holdProgress >= 1
                      ? `${candidate?.title ?? '선택한 스팟'} 도장을 수집했어요.`
                      : `${candidate?.title ?? '선택한 스팟'} 도장을 수집할 수 있어요.`
                    : statusHint}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="도장 길게 누르기"
                accessibilityHint={canVerify ? '길게 눌러 도장을 찍습니다.' : statusHint}
                accessibilityState={{ disabled: !canVerify }}
                disabled={!canVerify}
                onPressIn={startHold}
                onPressOut={cancelHold}
                style={({ pressed }) => [
                  styles.longPressButton,
                  !canVerify ? styles.longPressButtonDisabled : null,
                  pressed && canVerify ? styles.pressed : null,
                ]}
              >
                <AppText variant="bodyBold" tone={canVerify ? 'ink' : 'inkMuted'} numberOfLines={1}>
                  {holdProgress > 0 ? `${Math.round(holdProgress * 100)}%` : '길게 누르기'}
                </AppText>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>

      {mode === 'capture' ? (
        <StampSuccessModal
          collectedCount={collectedCount}
          onClose={() => setSuccessSpotTitle(null)}
          spotTitle={successSpotTitle}
          totalCount={displayTotalCount}
        />
      ) : null}
    </SafeAreaView>
  );
}

function StampIcon({ collected, label }: { readonly collected: boolean; readonly label: string }) {
  return (
    <View style={[styles.stampIcon, collected ? styles.stampIconDone : styles.stampIconLocked]}>
      {collected ? (
        <AppText variant="h3" style={styles.stampIconText} numberOfLines={1}>
          {label}
        </AppText>
      ) : (
        <Ionicons name="lock-closed" size={19} color={colors.inkSubtle} />
      )}
    </View>
  );
}

const buildGridItems = (
  recentStamps: readonly {
    readonly contentId: string;
    readonly title: string;
    readonly collected: boolean;
  }[],
  candidate: StampCandidate | null,
) => {
  const knownItems = recentStamps.length > 0 ? recentStamps : [];
  const candidateItem =
    candidate && !knownItems.some((stamp) => stamp.contentId === candidate.contentId)
      ? [{ contentId: candidate.contentId, title: candidate.title, collected: candidate.collected }]
      : [];
  const filler = [
    { contentId: 'mock-cheonggye', title: '청계천', collected: false },
    { contentId: 'mock-deoksu', title: '덕수궁', collected: false },
    { contentId: 'mock-market', title: '광장시장', collected: false },
    { contentId: 'mock-cathedral', title: '명동성당', collected: false },
    { contentId: 'mock-forest', title: '서울숲', collected: false },
  ];

  return [...knownItems, ...candidateItem, ...filler].slice(0, 9);
};

const getStampMeta = (stamp: { readonly contentId: string }, candidate: StampCandidate | null) => {
  if (
    candidate?.contentId === stamp.contentId &&
    candidate.verificationDistanceMeters !== null &&
    candidate.verificationDistanceMeters <= STAMP_RADIUS_METERS
  ) {
    return `${candidate.distanceMeters}m · 인증 가능`;
  }

  if (candidate?.contentId === stamp.contentId) {
    return `${candidate.distanceMeters}m`;
  }

  return '방문 전';
};

const getStampGlyph = (index: number) =>
  ['村', '宮', '塔', '門', '川', '德', '場', '聖', '林'][index] ?? '印';

function StampSuccessModal({
  collectedCount,
  onClose,
  spotTitle,
  totalCount,
}: {
  readonly collectedCount: number;
  readonly onClose: () => void;
  readonly spotTitle: string | null;
  readonly totalCount: number;
}) {
  const nextCollectedCount = Math.min(totalCount, collectedCount + 1);
  const nextProgressPercent = Math.round((nextCollectedCount / totalCount) * 100);

  return (
    <Modal animationType="fade" transparent visible={spotTitle !== null} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.successCard}>
          <View style={styles.successStampWrap}>
            <View style={styles.successStamp}>
              <AppText variant="display" style={styles.successStampGlyph} numberOfLines={1}>
                宮
              </AppText>
            </View>
            <View style={styles.successCheck}>
              <Ionicons name="checkmark" size={18} color={colors.surface} />
            </View>
          </View>

          <AppText variant="h2" tone="ink" style={styles.successTitle} numberOfLines={2}>
            {spotTitle ?? '스팟'} 도장을 획득했어요!
          </AppText>
          <AppText variant="caption" tone="inkMuted" style={styles.successMeta} numberOfLines={2}>
            GPS 위치 인증 완료
          </AppText>

          <View style={styles.successProgress}>
            <View style={styles.successProgressHead}>
              <AppText variant="caption" tone="inkSoft" numberOfLines={1}>
                서울 스탬프 투어
              </AppText>
              <AppText variant="captionBold" tone="brand" numberOfLines={1}>
                도장 {nextCollectedCount}/{totalCount}
              </AppText>
            </View>
            <Gauge value={nextProgressPercent} tone="reward" />
            <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
              다음 보상 고궁 마스터 배지까지 도장 {Math.max(0, 5 - nextCollectedCount)}개
            </AppText>
          </View>

          <View style={styles.successActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="공유하기"
              onPress={onClose}
              style={styles.successSecondaryButton}
            >
              <AppText variant="bodyBold" tone="ink" numberOfLines={1}>
                공유하기
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="컬렉션 보기"
              onPress={onClose}
              style={styles.successPrimaryButton}
            >
              <AppText variant="bodyBold" tone="onDark" numberOfLines={1}>
                컬렉션 보기
              </AppText>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="계속 둘러보기"
            onPress={onClose}
          >
            <AppText
              variant="caption"
              tone="inkMuted"
              style={styles.successClose}
              numberOfLines={1}
            >
              계속 둘러보기
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const clearHoldTimer = (
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
) => {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
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
    return '도장 영역을 꾹 누르고 있으면 인증이 완료돼요.';
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

  if (
    candidate.verificationDistanceMeters !== null &&
    candidate.verificationDistanceMeters > STAMP_RADIUS_METERS
  ) {
    return `반경 ${STAMP_RADIUS_METERS}m 안으로 이동하세요.`;
  }

  if (locationAccuracyMeters > STAMP_RADIUS_METERS) {
    return '위치 정확도가 아직 부족해요.';
  }

  return '상태를 확인하는 중이에요.';
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  captureHeader: {
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  captureTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  captureBadge: {
    maxWidth: 104,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSink,
  },
  captureBadgeReady: {
    maxWidth: 112,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: '#E7F7EE',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressPanel: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.canvas,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '31.7%',
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stampIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampIconDone: {
    borderWidth: 2,
    borderColor: colors.stamp,
    backgroundColor: '#E7F7EE',
  },
  stampIconLocked: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#B8C2D0',
    backgroundColor: colors.canvas,
  },
  stampIconText: {
    color: colors.stampInk,
  },
  centerText: {
    textAlign: 'center',
  },
  paper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DFCC',
    backgroundColor: '#FBF7EF',
    overflow: 'hidden',
  },
  paperStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: colors.brand,
  },
  paperKicker: {
    color: '#9C8E72',
  },
  paperTitle: {
    textAlign: 'center',
  },
  paperMeta: {
    color: '#9C8E72',
    textAlign: 'center',
  },
  stampTarget: {
    width: 192,
    height: 192,
    marginTop: spacing.lg,
    borderRadius: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D9CDB4',
    backgroundColor: colors.surface,
    ...shadow.e1,
  },
  holdRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stampTargetPressed: {
    transform: [{ scale: 0.985 }],
    borderColor: colors.brand,
  },
  stampTargetDisabled: {
    opacity: 0.7,
  },
  stampDropLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdText: {
    color: '#9C8E72',
  },
  holdTextActive: {
    color: colors.brand,
  },
  holdSub: {
    maxWidth: 136,
    color: '#C2B69A',
    textAlign: 'center',
  },
  paperHint: {
    minHeight: 36,
    color: '#9C8E72',
    textAlign: 'center',
  },
  verifyPanel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  verifyPanelReady: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: '#E7F7EE',
  },
  verifyIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stamp,
  },
  verifyCopy: {
    flex: 1,
    minWidth: 0,
  },
  longPressButton: {
    minWidth: 96,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  longPressButtonDisabled: {
    backgroundColor: colors.surfaceSink,
  },
  pressed: {
    opacity: 0.86,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(17, 32, 51, 0.55)',
  },
  successCard: {
    width: '100%',
    maxWidth: 296,
    alignItems: 'center',
    paddingTop: 26,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderRadius: 24,
    backgroundColor: colors.surface,
    ...shadow.e3,
  },
  successStampWrap: {
    position: 'relative',
  },
  successStamp: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.stamp,
    backgroundColor: '#E7F7EE',
    transform: [{ rotate: '-7deg' }],
  },
  successStampGlyph: {
    color: colors.stampInk,
  },
  successCheck: {
    position: 'absolute',
    right: -6,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.stamp,
  },
  successTitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  successMeta: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  successProgress: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.canvas,
  },
  successProgressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  successActions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  successSecondaryButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  successPrimaryButton: {
    flex: 1.4,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.brand,
  },
  successClose: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
