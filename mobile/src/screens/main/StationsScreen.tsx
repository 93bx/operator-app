import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const StationsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Stations Screen - Coming soon!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StationsScreen;
