import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const tabIcon = (emoji: string) => {
  const Icon = () => <Text style={{ fontSize: 18 }}>{emoji}</Text>;
  Icon.displayName = `TabIcon(${emoji})`;
  return Icon;
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#14806f',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: tabIcon('🏠') }} />
      <Tabs.Screen name="map" options={{ title: '지도', tabBarIcon: tabIcon('🗺️') }} />
      <Tabs.Screen name="stamp" options={{ title: '도장', tabBarIcon: tabIcon('🎖️') }} />
      <Tabs.Screen name="ranking" options={{ title: '랭킹', tabBarIcon: tabIcon('🏆') }} />
      <Tabs.Screen name="my" options={{ title: 'MY', tabBarIcon: tabIcon('👤') }} />
    </Tabs>
  );
}
