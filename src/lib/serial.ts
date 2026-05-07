import { robotState, notifyRobot } from './robotState';

class SerialService {
  mockMode = false;
  port: unknown | null = null;
  writer: unknown | null = null;
  
  log(msg: string) {
    console.log(`[SYS] ${msg}`);
  }
  
  usb(cmd: string) {
    console.log(`[USB TX] ${cmd}`);
    if (!this.mockMode && this.writer) {
      const encoder = new TextEncoder();
      (this.writer as WritableStreamDefaultWriter).write(encoder.encode(cmd + '\n'));
    }
  }
  
  async connectPhysical() {
    try {
      if (!('serial' in navigator)) {
        alert("Web Serial API não suportada ou bloqueada.\nSe estiver visualizando dentro de um iframe ou preview, abra o aplicativo em uma nova aba para permitir acesso ao hardware USB.");
        return false;
      }
      const port: any = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      this.port = port;
      this.writer = port.writable.getWriter();
      
      robotState.connected = true;
      this.mockMode = false;
      this.usb("HANDSHAKE OK port=WebSerial baud=9600");
      this.log("Conectado na porta Serial Física.");
      notifyRobot();
      return true;
    } catch (e) {
      console.error(e);
      alert("Falha na conexão Serial. Verifique se o dispositivo está sendo usado por outro app.");
      return false;
    }
  }

  connectMock() {
    robotState.connected = true;
    this.mockMode = true;
    this.usb("HANDSHAKE OK port=COM3 baud=9600");
    this.log("Conexão Simulada ativada.");
    notifyRobot();
  }
  
  async disconnect() {
    if (!this.mockMode && this.writer) {
       (this.writer as WritableStreamDefaultWriter).releaseLock();
       this.writer = null;
    }
    if (!this.mockMode && this.port) {
       await (this.port as any).close();
       this.port = null;
    }
    robotState.connected = false;
    this.mockMode = false;
    this.log("USB desconectado.");
    notifyRobot();
  }
}

export const serialService = new SerialService();
