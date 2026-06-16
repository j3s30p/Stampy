import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, colors } from '@shared/ui';
import type { MapSpotPin } from '../model';
import { fallbackMapStageStyles as styles } from './MapFallbackMapStage.styles';

interface MapFallbackMapStageProps {
  readonly selectedSpot: MapSpotPin | null;
  readonly filteredSpots: readonly MapSpotPin[];
  readonly mapErrorMessage: string | null;
}

export function MapFallbackMapStage({
  selectedSpot,
  filteredSpots,
  mapErrorMessage,
}: MapFallbackMapStageProps) {
  const fallbackSpot = selectedSpot ?? filteredSpots[0] ?? null;
  const previewSpots = filteredSpots.slice(0, 3);
  const distanceLabel = fallbackSpot ? `${fallbackSpot.distanceMeters}m` : '0m';

  return (
    <View style={styles.emptyMap}>
      <View style={styles.fallbackBackdrop} />
      <View style={styles.fallbackGrid} />

      <View style={styles.fallbackBadge}>
        <Ionicons name="location-outline" size={13} color={colors.ink} />
        <AppText variant="micro" tone="ink" numberOfLines={1}>
          서울시청 기준
        </AppText>
      </View>

      <View style={styles.fallbackStatus}>
        <AppText variant="captionBold" tone="ink" numberOfLines={1}>
          Kakao 지도 대기 중
        </AppText>
        {mapErrorMessage ? (
          <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
            {mapErrorMessage}
          </AppText>
        ) : null}
      </View>

      <View style={styles.fallbackRadiusRingOuter} />
      <View style={styles.fallbackRadiusRingInner} />
      <View style={styles.fallbackRadiusCore} />
      <View style={styles.fallbackRadiusLabel}>
        <AppText variant="micro" tone="ink" numberOfLines={1}>
          {STAMP_RADIUS_METERS}m 반경
        </AppText>
      </View>

      <View style={styles.fallbackTarget}>
        <Ionicons name="location-sharp" size={25} color={colors.brand} />
        <View style={styles.fallbackTargetCopy}>
          <AppText variant="captionBold" tone="ink" numberOfLines={1}>
            {fallbackSpot ? fallbackSpot.title : '선택된 스팟 없음'}
          </AppText>
          <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
            {fallbackSpot ? distanceLabel : '스팟을 불러오면 표시됩니다'}
          </AppText>
        </View>
      </View>

      <View style={styles.fallbackSpotStrip}>
        {previewSpots.length > 0 ? (
          previewSpots.map((spot) => (
            <View key={spot.contentId} style={styles.fallbackSpotChip}>
              <View
                style={[
                  styles.fallbackSpotDot,
                  spot.collected ? styles.fallbackSpotDotCollected : null,
                ]}
              />
              <AppText variant="micro" tone="ink" numberOfLines={1} style={styles.fallbackSpotText}>
                {spot.title}
              </AppText>
            </View>
          ))
        ) : (
          <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
            스팟을 불러오는 중
          </AppText>
        )}
      </View>
    </View>
  );
}
