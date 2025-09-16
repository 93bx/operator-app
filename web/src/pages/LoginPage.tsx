import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Select } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            {t('auth.login')}
          </Title>
          <Text type="secondary">
            {t('auth.welcome')} - Operator App
          </Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label={t('auth.email')}
            rules={[
              { required: true, message: t('validation.emailRequired') },
              { type: 'email', message: t('validation.emailInvalid') }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth.email')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('auth.password')}
            rules={[
              { required: true, message: t('validation.passwordRequired') },
              { min: 6, message: t('validation.passwordMinLength') }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', height: '48px' }}
            >
              {t('auth.login')}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Space>
            <GlobalOutlined />
            <Select
              value={language}
              onChange={handleLanguageChange}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="ar">العربية</Option>
              <Option value="en">English</Option>
            </Select>
          </Space>
        </div>

        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: '#f5f5f5', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <Text strong>Demo Credentials:</Text><br />
          Admin: admin@operator.com / admin123<br />
          Operator: operator@operator.com / operator123
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
