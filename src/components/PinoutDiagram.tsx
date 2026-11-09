import React from 'react';
import { Layers, AlertTriangle, CheckCircle, ShieldAlert, Zap, Cpu } from 'lucide-react';
import { PINOUT_INFO } from '../data/esp32Code';

export const PinoutDiagram: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Esquema de Conexión: ESP32 &rarr; Driver L298N
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Conexión exacta y verificada para el robot de combate sumo. Asegúrate de respetar cada GPIO asignado en el código para que el control de giro y velocidad funcione correctamente.
        </p>
      </div>

      {/* Critical Reminders / Advertencias Esenciales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Retirar Jumpers ENA y ENB</span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            El driver L298N viene de fábrica con dos puentes (jumpers) negros colocados en ENA y ENB. <strong>Debes retirarlos</strong> para conectar los cables de GPIO 14 y GPIO 32 y permitir el control de velocidad por PWM.
          </p>
        </div>

        <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Tierra Común (GND Unificado)</span>
          </div>
          <p className="text-[11px] text-blue-200/80 leading-relaxed">
            Es fundamental unir el pin <strong>GND del ESP32</strong> con el pin <strong>GND del L298N</strong> y el polo negativo <strong>(-) de la batería</strong>. Sin tierra de referencia común, los motores responderán de forma errática.
          </p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
            <Zap className="w-4 h-4 shrink-0" />
            <span>Batería e Interruptor</span>
          </div>
          <p className="text-[11px] text-emerald-200/80 leading-relaxed">
            Conecta el polo positivo (+) de la batería (7.4V LiPo o 2 baterías 18650) a través del <strong>interruptor general</strong> a la bornera de <strong>+12V / VCC</strong> del L298N para cortar la energía con seguridad.
          </p>
        </div>
      </div>

      {/* Pin Mapping Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white">Tabla de Asignación de Pines y Funciones</h3>
          <span className="text-xs text-slate-400 font-mono">ESP32 DevKit V1 (30/38 pines)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Borne / Pin L298N</th>
                <th className="py-2.5 px-3">Pin ESP32</th>
                <th className="py-2.5 px-3">Tipo Señal</th>
                <th className="py-2.5 px-3">Función en el Robot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              {PINOUT_INFO.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-amber-300">{row.pinL298N}</td>
                  <td className="py-3 px-3 font-bold text-blue-300">{row.pinEsp32}</td>
                  <td className="py-3 px-3 text-slate-400 font-sans">{row.tipo}</td>
                  <td className="py-3 px-3 text-slate-300 font-sans">{row.funcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logic Table Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
          Tabla de Verdad: Comandos vs Señales del Driver L298N
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2 px-2 text-left">Comando</th>
                <th className="py-2 px-2">Acción Robot</th>
                <th className="py-2 px-2 text-emerald-400">IN1 (26)</th>
                <th className="py-2 px-2 text-emerald-400">IN2 (27)</th>
                <th className="py-2 px-2 text-blue-400">IN3 (25)</th>
                <th className="py-2 px-2 text-blue-400">IN4 (33)</th>
                <th className="py-2 px-2 text-amber-400">ENA (14)</th>
                <th className="py-2 px-2 text-amber-400">ENB (32)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-slate-300 text-center">
              <tr className="hover:bg-slate-800/40">
                <td className="py-2 px-2 text-left font-bold text-white">W / w</td>
                <td className="py-2 px-2 font-sans text-slate-300">Avanzar</td>
                <td className="py-2 px-2 font-bold text-emerald-400">HIGH</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 font-bold text-blue-400">HIGH</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 text-amber-400">200 PWM</td>
                <td className="py-2 px-2 text-amber-400">200 PWM</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2 px-2 text-left font-bold text-white">S / s</td>
                <td className="py-2 px-2 font-sans text-slate-300">Retroceder</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 font-bold text-emerald-400">HIGH</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 font-bold text-blue-400">HIGH</td>
                <td className="py-2 px-2 text-amber-400">200 PWM</td>
                <td className="py-2 px-2 text-amber-400">200 PWM</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2 px-2 text-left font-bold text-white">A / a</td>
                <td className="py-2 px-2 font-sans text-slate-300">Girar Izquierda</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 font-bold text-emerald-400">HIGH</td>
                <td className="py-2 px-2 font-bold text-blue-400">HIGH</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 text-amber-400">200 PWM</td>
                <td className="py-2 px-2 text-amber-400">200 PWM</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2 px-2 text-left font-bold text-white">D / d</td>
                <td className="py-2 px-2 font-sans text-slate-300">Girar Derecha</td>
                <td className="py-2 px-2 font-bold text-emerald-400">HIGH</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 font-bold text-blue-400">HIGH</td>
                <td className="py-2 px-2 text-amber-400">200 PWM</td>
                <td className="py-2 px-2 text-amber-400">200 PWM</td>
              </tr>
              <tr className="hover:bg-slate-800/40 bg-red-950/20">
                <td className="py-2 px-2 text-left font-bold text-red-400">L / l</td>
                <td className="py-2 px-2 font-sans font-bold text-red-300">STOP Inmediato</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 text-slate-500">LOW</td>
                <td className="py-2 px-2 text-red-400 font-bold">0</td>
                <td className="py-2 px-2 text-red-400 font-bold">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
