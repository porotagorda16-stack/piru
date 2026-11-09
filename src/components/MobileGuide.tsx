import React from 'react';
import { Smartphone, Bluetooth, CheckCircle2, ArrowRight, Share2, Download } from 'lucide-react';

export const MobileGuide: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Guía para Controlar el Robot desde el Celular
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          El ESP32 emite Bluetooth Clásico bajo el nombre <strong>RobotSumo</strong>. Tienes dos métodos principales y muy cómodos para controlarlo desde tu celular Android.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Web App PWA directa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">1</span>
              <span>Método 1: Esta Misma Aplicación en el Celular (PWA)</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Puedes abrir la URL de esta aplicación web directamente en el navegador <strong>Google Chrome</strong> de tu teléfono celular Android.
            </p>

            <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-400">
              <li>Abre el enlace de esta web en Google Chrome en tu celular.</li>
              <li>
                Toca los tres puntos de Chrome y selecciona <strong>&quot;Agregar a la pantalla principal&quot;</strong>. La app se instalará como una aplicación nativa a pantalla completa.
              </li>
              <li>
                Presiona el botón <strong>&quot;Conectar Bluetooth&quot;</strong> en la barra superior.
              </li>
              <li>
                Selecciona <strong>RobotSumo</strong> en la lista de dispositivos Bluetooth.
              </li>
              <li>
                ¡Listo! Usa la cruceta táctil optimizada para dedos con parada automática al soltar.
              </li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Excelente ergonomía con botones grandes y respuesta táctil inmediata.</span>
          </div>
        </div>

        {/* Method 2: App Serial Bluetooth Terminal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs">2</span>
              <span>Método 2: App &quot;Serial Bluetooth Terminal&quot; (Play Store)</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Para Bluetooth Clásico tradicional sin depender de Web Bluetooth del navegador, la app estándar de la industria para electrónica es <strong>Serial Bluetooth Terminal</strong> (gratuita):
            </p>

            <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-400">
              <li>
                Ve a <strong>Ajustes de Bluetooth</strong> de tu celular, busca dispositivos y vincula <strong>RobotSumo</strong> (código PIN 1234 o 0000 si lo pide).
              </li>
              <li>
                Instala <strong>Serial Bluetooth Terminal</strong> desde Google Play Store.
              </li>
              <li>
                Abre la app, entra al menú lateral &rarr; <strong>Devices</strong> &rarr; pestaña <strong>Bluetooth Classic</strong> y toca <strong>RobotSumo</strong>.
              </li>
              <li>
                En la barra inferior de botones M1 a M6, mantén presionado cada botón para configurarlo:
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] text-slate-200">
                  <div className="bg-slate-950 p-1.5 rounded">M1: Valor <span className="text-amber-400 font-bold">W</span> (Adelante)</div>
                  <div className="bg-slate-950 p-1.5 rounded">M2: Valor <span className="text-amber-400 font-bold">S</span> (Atrás)</div>
                  <div className="bg-slate-950 p-1.5 rounded">M3: Valor <span className="text-amber-400 font-bold">A</span> (Izquierda)</div>
                  <div className="bg-slate-950 p-1.5 rounded">M4: Valor <span className="text-amber-400 font-bold">D</span> (Derecha)</div>
                  <div className="bg-slate-950 p-1.5 rounded col-span-2 text-center">M5: Valor <span className="text-red-400 font-bold">L</span> (STOP)</div>
                </div>
              </li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>100% compatible con todos los teléfonos Android con Bluetooth clásico.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
