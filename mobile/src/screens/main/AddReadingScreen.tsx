import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const AddReadingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    stationId: '',
    phLevel: '',
    tdsLevel: '',
    temperature: '',
    pressure: '',
    tankLevelPercentage: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!formData.stationId) {
      Alert.alert(t('common.error'), t('validation.stationRequired'));
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement reading submission
      Alert.alert(t('common.success'), t('readings.addedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), t('readings.addError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>{t('readings.addReading')}</Title>
            <Paragraph style={styles.subtitle}>
              {t('readings.addReadingDescription')}
            </Paragraph>

            <Divider style={styles.divider} />

            <TextInput
              label={t('readings.station')}
              value={formData.stationId}
              onChangeText={(text) => setFormData({ ...formData, stationId: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('readings.phLevel')}
              value={formData.phLevel}
              onChangeText={(text) => setFormData({ ...formData, phLevel: text })}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('readings.tdsLevel')}
              value={formData.tdsLevel}
              onChangeText={(text) => setFormData({ ...formData, tdsLevel: text })}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('readings.temperature')}
              value={formData.temperature}
              onChangeText={(text) => setFormData({ ...formData, temperature: text })}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('readings.pressure')}
              value={formData.pressure}
              onChangeText={(text) => setFormData({ ...formData, pressure: text })}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('readings.tankLevel')}
              value={formData.tankLevelPercentage}
              onChangeText={(text) => setFormData({ ...formData, tankLevelPercentage: text })}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('readings.notes')}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.button}
              >
                {t('common.cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                {loading ? t('common.saving') : t('common.save')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default AddReadingScreen;
