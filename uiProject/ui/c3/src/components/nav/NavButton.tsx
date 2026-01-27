import React from 'react';
import { useDispatch } from '@c3/ui/UiSdlUseDispatch';
import { NavItem } from '@c3/app/ui/src/types/types';

interface NavButtonProps {
  item: NavItem;
  index: number;
  activePath: string;
}

const NavButton = ({ item, index, activePath }: NavButtonProps) => {
  const isActive = activePath === item.path;

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
        backgroundColor: isActive ? '#e0e0e0' : 'transparent',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
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
          color: isActive ? '#000' : '#666',
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
          color: isActive ? '#000' : '#666',
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
