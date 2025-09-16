import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { SyncProvider } from './src/contexts/SyncContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { theme } from './src/theme/theme';
import { initDatabase } from './src/config/database';
import './src/i18n';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        await initDatabase();
        
        // Pre-load fonts
        await Font.loadAsync({
          ...Ionicons.font,
        });
        
        // Pre-load any other resources
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <LanguageProvider>
            <OfflineProvider>
              <AuthProvider>
                <SyncProvider>
                  <NotificationProvider>
                    <NavigationContainer>
                      <StatusBar style="auto" />
                      <AppNavigator />
                    </NavigationContainer>
                  </NotificationProvider>
                </SyncProvider>
              </AuthProvider>
            </OfflineProvider>
          </LanguageProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
