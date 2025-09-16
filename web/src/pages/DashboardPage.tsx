import React from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button } from 'antd';
import { 
  EnvironmentOutlined, 
  WarningOutlined, 
  BarChartOutlined,
  SyncOutlined 
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import api from '../services/api';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();

  // Fetch dashboard data
  const { data: stationsData } = useQuery('stations', () =>
    api.get('/stations').then(res => res.data.data)
  );

  const { data: readingsData } = useQuery('readings', () =>
    api.get('/readings?limit=10').then(res => res.data.data)
  );

  const { data: faultsData } = useQuery('faults', () =>
    api.get('/faults?status=open').then(res => res.data.data)
  );

  const totalStations = stationsData?.length || 0;
  const activeStations = stationsData?.filter((s: any) => s.status === 'active').length || 0;
  const openFaults = faultsData?.length || 0;
  const recentReadings = readingsData?.length || 0;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>{t('dashboard.title')}</Title>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.totalStations')}
              value={totalStations}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.activeStations')}
              value={activeStations}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.faultsOpen')}
              value={openFaults}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.readingsToday')}
              value={recentReadings}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.overview')} style={{ height: '300px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>{t('dashboard.stationStatus')}</Title>
                <p>
                  {activeStations} {t('stations.active')} / {totalStations} {t('common.total')}
                </p>
              </div>
              <div>
                <Title level={4}>{t('dashboard.faultsByPriority')}</Title>
                <p>
                  {faultsData?.filter((f: any) => f.priority === 'critical').length || 0} {t('faults.critical')}
                </p>
              </div>
              <Button type="primary" icon={<SyncOutlined />}>
                {t('dashboard.syncNow')}
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.recentActivity')} style={{ height: '300px' }}>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <BarChartOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <p style={{ marginTop: '16px', color: '#999' }}>
                {t('dashboard.readingsChart')}
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
