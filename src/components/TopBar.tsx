import { useRobotState } from '../lib/robotState';
import { serialService } from '../lib/serial';

export function TopBar() {
  const state = useRobotState();

  return (
    <header className="bg-[#141417] h-[60px] border-b border-[#27272A] px-6 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span className="font-bold tracking-tight text-[18px] text-[#F4F4F5]">
          ACTUATOR<span className="text-[#3B82F6]">PRO</span>
        </span>
        <span className="ml-3 text-[12px] text-[#71717A] font-mono">
          WEB SERIAL // v4.8.2.ALPHA
        </span>
      </div>

      <div className="flex items-center gap-4">
        {state.connected ? (
          <div className="bg-[#18181B] border border-[#3F3F46] px-3 py-1 rounded-full text-[12px] flex items-center gap-1.5 text-[#D4D4D8]">
            <div className={`w-2 h-2 rounded-full ${serialService.mockMode ? 'bg-[#FACC15]' : 'bg-[#10B981]'}`}></div>
            CONECTADO — {serialService.mockMode ? "Simulado" : "Físico"}
          </div>
        ) : (
          <div className="bg-[#18181B] border border-[#3F3F46] px-3 py-1 rounded-full text-[12px] flex items-center gap-1.5 text-[#FACC15]">
            <div className="w-2 h-2 rounded-full bg-[#FACC15]"></div>
            AGUARDANDO CONEXÃO USB
          </div>
        )}

        <div className="flex gap-2">
           {state.connected ? (
              <button onClick={() => serialService.disconnect()} className="bg-[#27272A] hover:bg-[#3F3F46] text-[#F4F4F5] font-semibold text-xs px-4 py-2 rounded-lg transition tracking-[0.05em]">
                DESCONECTAR
              </button>
           ) : (
              <>
                <button onClick={() => serialService.connectMock()} className="bg-[#27272A] hover:bg-[#3F3F46] text-[#F4F4F5] font-semibold text-xs px-4 py-2 rounded-lg transition tracking-[0.05em]">
                  SIMULAR USB
                </button>
                <button onClick={() => serialService.connectPhysical()} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-sm tracking-[0.05em]">
                  CONECTAR FÍSICO
                </button>
              </>
           )}
        </div>
      </div>
    </header>
  );
}
