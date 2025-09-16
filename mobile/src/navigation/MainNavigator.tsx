import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import DashboardScreen from '../screens/main/DashboardScreen';
import StationsScreen from '../screens/main/StationsScreen';
import ReadingsScreen from '../screens/main/ReadingsScreen';
import FaultsScreen from '../screens/main/FaultsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AddReadingScreen from '../screens/main/AddReadingScreen';
import AddFaultScreen from '../screens/main/AddFaultScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DashboardMain" 
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const StationsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="StationsMain" 
      component={StationsScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const ReadingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ReadingsMain" 
      component={ReadingsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AddReading" 
      component={AddReadingScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const FaultsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="FaultsMain" 
      component={FaultsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AddFault" 
      component={AddFaultScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Stations') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Readings') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Faults') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{ title: t('navigation.dashboard') }}
      />
      <Tab.Screen 
        name="Stations" 
        component={StationsStack}
        options={{ title: t('navigation.stations') }}
      />
      <Tab.Screen 
        name="Readings" 
        component={ReadingsStack}
        options={{ title: t('navigation.readings') }}
      />
      <Tab.Screen 
        name="Faults" 
        component={FaultsStack}
        options={{ title: t('navigation.faults') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: t('navigation.profile') }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
