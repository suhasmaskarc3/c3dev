import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import UiSdlPageTitle from '@c3/ui/UiSdlPageTitleReact';
import SDLActionGroup from '@c3/sdl-react/reactComponents/SDLActionGroup';
import UiSdlModal from '@c3/ui/UiSdlModalReact';
import UiSdlInlineNotification from '@c3/ui/UiSdlInlineNotificationReact';
import { useDispatch } from '@c3/ui/UiSdlUseDispatch';
import { getConfigFromApplicationState } from '@c3/ui/UiSdlApplicationState';
import { ImmutableReduxState } from '@c3/ui/UiSdlConnected';
import { useTranslate } from '@c3/sdl-react/hooks/useTranslate';
import '@c3/ui/UiSdlPageTitleTimezone.scss';
import '@c3/css-library/components/base/_actionGroup.scss';
import { getCurrentPathFromState, getRoutesFromState } from '@c3/ui/UiSdlSite';
import { findMatchingRoute } from '@c3/ui/UiSdlRouter';
import { UiSdlRoute } from '@c3/types';
import { extract as matchesRoles } from '@c3/ui/UiUserValueParam';
import WeatherDisplay from './components/WeatherDisplay.js';
import { createUseWeatherService } from './hooks/useWeatherService.js';
import { createTimedCache, fetchWithTimeout, formatTz } from './utils/weatherHelpers.js';

const appStateId = 'Reliability.ReliabilityApplicationState';
const modalId = 'Reliability.TimezoneConfirmationModal';
const API_KEY = '75cb98e60f3fe4b06610b0936cab22ad';
const CACHE_TTL = { WEATHER: 600000 };
const RATE_LIMIT = 1000;

function formatTimezone(timezoneLabel, timezoneOffset) {
  if (timezoneLabel) return `${timezoneLabel} (${timezoneOffset})`;
  return timezoneLabel;
}

const UiSdlPageTitleTimezoneReact = (props) => {
  const translate = useTranslate();
  const dispatch = useDispatch();

  const currentPath = useSelector((state) => getCurrentPathFromState('SDL.DefaultSite', state));
  const currentUrlRoute = useSelector((state) => findMatchingRoute(currentPath, getRoutesFromState('SDL.DefaultSite', state)));
  const inAppDocExistsForCurrentRoute = !!currentUrlRoute?.inAppDoc;

  const hasGenAiAccess = useSelector((state) => matchesRoles({ matchingRole: ['Reliability.GenaiUser.Role', 'C3.AppAdmin'] }, { state }));

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowInAppEmbeddedDoc = () => {
    dispatch({ type: 'SDL.DefaultInAppDoc.IN_APP_DOC_SHOW_HIDE', payload: { show: true, componentId: 'SDL.DefaultInAppDoc' } });
  };

  const handleButtonClick = (button) => {
    setIsModalOpen(false);
    if (button === 'PRIMARY') dispatch({ type: 'GLOBAL_PAGE_TITLE_ACTION_CLICK_REDIRECT_SETTINGS' });
  };

  const handleShowConfirmationModal = () => setIsModalOpen(true);
  const handleShowAlerts = () => dispatch({ type: 'GLOBAL_PAGE_TITLE_ACTION_CLICK_SHOW_ALERTS' });
  const handleShowCases = () => dispatch({ type: 'GLOBAL_PAGE_TITLE_ACTION_CLICK_SHOW_CASES' });
  const handleShowAgent = () => dispatch({ type: 'GLOBAL_PAGE_TITLE_ACTION_CLICK_SHOW_AGENT' });

  const defaultTimezoneLabel = useSelector((state) => getConfigFromApplicationState(appStateId, state, ['uiTimezoneLabel']));
  const defaultTimezoneOffset = useSelector((state) => getConfigFromApplicationState(appStateId, state, ['uiTimezoneOffset']));
  const formattedTimezone = formatTimezone(defaultTimezoneLabel, defaultTimezoneOffset);

  const actionGroup = {
    actions: [
      { size: 'small', usage: 'icon', iconSuffix: 'globe-americas', name: translate({ spec: 'Reliability.ChangeTimezone' }), onClick: handleShowConfirmationModal },
      { size: 'small', usage: 'icon', iconSuffix: 'exclamation-triangle', actionSuffix: 'SHOW_ALERTS', onClick: handleShowAlerts },
      { size: 'small', usage: 'icon', iconSuffix: 'folder-plus', actionSuffix: 'SHOW_CASES', onClick: handleShowCases },
    ],
    collapseThreshold: 5,
  };

  if (hasGenAiAccess) {
    actionGroup.actions.push({ size: 'small', usage: 'icon', iconSuffix: 'sparkles', actionSuffix: 'SHOW_AGENT', onClick: handleShowAgent });
  }

  if (inAppDocExistsForCurrentRoute) {
    actionGroup.actions.push({ size: 'small', usage: 'icon', iconSuffix: 'circle-question', name: translate({ spec: 'Reliability.ShowDocumentation' }), onClick: handleShowInAppEmbeddedDoc });
  }

  const modalContent = {
    id: modalId,
    open: isModalOpen,
    header: { text: translate({ spec: 'Reliability.TimezoneConfirmationModal.Header' }) },
    subHeader: { text: `${translate({ spec: 'Reliability.TimezoneConfirmationModal.subHeader' })} ${formattedTimezone}` },
    modalType: { type: 'UiSdlTwoButtonModal', primaryButtonLabel: translate({ spec: 'Reliability.Confirm' }) },
    size: 'MEDIUM',
    clickButtonAction: handleButtonClick,
  };

  const inlineContent = {
    title: translate({ spec: 'Reliability.TimezoneConfirmationInlineNotification.Title' }),
    subtitle: translate({ spec: 'Reliability.TimezoneConfirmationInlineNotification.Subtitle' }),
    status: 'ERROR',
  };

  const useWeather = createUseWeatherService({
    useState,
    useRef,
    useCallback: React.useCallback,
    createTimedCache,
    fetchWithTimeout,
    apiKey: API_KEY,
    cacheTtlMs: CACHE_TTL.WEATHER,
    rateLimitMs: RATE_LIMIT,
    formatTimezone: formatTz,
  });
  const { weatherData: w, weatherError: err, weatherLoading: load, timezoneLabel: tz, fetchWeather } = useWeather();
  const [unit, setUnit] = useState('F');

  useEffect(() => {
    // attempt to fetch default weather using current timezone offset if available
    if (defaultTimezoneOffset != null && fetchWeather) {
      // crude mapping: map timezone seconds to lat/lon fallback; this is only a trigger
      fetchWeather(37.7749, -122.4194);
    }
  }, [defaultTimezoneOffset, fetchWeather]);

  return (
    <div id="page-title-container">
      <UiSdlPageTitle {...props} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0' }}>
        <WeatherDisplay
          temperature={typeof w?.temperature === 'number' ? (unit === 'F' ? w.temperature : Math.round((w.temperature - 32) * 5 / 9)) : null}
          unit={unit}
          condition={w?.condition}
          error={err}
          loading={load}
          onUnitToggle={() => setUnit(unit === 'F' ? 'C' : 'F')}
        />
        <span style={{ color: '#333', fontSize: 13 }}>{tz}</span>
      </div>
      <div id="timezone-value-container">{formattedTimezone}</div>
      <SDLActionGroup {...actionGroup} />
      <UiSdlModal {...modalContent} openCloseModalAction={setIsModalOpen}>
        <UiSdlInlineNotification {...inlineContent} />
      </UiSdlModal>
    </div>
  );
};

export default UiSdlPageTitleTimezoneReact;
