import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const AddReadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Add Reading Screen - Coming soon!</Text>
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

export default AddReadingScreen;
