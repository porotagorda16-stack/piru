import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { RemoteControl } from './components/RemoteControl';
import { RobotArena } from './components/RobotArena';
import { CodeViewer } from './components/CodeViewer';
import { PinoutDiagram } from './components/PinoutDiagram';
import { MobileGuide } from './components/MobileGuide';
import { ConnectModal } from './components/ConnectModal';
import { Command, CommandLog, ConnectionMode, ConnectionStatus, GpioStatus, MotorState } from './types';
import robotHeroImage from './assets/images/robot_sumo_chassis_1791235717001.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<'control' | 'simulator' | 'code' | 'wiring' | 'mobile'>('control');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('simulated');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [speed, setSpeed] = useState<number>(200); // 200 de 255 por especificación
  const [activeCommand, setActiveCommand] = useState<Command>('L');
  const [failsafeTriggered, setFailsafeTriggered] = useState<boolean>(false);
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);

  // Hardware references for real serial / bluetooth
  const serialPortRef = useRef<any>(null);
  const serialWriterRef = useRef<WritableStreamDefaultWriter | null>(null);
  const bleCharacteristicRef = useRef<any>(null);

  // Safety failsafe timer reference (500 ms)
  const failsafeTimerRef = useRef<number | null>(null);
  const lastCommandTimeRef = useRef<number>(Date.now());

  // Motor & GPIO State
  const [gpioStatus, setGpioStatus] = useState<GpioStatus>({
    in1: false,
    in2: false,
    in3: false,
    in4: false,
    enaPwm: 0,
    enbPwm: 0,
  });

  const [motorState, setMotorState] = useState<MotorState>({
    leftDirection: 'stopped',
    rightDirection: 'stopped',
    leftSpeed: 0,
    rightSpeed: 0,
  });

  // Calculate GPIO and Motor state from command and speed
  const computeHardwareState = useCallback((cmd: Command, currentSpeed: number) => {
    switch (cmd) {
      case 'W': // Ambos adelante
        setGpioStatus({
          in1: true,
          in2: false,
          in3: true,
          in4: false,
          enaPwm: currentSpeed,
          enbPwm: currentSpeed,
        });
        setMotorState({
          leftDirection: 'forward',
          rightDirection: 'forward',
          leftSpeed: currentSpeed,
          rightSpeed: currentSpeed,
        });
        break;

      case 'S': // Ambos atrás
        setGpioStatus({
          in1: false,
          in2: true,
          in3: false,
          in4: true,
          enaPwm: currentSpeed,
          enbPwm: currentSpeed,
        });
        setMotorState({
          leftDirection: 'reverse',
          rightDirection: 'reverse',
          leftSpeed: currentSpeed,
          rightSpeed: currentSpeed,
        });
        break;

      case 'A': // Girar izquierda (izq atrás, der adelante)
        setGpioStatus({
          in1: false,
          in2: true,
          in3: true,
          in4: false,
          enaPwm: currentSpeed,
          enbPwm: currentSpeed,
        });
        setMotorState({
          leftDirection: 'reverse',
          rightDirection: 'forward',
          leftSpeed: currentSpeed,
          rightSpeed: currentSpeed,
        });
        break;

      case 'D': // Girar derecha (izq adelante, der atrás)
        setGpioStatus({
          in1: true,
          in2: false,
          in3: false,
          in4: true,
          enaPwm: currentSpeed,
          enbPwm: currentSpeed,
        });
        setMotorState({
          leftDirection: 'forward',
          rightDirection: 'reverse',
          leftSpeed: currentSpeed,
          rightSpeed: currentSpeed,
        });
        break;

      case 'L': // STOP Inmediato
      default:
        setGpioStatus({
          in1: false,
          in2: false,
          in3: false,
          in4: false,
          enaPwm: 0,
          enbPwm: 0,
        });
        setMotorState({
          leftDirection: 'stopped',
          rightDirection: 'stopped',
          leftSpeed: 0,
          rightSpeed: 0,
        });
        break;
    }
  }, []);

  // Update hardware state when speed changes while moving
  useEffect(() => {
    if (activeCommand !== 'L') {
      computeHardwareState(activeCommand, speed);
    }
  }, [speed, activeCommand, computeHardwareState]);

  // Command transmission handler
  const sendCommand = useCallback(
    (cmd: Command, source: 'button' | 'keyboard' | 'failsafe' | 'heartbeat' = 'button') => {
      lastCommandTimeRef.current = Date.now();
      setActiveCommand(cmd);

      // Reset failsafe alert when valid command received
      if (cmd !== 'L') {
        setFailsafeTriggered(false);
      }

      computeHardwareState(cmd, speed);

      // Log command
      const labelMap: Record<Command, string> = {
        W: 'Avanzar (Adelante)',
        S: 'Retroceder (Atrás)',
        A: 'Girar Izquierda',
        D: 'Girar Derecha',
        L: 'STOP (Detener)',
      };

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
        .getMilliseconds()
        .toString()
        .padStart(3, '0')}`;

      // Only add to visible log if not a redundant high-frequency heartbeat
      if (source !== 'heartbeat') {
        setCommandLogs((prev) => [
          {
            id: Math.random().toString(36).substring(2, 9),
            command: cmd,
            label: labelMap[cmd],
            timestamp: timeStr,
            source,
          },
          ...prev.slice(0, 49),
        ]);
      }

      // Transmit over real Web Serial if connected
      if (serialWriterRef.current) {
        try {
          const encoder = new TextEncoder();
          serialWriterRef.current.write(encoder.encode(cmd));
        } catch (err) {
          console.error('Error escribiendo en puerto Serial:', err);
        }
      }

      // Transmit over real Web Bluetooth BLE if connected
      if (bleCharacteristicRef.current) {
        try {
          const encoder = new TextEncoder();
          bleCharacteristicRef.current.writeValue(encoder.encode(cmd));
        } catch (err) {
          console.error('Error escribiendo en Bluetooth BLE:', err);
        }
      }

      // Manage the 500 ms Safety Failsafe Watchdog
      if (failsafeTimerRef.current !== null) {
        window.clearTimeout(failsafeTimerRef.current);
        failsafeTimerRef.current = null;
      }

      // If moving (W, S, A, D), arm the 500ms watchdog
      if (cmd !== 'L') {
        failsafeTimerRef.current = window.setTimeout(() => {
          // Timeout expired! Automatically stop the robot
          setActiveCommand('L');
          computeHardwareState('L', 0);
          setFailsafeTriggered(true);

          setCommandLogs((prev) => [
            {
              id: Math.random().toString(36).substring(2, 9),
              command: 'L',
              label: 'FAILSAFE: Timeout >500ms -> Parada de Emergencia',
              timestamp: `${new Date().toLocaleTimeString()}`,
              source: 'failsafe',
            },
            ...prev.slice(0, 49),
          ]);
        }, 500);
      }
    },
    [computeHardwareState, speed]
  );

  // Web Serial Connection implementation
  const handleConnectWebSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Tu navegador no soporta Web Serial API. Usa Google Chrome o Edge en PC/Mac.');
      return;
    }

    try {
      setConnectionStatus('connecting');
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      serialWriterRef.current = port.writable.getWriter();
      setConnectionStatus('connected');
      setConnectionMode('web-serial');
      setIsConnectModalOpen(false);
    } catch (err) {
      console.warn('Usuario canceló o error en conexión Serial:', err);
      setConnectionStatus('disconnected');
    }
  };

  // Web Bluetooth Connection implementation
  const handleConnectWebBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
      alert('Tu navegador no soporta Web Bluetooth API. Abre esta aplicación en Google Chrome para Android.');
      return;
    }

    try {
      setConnectionStatus('connecting');
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', '0000ffe0-0000-1000-8000-00805f9b34fb'],
      });

      setConnectionStatus('connected');
      setConnectionMode('web-bluetooth');
      setIsConnectModalOpen(false);
    } catch (err) {
      console.warn('Usuario canceló o error en conexión Bluetooth:', err);
      setConnectionStatus('disconnected');
    }
  };

  const handleConnectSimulated = () => {
    setConnectionMode('simulated');
    setConnectionStatus('connected');
    setIsConnectModalOpen(false);
  };

  const handleDisconnect = async () => {
    if (serialWriterRef.current) {
      try {
        await serialWriterRef.current.close();
      } catch (e) {
        // ignore
      }
      serialWriterRef.current = null;
    }
    if (serialPortRef.current) {
      try {
        await serialPortRef.current.close();
      } catch (e) {
        // ignore
      }
      serialPortRef.current = null;
    }
    setConnectionStatus('disconnected');
    setConnectionMode('simulated');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* 3-Zone Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionStatus={connectionStatus}
        onConnectClick={() => setIsConnectModalOpen(true)}
        isSimulated={connectionMode === 'simulated'}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pb-16">
        {/* Hero Banner with Generated Robot Sumo Studio Photo */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900 h-44 sm:h-52">
            <img
              src={robotHeroImage}
              alt="Robot Sumo de combate con chasis de aluminio, cuchilla de empuje y ruedas de alta tracción"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent flex items-center p-6 sm:p-8">
              <div className="max-w-xl space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Controlador Robótico ESP32 + L298N
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Robot Sumo Bluetooth Clásico
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Sistema de combate con control diferencial PWM (200/255), cruceta W/S/A/D/L, parada instantánea de seguridad y watchdog automático de 500 ms.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Sub-Navigation for Mobile/Small Screens */}
        <div className="lg:hidden max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs">
            <button
              onClick={() => setActiveTab('control')}
              className={`py-2 px-1 rounded-lg font-medium transition-colors ${
                activeTab === 'control' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              Control
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`py-2 px-1 rounded-lg font-medium transition-colors ${
                activeTab === 'simulator' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              Dohyo
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`py-2 px-1 rounded-lg font-medium transition-colors ${
                activeTab === 'code' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              Código
            </button>
            <button
              onClick={() => setActiveTab('wiring')}
              className={`py-2 px-1 rounded-lg font-medium transition-colors ${
                activeTab === 'wiring' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              Pines
            </button>
            <button
              onClick={() => setActiveTab('mobile')}
              className={`py-2 px-1 rounded-lg font-medium transition-colors ${
                activeTab === 'mobile' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              Celular
            </button>
          </div>
        </div>

        {/* Dynamic Tab Content */}
        <div className="mt-2">
          {activeTab === 'control' && (
            <RemoteControl
              connectionStatus={connectionStatus}
              isSimulated={connectionMode === 'simulated'}
              onConnectClick={() => setIsConnectModalOpen(true)}
              speed={speed}
              setSpeed={setSpeed}
              sendCommand={sendCommand}
              activeCommand={activeCommand}
              commandLogs={commandLogs}
              gpioStatus={gpioStatus}
              motorState={motorState}
            />
          )}

          {activeTab === 'simulator' && (
            <RobotArena
              activeCommand={activeCommand}
              speed={speed}
              motorState={motorState}
              gpioStatus={gpioStatus}
              failsafeTriggered={failsafeTriggered}
            />
          )}

          {activeTab === 'code' && <CodeViewer />}

          {activeTab === 'wiring' && <PinoutDiagram />}

          {activeTab === 'mobile' && <MobileGuide />}
        </div>
      </main>

      {/* Connect Modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnectSimulated={handleConnectSimulated}
        onConnectWebSerial={handleConnectWebSerial}
        onConnectWebBluetooth={handleConnectWebBluetooth}
        connectionStatus={connectionStatus}
        isSimulated={connectionMode === 'simulated'}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
}
