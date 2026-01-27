import React from 'react';
import MapIcon from '@mui/icons-material/Map';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { NavItem } from '@c3/app/ui/src/types/types';
import NavButton from '@c3/app/ui/src/components/nav/NavButton';

interface NavBarProps {
  activePath?: string;
}

const NavBar = ({ activePath = '/' }: NavBarProps) => {
  const navItems: NavItem[] = [
    {
      icon: <MapIcon sx={{ fontSize: 28 }} />,
      label: 'Home',
      path: '/',
    },
    {
      icon: <FlightTakeoffIcon sx={{ fontSize: 28 }} />,
      label: 'Operations',
      path: '/operations',
    },
  ];

  return (
    <div
      style={{
        width: '70px',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '12px',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <img
          src="assets/c3_ai_logo_with_title.svg"
          alt="C3 Logo"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* Navigation Items */}
      {navItems.map((item, index) => (
        <NavButton key={item.path} item={item} index={index} activePath={activePath} />
      ))}
    </div>
  );
};

export default NavBar;
