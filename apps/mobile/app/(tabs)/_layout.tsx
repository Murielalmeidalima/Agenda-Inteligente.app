import { Tabs } from 'expo-router';
import { theme } from '../../src/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { NotificationService } from '../../src/lib/notifications-service';

export default function TabLayout() {
  useEffect(() => {
    NotificationService.registerForPushNotifications();
  }, []);

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textMuted,
      tabBarStyle: {
        borderTopColor: theme.colors.border,
        height: 60,
        paddingBottom: 8,
      },
      headerStyle: {
        backgroundColor: theme.colors.background,
      },
      headerTitleStyle: {
        fontWeight: 'bold',
        color: theme.colors.text,
      }
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <MaterialIcons name="event" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <MaterialIcons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Prontuário',
          tabBarIcon: ({ color }) => <MaterialIcons name="history-edu" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
