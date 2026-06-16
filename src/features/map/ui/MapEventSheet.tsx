import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, View } from 'react-native';
import { AppText, Badge, Button, colors, Surface } from '@shared/ui';
import type { MapEventPin } from '../model';
import { mapSheetStyles as styles } from './MapSheet.styles';
import { formatEventPeriod, getEventStatusLabel } from './MapView.helpers';

interface MapEventSheetProps {
  readonly directionMessage: string;
  readonly event: MapEventPin;
  readonly onOpenEventDetail?: (contentId: string) => void;
  readonly onOpenStamp?: (contentId: string) => void;
}

export function MapEventSheet({
  directionMessage,
  event,
  onOpenEventDetail,
  onOpenStamp,
}: MapEventSheetProps) {
  return (
    <>
      <View style={styles.sheetMain}>
        <EventThumb thumbnailUrl={event.thumbnailUrl} />
        <View style={styles.sheetCopy}>
          <View style={styles.sheetTitleRow}>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              {event.title}
            </AppText>
            <Ionicons name="ticket-outline" size={18} color={colors.locationDot} />
          </View>
          <AppText variant="caption" tone="inkMuted" numberOfLines={2}>
            {event.address} · 기간이 있는 행사 도장
          </AppText>
          <View style={styles.badgeRow}>
            <Badge tone={event.collected ? 'done' : 'ready'} size="sm">
              {event.collected ? '수집 완료' : getEventStatusLabel(event)}
            </Badge>
            <Badge tone="neutral" size="sm">
              {formatEventPeriod(event)}
            </Badge>
            <Badge tone="neutral" size="sm">
              {event.distanceMeters}m
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
          accessibilityLabel={`${event.title} 행사 상세 보기`}
          onPress={() => onOpenEventDetail?.(event.contentId)}
        >
          <AppText variant="captionBold" style={styles.detailText} numberOfLines={1}>
            상세 보기
          </AppText>
        </Pressable>
      </Surface>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${event.title} 행사 상세 보기`}
          onPress={() => onOpenEventDetail?.(event.contentId)}
          style={styles.routeButton}
        >
          <Ionicons name="information-circle-outline" size={21} color={colors.locationDot} />
        </Pressable>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onPress={() => onOpenStamp?.(event.contentId)}
          accessibilityLabel={`${event.title} 행사 도장 찍기`}
        >
          행사 도장 찍기
        </Button>
      </View>
    </>
  );
}

function EventThumb({ thumbnailUrl }: { readonly thumbnailUrl?: string }) {
  return (
    <View style={styles.eventThumb}>
      {thumbnailUrl ? (
        <>
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbImage} resizeMode="cover" />
          <View style={styles.eventThumbLabel}>
            <AppText variant="micro" tone="onDark" numberOfLines={1}>
              행사
            </AppText>
          </View>
        </>
      ) : (
        <View style={styles.eventThumbFallback}>
          <Ionicons name="calendar-clear-outline" size={28} color={colors.surface} />
          <AppText variant="micro" tone="onDark" numberOfLines={1}>
            행사
          </AppText>
        </View>
      )}
    </View>
  );
}
