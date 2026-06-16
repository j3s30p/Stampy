import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Linking, PanResponder, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Badge, colors } from '@shared/ui';
import { KakaoMapWebView } from './KakaoMapWebView';
import { MapEventSheet } from './MapEventSheet';
import { MapFallbackMapStage } from './MapFallbackMapStage';
import { mapSheetStyles } from './MapSheet.styles';
import { MapSheetGrabber } from './MapSheetGrabber';
import { MapSpotSheet } from './MapSpotSheet';
import {
  buildKakaoDirectionsUrl,
  filterEvents,
  filterSpots,
  getLocationStatusLabel,
  mapFilters,
  resolveEffectiveSelectedSpotId,
  resolveSelectedSpot,
} from './MapView.helpers';
import { styles } from './MapView.styles';
import type { MapFilter, MapViewProps } from './MapView.types';

export function MapView({
  kakaoJsKey,
  events = [],
  spots,
  totalCount,
  currentLocation,
  locationStatus,
  useRealApi = false,
  onSelectEvent,
  onSelectSpot,
  onOpenEventDetail,
  onOpenSpotDetail,
  onOpenStamp,
}: MapViewProps) {
  const [internalSelectedSpotId, setInternalSelectedSpotId] = useState<string | null>(null);
  const [internalSelectedEventId, setInternalSelectedEventId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MapFilter>('all');
  const [directionMessage, setDirectionMessage] = useState('GPS 위치 인증 후 수집 가능');
  const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const effectiveSelectedSpotId = resolveEffectiveSelectedSpotId(spots, internalSelectedSpotId);

  const selectedSpot = useMemo(() => {
    return resolveSelectedSpot(spots, effectiveSelectedSpotId);
  }, [effectiveSelectedSpotId, spots]);
  const selectedEvent = useMemo(() => {
    return events.find((event) => event.contentId === internalSelectedEventId) ?? null;
  }, [events, internalSelectedEventId]);
  const selectedKind: 'spot' | 'event' | null = selectedEvent
    ? 'event'
    : selectedSpot
      ? 'spot'
      : null;
  const selectedMapContentId = selectedEvent?.contentId ?? effectiveSelectedSpotId;

  const filteredSpots = useMemo(() => filterSpots(spots, activeFilter), [activeFilter, spots]);
  const filteredEvents = useMemo(() => filterEvents(events, activeFilter), [activeFilter, events]);
  const collectedCount = spots.filter((spot) => spot.collected).length;
  const displayTotalCount = Math.max(totalCount, spots.length, collectedCount, 1);
  const shouldShowFallbackMap = !kakaoJsKey.trim() || Boolean(mapErrorMessage);
  const locationStatusLabel = getLocationStatusLabel(locationStatus, {
    currentLocation,
    useRealApi,
  });
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy < -20) {
            setSheetExpanded(true);
            return;
          }

          if (gestureState.dy > 20) {
            setSheetExpanded(false);
          }
        },
      }),
    [],
  );

  const handleSelectSpot = (contentId: string) => {
    const nextEvent = events.find((event) => event.contentId === contentId) ?? null;

    if (nextEvent) {
      setInternalSelectedEventId(contentId);
      setDirectionMessage(`${nextEvent.title} 행사 선택됨`);
      onSelectEvent?.(contentId);
      return;
    }

    setInternalSelectedSpotId(contentId);
    setInternalSelectedEventId(null);
    const nextSpot = spots.find((spot) => spot.contentId === contentId) ?? null;
    setDirectionMessage(nextSpot ? `${nextSpot.title} 선택됨` : 'GPS 위치 인증 후 수집 가능');
    onSelectSpot?.(contentId);
  };

  const handleMapTap = () => {
    setInternalSelectedEventId(null);
    setInternalSelectedSpotId(null);
    setSheetExpanded(false);
    setDirectionMessage('GPS 위치 인증 후 수집 가능');
  };

  const handleFilterChange = (filter: MapFilter) => {
    setActiveFilter(filter);
    handleMapTap();
  };

  const handleOpenDirections = async () => {
    if (!selectedSpot) {
      return;
    }

    try {
      setDirectionMessage(`${selectedSpot.title} 카카오맵 열기`);
      await Linking.openURL(buildKakaoDirectionsUrl(selectedSpot));
    } catch {
      setDirectionMessage('카카오맵을 열지 못했습니다');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Ionicons name="ribbon" size={16} color={colors.surface} />
          </View>
          <AppText variant="h2" tone="ink" numberOfLines={1}>
            Stampy
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <Badge tone="brand" size="sm">
            도장 {collectedCount}/{displayTotalCount}
          </Badge>
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
        </View>
      </View>

      <View style={styles.mapArea}>
        {shouldShowFallbackMap ? (
          <MapFallbackMapStage
            selectedSpot={selectedSpot}
            filteredSpots={filteredSpots}
            mapErrorMessage={mapErrorMessage}
          />
        ) : (
          <KakaoMapWebView
            kakaoJsKey={kakaoJsKey}
            events={filteredEvents}
            spots={filteredSpots}
            selectedSpotId={selectedMapContentId}
            currentLocation={currentLocation}
            onMarkerTap={handleSelectSpot}
            onMapTap={handleMapTap}
            onMapReady={() => setMapErrorMessage(null)}
            onMapError={setMapErrorMessage}
          />
        )}

        <View style={styles.filterPanel}>
          {mapFilters.map((filter) => (
            <Pressable
              key={filter.key}
              accessibilityRole="button"
              accessibilityLabel={`${filter.label} 스팟 보기`}
              accessibilityState={{ selected: activeFilter === filter.key }}
              onPress={() => handleFilterChange(filter.key)}
              style={({ pressed }) => [
                styles.filterOption,
                activeFilter === filter.key ? styles.filterOptionActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={activeFilter === filter.key ? colors.surface : colors.inkSoft}
              />
              <AppText
                variant="captionBold"
                tone={activeFilter === filter.key ? 'onDark' : 'ink'}
                numberOfLines={1}
              >
                {filter.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.mapControls}>
          <IconButton
            icon="locate"
            color={colors.locationDot}
            label="현재 위치"
            onPress={() => setDirectionMessage(locationStatusLabel)}
          />
          <IconButton
            icon="filter"
            color={colors.ink}
            label="필터"
            onPress={() => handleFilterChange(activeFilter === 'all' ? 'uncollected' : 'all')}
          />
        </View>

        <View style={styles.locationPill}>
          <View style={styles.locationDot} />
          <AppText variant="captionBold" tone="ink" numberOfLines={1}>
            {locationStatusLabel}
          </AppText>
        </View>

        {mapErrorMessage ? (
          <View style={styles.mapError}>
            <AppText variant="captionBold" tone="ink" numberOfLines={2}>
              {mapErrorMessage}
            </AppText>
          </View>
        ) : null}
      </View>

      {selectedKind === 'event' && selectedEvent ? (
        <View style={[mapSheetStyles.sheet, sheetExpanded ? mapSheetStyles.sheetExpanded : null]}>
          <MapSheetGrabber
            sheetExpanded={sheetExpanded}
            setSheetExpanded={setSheetExpanded}
            sheetPanHandlers={sheetPanResponder.panHandlers}
          />
          <MapEventSheet
            event={selectedEvent}
            onOpenStamp={onOpenStamp}
            onOpenEventDetail={onOpenEventDetail}
            directionMessage={directionMessage}
          />
        </View>
      ) : selectedSpot ? (
        <View style={[mapSheetStyles.sheet, sheetExpanded ? mapSheetStyles.sheetExpanded : null]}>
          <MapSheetGrabber
            sheetExpanded={sheetExpanded}
            setSheetExpanded={setSheetExpanded}
            sheetPanHandlers={sheetPanResponder.panHandlers}
          />
          <MapSpotSheet
            directionMessage={directionMessage}
            filteredSpots={filteredSpots}
            selectedSpot={selectedSpot}
            sheetExpanded={sheetExpanded}
            onOpenDirections={handleOpenDirections}
            onOpenSpotDetail={onOpenSpotDetail}
            onOpenStamp={onOpenStamp}
            onSelectSpot={handleSelectSpot}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function IconButton({
  color,
  icon,
  label,
  onPress,
}: {
  readonly color: string;
  readonly icon: React.ComponentProps<typeof Ionicons>['name'];
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.iconButton}
    >
      <Ionicons name={icon} size={19} color={color} />
    </Pressable>
  );
}
