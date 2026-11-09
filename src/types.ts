export type Command = 'W' | 'S' | 'A' | 'D' | 'L';

export type ConnectionMode = 'simulated' | 'web-serial' | 'web-bluetooth';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface GpioStatus {
  in1: boolean;      // GPIO 26 - Motor Izq Dir 1
  in2: boolean;      // GPIO 27 - Motor Izq Dir 2
  in3: boolean;      // GPIO 25 - Motor Der Dir 1
  in4: boolean;      // GPIO 33 - Motor Der Dir 2
  enaPwm: number;    // GPIO 14 - Motor Izq PWM (0-255)
  enbPwm: number;    // GPIO 32 - Motor Der PWM (0-255)
}

export interface MotorState {
  leftDirection: 'forward' | 'reverse' | 'stopped';
  rightDirection: 'forward' | 'reverse' | 'stopped';
  leftSpeed: number;
  rightSpeed: number;
}

export interface CommandLog {
  id: string;
  command: Command;
  label: string;
  timestamp: string;
  source: 'button' | 'keyboard' | 'failsafe' | 'heartbeat';
}
