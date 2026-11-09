import React from 'react';
import { Bluetooth, Cable, Cpu, X, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSimulated: () => void;
  onConnectWebSerial: () => void;
  onConnectWebBluetooth: () => void;
  connectionStatus: ConnectionStatus;
  isSimulated: boolean;
  onDisconnect: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onConnectSimulated,
  onConnectWebSerial,
  onConnectWebBluetooth,
  connectionStatus,
  isSimulated,
  onDisconnect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Conexión con RobotSumo (ESP32)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Selecciona el método de comunicación según tu dispositivo.
          </p>
        </div>

        {connectionStatus === 'connected' ? (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Check className="w-4 h-4" />
              <span>
                {isSimulated ? 'Simulador ESP32 Conectado' : 'Conectado a RobotSumo'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              La conexión está establecida y el sistema de seguridad watchdog (500 ms) está activo.
            </p>
            <button
              onClick={() => {
                onDisconnect();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-lg bg-red-700/80 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Option 1: Web Bluetooth */}
            <button
              onClick={onConnectWebBluetooth}
              className="w-full p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-start gap-3 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Bluetooth className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Bluetooth Inalámbrico (Web Bluetooth)</div>
                <div className="text-[11px] text-slate-400">
                  Ideal para Google Chrome en teléfonos celulares Android o computadoras con Bluetooth.
                </div>
              </div>
            </button>

            {/* Option 2: Web Serial */}
            <button
              onClick={onConnectWebSerial}
              className="w-full p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-start gap-3 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Cable className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Puerto Serie USB / COM Bluetooth (Web Serial)</div>
                <div className="text-[11px] text-slate-400">
                  Conexión directa por cable USB o por puerto COM virtual de Windows emparejado con RobotSumo.
                </div>
              </div>
            </button>

            {/* Option 3: Simulator Mode */}
            <button
              onClick={() => {
                onConnectSimulated();
                onClose();
              }}
              className="w-full p-3.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/50 text-left flex items-start gap-3 transition-colors cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-emerald-300">Modo Simulación ESP32 Integrado</div>
                <div className="text-[11px] text-slate-400">
                  Prueba el robot, los comandos W, S, A, D, L y el Dohyo en pantalla sin necesidad de hardware.
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Nombre de dispositivo esperado: <strong>RobotSumo</strong></span>
        </div>
      </div>
    </div>
  );
};
