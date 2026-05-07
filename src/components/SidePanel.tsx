import React from 'react';
import { useRobotState, robotState, notifyRobot } from '../lib/robotState';
import { serialService } from '../lib/serial';

async function animJoints(targets: number[], ms: number) {
  const starts = [...robotState.joints];
  const steps = 45;
  const sleepMs = ms / steps;
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    t = t * t * (3 - 2 * t);
    for (let j = 0; j < 3; j++) {
      robotState.joints[j] = starts[j] + (targets[j] - starts[j]) * t;
    }
    notifyRobot();
    await new Promise(r => setTimeout(r, sleepMs));
  }
}

async function animRotor(target: number, ms: number) {
  const start = robotState.rotorAngle;
  const steps = 45;
  const sleepMs = ms / steps;
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    t = t * t * (3 - 2 * t);
    robotState.rotorAngle = start + (target - start) * t;
    notifyRobot();
    await new Promise(r => setTimeout(r, sleepMs));
  }
}

export function SidePanel() {
  const state = useRobotState();

  const checkConn = () => {
    if (!state.connected) {
      alert("Nenhum braço robótico conectado.\nClique em 'Simular USB' ou 'Conectar Físico'.");
      return false;
    }
    return true;
  };

  const runRoutine1 = async () => {
    if (!checkConn()) return;
    try {
      serialService.usb("ROUTINE1 START");
      await animJoints([30, 20, 15], 600);
      await new Promise(r => setTimeout(r, 250));
      robotState.gripperOpen = false;
      notifyRobot();
      serialService.usb("GRIPPER state=CLOSE");
      await new Promise(r => setTimeout(r, 350));
      await animJoints([100, 80, 65], 700);
      serialService.usb("ROUTINE1 DONE");
      alert("✔ Rotina 1 Concluída!\nObjeto pego e elevado.");
    } catch (e) { console.error(e); }
  };

  const runRoutine2 = async () => {
    if (!checkConn()) return;
    try {
      serialService.usb("ROUTINE2 START");
      await animRotor(90, 650);
      await new Promise(r => setTimeout(r, 200));
      robotState.gripperOpen = true;
      notifyRobot();
      serialService.usb("GRIPPER state=OPEN");
      await new Promise(r => setTimeout(r, 300));
      await animRotor(0, 650);
      serialService.usb("ROUTINE2 DONE");
      alert("✔ Rotina 2 Concluída!\nObjeto descartado lateralmente.");
    } catch (e) { console.error(e); }
  };

  const toggleRecord = () => {
    if (!state.recording) {
      if (!checkConn()) return;
      robotState.recording = true;
      notifyRobot();
      serialService.log("Gravação iniciada.");
    } else {
      robotState.recording = false;
      notifyRobot();
      const name = prompt("Dê um nome para a rotina gravada:");
      if (name) {
        serialService.log(`Rotina salva: "${name}"`);
        alert(`Rotina "${name}" salva com sucesso!`);
      }
    }
  };

  const emergencyStop = () => {
    serialService.usb("EMERGENCY_STOP ALL");
    alert("⚠ PARADA DE EMERGÊNCIA ACIONADA!\nTodos os movimentos foram interrompidos.");
  };

  return (
    <div className="bg-[#141417] border border-[#27272A] rounded-xl flex flex-col p-5 select-none overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center custom-scrollbar pr-2 gap-4">
        
        <div className="w-full">
          <Section title="AUTOMAÇÃO" />
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={runRoutine1} bgColor="bg-[#3B82F6]" hoverColor="hover:bg-[#2563EB]">
              START ROTINA 1: PEGAR
            </Button>
            <Button onClick={runRoutine2} bgColor="bg-[#27272A]" hoverColor="hover:bg-[#3F3F46]" textColor="text-[#F4F4F5]">
              START ROTINA 2: DESCARTAR
            </Button>
          </div>
        </div>

        <div className="w-full mt-4">
          <Section title="GRAVAR ROTINA (RF003)" />
          <div className="flex flex-col gap-2 mt-2">
            <Button 
              onClick={toggleRecord} 
              bgColor={state.recording ? "bg-[#7F1D1D]" : "bg-[#27272A]"} 
              hoverColor={state.recording ? "hover:bg-[#991B1B]" : "hover:bg-[#3F3F46]"}
              textColor={state.recording ? "text-[#FECACA]" : "text-[#F4F4F5]"}
            >
              {state.recording ? "⏹ PARAR GRAVAÇÃO" : "⏺ INICIAR GRAVAÇÃO"}
            </Button>
            <div className="text-center font-mono font-bold text-xs h-4 text-[#EF4444] mt-1 relative">
              {state.recording ? "● REC — gravando..." : ""}
            </div>
          </div>
        </div>

        <div className="w-full mt-4 mb-2 flex-1">
          <Section title="GUIDELINES (WEB)" />
          <div className="text-[#71717A] text-[11px] w-full leading-relaxed bg-[#111114] p-3 rounded-lg border border-[#27272A] mt-2">
            <p className="mb-1">G001: Flex/Grid Viewport</p>
            <p className="mb-1">G002: Brilho accent no hover</p>
            <p className="mb-1">G003: Seta Emerald (mov. válido)</p>
            <p className="mb-1">G004: Seta vermelha (limite)</p>
            <p className="mb-1">G005: Play=Blue | STOP=Red</p>
            <p className="mb-1">G006: Web Serial USB API</p>
          </div>
        </div>

      </div>

      <div className="pt-4 border-t border-[#27272A] flex items-center justify-center mt-2 shrink-0">
        <button 
          onClick={emergencyStop}
          className="bg-[#7F1D1D] text-[#FECACA] border border-[#B91C1C] py-3 px-6 rounded-lg font-bold uppercase tracking-[1px] w-full transition-colors hover:bg-[#991B1B]"
        >
          EMERGENCY STOP
        </button>
      </div>
    </div>
  );
}

function Section({title}: {title: string}) {
  return (
    <div className="w-full">
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-[#71717A] font-semibold">{title}</h3>
    </div>
  );
}

function Button({onClick, children, bgColor, hoverColor, textColor = "text-white"}: {onClick: ()=>void, children: React.ReactNode, bgColor: string, hoverColor: string, textColor?: string}) {
  return (
    <button 
      onClick={onClick}
      className={`${bgColor} ${hoverColor} ${textColor} transition-colors w-full py-2.5 rounded-lg font-semibold text-[12px] tracking-wide shadow-sm focus:outline-none`}
    >
      {children}
    </button>
  );
}
