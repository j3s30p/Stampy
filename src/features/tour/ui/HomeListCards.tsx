import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, View } from 'react-native';
import type { HomeTourEvent, HomeTourSpot } from '@features/tour/model';
import { AppText, Badge, Surface, colors } from '@shared/ui';
import {
  formatEventPeriod,
  getEventStatusLabel,
  getSpotStatusLabel,
  getSpotStatusTone,
} from './HomeView.helpers';
import { styles } from './HomeView.styles';

export function TourEventList({
  events,
  onSelectEvent,
}: {
  readonly events: readonly HomeTourEvent[];
  readonly onSelectEvent?: (contentId: string) => void;
}) {
  return (
    <View style={styles.eventList}>
      {events.map((event) => (
        <Pressable
          key={event.contentId}
          accessibilityRole="button"
          accessibilityLabel={`${event.title} 행사 상세 보기`}
          accessibilityHint={`${formatEventPeriod(event)} · ${event.distanceMeters}m`}
          onPress={() => onSelectEvent?.(event.contentId)}
          style={({ pressed }) => [styles.spotPressable, pressed ? styles.pressed : null]}
        >
          <Surface elevation="none" radius="md" style={styles.eventCard}>
            <EventListMark thumbnailUrl={event.thumbnailUrl ?? event.imageUrls[0]} />

            <View style={styles.spotCopy}>
              <View style={styles.spotTitleRow}>
                <AppText variant="h3" tone="ink" numberOfLines={1} style={styles.spotTitle}>
                  {event.title}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.inkSubtle} />
              </View>
              <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                {event.address}
              </AppText>
              <View style={styles.spotMetaRow}>
                <Badge tone={event.collected ? 'done' : 'ready'} size="sm">
                  {event.collected ? '수집 완료' : getEventStatusLabel(event)}
                </Badge>
                <AppText variant="captionBold" tone="inkSoft" numberOfLines={1}>
                  {formatEventPeriod(event)} · {event.distanceMeters}m
                </AppText>
              </View>
            </View>
          </Surface>
        </Pressable>
      ))}
    </View>
  );
}

export function TourSpotList({
  spots,
  onSelectSpot,
}: {
  readonly spots: readonly HomeTourSpot[];
  readonly onSelectSpot?: (contentId: string) => void;
}) {
  return (
    <View style={styles.spotList}>
      {spots.map((spot, index) => (
        <Pressable
          key={spot.contentId}
          accessibilityRole="button"
          accessibilityLabel={`${spot.title} 상세 보기`}
          accessibilityHint={`${getSpotStatusLabel(spot)} · ${spot.distanceMeters}m`}
          onPress={() => onSelectSpot?.(spot.contentId)}
          style={({ pressed }) => [styles.spotPressable, pressed ? styles.pressed : null]}
        >
          <Surface elevation="none" radius="md" style={styles.spotCard}>
            <SpotListMark
              index={index}
              collected={spot.collected}
              thumbnailUrl={spot.thumbnailUrl}
            />

            <View style={styles.spotCopy}>
              <View style={styles.spotTitleRow}>
                <AppText variant="h3" tone="ink" numberOfLines={1} style={styles.spotTitle}>
                  {spot.title}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.inkSubtle} />
              </View>
              <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
                {spot.address}
              </AppText>
              <View style={styles.spotMetaRow}>
                <Badge tone={getSpotStatusTone(spot)} size="sm">
                  {getSpotStatusLabel(spot)}
                </Badge>
                <AppText variant="captionBold" tone="inkSoft" numberOfLines={1}>
                  {spot.distanceMeters}m
                </AppText>
              </View>
            </View>
          </Surface>
        </Pressable>
      ))}
    </View>
  );
}

export function PlaceThumb({
  size,
  thumbnailUrl,
}: {
  readonly size: number;
  readonly thumbnailUrl?: string;
}) {
  return (
    <View style={[styles.placeThumb, { width: size, height: size, borderRadius: size * 0.22 }]}>
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
    </View>
  );
}

export function EventListMark({ thumbnailUrl }: { readonly thumbnailUrl?: string }) {
  return (
    <View style={styles.eventMark}>
      {thumbnailUrl ? (
        <>
          <Image source={{ uri: thumbnailUrl }} style={styles.eventMarkImage} resizeMode="cover" />
          <View style={styles.eventImagePill}>
            <AppText variant="micro" tone="onDark" numberOfLines={1}>
              행사
            </AppText>
          </View>
        </>
      ) : (
        <View style={styles.eventMarkFallback}>
          <Ionicons name="calendar-clear-outline" size={18} color={colors.surface} />
          <AppText variant="micro" tone="onDark" numberOfLines={1}>
            행사
          </AppText>
        </View>
      )}
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
    <View style={styles.spotMark}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.spotMarkImage} resizeMode="cover" />
      ) : (
        <View style={[styles.spotMarkFallback, collected ? styles.spotMarkFallbackDone : null]}>
          <AppText variant="captionBold" tone={collected ? 'ink' : 'inkMuted'} numberOfLines={1}>
            {String(index + 1).padStart(2, '0')}
          </AppText>
        </View>
      )}
    </View>
  );
}
