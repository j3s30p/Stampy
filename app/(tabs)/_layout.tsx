import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { colors } from '@shared/ui';

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

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          height: 76,
          paddingTop: 10,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.canvas,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
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
        options={{
          title: '지도',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} activeIcon="map" inactiveIcon="map-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="stamp"
        options={{
          title: '도장',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              activeIcon="ribbon"
              inactiveIcon="ribbon-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
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
});
