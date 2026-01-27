/*
 * Copyright 2009-2025 C3 AI (www.c3.ai). All Rights Reserved.
 * Confidential and Proprietary C3 Materials.
 * This material, including without limitation any software, is the confidential trade secret and proprietary
 * information of C3 and its licensors. Reproduction, use and/or distribution of this material in any form is
 * strictly prohibited except as set forth in a written license agreement with C3 and/or its authorized distributors.
 * This material may be covered by one or more patents or pending patent applications.
 */

import * as React from 'react';
import { useState } from 'react';
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
import WeatherWidget from '../components/WeatherWidget.js';

const appStateId = 'Reliability.ReliabilityApplicationState';
const modalId = 'Reliability.TimezoneConfirmationModal';

/*
 * Function to transform the timezoneLabel in the format: "timezoneLabel (timezoneOffset)"
 */
function formatTimezone(timezoneLabel, timezoneOffset) {
  if (timezoneLabel) {
    timezoneLabel = `${timezoneLabel} (${timezoneOffset})`;
  }

  return timezoneLabel;
}

const UiSdlPageTitleTimezoneReact: React.FunctionComponent<Props> = (props: Props) => {
  const translate = useTranslate();
  const dispatch = useDispatch();

  const currentPath: string = useSelector((state: ImmutableReduxState) => {
    return getCurrentPathFromState('SDL.DefaultSite', state);
  });
  const currentUrlRoute: UiSdlRoute = useSelector((state: ImmutableReduxState) => {
    return findMatchingRoute(currentPath, getRoutesFromState('SDL.DefaultSite', state));
  });
  const inAppDocExistsForCurrentRoute = !!currentUrlRoute?.inAppDoc;

  const hasGenAiAccess = useSelector((state: ImmutableReduxState) => {
    return matchesRoles({ matchingRole: ['Reliability.GenaiUser.Role', 'C3.AppAdmin'] }, { state });
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowInAppEmbeddedDoc = () => {
    dispatch({
      type: 'SDL.DefaultInAppDoc.IN_APP_DOC_SHOW_HIDE',
      payload: {
        show: true,
        componentId: 'SDL.DefaultInAppDoc',
      },
    });
  };

  // Handle MODAL Button Click actions
  const handleButtonClick = (button) => {
    setIsModalOpen(false);
    if (button === 'PRIMARY') {
      dispatch({
        type: 'GLOBAL_PAGE_TITLE_ACTION_CLICK_REDIRECT_SETTINGS',
      });
    }
  };

  // Handle SHOW_CONFIRMATION_MODAL action
  const handleShowConfirmationModal = () => {
    setIsModalOpen(true);
  };

  // Handle SHOW_ALERTS action
  const handleShowAlerts = () => {
    dispatch({
      type: 'GLOBAL_PAGE_TITLE_ACTION_CLICK_SHOW_ALERTS',
    });
  };

  // Handle SHOW_CASES action
  const handleShowCases = () => {
    dispatch({
      type: 'GLOBAL_PAGE_TITLE_ACTION_CLICK_SHOW_CASES',
    });
  };

  const handleShowAgent = () => {
    dispatch({
      type: 'GLOBAL_PAGE_TITLE_ACTION_CLICK_SHOW_AGENT',
    });
  };

  const defaultTimezoneLabel = useSelector((state: ImmutableReduxState) => {
    return getConfigFromApplicationState(appStateId, state, ['uiTimezoneLabel']);
  });

  const defaultTimezoneOffset = useSelector((state: ImmutableReduxState) => {
    return getConfigFromApplicationState(appStateId, state, ['uiTimezoneOffset']);
  });

  const formattedTimezone = formatTimezone(defaultTimezoneLabel, defaultTimezoneOffset);

  const actionGroup = {
    actions: [
      {
        size: 'small',
        usage: 'icon',
        iconSuffix: 'globe-americas',
        name: translate({ spec: 'Reliability.ChangeTimezone' }),
        onClick: handleShowConfirmationModal,
      },
      {
        size: 'small',
        usage: 'icon',
        iconSuffix: 'exclamation-triangle',
        actionSuffix: 'SHOW_ALERTS',
        onClick: handleShowAlerts,
      },
      {
        size: 'small',
        usage: 'icon',
        iconSuffix: 'folder-plus',
        actionSuffix: 'SHOW_CASES',
        onClick: handleShowCases,
      },
    ],
    collapseThreshold: 5,
  };

  if (hasGenAiAccess) {
    actionGroup.actions.push({
      size: 'small',
      usage: 'icon',
      iconSuffix: 'sparkles',
      actionSuffix: 'SHOW_AGENT',
      onClick: handleShowAgent,
    });
  }

  // Add the Show Documentation action to the action group if the route has an in-app embedded document associated with it
  if (inAppDocExistsForCurrentRoute) {
    actionGroup.actions.push({
      size: 'small',
      usage: 'icon',
      iconSuffix: 'circle-question',
      name: translate({ spec: 'Reliability.ShowDocumentation' }),
      onClick: handleShowInAppEmbeddedDoc,
    });
  }

  const modalContent = {
    id: modalId,
    open: isModalOpen,
    header: {
      text: translate({ spec: 'Reliability.TimezoneConfirmationModal.Header' }),
    },
    subHeader: {
      text: `${translate({ spec: 'Reliability.TimezoneConfirmationModal.subHeader' })} ${formattedTimezone}`,
    },
    modalType: {
      type: 'UiSdlTwoButtonModal',
      primaryButtonLabel: translate({ spec: 'Reliability.Confirm' }),
    },
    size: 'MEDIUM',
    clickButtonAction: handleButtonClick,
  };

  const inlineContent = {
    title: translate({ spec: 'Reliability.TimezoneConfirmationInlineNotification.Title' }),
    subtitle: translate({ spec: 'Reliability.TimezoneConfirmationInlineNotification.Subtitle' }),
    status: 'ERROR',
  };

  return (
    <div id="page-title-container">
      <UiSdlPageTitle {...props} />
      {/* Weather widget in navbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0' }}>
        <WeatherWidget />
      </div>
      <div id="timezone-value-container">{formattedTimezone}</div>
      <SDLActionGroup {...actionGroup} />
      <UiSdlModal
        {...modalContent}
        openCloseModalAction={setIsModalOpen}
        children={<UiSdlInlineNotification {...inlineContent} />}
      />
    </div>
  );
};

export default UiSdlPageTitleTimezoneReact;
