import React from 'react';
import NavBar from '@c3/app/ui/src/components/nav/NavBar';

interface PageContainerProps {
  children: React.ReactNode;
  currentPath: string;
}

const PageContainer = ({ children, currentPath }: PageContainerProps) => {
  return (
    <div style={{ display: 'flex' }}>
      <NavBar activePath={currentPath} />
      <div style={{ marginLeft: '70px', width: 'calc(100% - 70px)' }}>{children}</div>
    </div>
  );
};

export default PageContainer;
