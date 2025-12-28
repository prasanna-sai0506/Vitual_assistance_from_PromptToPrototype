export enum AppState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}

export interface SystemState {
  wifi: boolean;
  bluetooth: boolean;
  airplaneMode: boolean;
  brightness: number; // 0-100
  volume: number; // 0-100
  powerSaver: boolean;
  theme: 'light' | 'dark';
}

export interface AssistantConfig {
  name: string;
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  source: 'user' | 'system' | 'assistant';
  message: string;
  type: 'info' | 'action' | 'error';
}

// Mock Data Types
export interface MockFile {
  name: string;
  type: 'pdf' | 'docx' | 'jpg' | 'png' | 'txt' | 'exe';
  path: string;
  date: string;
}

export interface Timer {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  active: boolean;
}

// Function Calling Tool Definition Types
export interface ToolCallArgs {
  setting?: string;
  value?: boolean | number | string;
  action?: string;
  appName?: string;
  query?: string;
  duration?: number;
  location?: string;
  fileType?: string;
  date?: string;
}