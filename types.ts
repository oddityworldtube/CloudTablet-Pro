
export type DeviceRole = 'desktop' | 'mobile';

export interface RemoteCommand {
  type: 'MOUSE_MOVE_ABS' | 'MOUSE_CLICK' | 'MOUSE_RCLICK' | 'MOUSE_DOWN' | 'MOUSE_UP' | 'KEY_PRESS' | 'SCROLL';
  payload: any;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  color: string;
  size: number;
  isDrawing: boolean;
}

export interface SyncMessage {
  type: 'COMMAND' | 'STROKE' | 'CLEAR' | 'UNDO' | 'SYNC_SCREEN_SIZE';
  payload?: any;
}
