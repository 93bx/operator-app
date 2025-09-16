import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Layout, ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';
import enUS from 'antd/locale/en_US';

import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StationsPage from './pages/StationsPage';
import ReadingsPage from './pages/ReadingsPage';
import FaultsPage from './pages/FaultsPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import LayoutWrapper from './components/LayoutWrapper';
import LoadingSpinner from './components/LoadingSpinner';

const { Content } = Layout;

function App() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  if (loading) {
    return <LoadingSpinner />;
  }

  const isRTL = language === 'ar';
  const antdLocale = language === 'ar' ? arEG : enUS;

  return (
    <ConfigProvider locale={antdLocale} direction={isRTL ? 'rtl' : 'ltr'}>
      <Helmet>
        <html dir={isRTL ? 'rtl' : 'ltr'} lang={language} />
        <title>{t('navigation.dashboard')} - Operator App</title>
      </Helmet>
      
      <Layout style={{ minHeight: '100vh' }}>
        {!user ? (
          <Content>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Content>
        ) : (
          <LayoutWrapper>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/stations" element={<StationsPage />} />
              <Route path="/readings" element={<ReadingsPage />} />
              <Route path="/faults" element={<FaultsPage />} />
              {user.role === 'admin' && (
                <Route path="/users" element={<UsersPage />} />
              )}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </LayoutWrapper>
        )}
      </Layout>
    </ConfigProvider>
  );
}

export default App;
