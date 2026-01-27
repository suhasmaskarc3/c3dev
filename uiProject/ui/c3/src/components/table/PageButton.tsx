import React from 'react';

interface PageButtonProps {
  updateCurrentPage: () => void;
  disabled: boolean;
  icon: string;
}

const PageButton = ({ updateCurrentPage, disabled, icon }: PageButtonProps) => {
  return (
    <button
      onClick={updateCurrentPage}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        backgroundColor: 'transparent',
        color: disabled ? '#ccc' : '#333',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '20px',
        fontWeight: 600,
      }}
    >
      {icon}
    </button>
  );
};

export default PageButton;
