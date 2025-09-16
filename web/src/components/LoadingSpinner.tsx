import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Spin 
        indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
        size="large" 
      />
      <div style={{ fontSize: '16px', color: '#666' }}>
        Loading...
      </div>
    </div>
  );
};

export default LoadingSpinner;
