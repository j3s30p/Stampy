import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { StampCandidate } from '@features/stamp/model';
import { AppText, StampDrop, colors } from '@shared/ui';
import { HOLD_RING_CIRCUMFERENCE, HOLD_RING_RADIUS, HOLD_RING_SIZE } from './StampView.helpers';
import { stampPaperPalette, styles } from './StampView.styles';

interface StampCaptureViewProps {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
  readonly holdProgress: number;
  readonly onBack?: () => void;
  readonly onHoldCancel: () => void;
  readonly onHoldStart: () => void;
  readonly stampBurstKey: number;
  readonly statusHint: string;
}

export function StampCaptureView({
  candidate,
  canVerify,
  holdProgress,
  onBack,
  onHoldCancel,
  onHoldStart,
  stampBurstKey,
  statusHint,
}: StampCaptureViewProps) {
  return (
    <>
      <StampCaptureHeader candidate={candidate} canVerify={canVerify} onBack={onBack} />
      <StampPaper
        candidate={candidate}
        canVerify={canVerify}
        holdProgress={holdProgress}
        onHoldCancel={onHoldCancel}
        onHoldStart={onHoldStart}
        stampBurstKey={stampBurstKey}
        statusHint={statusHint}
      />
      <StampVerifyPanel
        candidate={candidate}
        canVerify={canVerify}
        holdProgress={holdProgress}
        onHoldCancel={onHoldCancel}
        onHoldStart={onHoldStart}
        statusHint={statusHint}
      />
    </>
  );
}

function StampCaptureHeader({
  candidate,
  canVerify,
  onBack,
}: {
  readonly candidate: StampCandidate | null;
  readonly canVerify: boolean;
  readonly onBack?: () => void;
}) {
  return (
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
          {candidate ? `${candidate.distanceMeters}m` : 'GPS'} · {canVerify ? '인증됨' : '확인 중'}
        </AppText>
      </View>
    </View>
  );
}

function StampPaper({
  candidate,
  canVerify,
  holdProgress,
  onHoldCancel,
  onHoldStart,
  stampBurstKey,
  statusHint,
}: Omit<StampCaptureViewProps, 'onBack'>) {
  return (
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
        onPressIn={onHoldStart}
        onPressOut={onHoldCancel}
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
            stroke={stampPaperPalette.dashedBorder}
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
              color={canVerify ? colors.brand : stampPaperPalette.ink}
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
  );
}

function StampVerifyPanel({
  candidate,
  canVerify,
  holdProgress,
  onHoldCancel,
  onHoldStart,
  statusHint,
}: Omit<StampCaptureViewProps, 'onBack' | 'stampBurstKey'>) {
  return (
    <View style={canVerify ? styles.verifyPanelReady : styles.verifyPanel}>
      <View style={styles.verifyIcon}>
        <Ionicons name={canVerify ? 'checkmark' : 'navigate'} size={18} color={colors.surface} />
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
        onPressIn={onHoldStart}
        onPressOut={onHoldCancel}
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
  );
}
