import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Button, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Title style={styles.title}>{t('dashboard.title')}</Title>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('dashboard.myStations')}</Text>
            <Text style={styles.cardValue}>3</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('dashboard.openFaults')}</Text>
            <Text style={styles.cardValue}>2</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('dashboard.recentReadings')}</Text>
            <Text style={styles.cardValue}>5</Text>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Readings' as never, { screen: 'AddReading' } as never)}
            style={styles.button}
          >
            {t('dashboard.addReading')}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Faults' as never, { screen: 'AddFault' } as never)}
            style={styles.button}
          >
            {t('dashboard.reportFault')}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    marginBottom: 12,
  },
});

export default DashboardScreen;
