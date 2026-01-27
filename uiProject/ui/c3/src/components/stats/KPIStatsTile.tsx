import React from 'react';

interface KPIStatsTileProps {
  title: string;
  value: string | number;
  showVerticalBarToRight: boolean;
}

const KPIStatsTile = ({ title, value, showVerticalBarToRight }: KPIStatsTileProps) => {
  return (
    <div
      key={title}
      style={{
        padding: '16px',
        textAlign: 'center',
        borderRadius: '0px',
        borderRight: showVerticalBarToRight ? '1px solid #eee' : 'none',
      }}
    >
      <div
        style={{
          color: '#222',
          fontWeight: 500,
          fontSize: '1rem',
          letterSpacing: '0.5px',
          marginBottom: '8px',
          fontFamily: 'Inter, Helvetica Neue, Arial, Helvetica, sans-serif',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      <h3
        style={{
          fontWeight: 700,
          fontSize: '2.5rem',
          margin: 0,
          color: '#000000',
          letterSpacing: '-0.02em',
          fontFamily: 'Inter, Helvetica Neue, Arial, Helvetica, sans-serif',
        }}
      >
        {value}
      </h3>
    </div>
  );
};

export default KPIStatsTile;
