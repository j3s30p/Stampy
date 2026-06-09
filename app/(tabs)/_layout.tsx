import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { AppText, colors, radius, shadow, spacing } from '@shared/ui';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  readonly color: string;
  readonly focused: boolean;
  readonly activeIcon: IoniconName;
  readonly inactiveIcon: IoniconName;
}

function ActiveDot() {
  return <View style={styles.dot} />;
}

function TabIcon({ color, focused, activeIcon, inactiveIcon }: TabIconProps) {
  return (
    <View style={styles.iconWrapper}>
      {focused ? <ActiveDot /> : <View style={styles.dotPlaceholder} />}
      <Ionicons name={focused ? activeIcon : inactiveIcon} size={22} color={color} />
    </View>
  );
}

function StampTabButton({
  accessibilityLabel,
  accessibilityState,
  href,
  onLongPress,
  onPress,
  onPressIn,
  onPressOut,
  style,
  testID,
}: BottomTabBarButtonProps) {
  const selected = accessibilityState?.selected ?? false;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = (event: GestureResponderEvent) => {
    setPressed(true);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    setPressed(false);
    onPressOut?.(event);
  };

  return (
    <View style={styles.stampTabShell}>
      <PlatformPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        href={href}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        style={[
          styles.stampTabButton,
          style,
          selected ? styles.stampTabButtonActive : styles.stampTabButtonInactive,
          pressed && styles.stampTabButtonPressed,
        ]}
      >
        <View style={styles.stampTabIconWrap}>
          <Ionicons
            name={selected ? 'ribbon' : 'ribbon-outline'}
            size={20}
            color={selected ? colors.surface : colors.brandInk}
          />
        </View>
        <AppText
          variant="micro"
          tone={selected ? 'onDark' : 'brand'}
          numberOfLines={1}
          style={styles.stampTabLabel}
        >
          도장
        </AppText>
      </PlatformPressable>
    </View>
  );
}

const tabPressHaptic = () => {
  if (Platform.OS === 'web') {
    return;
  }

  Haptics.selectionAsync().catch(() => undefined);
};

const tabListeners = { tabPress: tabPressHaptic };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.canvas,
          overflow: 'visible',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Pretendard-Bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={tabListeners}
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              activeIcon="home"
              inactiveIcon="home-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        listeners={tabListeners}
        options={{
          title: '지도',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} activeIcon="map" inactiveIcon="map-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="stamp"
        listeners={tabListeners}
        options={{
          title: '도장',
          tabBarButton: (props) => <StampTabButton {...props} />,
          tabBarLabel: () => null,
          tabBarItemStyle: styles.stampTabItem,
        }}
      />
      <Tabs.Screen
        name="ranking"
        listeners={tabListeners}
        options={{
          title: '랭킹',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              activeIcon="trophy"
              inactiveIcon="trophy-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        listeners={tabListeners}
        options={{
          title: 'MY',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              activeIcon="person-circle"
              inactiveIcon="person-circle-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
  },
  stampTabItem: {
    flex: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  stampTabShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    paddingHorizontal: spacing.xs,
  },
  stampTabButton: {
    width: '100%',
    maxWidth: 112,
    minWidth: 0,
    height: 58,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow.e3,
  },
  stampTabButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  stampTabButtonInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  stampTabButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  stampTabIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampTabLabel: {
    marginTop: 1,
    flexShrink: 1,
    minWidth: 0,
  },
});
