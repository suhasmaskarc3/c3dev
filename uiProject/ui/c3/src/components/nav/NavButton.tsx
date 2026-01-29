import React from 'react';
import { useDispatch } from '@c3/ui/UiSdlUseDispatch';
import { NavItem } from '@c3/app/ui/src/types/types';
import { useTheme } from '@c3/app/ui/src/contexts/ThemeContext';

interface NavButtonProps {
  item: NavItem;
  index: number;
  activePath: string;
}

const NavButton = ({ item, index, activePath }: NavButtonProps) => {
  const isActive = activePath === item.path;
  const { theme } = useTheme();

  const dispatch = useDispatch();

  const handleNavigate = (path: string) => {
    dispatch({
      type: 'GLOBAL_REDIRECT',
      payload: {
        url: path,
      },
    });
  };

  return (
    <div
      key={index}
      onClick={() => handleNavigate(item.path)}
      style={{
        width: '100%',
        height: '52px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: '6px 8px',
        cursor: 'pointer',
        backgroundColor: isActive ? theme.hover : 'transparent',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = theme.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div
        style={{
          color: isActive ? theme.text : theme.textSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
        }}
      >
        {item.icon}
      </div>
      <span
        style={{
          fontSize: '10px',
          color: isActive ? theme.text : theme.textSecondary,
          fontWeight: isActive ? 600 : 400,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        {item.label}
      </span>
    </div>
  );
};

export default NavButton;
