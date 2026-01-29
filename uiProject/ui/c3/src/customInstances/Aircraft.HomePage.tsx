import React, { useEffect, useState } from 'react';
import Leaflet from 'leaflet';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';

import { fetchAllBases } from '@c3/app/ui/src/components/CRUDMethods/BaseCRUD';
import { windTurbineIcon } from '@c3/app/ui/src/components/icons/MapIcons';
import BasePopup from '@c3/app/ui/src/components/map/BasePopup';
import LoadingAnimation from '@c3/app/ui/src/components/misc/LoadingAnimation';
import ErrorModal from '@c3/app/ui/src/components/misc/ErrorModal';
import PageContainer from '@c3/app/ui/src/components/container/PageContainer';
import { ThemeProvider, useTheme } from '@c3/app/ui/src/contexts/ThemeContext';
import { Base } from '@c3/types';

import 'leaflet/dist/leaflet.css';

const AircraftHomePageContent = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [bases, setBases] = useState<Base[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const loadBases = async () => {
      try {
        const baseData = await fetchAllBases();
        setBases(baseData);
      } catch (error) {
        console.error('An error occurred: ', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Load Base data
    loadBases();
  }, []);

  if (error) {
    return (
      <PageContainer currentPath="/">
        <ErrorModal errorMessage={error} />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer currentPath="/">
        <LoadingAnimation />
      </PageContainer>
    );
  }

  const handleMarkerClick = (e: Leaflet.LeafletMouseEvent, base: Base) => {
    const map = e.target._map;
    map.flyTo([base.latitude, base.longitude], 10, {
      animate: true,
      duration: 1.2,
    });
  };

  const handleMarkerClose = (e: Leaflet.LeafletEvent) => {
    const map = e.target._map;
    map.flyTo(map.getCenter(), 4, {
      animate: true,
      duration: 1.2,
    });
  };

  const DEFAULT_CENTER = [39.8, -98.5];

  return (
    <PageContainer currentPath="/">
      <div style={{ height: '100vh', width: '100%' }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={4}
          className="map-container"
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="bottomleft" />

          {/* Map tile layer with dark mode support */}
          <TileLayer
            url={theme.mapTile}
            attribution='&copy; <a href="https://www.openweathermap.org/">OpenWeatherMap</a> contributors'
          />

          {/* Wind Turbine Markers */}
          {bases.map((base) => (
            <Marker
              key={base.id}
              position={[base.latitude, base.longitude]}
              icon={windTurbineIcon}
              eventHandlers={{
                click: (e) => handleMarkerClick(e, base),
                popupclose: (e) => handleMarkerClose(e),
              }}
            >
              <BasePopup base={base} />
            </Marker>
          ))}
        </MapContainer>
      </div>
    </PageContainer>
  );
};

const AircraftHomePage = () => {
  return (
    <ThemeProvider>
      <AircraftHomePageContent />
    </ThemeProvider>
  );
};

export default AircraftHomePage;
