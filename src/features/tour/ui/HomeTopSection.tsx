import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';
import { STAMP_RADIUS_METERS } from '@shared/config';
import { AppText, Gauge, Surface, colors } from '@shared/ui';
import { EventListMark, PlaceThumb } from './HomeListCards';
import { styles } from './HomeView.styles';
import type { HomeContentMode, RecommendedHomeItem } from './HomeView.types';

export function HomeProgressCard({
  collectedCount,
  displayTotalCount,
  progressPercent,
}: {
  readonly collectedCount: number;
  readonly displayTotalCount: number;
  readonly progressPercent: number;
}) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHead}>
        <AppText variant="caption" style={styles.progressSub} numberOfLines={1}>
          서울 스탬프 투어
        </AppText>
        <AppText variant="captionBold" tone="onDark" numberOfLines={1}>
          도장 {collectedCount}/{displayTotalCount}
        </AppText>
      </View>
      <Gauge value={progressPercent} tone="reward" />
      <View style={styles.progressFoot}>
        <AppText variant="caption" style={styles.progressSub} numberOfLines={1}>
          다음 보상까지 도장 {Math.max(0, 5 - collectedCount)}개
        </AppText>
        <AppText variant="captionBold" style={styles.progressAction} numberOfLines={1}>
          컬렉션 보기
        </AppText>
      </View>
    </View>
  );
}

export function RecommendedItemsCard({
  items,
  onSelectItem,
}: {
  readonly items: readonly RecommendedHomeItem[];
  readonly onSelectItem: (item: RecommendedHomeItem) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Surface elevation="none" radius="lg" style={styles.readyCard}>
      <View style={styles.readyStateRow}>
        <View style={styles.readyDot} />
        <AppText variant="captionBold" style={styles.readyStateText} numberOfLines={1}>
          추천 스팟
        </AppText>
      </View>

      <View style={styles.readyList}>
        {items.map((item) => (
          <RecommendedItemRow
            key={`${item.kind}-${item.contentId}`}
            item={item}
            onPress={() => onSelectItem(item)}
          />
        ))}
      </View>
    </Surface>
  );
}

export function HomeContentSwitcher({
  activeContentMode,
  eventCount,
  nearbySpotCount,
  onChangeMode,
}: {
  readonly activeContentMode: HomeContentMode;
  readonly eventCount: number;
  readonly nearbySpotCount: number;
  readonly onChangeMode: (mode: HomeContentMode) => void;
}) {
  return (
    <View style={styles.contentSwitcher}>
      <SegmentButton
        active={activeContentMode === 'spot'}
        count={nearbySpotCount}
        icon="image-outline"
        label="관광지"
        onPress={() => onChangeMode('spot')}
      />
      <SegmentButton
        active={activeContentMode === 'event'}
        count={eventCount}
        icon="calendar-clear-outline"
        label="행사"
        onPress={() => onChangeMode('event')}
      />
    </View>
  );
}

function SegmentButton({
  active,
  count,
  icon,
  label,
  onPress,
}: {
  readonly active: boolean;
  readonly count: number;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} 목록 보기`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        active ? styles.segmentButtonActive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Ionicons name={icon} size={17} color={active ? colors.surface : colors.inkSoft} />
      <AppText
        variant="captionBold"
        tone={active ? 'onDark' : 'ink'}
        numberOfLines={1}
        style={styles.segmentLabel}
      >
        {label}
      </AppText>
      <View style={[styles.segmentCount, active ? styles.segmentCountActive : null]}>
        <AppText variant="micro" tone={active ? 'ink' : 'inkMuted'} numberOfLines={1}>
          {count}
        </AppText>
      </View>
    </Pressable>
  );
}

function RecommendedItemRow({
  item,
  onPress,
}: {
  readonly item: RecommendedHomeItem;
  readonly onPress: () => void;
}) {
  const canVerify =
    !item.collected &&
    item.verificationDistanceMeters !== null &&
    item.verificationDistanceMeters <= STAMP_RADIUS_METERS;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.kind === 'event' ? '행사' : '관광지'} ${item.title} 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.readyRowPressable, pressed ? styles.pressed : null]}
    >
      <View style={styles.readyBody}>
        {item.kind === 'event' ? (
          <EventListMark thumbnailUrl={item.thumbnailUrl} />
        ) : (
          <PlaceThumb size={56} thumbnailUrl={item.thumbnailUrl} />
        )}
        <View style={styles.readyText}>
          <AppText variant="captionBold" style={styles.readyKindText} numberOfLines={1}>
            {item.kind === 'event' ? '행사' : '관광지'}
          </AppText>
          <AppText variant="h3" tone="ink" numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="captionBold" style={styles.readyDistance} numberOfLines={1}>
            {canVerify
              ? `${STAMP_RADIUS_METERS}m 안에 있어요 · ${item.distanceMeters}m`
              : `${item.distanceMeters}m · 가까이 이동 필요`}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.inkSubtle} />
      </View>
    </Pressable>
  );
}
