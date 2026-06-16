import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { HomeTourEvent, HomeTourSpot } from '@features/tour/model';
import { AppText, colors } from '@shared/ui';
import { TourEventList, TourSpotList } from './HomeListCards';
import { RecentStampRow } from './HomeRecentStamps';
import { SectionHead } from './HomeSectionHead';
import { HomeContentSwitcher, HomeProgressCard, RecommendedItemsCard } from './HomeTopSection';
import { pickRecommendedItem, toRecommendedEvent, toRecommendedSpot } from './HomeView.helpers';
import { styles } from './HomeView.styles';
import type { HomeContentMode, RecommendedHomeItem } from './HomeView.types';

interface HomeViewProps {
  readonly spots: readonly HomeTourSpot[];
  readonly events: readonly HomeTourEvent[];
  readonly collectedCount: number;
  readonly totalCount: number;
  readonly onSelectSpot?: (contentId: string) => void;
  readonly onSelectEvent?: (contentId: string) => void;
}

export function HomeView({
  spots,
  events = [],
  collectedCount,
  onSelectEvent,
  onSelectSpot,
  totalCount,
}: HomeViewProps) {
  const [activeContentMode, setActiveContentMode] = useState<HomeContentMode>('spot');
  const displayTotalCount = Math.max(totalCount, collectedCount, spots.length, 1);
  const progressPercent = Math.round((collectedCount / displayTotalCount) * 100);
  const recommendedSpotItem = pickRecommendedItem(spots.map(toRecommendedSpot));
  const recommendedEventItem = pickRecommendedItem(events.map(toRecommendedEvent));
  const recommendedItems = [recommendedSpotItem, recommendedEventItem].filter(
    (item): item is RecommendedHomeItem => item !== null,
  );
  const nearbySpotCount = Math.min(spots.length, 5);
  const recentSpots = spots.filter((spot) => spot.collected).slice(0, 3);
  const handleSelectReadyItem = (item: RecommendedHomeItem) => {
    if (item.kind === 'event') {
      onSelectEvent?.(item.contentId);
      return;
    }

    onSelectSpot?.(item.contentId);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Ionicons name="ribbon" size={16} color={colors.surface} />
            </View>
            <AppText variant="h2" tone="ink" numberOfLines={1}>
              Stampy
            </AppText>
          </View>
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
        </View>

        <AppText variant="h1" tone="ink" style={styles.greeting} numberOfLines={2}>
          안녕하세요, 재선님{'\n'}오늘은 종로에서 도장 모아볼까요?
        </AppText>

        <HomeProgressCard
          collectedCount={collectedCount}
          displayTotalCount={displayTotalCount}
          progressPercent={progressPercent}
        />

        <RecommendedItemsCard items={recommendedItems} onSelectItem={handleSelectReadyItem} />

        <HomeContentSwitcher
          activeContentMode={activeContentMode}
          eventCount={events.length}
          nearbySpotCount={nearbySpotCount}
          onChangeMode={setActiveContentMode}
        />

        {activeContentMode === 'event' ? (
          <>
            <SectionHead title="진행 중인 행사" action={`${events.length}개`} />
            <TourEventList events={events} onSelectEvent={onSelectEvent} />
          </>
        ) : (
          <>
            <SectionHead title="주변 관광지" action={`상위 ${nearbySpotCount}개`} />
            <TourSpotList spots={spots.slice(0, nearbySpotCount)} onSelectSpot={onSelectSpot} />
          </>
        )}

        <SectionHead title="최근 수집한 도장" action="6월" />
        <RecentStampRow
          spots={recentSpots.length > 0 ? recentSpots : spots.slice(0, 3)}
          onSelectSpot={onSelectSpot}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
