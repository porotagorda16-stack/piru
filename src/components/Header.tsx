import React from 'react';
import { Bluetooth, Radio, Cpu, BookOpen, Layers, Smartphone } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface HeaderProps {
  activeTab: 'control' | 'simulator' | 'code' | 'wiring' | 'mobile';
  setActiveTab: (tab: 'control' | 'simulator' | 'code' | 'wiring' | 'mobile') => void;
  connectionStatus: ConnectionStatus;
  onConnectClick: () => void;
  isSimulated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  connectionStatus,
  onConnectClick,
  isSimulated,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-16 bg-slate-900 border-b border-slate-800 text-white">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
          武
        </div>
        <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
          Robot Sumo ESP32
        </span>
      </div>

      {/* Zone 2: Clean text navigation links / tabs */}
      <nav className="hidden lg:flex items-center gap-1">
        <button
          onClick={() => setActiveTab('control')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'control'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Control Remoto
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'simulator'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Simulador Dohyo
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'code'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Código PlatformIO
        </button>
        <button
          onClick={() => setActiveTab('wiring')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'wiring'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Conexión L298N
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'mobile'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Guía Celular
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onConnectClick}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            connectionStatus === 'connected'
              ? isSimulated
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
              : connectionStatus === 'connecting'
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Bluetooth className="w-4 h-4 shrink-0" />
          <span>
            {connectionStatus === 'connected'
              ? isSimulated
                ? 'Simulador Activo'
                : 'Conectado: RobotSumo'
              : connectionStatus === 'connecting'
              ? 'Conectando...'
              : 'Conectar Bluetooth'}
          </span>
        </button>
      </div>
    </header>
  );
};
