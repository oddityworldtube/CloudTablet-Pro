
export type DeviceRole = 'desktop' | 'mobile';
export type ControlMode = 'remote_desktop' | 'graphics_tablet';

export interface RemoteCommand {
  type: 'MOUSE_MOVE' | 'MOUSE_MOVE_RELATIVE' | 'MOUSE_CLICK' | 'MOUSE_RCLICK' | 'MOUSE_WHEEL' | 'KEY_PRESS' | 'SHORTCUT';
  payload: any;
}

export interface SyncMessage {
  type: 'COMMAND' | 'STROKE' | 'SETTINGS' | 'CLEAR' | 'UNDO' | 'TEXT_POST' | 'BRIDGE_STATUS';
  payload?: any;
}
