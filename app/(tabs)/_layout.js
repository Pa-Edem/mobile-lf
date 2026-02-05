import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'hsl(130, 40%, 50%)', // greenDefault
        tabBarInactiveTintColor: 'hsl(29, 10%, 55%)', // textText
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'hsl(36, 33%, 97%)', // bgMain
          borderTopColor: 'hsl(36, 20%, 80%)', // brdLight
          borderTopWidth: 1,
          height: 80, // Высота таб-бара
          paddingBottom: 12,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name='home' size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name='settings' size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name='person' size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='stats'
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color, size }) => <Ionicons name='bar-chart' size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name='messages'
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color, size }) => <Ionicons name='notifications' size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
