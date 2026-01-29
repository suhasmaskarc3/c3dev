import React from 'react';
import NavBar from '@c3/app/ui/src/components/nav/NavBar';
import { useTheme } from '@c3/app/ui/src/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@c3/app/ui/src/theme/colors';

interface PageContainerProps {
  children: React.ReactNode;
  currentPath: string;
}

const PageContainer = ({ children, currentPath }: PageContainerProps) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <div style={{ display: 'flex', backgroundColor: theme.background, minHeight: '100vh' }}>
      <NavBar activePath={currentPath} />
      <div style={{ marginLeft: '70px', width: 'calc(100% - 70px)' }}>{children}</div>
    </div>
  );
};

export default PageContainer;
