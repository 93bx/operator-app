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
  Divider,
  Chip,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const AddFaultScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    stationId: '',
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    priority: 'medium',
    latitude: '',
    longitude: '',
  });

  const priorities = [
    { key: 'low', label: t('faults.priority.low') },
    { key: 'medium', label: t('faults.priority.medium') },
    { key: 'high', label: t('faults.priority.high') },
    { key: 'critical', label: t('faults.priority.critical') },
  ];

  const handleSubmit = async () => {
    if (!formData.stationId || !formData.title || !formData.description) {
      Alert.alert(t('common.error'), t('validation.requiredFields'));
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement fault submission
      Alert.alert(t('common.success'), t('faults.reportedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), t('faults.reportError'));
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
            <Title style={styles.title}>{t('faults.reportFault')}</Title>
            <Paragraph style={styles.subtitle}>
              {t('faults.reportFaultDescription')}
            </Paragraph>

            <Divider style={styles.divider} />

            <TextInput
              label={t('faults.station')}
              value={formData.stationId}
              onChangeText={(text) => setFormData({ ...formData, stationId: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('faults.title')}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('faults.titleAr')}
              value={formData.titleAr}
              onChangeText={(text) => setFormData({ ...formData, titleAr: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('faults.description')}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('faults.descriptionAr')}
              value={formData.descriptionAr}
              onChangeText={(text) => setFormData({ ...formData, descriptionAr: text })}
              multiline
              numberOfLines={4}
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>{t('faults.priority.title')}</Text>
              <View style={styles.chipContainer}>
                {priorities.map((priority) => (
                  <Chip
                    key={priority.key}
                    selected={formData.priority === priority.key}
                    onPress={() => setFormData({ ...formData, priority: priority.key })}
                    style={styles.chip}
                  >
                    {priority.label}
                  </Chip>
                ))}
              </View>
            </View>

            <TextInput
              label={t('faults.latitude')}
              value={formData.latitude}
              onChangeText={(text) => setFormData({ ...formData, latitude: text })}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('faults.longitude')}
              value={formData.longitude}
              onChangeText={(text) => setFormData({ ...formData, longitude: text })}
              keyboardType="numeric"
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
                {loading ? t('common.submitting') : t('faults.submitReport')}
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
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
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

export default AddFaultScreen;
