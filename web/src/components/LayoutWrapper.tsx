import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Space, Dropdown } from 'antd';
import { 
  DashboardOutlined, 
  EnvironmentOutlined, 
  BarChartOutlined, 
  WarningOutlined, 
  UserOutlined, 
  LogoutOutlined,
  MenuOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('navigation.dashboard'),
    },
    {
      key: '/stations',
      icon: <EnvironmentOutlined />,
      label: t('navigation.stations'),
    },
    {
      key: '/readings',
      icon: <BarChartOutlined />,
      label: t('navigation.readings'),
    },
    {
      key: '/faults',
      icon: <WarningOutlined />,
      label: t('navigation.faults'),
    },
    ...(user?.role === 'admin' ? [{
      key: '/users',
      icon: <UserOutlined />,
      label: t('navigation.users'),
    }] : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('navigation.profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: language === 'ar' ? 'English' : 'العربية',
      onClick: () => setLanguage(language === 'ar' ? 'en' : 'ar'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#001529',
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '16px' : '18px',
          fontWeight: 'bold',
          borderBottom: '1px solid #002140'
        }}>
          {collapsed ? 'OA' : 'Operator App'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <Space>
            <Text strong>
              {user?.firstName} {user?.lastName}
            </Text>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
            >
              <Button type="text" icon={<UserOutlined />}>
                {user?.role === 'admin' ? t('users.admin') : t('users.operator')}
              </Button>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutWrapper;
