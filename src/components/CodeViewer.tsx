import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, CheckCircle2, AlertTriangle, FileCode, Wrench } from 'lucide-react';
import { MAIN_CPP_CODE, PLATFORMIO_INI_CODE } from '../data/esp32Code';

export const CodeViewer: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'main' | 'ini' | 'guide'>('main');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Tab Navigation for Code and Tutorial */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveCodeTab('main')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeCodeTab === 'main'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>src/main.cpp</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('ini')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeCodeTab === 'ini'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>platformio.ini</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeCodeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Guía Paso a Paso (VS Code + PlatformIO)</span>
          </button>
        </div>

        {/* Action Buttons for Copy & Download */}
        {activeCodeTab !== 'guide' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeCodeTab === 'main') handleCopy(MAIN_CPP_CODE, 'main.cpp');
                if (activeCodeTab === 'ini') handleCopy(PLATFORMIO_INI_CODE, 'platformio.ini');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors border border-slate-700"
            >
              {copiedFile ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (activeCodeTab === 'main') handleDownload('main.cpp', MAIN_CPP_CODE);
                if (activeCodeTab === 'ini') handleDownload('platformio.ini', PLATFORMIO_INI_CODE);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Archivo</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab: main.cpp */}
      {activeCodeTab === 'main' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono">src/main.cpp</h3>
              <p className="text-xs text-slate-400">
                Código completo para ESP32 con Bluetooth Clásico, PWM, Watchdog de 500ms y control L298N.
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded">
              100% Listo para Subir
            </span>
          </div>

          <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[580px] border border-slate-800/80">
            <code>{MAIN_CPP_CODE}</code>
          </pre>
        </div>
      )}

      {/* Tab: platformio.ini */}
      {activeCodeTab === 'ini' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono">platformio.ini</h3>
              <p className="text-xs text-slate-400">
                Configuración del entorno PlatformIO para placa ESP32 (esp32dev) con partición para Bluetooth.
              </p>
            </div>
            <span className="text-[11px] font-mono text-blue-400 bg-blue-950/70 border border-blue-800/80 px-2 py-0.5 rounded">
              monitor_speed = 115200
            </span>
          </div>

          <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed border border-slate-800/80">
            <code>{PLATFORMIO_INI_CODE}</code>
          </pre>
        </div>
      )}

      {/* Tab: Detailed VS Code + PlatformIO Guide */}
      {activeCodeTab === 'guide' && (
        <div className="space-y-6">
          {/* Card 1: Prerrequisitos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              1. Preparar el Entorno en Visual Studio Code
            </h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Descarga e instala <strong>Visual Studio Code</strong> si aún no lo tienes.
                </li>
                <li>
                  Abre VS Code y ve a la sección de extensiones en la barra lateral izquierda (o presiona{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-200">Ctrl + Shift + X</kbd>).
                </li>
                <li>
                  Busca <strong>PlatformIO IDE</strong> (del autor <em>PlatformIO</em>) y haz clic en <strong>Install</strong>.
                </li>
                <li>
                  Espera a que PlatformIO termine de inicializarse (verás un icono de una hormiga alienígena en la barra izquierda).
                </li>
              </ol>
            </div>
          </div>

          {/* Card 2: Crear el Proyecto */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              2. Crear el Proyecto en PlatformIO
            </h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Haz clic en el icono de <strong>PlatformIO</strong> en la barra lateral izquierda y selecciona <strong>PIO Home &rarr; Open</strong>.
                </li>
                <li>
                  Haz clic en el botón <strong>+ New Project</strong> (Nuevo Proyecto).
                </li>
                <li>
                  Rellena los campos con estos valores:
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400">
                    <li><strong>Name:</strong> <span className="text-slate-200 font-mono">RobotSumoESP32</span></li>
                    <li><strong>Board:</strong> <span className="text-slate-200 font-mono">Espressif ESP32 Dev Module (esp32dev)</span></li>
                    <li><strong>Framework:</strong> <span className="text-slate-200 font-mono">Arduino</span></li>
                  </ul>
                </li>
                <li>
                  Haz clic en <strong>Finish</strong>. PlatformIO descargará las herramientas del ESP32 en unos momentos.
                </li>
                <li>
                  Reemplaza el contenido del archivo <span className="font-mono text-blue-300">platformio.ini</span> por el código provisto en la pestaña anterior.
                </li>
                <li>
                  Abre la carpeta <span className="font-mono text-blue-300">src/main.cpp</span> y pega el código completo de <span className="font-mono text-blue-300">main.cpp</span>.
                </li>
              </ol>
            </div>
          </div>

          {/* Card 3: Conectar el ESP32 a la PC */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              3. Conectar el ESP32 a la PC
            </h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Usa un cable USB que transmita <strong>datos</strong> (algunos cables baratos son solo de carga).
                </li>
                <li>
                  Conecta el ESP32 a un puerto USB de tu computadora.
                </li>
                <li>
                  El sistema operativo asignará un puerto serie COM (por ejemplo <code className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">COM3</code>, <code className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">COM5</code> o en Linux/Mac <code className="font-mono bg-slate-800 px-1 py-0.5 rounded text-amber-300">/dev/ttyUSB0</code>).
                </li>
                <li>
                  <strong>Si no lo reconoce:</strong> Asegúrate de instalar el controlador del chip puente USB de tu placa (usualmente el chip <strong>CP2102</strong> de Silicon Labs o el <strong>CH340</strong>).
                </li>
              </ul>
            </div>
          </div>

          {/* Card 4: Compilar y Subir */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              4. Compilar y Subir el Firmware al ESP32
            </h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  En la barra azul inferior de VS Code, encontrarás los iconos rápidos de PlatformIO:
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-400">
                    <li>Icono de tilde <strong>✓ (PlatformIO: Build)</strong> para compilar.</li>
                    <li>Icono de flecha <strong>&rarr; (PlatformIO: Upload)</strong> para subir el programa.</li>
                  </ul>
                </li>
                <li>
                  Haz clic en el icono de flecha <strong>Upload</strong>.
                </li>
                <li>
                  PlatformIO compilará automáticamente el código, detectará el puerto COM del ESP32 y subirá el firmware.
                </li>
                <li>
                  💡 <em>Nota sobre placas ESP32 rebeldes:</em> Si en la terminal ves el mensaje <code className="text-amber-400 font-mono">Connecting........_____.....</code>, mantén presionado el botón <strong>BOOT</strong> en la placa ESP32 durante 2 segundos hasta que comience a escribir la memoria flash.
                </li>
                <li>
                  Cuando finalice, verás el mensaje verde <strong className="text-emerald-400 font-mono">[SUCCESS] Took X.XX seconds</strong>.
                </li>
              </ol>
            </div>
          </div>

          {/* Card 5: Monitor Serial y Verificación de Comandos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              5. Comprobar en el Monitor Serial la Recepción de W, S, A, D, L
            </h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Haz clic en el icono del enchufe o cable <strong>(PlatformIO: Serial Monitor)</strong> en la barra inferior de VS Code.
                </li>
                <li>
                  El monitor se abrirá a <strong>115200 baudios</strong> (configurado en <code className="font-mono text-slate-300">platformio.ini</code>).
                </li>
                <li>
                  Presiona el botón <strong>EN / RST</strong> del ESP32. Verás en pantalla:
                  <pre className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-emerald-300 my-2 border border-slate-800">
{`==============================================
  SISTEMA DE CONTROL - ROBOT SUMO ESP32       
==============================================
[BT INICIADO]: Dispositivo listo. Nombre: RobotSumo
Comandos aceptados: W (Avanzar), S (Retroceder), A (Izq), D (Der), L (STOP)
Velocidad configurada: 200 / 255
Failsafe de seguridad activo: 500 ms`}
                  </pre>
                </li>
                <li>
                  <strong>Prueba rápida por teclado:</strong> Puedes escribir en la barra superior del monitor serial una letra (ejemplo: <kbd className="font-mono text-slate-200">W</kbd> o <kbd className="font-mono text-slate-200">w</kbd>) y presionar Enter. Verás la respuesta inmediata:
                  <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-blue-300 my-1">
                    [COMANDO &apos;W&apos;]: AVANZAR -&gt; Ambos motores adelante | Vel: 200
                  </div>
                  Y si esperas 500 ms sin escribir nada, observarás cómo el sistema de seguridad entra en acción:
                  <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-amber-300 my-1">
                    [SEGURIDAD]: Timeout &gt;500ms sin señal. Motores detenidos automaticamente.
                  </div>
                </li>
                <li>
                  Prueba cada tecla: <kbd className="font-mono text-slate-200">W</kbd> (Avanzar), <kbd className="font-mono text-slate-200">S</kbd> (Retroceder), <kbd className="font-mono text-slate-200">A</kbd> (Girar Izquierda), <kbd className="font-mono text-slate-200">D</kbd> (Girar Derecha) y <kbd className="font-mono text-slate-200">L</kbd> (STOP Inmediato).
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
