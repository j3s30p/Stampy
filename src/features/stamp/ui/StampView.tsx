import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { StampCaptureView } from './StampCaptureView';
import { StampCollectionView } from './StampCollectionView';
import { StampSuccessModal } from './StampSuccessModal';
import { HOLD_DURATION_MS, clearHoldTimer, getStatusHint } from './StampView.helpers';
import { styles } from './StampView.styles';
import type { StampLocationStatus, StampViewProps } from './StampView.types';

export type { StampLocationStatus };

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
          <StampCaptureView
            candidate={candidate}
            canVerify={canVerify}
            holdProgress={holdProgress}
            onBack={onBack}
            onHoldCancel={cancelHold}
            onHoldStart={startHold}
            stampBurstKey={stampBurstKey}
            statusHint={statusHint}
          />
        ) : (
          <StampCollectionView
            candidate={candidate}
            collectedCount={collectedCount}
            displayTotalCount={displayTotalCount}
            progressPercent={progressPercent}
            recentStamps={recentStamps}
          />
        )}
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
