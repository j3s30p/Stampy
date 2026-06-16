import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import type { StampCandidate } from '@features/stamp/model';
import { AppText, Gauge, colors } from '@shared/ui';
import { buildGridItems, getStampGlyph, getStampMeta } from './StampView.helpers';
import { styles } from './StampView.styles';
import type { RecentStamp } from './StampView.types';

interface StampCollectionViewProps {
  readonly candidate: StampCandidate | null;
  readonly collectedCount: number;
  readonly displayTotalCount: number;
  readonly progressPercent: number;
  readonly recentStamps: readonly RecentStamp[];
}

export function StampCollectionView({
  candidate,
  collectedCount,
  displayTotalCount,
  progressPercent,
  recentStamps,
}: StampCollectionViewProps) {
  return (
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
            <AppText variant="captionBold" tone="ink" numberOfLines={1} style={styles.centerText}>
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
