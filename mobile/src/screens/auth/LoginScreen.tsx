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
  Switch,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { login, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('validation.emailRequired'));
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.loginError'));
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.title}>{t('auth.login')}</Title>
              <Paragraph style={styles.subtitle}>
                {t('auth.welcome')} - Operator App
              </Paragraph>
            </View>

            <View style={styles.form}>
              <TextInput
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <TextInput
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />

              <View style={styles.switchContainer}>
                <Text>{t('auth.rememberMe')}</Text>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                />
              </View>

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
              >
                {t('auth.login')}
              </Button>

              <View style={styles.languageContainer}>
                <Text style={styles.languageLabel}>
                  {t('settings.language')}:
                </Text>
                <Button
                  mode="outlined"
                  onPress={toggleLanguage}
                  style={styles.languageButton}
                >
                  {language === 'ar' ? 'English' : 'العربية'}
                </Button>
              </View>
            </View>

            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>
                Admin: admin@operator.com / admin123
              </Text>
              <Text style={styles.demoText}>
                Operator: operator@operator.com / operator123
              </Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  languageLabel: {
    marginRight: 8,
    fontSize: 16,
  },
  languageButton: {
    marginLeft: 8,
  },
  demoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

export default LoginScreen;
