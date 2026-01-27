import React from 'react';

interface ContentSectionProps {
  title: string;
  children: React.ReactNode;
  noPadding?: boolean;
}

const ContentSection = ({ title, children, noPadding = false }: ContentSectionProps) => {
  return (
    <div
      style={{
        marginTop: '32px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e5e5',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '24px', paddingBottom: noPadding ? '24px' : '16px' }}>
        <h2
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: '1.5rem',
            color: '#000000',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
      </div>
      {noPadding ? (
        <div style={{ paddingBottom: '24px' }}>{children}</div>
      ) : (
        <div style={{ padding: '0 24px 24px 24px' }}>{children}</div>
      )}
    </div>
  );
};

export default ContentSection;
