import { UiSdlReduxState } from '@c3/types';

export type ImmutableReduxState = Map<keyof UiSdlReduxState, UiSdlReduxState[keyof UiSdlReduxState]>;

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}
