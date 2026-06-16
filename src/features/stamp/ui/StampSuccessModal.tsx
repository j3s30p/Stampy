import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, View } from 'react-native';
import { AppText, Gauge, colors } from '@shared/ui';
import { styles } from './StampView.styles';

interface StampSuccessModalProps {
  readonly collectedCount: number;
  readonly onClose: () => void;
  readonly spotTitle: string | null;
  readonly totalCount: number;
}

export function StampSuccessModal({
  collectedCount,
  onClose,
  spotTitle,
  totalCount,
}: StampSuccessModalProps) {
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
