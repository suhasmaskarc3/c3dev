import React from 'react';
import { Alert } from '@mui/material';

interface ErrorModalProps {
  errorMessage: string;
}

const ErrorModal = ({ errorMessage }: ErrorModalProps) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'red',
        fontSize: '18px',
      }}
    >
      <Alert severity="error">Error: {errorMessage}</Alert>
    </div>
  );
};

export default ErrorModal;
