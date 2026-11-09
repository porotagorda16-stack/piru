import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw, Play, ShieldAlert, Cpu, Award } from 'lucide-react';
import { Command, GpioStatus, MotorState } from '../types';

interface RobotArenaProps {
  activeCommand: Command;
  speed: number;
  motorState: MotorState;
  gpioStatus: GpioStatus;
  failsafeTriggered: boolean;
  onResetArena?: () => void;
}

export const RobotArena: React.FC<RobotArenaProps> = ({
  activeCommand,
  speed,
  motorState,
  gpioStatus,
  failsafeTriggered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Robot State
  const robotPosRef = useRef({ x: 260, y: 320, angle: -Math.PI / 2, vx: 0, vy: 0, vTheta: 0 });
  // Opponent Dummy State
  const dummyPosRef = useRef({ x: 260, y: 180, angle: Math.PI / 2, vx: 0, vy: 0 });
  const [matchScore, setMatchScore] = useState<{ wins: number; status: string }>({
    wins: 0,
    status: 'Listo en el Dohyo',
  });

  // Reset Arena positions
  const resetPositions = () => {
    robotPosRef.current = { x: 260, y: 340, angle: -Math.PI / 2, vx: 0, vy: 0, vTheta: 0 };
    dummyPosRef.current = { x: 260, y: 160, angle: Math.PI / 2, vx: 0, vy: 0 };
    setMatchScore((prev) => ({ ...prev, status: 'Combate Reiniciado' }));
  };

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ARENA_CENTER_X = 260;
    const ARENA_CENTER_Y = 260;
    const ARENA_RADIUS = 210;
    const RING_BORDER_WIDTH = 14;

    const render = () => {
      // 1. Update Physics based on motorState
      const linearSpeedFactor = (speed / 255) * 2.8;
      const angularSpeedFactor = (speed / 255) * 0.06;

      let linearVel = 0;
      let angularVel = 0;

      if (motorState.leftDirection === 'forward' && motorState.rightDirection === 'forward') {
        linearVel = linearSpeedFactor;
      } else if (motorState.leftDirection === 'reverse' && motorState.rightDirection === 'reverse') {
        linearVel = -linearSpeedFactor;
      } else if (motorState.leftDirection === 'reverse' && motorState.rightDirection === 'forward') {
        // Girar Izquierda (A): motor izq atrás, der adelante
        angularVel = -angularSpeedFactor;
      } else if (motorState.leftDirection === 'forward' && motorState.rightDirection === 'reverse') {
        // Girar Derecha (D): motor izq adelante, der atrás
        angularVel = angularSpeedFactor;
      }

      // Update robot pose
      const r = robotPosRef.current;
      r.angle += angularVel;
      r.x += Math.cos(r.angle) * linearVel;
      r.y += Math.sin(r.angle) * linearVel;

      // Simple collision between Robot and Dummy Opponent
      const d = dummyPosRef.current;
      const dx = d.x - r.x;
      const dy = d.y - r.y;
      const dist = Math.hypot(dx, dy);
      const robotRadius = 26;
      const dummyRadius = 24;

      if (dist < robotRadius + dummyRadius) {
        // Collision response: push dummy in direction of robot heading
        const overlap = robotRadius + dummyRadius - dist;
        const pushAngle = r.angle;
        d.x += Math.cos(pushAngle) * (overlap + linearSpeedFactor * 1.5);
        d.y += Math.sin(pushAngle) * (overlap + linearSpeedFactor * 1.5);
      }

      // Check Dohyo Bounds
      const distRobotFromCenter = Math.hypot(r.x - ARENA_CENTER_X, r.y - ARENA_CENTER_Y);
      const distDummyFromCenter = Math.hypot(d.x - ARENA_CENTER_X, d.y - ARENA_CENTER_Y);

      if (distDummyFromCenter > ARENA_RADIUS && !matchScore.status.includes('VICTORIA')) {
        setMatchScore((prev) => ({
          wins: prev.wins + 1,
          status: '¡VICTORIA! Oponente fuera del Dohyo',
        }));
      }

      // 2. Draw Arena
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background ambient
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dohyo platform shadow
      ctx.beginPath();
      ctx.arc(ARENA_CENTER_X, ARENA_CENTER_Y + 6, ARENA_RADIUS + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();

      // Dohyo Black Surface
      ctx.beginPath();
      ctx.arc(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#18181b';
      ctx.fill();

      // Dohyo Crisp White Border Ring (Tawaras)
      ctx.beginPath();
      ctx.arc(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS - RING_BORDER_WIDTH / 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = RING_BORDER_WIDTH;
      ctx.stroke();

      // Start lines (Shikiri-sen) in traditional Sumo
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ARENA_CENTER_X - 35, ARENA_CENTER_Y - 30);
      ctx.lineTo(ARENA_CENTER_X + 35, ARENA_CENTER_Y - 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ARENA_CENTER_X - 35, ARENA_CENTER_Y + 30);
      ctx.lineTo(ARENA_CENTER_X + 35, ARENA_CENTER_Y + 30);
      ctx.stroke();

      // 3. Draw Opponent Dummy
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);

      // Dummy chassis
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-20, -20, 40, 40, 6);
      ctx.fill();
      ctx.stroke();

      // Dummy label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OPONENTE', 0, 3);
      ctx.restore();

      // 4. Draw Our Robot Sumo
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.angle);

      // Wheels (Left and Right)
      // Left Wheel
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-16, -26, 32, 6);
      // Right Wheel
      ctx.fillRect(-16, 20, 32, 6);

      // Robot Chassis
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, -18, 44, 36, 4);
      ctx.fill();
      ctx.stroke();

      // Front Steel Wedge / Scoop (Cuchilla delantera de Sumo)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(22, -18);
      ctx.lineTo(30, -22);
      ctx.lineTo(30, 22);
      ctx.lineTo(22, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Internal electronics (ESP32 + L298N representation)
      ctx.fillStyle = '#047857';
      ctx.fillRect(-12, -10, 24, 20);

      // ESP32 Chip
      ctx.fillStyle = '#111827';
      ctx.fillRect(-6, -6, 12, 12);

      // LED Power indicator
      ctx.beginPath();
      ctx.arc(10, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = motorState.leftSpeed > 0 ? '#34d399' : '#f87171';
      ctx.fill();

      // Heading arrow indicator
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(14, 0);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [motorState, speed, matchScore.status]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Match status */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Simulador Dohyo & Banco de Pruebas
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Prueba el giro diferencial de dos motores, la cuchilla de empuje y el failsafe de seguridad.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Victorias:</span>
            <span className="font-bold text-white font-mono tabular-nums">{matchScore.wins}</span>
          </div>

          <button
            onClick={resetPositions}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reiniciar Posiciones
          </button>
        </div>
      </div>

      {/* Main Dohyo Viewport & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Arena Canvas */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={520}
              height={520}
              className="max-w-full h-auto rounded-xl border border-slate-800 shadow-2xl"
            />

            {/* Failsafe Overlay Warning */}
            {failsafeTriggered && (
              <div className="absolute top-4 left-4 right-4 bg-red-950/90 border border-red-500/80 rounded-lg p-3 text-red-200 text-xs flex items-center gap-2.5 backdrop-blur-sm animate-pulse">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Failsafe Activado (&gt;500ms sin comando):</strong> Motores apagados automáticamente por seguridad.
                </span>
              </div>
            )}
          </div>

          {/* Quick instructions below arena */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mt-4 px-2">
            <span>Usa las teclas W, A, S, D o la pestaña Control Remoto para pilotar</span>
            <span className="font-medium text-slate-300">{matchScore.status}</span>
          </div>
        </div>

        {/* Live Hardware Telemetry Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* L298N Logic Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Señales Hacia el L298N (Tiempo Real)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Comando Activo:</span>
                <span className="font-mono font-bold text-sm text-blue-400">
                  {activeCommand ? `[ ${activeCommand} ]` : 'NINGUNO (L)'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300">Motor Izquierdo (OUT1 / OUT2):</div>
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">IN1 (GPIO 26)</div>
                    <div className={`font-bold ${gpioStatus.in1 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {gpioStatus.in1 ? '1 (HIGH)' : '0 (LOW)'}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">IN2 (GPIO 27)</div>
                    <div className={`font-bold ${gpioStatus.in2 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {gpioStatus.in2 ? '1 (HIGH)' : '0 (LOW)'}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">ENA (GPIO 14)</div>
                    <div className="font-bold text-amber-400 tabular-nums">
                      {gpioStatus.enaPwm}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300">Motor Derecho (OUT3 / OUT4):</div>
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">IN3 (GPIO 25)</div>
                    <div className={`font-bold ${gpioStatus.in3 ? 'text-blue-400' : 'text-slate-600'}`}>
                      {gpioStatus.in3 ? '1 (HIGH)' : '0 (LOW)'}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">IN4 (GPIO 33)</div>
                    <div className={`font-bold ${gpioStatus.in4 ? 'text-blue-400' : 'text-slate-600'}`}>
                      {gpioStatus.in4 ? '1 (HIGH)' : '0 (LOW)'}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-[10px] text-slate-500">ENB (GPIO 32)</div>
                    <div className="font-bold text-amber-400 tabular-nums">
                      {gpioStatus.enbPwm}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rules of Sumo Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm">Reglas de Combate Robot Sumo</h4>
            <p className="leading-relaxed text-slate-400">
              El objetivo de la categoría Mini Sumo es empujar al robot oponente fuera del ring circular (Dohyo) de 77 cm de diámetro delimitado por una línea perimetral blanca de 2.5 cm (Tawara).
            </p>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] text-amber-300/90">
              💡 <strong>Consejo para el código:</strong> La velocidad predeterminada de 200/255 ofrece el equilibrio ideal entre tracción y torque antes del contacto.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
