import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { AppText, Badge, Button, colors, Surface } from '@shared/ui';
import type { MapSpotPin } from '../model';
import { mapSheetStyles as styles } from './MapSheet.styles';
import { getSpotStatusBadgeLabel, getSpotStatusLabel, getSpotStatusTone } from './MapView.helpers';
import { styles as mapViewStyles } from './MapView.styles';

interface MapSpotSheetProps {
  readonly directionMessage: string;
  readonly filteredSpots: readonly MapSpotPin[];
  readonly selectedSpot: MapSpotPin;
  readonly sheetExpanded: boolean;
  readonly onOpenDirections: () => void;
  readonly onOpenSpotDetail?: (contentId: string) => void;
  readonly onOpenStamp?: (contentId: string) => void;
  readonly onSelectSpot: (contentId: string) => void;
}

export function MapSpotSheet({
  directionMessage,
  filteredSpots,
  selectedSpot,
  sheetExpanded,
  onOpenDirections,
  onOpenSpotDetail,
  onOpenStamp,
  onSelectSpot,
}: MapSpotSheetProps) {
  return (
    <>
      <View style={styles.sheetMain}>
        <PlaceThumb thumbnailUrl={selectedSpot.thumbnailUrl} />
        <View style={styles.sheetCopy}>
          <View style={styles.sheetTitleRow}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              {selectedSpot.title}
            </AppText>
            <Ionicons name="share-outline" size={18} color={colors.inkSubtle} />
          </View>
          <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
            {selectedSpot.address} · 한국관광공사 인증 스팟
          </AppText>
          <View style={styles.badgeRow}>
            <Badge tone={getSpotStatusTone(selectedSpot)} size="sm">
              {getSpotStatusLabel(selectedSpot)}
            </Badge>
            <Badge tone="neutral" size="sm">
              {selectedSpot.distanceMeters}m · 도보 1분
            </Badge>
          </View>
        </View>
      </View>

      <Surface elevation="none" radius="md" style={styles.sheetNotice}>
        <AppText variant="caption" tone="inkSoft" numberOfLines={1}>
          {directionMessage}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${selectedSpot.title} 상세 보기`}
          onPress={() => onOpenSpotDetail?.(selectedSpot.contentId)}
        >
          <AppText variant="captionBold" style={styles.detailText} numberOfLines={1}>
            상세 보기
          </AppText>
        </Pressable>
      </Surface>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${selectedSpot.title} 카카오 길찾기`}
          onPress={onOpenDirections}
          style={({ pressed }) => [styles.routeButton, pressed ? mapViewStyles.pressed : null]}
        >
          <Ionicons name="navigate-outline" size={21} color={colors.ink} />
        </Pressable>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onPress={() => onOpenStamp?.(selectedSpot.contentId)}
          accessibilityLabel={`${selectedSpot.title} 도장 찍기`}
        >
          도장 찍기
        </Button>
      </View>

      {sheetExpanded && filteredSpots.length > 0 ? (
        <View style={[styles.fallbackList, sheetExpanded ? styles.fallbackListExpanded : null]}>
          <View style={styles.fallbackListHeader}>
            <View style={styles.fallbackListHeaderCopy}>
              <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                주변 스팟
              </AppText>
              <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
                아래로 내리면 다시 접을 수 있어요.
              </AppText>
            </View>
            <View style={styles.fallbackListCount}>
              <AppText variant="captionBold" tone="ink" numberOfLines={1}>
                {filteredSpots.length}개
              </AppText>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={sheetExpanded}
            scrollEnabled={sheetExpanded}
            style={sheetExpanded ? styles.fallbackListScroller : null}
            contentContainerStyle={styles.fallbackListContent}
          >
            {filteredSpots.map((spot, index) => {
              const isSelected = spot.contentId === selectedSpot?.contentId;

              return (
                <Pressable
                  key={spot.contentId}
                  accessibilityRole="button"
                  accessibilityLabel={`${spot.title} 지도 선택`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onSelectSpot(spot.contentId)}
                  style={({ pressed }) => [
                    styles.fallbackRow,
                    isSelected ? styles.fallbackRowSelected : null,
                    pressed ? mapViewStyles.pressed : null,
                  ]}
                >
                  <SpotListMark
                    index={index}
                    collected={spot.collected}
                    thumbnailUrl={spot.thumbnailUrl}
                  />

                  <View style={styles.fallbackRowCopy}>
                    <View style={styles.fallbackRowTitleLine}>
                      <AppText
                        variant="captionBold"
                        tone="ink"
                        style={styles.fallbackTitle}
                        numberOfLines={1}
                      >
                        {spot.title}
                      </AppText>
                      <Ionicons name="chevron-forward" size={16} color={colors.inkSubtle} />
                    </View>
                    <AppText variant="micro" tone="inkMuted" numberOfLines={1}>
                      {spot.distanceMeters}m · {getSpotStatusLabel(spot)}
                    </AppText>
                  </View>

                  <Badge tone={getSpotStatusTone(spot)} size="sm">
                    {isSelected ? '선택됨' : getSpotStatusBadgeLabel(spot)}
                  </Badge>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

function PlaceThumb({ thumbnailUrl }: { readonly thumbnailUrl?: string }) {
  return (
    <View style={styles.placeThumb}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbImage} resizeMode="cover" />
      ) : (
        <>
          <View style={styles.thumbSky} />
          <View style={styles.thumbHill} />
          <View style={styles.thumbRoof} />
          <View style={styles.thumbWall} />
        </>
      )}
      <View style={styles.categoryPill}>
        <AppText variant="micro" tone="onDark" numberOfLines={1}>
          고궁
        </AppText>
      </View>
    </View>
  );
}

function SpotListMark({
  collected,
  index,
  thumbnailUrl,
}: {
  readonly collected: boolean;
  readonly index: number;
  readonly thumbnailUrl?: string;
}) {
  return (
    <View style={styles.fallbackRowMark}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.fallbackRowMarkImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.fallbackRowMarkFallback, collected ? styles.fallbackRowMarkDone : null]}
        >
          <AppText variant="captionBold" tone="ink" numberOfLines={1}>
            {String(index + 1).padStart(2, '0')}
          </AppText>
        </View>
      )}
    </View>
  );
}
