import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { colors } from '@shared/ui';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  readonly color: string;
  readonly focused: boolean;
  readonly activeIcon: IoniconName;
  readonly inactiveIcon: IoniconName;
}

function TabIcon({ color, focused, activeIcon, inactiveIcon }: TabIconProps) {
  return <Ionicons name={focused ? activeIcon : inactiveIcon} size={22} color={color} />;
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
          borderTopWidth: 0,
          backgroundColor: colors.surface,
          shadowColor: colors.ink,
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
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
