import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

interface NotificationContextType {
  scheduleNotification: (title: string, body: string, data?: any) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  getNotificationPermissions: () => Promise<boolean>;
  requestNotificationPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);
      console.log('Push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  const scheduleNotification = async (title: string, body: string, data?: any): Promise<string> => {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
    return notificationId;
  };

  const cancelNotification = async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  };

  const cancelAllNotifications = async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const getNotificationPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  };

  const requestNotificationPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  const value: NotificationContextType = {
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    getNotificationPermissions,
    requestNotificationPermissions
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
