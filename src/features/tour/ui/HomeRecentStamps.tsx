import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';
import type { HomeTourSpot } from '@features/tour/model';
import { AppText, Surface, colors } from '@shared/ui';
import { getStampGlyph } from './HomeView.helpers';
import { styles } from './HomeView.styles';

export function RecentStampRow({
  spots,
  onSelectSpot,
}: {
  readonly spots: readonly HomeTourSpot[];
  readonly onSelectSpot?: (contentId: string) => void;
}) {
  return (
    <View style={styles.recentRow}>
      {spots.map((spot, index) => (
        <Pressable
          key={spot.contentId}
          accessibilityRole="button"
          accessibilityLabel={`${spot.title} 상세 보기`}
          onPress={() => onSelectSpot?.(spot.contentId)}
          style={({ pressed }) => [styles.recentPressable, pressed ? styles.pressed : null]}
        >
          <Surface elevation="none" radius="md" style={styles.recentCard}>
            <StampMedallion label={getStampGlyph(index)} collected={spot.collected} />
            <AppText variant="captionBold" tone="ink" numberOfLines={1} style={styles.centerText}>
              {spot.title}
            </AppText>
            <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
              {spot.collected ? '6월 수집' : `${spot.distanceMeters}m`}
            </AppText>
          </Surface>
        </Pressable>
      ))}
    </View>
  );
}

function StampMedallion({
  collected,
  label,
}: {
  readonly collected: boolean;
  readonly label: string;
}) {
  return (
    <View style={[styles.stampMedallion, collected ? styles.stampDone : styles.stampLocked]}>
      {collected ? (
        <AppText variant="h3" style={styles.stampDoneText} numberOfLines={1}>
          {label}
        </AppText>
      ) : (
        <Ionicons name="lock-closed" size={17} color={colors.inkSubtle} />
      )}
    </View>
  );
}
