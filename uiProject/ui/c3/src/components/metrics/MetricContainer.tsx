import React from 'react';

interface KPIStatsContainerProps {
  children: React.ReactNode;
}

const KPIStatsContainer = ({ children }: KPIStatsContainerProps) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
        backgroundColor: '#fafbfc',
        border: '1px solid #eee',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      {children}
    </div>
  );
};

export default KPIStatsContainer;
