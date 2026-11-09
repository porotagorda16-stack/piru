import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Octagon,
  Gauge,
  ShieldCheck,
  Activity,
  Keyboard,
  Sliders,
  Radio,
  Zap,
} from 'lucide-react';
import { Command, CommandLog, ConnectionStatus, GpioStatus, MotorState } from '../types';

interface RemoteControlProps {
  connectionStatus: ConnectionStatus;
  isSimulated: boolean;
  onConnectClick: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
  sendCommand: (cmd: Command, source: 'button' | 'keyboard' | 'failsafe' | 'heartbeat') => void;
  activeCommand: Command;
  commandLogs: CommandLog[];
  gpioStatus: GpioStatus;
  motorState: MotorState;
}

export const RemoteControl: React.FC<RemoteControlProps> = ({
  connectionStatus,
  isSimulated,
  onConnectClick,
  speed,
  setSpeed,
  sendCommand,
  activeCommand,
  commandLogs,
  gpioStatus,
  motorState,
}) => {
  const [pressedKey, setPressedKey] = useState<Command | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const currentHeldCmdRef = useRef<Command | null>(null);

  // Stop heartbeat interval safely
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current !== null) {
      window.clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    currentHeldCmdRef.current = null;
  }, []);

  // Press down action for movement buttons (W, S, A, D)
  const handleButtonPressDown = useCallback(
    (cmd: Command, source: 'button' | 'keyboard' = 'button') => {
      if (cmd === 'L') {
        stopHeartbeat();
        setPressedKey('L');
        sendCommand('L', source);
        return;
      }

      // If already holding this command, don't restart
      if (currentHeldCmdRef.current === cmd) return;

      stopHeartbeat();
      setPressedKey(cmd);
      currentHeldCmdRef.current = cmd;

      // Send initial command
      sendCommand(cmd, source);

      // Heartbeat pulse every 120ms to refresh ESP32 500ms safety watchdog
      heartbeatTimerRef.current = window.setInterval(() => {
        if (currentHeldCmdRef.current === cmd) {
          sendCommand(cmd, 'heartbeat');
        }
      }, 120);
    },
    [sendCommand, stopHeartbeat]
  );

  // Release action for movement buttons -> sends 'L' automatically
  const handleButtonRelease = useCallback(
    (cmd: Command, source: 'button' | 'keyboard' = 'button') => {
      if (currentHeldCmdRef.current === cmd || pressedKey === cmd) {
        stopHeartbeat();
        setPressedKey(null);
        // Automatically send 'L' to stop both motors immediately
        sendCommand('L', source);
      }
    },
    [sendCommand, stopHeartbeat, pressedKey]
  );

  // Keyboard navigation support (W, S, A, D, L, Space, Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      if (key === 'W' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleButtonPressDown('W', 'keyboard');
      } else if (key === 'S' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleButtonPressDown('S', 'keyboard');
      } else if (key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleButtonPressDown('A', 'keyboard');
      } else if (key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleButtonPressDown('D', 'keyboard');
      } else if (key === 'L' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleButtonPressDown('L', 'keyboard');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      if (key === 'W' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleButtonRelease('W', 'keyboard');
      } else if (key === 'S' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleButtonRelease('S', 'keyboard');
      } else if (key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleButtonRelease('A', 'keyboard');
      } else if (key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleButtonRelease('D', 'keyboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopHeartbeat();
    };
  }, [handleButtonPressDown, handleButtonRelease, stopHeartbeat]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-300">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected'
                ? isSimulated
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                : connectionStatus === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <div>
            <span className="font-semibold text-white">Estado: </span>
            <span className="text-slate-200">
              {connectionStatus === 'connected'
                ? isSimulated
                  ? 'Simulador ESP32 Activo (Listo para pruebas)'
                  : 'ESP32 Conectado (RobotSumo)'
                : connectionStatus === 'connecting'
                ? 'Estableciendo comunicación...'
                : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Failsafe Watchdog: 500 ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span>PWM: {speed} / 255 ({Math.round((speed / 255) * 100)}%)</span>
          </div>
        </div>

        {connectionStatus !== 'connected' && (
          <button
            onClick={onConnectClick}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
          >
            Conectar Robot
          </button>
        )}
      </div>

      {/* Main Grid: Control Pad & Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Robot Sumo Control Pad */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[500px] shadow-sm select-none">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Panel de Control</h2>
              <p className="text-xs text-slate-400">
                Mantén presionado para mover. Al soltar se envía STOP (L) automáticamente.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-md text-xs text-slate-300">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Teclas W, A, S, D, L</span>
            </div>
          </div>

          {/* Controller Pad Layout:
                    [ W ]
              [ A ] [ L ] [ D ]
                    [ S ]
          */}
          <div className="w-full max-w-sm my-auto py-6 flex flex-col items-center">
            {/* Row 1: W Button (Avanzar) */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleButtonPressDown('W');
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleButtonRelease('W');
                }}
                onPointerLeave={(e) => {
                  e.preventDefault();
                  handleButtonRelease('W');
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 touch-none cursor-pointer border ${
                  activeCommand === 'W' || pressedKey === 'W'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-98'
                    : 'bg-slate-800/90 border-slate-700 text-slate-100 hover:bg-slate-700/80 shadow-md'
                }`}
                aria-label="Avanzar (W)"
              >
                <ArrowUp className="w-8 h-8" />
                <span className="font-extrabold text-xl">W</span>
                <span className="text-[10px] tracking-wider uppercase text-slate-300 font-medium">
                  Avanzar
                </span>
              </button>
            </div>

            {/* Row 2: A (Izquierda), L (STOP), D (Derecha) */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
              {/* Button A: Izquierda */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleButtonPressDown('A');
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleButtonRelease('A');
                }}
                onPointerLeave={(e) => {
                  e.preventDefault();
                  handleButtonRelease('A');
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 touch-none cursor-pointer border ${
                  activeCommand === 'A' || pressedKey === 'A'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-98'
                    : 'bg-slate-800/90 border-slate-700 text-slate-100 hover:bg-slate-700/80 shadow-md'
                }`}
                aria-label="Girar Izquierda (A)"
              >
                <ArrowLeft className="w-8 h-8" />
                <span className="font-extrabold text-xl">A</span>
                <span className="text-[10px] tracking-wider uppercase text-slate-300 font-medium">
                  Izquierda
                </span>
              </button>

              {/* Button L: Central STOP (Grande y claramente visible) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleButtonPressDown('L');
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 touch-none cursor-pointer border-2 ${
                  activeCommand === 'L' || activeCommand === null
                    ? 'bg-red-600 border-red-400 text-white shadow-[0_0_25px_rgba(220,38,38,0.7)]'
                    : 'bg-red-700/80 border-red-500 text-white hover:bg-red-600 shadow-lg'
                }`}
                aria-label="Detener Robot (STOP L)"
              >
                <Octagon className="w-10 h-10 fill-white/20 stroke-white animate-pulse" />
                <span className="font-black text-2xl tracking-wider">STOP</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-black/40 rounded text-red-100">
                  [ L ]
                </span>
              </button>

              {/* Button D: Derecha */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleButtonPressDown('D');
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleButtonRelease('D');
                }}
                onPointerLeave={(e) => {
                  e.preventDefault();
                  handleButtonRelease('D');
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 touch-none cursor-pointer border ${
                  activeCommand === 'D' || pressedKey === 'D'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-98'
                    : 'bg-slate-800/90 border-slate-700 text-slate-100 hover:bg-slate-700/80 shadow-md'
                }`}
                aria-label="Girar Derecha (D)"
              >
                <ArrowRight className="w-8 h-8" />
                <span className="font-extrabold text-xl">D</span>
                <span className="text-[10px] tracking-wider uppercase text-slate-300 font-medium">
                  Derecha
                </span>
              </button>
            </div>

            {/* Row 3: S Button (Retroceder) */}
            <div className="flex justify-center">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleButtonPressDown('S');
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleButtonRelease('S');
                }}
                onPointerLeave={(e) => {
                  e.preventDefault();
                  handleButtonRelease('S');
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 touch-none cursor-pointer border ${
                  activeCommand === 'S' || pressedKey === 'S'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-98'
                    : 'bg-slate-800/90 border-slate-700 text-slate-100 hover:bg-slate-700/80 shadow-md'
                }`}
                aria-label="Retroceder (S)"
              >
                <ArrowDown className="w-8 h-8" />
                <span className="font-extrabold text-xl">S</span>
                <span className="text-[10px] tracking-wider uppercase text-slate-300 font-medium">
                  Retroceder
                </span>
              </button>
            </div>
          </div>

          {/* Speed Controller Section */}
          <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Control de Velocidad (PWM)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Actual:</span>
                <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                  {speed} / 255
                </span>
                <span className="text-xs text-slate-400">
                  ({Math.round((speed / 255) * 100)}%)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="255"
                step="5"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>0 (Parado)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSpeed(150)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    150 (Lento)
                  </button>
                  <button
                    onClick={() => setSpeed(200)}
                    className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-600/50 hover:bg-amber-800/60 text-amber-200 cursor-pointer font-medium"
                  >
                    200 (Default)
                  </button>
                  <button
                    onClick={() => setSpeed(255)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    255 (Máx)
                  </button>
                </div>
                <span>255 (Máximo)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Motor Status, GPIO Signal Monitor & Serial Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Motor Actuators Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Estado de Motores DC (L298N)</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {activeCommand === 'L' ? 'DETENIDO' : `ACTIVO [${activeCommand}]`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Left Motor (OUT1, OUT2) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Motor Izquierdo</span>
                  <span className="text-[10px] text-slate-400">OUT1/OUT2</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      motorState.leftDirection === 'forward'
                        ? 'bg-emerald-400 animate-pulse'
                        : motorState.leftDirection === 'reverse'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-bold text-white uppercase">
                    {motorState.leftDirection === 'forward'
                      ? 'Adelante'
                      : motorState.leftDirection === 'reverse'
                      ? 'Reversa'
                      : 'Parado'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                  <span>PWM (ENA):</span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {motorState.leftSpeed}
                  </span>
                </div>
              </div>

              {/* Right Motor (OUT3, OUT4) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Motor Derecho</span>
                  <span className="text-[10px] text-slate-400">OUT3/OUT4</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      motorState.rightDirection === 'forward'
                        ? 'bg-emerald-400 animate-pulse'
                        : motorState.rightDirection === 'reverse'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-bold text-white uppercase">
                    {motorState.rightDirection === 'forward'
                      ? 'Adelante'
                      : motorState.rightDirection === 'reverse'
                      ? 'Reversa'
                      : 'Parado'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                  <span>PWM (ENB):</span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {motorState.rightSpeed}
                  </span>
                </div>
              </div>
            </div>

            {/* GPIO Real-Time State Table */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Señales Lógicas en GPIOs del ESP32:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500">GPIO 26</div>
                  <div className="text-[10px] text-slate-400 font-sans">IN1</div>
                  <div
                    className={`font-bold mt-1 ${
                      gpioStatus.in1 ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {gpioStatus.in1 ? 'HIGH' : 'LOW'}
                  </div>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500">GPIO 27</div>
                  <div className="text-[10px] text-slate-400 font-sans">IN2</div>
                  <div
                    className={`font-bold mt-1 ${
                      gpioStatus.in2 ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {gpioStatus.in2 ? 'HIGH' : 'LOW'}
                  </div>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500">GPIO 25</div>
                  <div className="text-[10px] text-slate-400 font-sans">IN3</div>
                  <div
                    className={`font-bold mt-1 ${
                      gpioStatus.in3 ? 'text-blue-400' : 'text-slate-600'
                    }`}
                  >
                    {gpioStatus.in3 ? 'HIGH' : 'LOW'}
                  </div>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500">GPIO 33</div>
                  <div className="text-[10px] text-slate-400 font-sans">IN4</div>
                  <div
                    className={`font-bold mt-1 ${
                      gpioStatus.in4 ? 'text-blue-400' : 'text-slate-600'
                    }`}
                  >
                    {gpioStatus.in4 ? 'HIGH' : 'LOW'}
                  </div>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500">GPIO 14</div>
                  <div className="text-[10px] text-slate-400 font-sans">ENA</div>
                  <div className="font-bold text-amber-400 mt-1 tabular-nums">
                    {gpioStatus.enaPwm}
                  </div>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500">GPIO 32</div>
                  <div className="text-[10px] text-slate-400 font-sans">ENB</div>
                  <div className="font-bold text-amber-400 mt-1 tabular-nums">
                    {gpioStatus.enbPwm}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Command Stream Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Registro de Comandos Enviados</h3>
              </div>
              <span className="text-[10px] text-slate-400">Serial / BT 115200</span>
            </div>

            <div className="bg-slate-950 rounded-xl p-3 h-44 overflow-y-auto font-mono text-xs space-y-1.5 border border-slate-800/80">
              {commandLogs.length === 0 ? (
                <div className="text-slate-600 text-center py-6">
                  Presiona W, A, S, D o L para iniciar transmisión...
                </div>
              ) : (
                commandLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 tabular-nums">{log.timestamp}</span>
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                          log.command === 'L'
                            ? 'bg-red-950 text-red-400'
                            : 'bg-blue-950 text-blue-300'
                        }`}
                      >
                        [{log.command}]
                      </span>
                      <span>{log.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {log.source === 'heartbeat' ? 'pulso' : log.source}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
