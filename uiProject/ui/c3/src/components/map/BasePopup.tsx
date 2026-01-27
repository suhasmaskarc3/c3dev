import React from 'react';
import { Popup } from 'react-leaflet';

import { useDispatch } from '@c3/ui/UiSdlUseDispatch';

import { Base } from '@c3/types';

interface BasePopupProps {
  base: Base;
}

const BasePopup = ({ base }: BasePopupProps) => {
  const dispatch = useDispatch();

  const handleNavigateToBaseDetailsPage = () => {
    /*
      TODO 1.1: Implement navigation to Base Details Page
            by dispatching a GLOBAL_REDIRECT action with the 
            appropriate URL.
    */
    dispatch({
      type: 'GLOBAL_REDIRECT',
      payload: {
        url: `/bases/<BASE_ID>`,
      },
    });
  };

  return (
    <Popup>
      <div
        style={{
          padding: '8px',
          minWidth: '200px',
        }}
      >
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a1a',
            borderBottom: '2px solid #0066cc',
            paddingBottom: '8px',
          }}
        >
          {base.name}
        </h3>
        <div
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#4a4a4a',
          }}
        >
          <p style={{ margin: '6px 0' }}>
            <strong>Base ID:</strong> {base.id}
          </p>
          <p style={{ margin: '6px 0' }}>
            <strong>Location</strong>
          </p>
          <p
            style={{
              margin: '4px 0',
              paddingLeft: '12px',
              fontSize: '13px',
              color: '#666',
            }}
          >
            Lat: {base.latitude.toFixed(4)}°<br />
            Long: {base.longitude.toFixed(4)}°
          </p>
        </div>
        <button
          onClick={handleNavigateToBaseDetailsPage}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0052a3')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0066cc')}
        >
          View Details
        </button>
      </div>
    </Popup>
  );
};

export default BasePopup;
